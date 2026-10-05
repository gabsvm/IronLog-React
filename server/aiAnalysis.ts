// U11: training analysis with Claude, server side only. The Anthropic key
// lives in the server environment (ANTHROPIC_API_KEY) and never reaches the
// client. The client sends a compact, anonymous training summary (weekly
// sets per muscle, e1RM trends, session counts) — no names, emails or notes —
// plus a Firebase ID token so only signed-in users can spend the key.
import Anthropic from '@anthropic-ai/sdk';
import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose';

export const AI_MODEL = 'claude-opus-5-5';
export const MAX_BODY_BYTES = 16 * 1024;
const RATE_LIMIT = { max: 5, windowMs: 60 * 60 * 1000 };

// ─── Input ──────────────────────────────────────────────────────────────────
export interface AnalysisWeek {
    weekStart: string;
    sessions: number;
    setsByMuscle: Record<string, number>;
    avgRir: number | null;
}

export interface AnalysisLift {
    name: string;
    points: Array<{ date: string; e1rm: number }>;
}

export interface AnalysisInput {
    lang: 'es' | 'en';
    unit: 'kg' | 'lb';
    weeks: AnalysisWeek[];
    lifts: AnalysisLift[];
    bodyweight: Array<{ date: string; value: number }>;
}

const SUPPORTED_LANGS = new Set(['es', 'en']);
const SUPPORTED_UNITS = new Set(['kg', 'lb']);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const isNum = (v: unknown, min: number, max: number): v is number =>
    typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
const isLabel = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.length <= 60;

/** Strict validation: returns the input or null. Unknown keys are rejected. */
export const parseAnalysisInput = (raw: unknown): AnalysisInput | null => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
    const o = raw as Record<string, unknown>;
    const allowed = new Set(['lang', 'unit', 'weeks', 'lifts', 'bodyweight']);
    if (Object.keys(o).some((k) => !allowed.has(k))) return null;
    if (!SUPPORTED_LANGS.has(String(o.lang))) return null;
    if (!SUPPORTED_UNITS.has(String(o.unit))) return null;
    if (!Array.isArray(o.weeks) || o.weeks.length < 1 || o.weeks.length > 12) return null;
    if (!Array.isArray(o.lifts) || o.lifts.length > 8) return null;
    if (!Array.isArray(o.bodyweight) || o.bodyweight.length > 16) return null;

    for (const w of o.weeks as unknown[]) {
        if (!w || typeof w !== 'object') return null;
        const wk = w as Record<string, unknown>;
        if (typeof wk.weekStart !== 'string' || !DATE_RE.test(wk.weekStart)) return null;
        if (!isNum(wk.sessions, 0, 21)) return null;
        if (!(wk.avgRir === null || isNum(wk.avgRir, 0, 10))) return null;
        const sets = wk.setsByMuscle;
        if (!sets || typeof sets !== 'object' || Array.isArray(sets)) return null;
        const entries = Object.entries(sets as Record<string, unknown>);
        if (entries.length > 20 || entries.some(([k, v]) => !isLabel(k) || !isNum(v, 0, 200))) return null;
    }
    for (const l of o.lifts as unknown[]) {
        if (!l || typeof l !== 'object') return null;
        const lift = l as Record<string, unknown>;
        if (!isLabel(lift.name) || !Array.isArray(lift.points) || lift.points.length > 12) return null;
        for (const p of lift.points as unknown[]) {
            const pt = p as Record<string, unknown>;
            if (!pt || typeof pt.date !== 'string' || !DATE_RE.test(pt.date) || !isNum(pt.e1rm, 0, 2000)) return null;
        }
    }
    for (const b of o.bodyweight as unknown[]) {
        const bw = b as Record<string, unknown>;
        if (!bw || typeof bw.date !== 'string' || !DATE_RE.test(bw.date) || !isNum(bw.value, 20, 900)) return null;
    }
    return o as unknown as AnalysisInput;
};

// ─── Output ─────────────────────────────────────────────────────────────────
export interface AnalysisResult {
    summary: string;
    strengths: string[];
    issues: string[];
    suggestions: string[];
}

const RESULT_SCHEMA = {
    type: 'object',
    properties: {
        summary: { type: 'string' },
        strengths: { type: 'array', items: { type: 'string' } },
        issues: { type: 'array', items: { type: 'string' } },
        suggestions: { type: 'array', items: { type: 'string' } },
    },
    required: ['summary', 'strengths', 'issues', 'suggestions'],
    additionalProperties: false,
} as const;

const SYSTEM_PROMPT = `You are the training analyst inside GainsLab, a strength and hypertrophy logging app.
You receive an anonymous summary of one lifter's recent training: weekly working sets per muscle group, sessions per week, average reps in reserve (RIR, null when not logged), estimated one-rep-max (e1RM) trends for their main lifts, and optionally body weight.

Write a short, practical review grounded only in these numbers:
- summary: 2-3 sentences on how training has gone over the period.
- strengths: up to 3 things that are going well, each one sentence.
- issues: up to 3 concrete problems you can see in the data (for example a muscle group well below or above typical weekly volume ranges, stalled or falling e1RM, inconsistent attendance, effort that looks too easy or too close to failure). Leave the list empty if nothing stands out.
- suggestions: up to 4 specific, actionable adjustments for the next few weeks that follow from the issues.

Cite the actual numbers when they support a point. If the data is too thin to judge something, say so instead of guessing. This is training feedback, not medical advice: if something looks like a health concern (for example a rapid body-weight change), only suggest checking with a professional.
Write every string in the language given in the request's "lang" field (es = Spanish, en = English), in plain text without markdown.`;

// ─── Handler ────────────────────────────────────────────────────────────────
export interface AnalysisDeps {
    verifyToken: (token: string) => Promise<string>;
    createMessage: (params: Anthropic.Beta.MessageCreateParamsNonStreaming) => Promise<Anthropic.Beta.BetaMessage>;
    rateLimiter?: (uid: string) => boolean;
    allowedOrigins?: string[];
}

export const createRateLimiter = (max = RATE_LIMIT.max, windowMs = RATE_LIMIT.windowMs, now = () => Date.now()) => {
    const hits = new Map<string, number[]>();
    return (uid: string): boolean => {
        const t = now();
        const recent = (hits.get(uid) || []).filter((h) => t - h < windowMs);
        if (recent.length >= max) {
            hits.set(uid, recent);
            return false;
        }
        recent.push(t);
        hits.set(uid, recent);
        return true;
    };
};

const corsHeaders = (origin: string | null, allowed: string[]): Record<string, string> =>
    origin && allowed.includes(origin)
        ? {
              'Access-Control-Allow-Origin': origin,
              'Access-Control-Allow-Methods': 'POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Authorization, Content-Type',
              'Access-Control-Max-Age': '600',
              Vary: 'Origin',
          }
        : {};

const json = (status: number, body: unknown, headers: Record<string, string>) =>
    new Response(JSON.stringify(body), { status, headers: { ...headers, 'Content-Type': 'application/json' } });

export const buildAnalysisRequest = (input: AnalysisInput): Anthropic.Beta.MessageCreateParamsNonStreaming => ({
    model: AI_MODEL,
    max_tokens: 16000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'medium', format: { type: 'json_schema', schema: RESULT_SCHEMA } },
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: JSON.stringify(input) }],
});

const clip = (list: unknown, max: number): string[] =>
    Array.isArray(list) ? list.filter((s): s is string => typeof s === 'string' && s.trim() !== '').slice(0, max) : [];

/** Reads the structured result; null when the model stopped early or refused. */
export const readAnalysisResult = (message: Anthropic.Beta.BetaMessage): AnalysisResult | null => {
    if (message.stop_reason !== 'end_turn') return null;
    const text = message.content.find((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text')?.text;
    if (!text) return null;
    try {
        const parsed = JSON.parse(text) as Record<string, unknown>;
        if (typeof parsed.summary !== 'string') return null;
        return {
            summary: parsed.summary,
            strengths: clip(parsed.strengths, 3),
            issues: clip(parsed.issues, 3),
            suggestions: clip(parsed.suggestions, 4),
        };
    } catch {
        return null;
    }
};

export const handleAnalysisRequest = async (request: Request, deps: AnalysisDeps): Promise<Response> => {
    const cors = corsHeaders(request.headers.get('Origin'), deps.allowedOrigins ?? []);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return json(405, { error: 'method_not_allowed' }, cors);

    const auth = request.headers.get('Authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
    if (!token) return json(401, { error: 'unauthenticated' }, cors);
    let uid: string;
    try {
        uid = await deps.verifyToken(token);
    } catch {
        return json(401, { error: 'unauthenticated' }, cors);
    }

    const raw = await request.text();
    if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) return json(413, { error: 'too_large' }, cors);
    let body: unknown;
    try {
        body = JSON.parse(raw);
    } catch {
        return json(400, { error: 'invalid_input' }, cors);
    }
    const input = parseAnalysisInput(body);
    if (!input) return json(400, { error: 'invalid_input' }, cors);

    if (deps.rateLimiter && !deps.rateLimiter(uid)) return json(429, { error: 'rate_limited' }, cors);

    try {
        const message = await deps.createMessage(buildAnalysisRequest(input));
        if (message.stop_reason === 'refusal') return json(502, { error: 'refused' }, cors);
        const result = readAnalysisResult(message);
        if (!result) return json(502, { error: 'bad_output' }, cors);
        return json(200, { analysis: result, model: message.model }, cors);
    } catch (error) {
        if (error instanceof Anthropic.RateLimitError) return json(503, { error: 'busy' }, cors);
        if (error instanceof Anthropic.APIError) return json(502, { error: 'upstream' }, cors);
        return json(500, { error: 'internal' }, cors);
    }
};

// ─── Production wiring ──────────────────────────────────────────────────────
const FIREBASE_JWKS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';

/** Verifies a Firebase Auth ID token against Google's public keys (no Admin SDK needed). */
export const firebaseTokenVerifier = (
    projectId: string,
    jwks: JWTVerifyGetKey = createRemoteJWKSet(new URL(FIREBASE_JWKS_URL)),
) => {
    return async (token: string): Promise<string> => {
        const { payload } = await jwtVerify(token, jwks, {
            issuer: `https://securetoken.google.com/${projectId}`,
            audience: projectId,
            algorithms: ['RS256'],
        });
        if (typeof payload.sub !== 'string' || payload.sub === '') throw new Error('no subject');
        return payload.sub;
    };
};
