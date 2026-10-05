// @vitest-environment node
// U11: server function — auth, validation, rate limit, Claude request shape,
// refusal / bad output / upstream errors. The Anthropic call is injected.
import { describe, it, expect, vi } from 'vitest';
import Anthropic from '@anthropic-ai/sdk';
import { SignJWT, createLocalJWKSet, exportJWK, generateKeyPair } from 'jose';
import {
    AI_MODEL,
    createRateLimiter,
    firebaseTokenVerifier,
    handleAnalysisRequest,
    parseAnalysisInput,
    type AnalysisDeps,
} from '../../server/aiAnalysis';

const input = {
    lang: 'es',
    unit: 'kg',
    weeks: [{ weekStart: '2026-09-28', sessions: 3, setsByMuscle: { CHEST: 12, BACK: 14 }, avgRir: 2 }],
    lifts: [{ name: 'Press banca', points: [{ date: '2026-09-28', e1rm: 100 }] }],
    bodyweight: [{ date: '2026-09-29', value: 80 }],
};

const analysis = { summary: 'Buen bloque.', strengths: ['Constancia'], issues: [], suggestions: ['Sube espalda'] };

const message = (over: Partial<Anthropic.Beta.BetaMessage> = {}): Anthropic.Beta.BetaMessage =>
    ({
        id: 'msg_1',
        type: 'message',
        role: 'assistant',
        model: AI_MODEL,
        content: [{ type: 'text', text: JSON.stringify(analysis), citations: null }],
        stop_reason: 'end_turn',
        stop_sequence: null,
        usage: { input_tokens: 10, output_tokens: 10 },
        ...over,
    }) as unknown as Anthropic.Beta.BetaMessage;

const deps = (over: Partial<AnalysisDeps> = {}): AnalysisDeps => ({
    verifyToken: vi.fn(async (t: string) => {
        if (t !== 'good') throw new Error('bad');
        return 'uid-1';
    }),
    createMessage: vi.fn(async () => message()),
    allowedOrigins: ['https://localhost'],
    ...over,
});

const post = (body: unknown, headers: Record<string, string> = { Authorization: 'Bearer good' }) =>
    new Request('https://app.test/api/ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: typeof body === 'string' ? body : JSON.stringify(body),
    });

describe('U11: input validation', () => {
    it('accepts the documented shape and rejects anything else', () => {
        expect(parseAnalysisInput(input)).not.toBeNull();
        expect(parseAnalysisInput({ ...input, email: 'a@b.c' })).toBeNull();
        expect(parseAnalysisInput({ ...input, lang: 'fr' })).toBeNull();
        expect(parseAnalysisInput({ ...input, weeks: [] })).toBeNull();
        expect(parseAnalysisInput({ ...input, weeks: [{ ...input.weeks[0], weekStart: 'yesterday' }] })).toBeNull();
        expect(parseAnalysisInput({ ...input, lifts: [{ name: 'x'.repeat(61), points: [] }] })).toBeNull();
        expect(parseAnalysisInput({ ...input, bodyweight: [{ date: '2026-09-29', value: Number.NaN }] })).toBeNull();
    });
});

describe('U11: handler', () => {
    it('sends the summary to Claude Opus 5.5 with structured output and default fallbacks', async () => {
        const d = deps();
        const res = await handleAnalysisRequest(post(input), d);
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ analysis, model: AI_MODEL });
        const params = (d.createMessage as any).mock.calls[0][0];
        expect(params).toMatchObject({
            model: 'claude-opus-5-5',
            betas: ['server-side-fallback-2026-07-01'],
            fallbacks: 'default',
            output_config: { effort: 'medium', format: { type: 'json_schema' } },
        });
        expect(params.thinking).toBeUndefined();
        expect(JSON.parse(params.messages[0].content)).toEqual(input);
        expect(params.system).toContain('"lang"');
    });

    it('401 without or with an invalid token; Claude is never called', async () => {
        const d = deps();
        expect((await handleAnalysisRequest(post(input, {}), d)).status).toBe(401);
        expect((await handleAnalysisRequest(post(input, { Authorization: 'Bearer forged' }), d)).status).toBe(401);
        expect(d.createMessage).not.toHaveBeenCalled();
    });

    it('400 invalid JSON or shape, 413 oversized body, 405 other methods', async () => {
        const d = deps();
        expect((await handleAnalysisRequest(post('{not json'), d)).status).toBe(400);
        expect((await handleAnalysisRequest(post({ ...input, note: 'secret' }), d)).status).toBe(400);
        expect((await handleAnalysisRequest(post('x'.repeat(17 * 1024)), d)).status).toBe(413);
        expect((await handleAnalysisRequest(new Request('https://app.test/api/ai-analysis'), d)).status).toBe(405);
        expect(d.createMessage).not.toHaveBeenCalled();
    });

    it('rate limits per user', async () => {
        let t = 0;
        const d = deps({ rateLimiter: createRateLimiter(2, 1000, () => t) });
        expect((await handleAnalysisRequest(post(input), d)).status).toBe(200);
        expect((await handleAnalysisRequest(post(input), d)).status).toBe(200);
        expect((await handleAnalysisRequest(post(input), d)).status).toBe(429);
        t = 1001;
        expect((await handleAnalysisRequest(post(input), d)).status).toBe(200);
    });

    it('refusal, truncated output and upstream errors map to clear codes', async () => {
        const run = async (createMessage: AnalysisDeps['createMessage']) => {
            const res = await handleAnalysisRequest(post(input), deps({ createMessage }));
            return [res.status, (await res.json()).error];
        };
        expect(await run(async () => message({ stop_reason: 'refusal', content: [] }))).toEqual([502, 'refused']);
        expect(await run(async () => message({ stop_reason: 'max_tokens' }))).toEqual([502, 'bad_output']);
        expect(await run(async () => message({ content: [{ type: 'text', text: 'not json', citations: null }] as any }))).toEqual([502, 'bad_output']);
        expect(await run(async () => { throw new Anthropic.RateLimitError(429, {}, 'slow down', new Headers()); })).toEqual([503, 'busy']);
        expect(await run(async () => { throw new Anthropic.InternalServerError(500, {}, 'boom', new Headers()); })).toEqual([502, 'upstream']);
    });

    it('CORS only for allowed origins (the Android app)', async () => {
        const preflight = (origin: string) =>
            handleAnalysisRequest(new Request('https://app.test/api/ai-analysis', { method: 'OPTIONS', headers: { Origin: origin } }), deps());
        expect((await preflight('https://localhost')).headers.get('Access-Control-Allow-Origin')).toBe('https://localhost');
        expect((await preflight('https://evil.example')).headers.get('Access-Control-Allow-Origin')).toBeNull();
    });
});

describe('U11: Firebase ID token verification', () => {
    it('accepts a token for this project and rejects other audiences, issuers and expired tokens', async () => {
        const { publicKey, privateKey } = await generateKeyPair('RS256');
        const jwk = { ...(await exportJWK(publicKey)), kid: 'k1', alg: 'RS256' };
        const verify = firebaseTokenVerifier('gainslab-test', createLocalJWKSet({ keys: [jwk] }));
        const sign = (claims: { aud?: string; iss?: string; exp?: string }) =>
            new SignJWT({})
                .setProtectedHeader({ alg: 'RS256', kid: 'k1' })
                .setSubject('uid-42')
                .setIssuedAt()
                .setAudience(claims.aud ?? 'gainslab-test')
                .setIssuer(claims.iss ?? 'https://securetoken.google.com/gainslab-test')
                .setExpirationTime(claims.exp ?? '1h')
                .sign(privateKey);
        expect(await verify(await sign({}))).toBe('uid-42');
        await expect(verify(await sign({ aud: 'other-project' }))).rejects.toThrow();
        await expect(verify(await sign({ iss: 'https://securetoken.google.com/other' }))).rejects.toThrow();
        await expect(verify(await sign({ exp: '-1m' }))).rejects.toThrow();
    });
});
