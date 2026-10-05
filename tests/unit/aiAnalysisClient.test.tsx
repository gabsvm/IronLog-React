// U11: client summary builder, request error mapping and the Stats card.
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { buildAnalysisInput, requestAnalysis, AnalysisError, loadLastAnalysis } from '../../services/aiAnalysis';
import { parseAnalysisInput } from '../../server/aiAnalysis';
import { AiAnalysisCard } from '../../components/stats/AiAnalysisCard';

const NOW = new Date(2026, 9, 5, 12).getTime(); // Monday 2026-10-05
const day = (d: number) => new Date(2026, 8, d, 18).getTime(); // September

const set = (weight: number, reps: number, extra: Record<string, unknown> = {}) => ({ id: Math.random(), weight, reps, rpe: '', completed: true, type: 'regular', ...extra });

const logs = [
    {
        id: 1, name: 'Push', startTime: day(29), endTime: day(29) + 3600e3, duration: 3600, note: 'private note',
        exercises: [
            { id: 'bench', name: 'Bench', muscle: 'CHEST', sets: [set(100, 5, { rpe: 8 }), set(105, 3, { rpe: 9 }), set(60, 10, { type: 'warmup' }), set(100, 5, { completed: false })] },
            { id: 'pullup', name: 'Pull-up', muscle: 'BACK', isBodyweight: true, sets: [set(0, 8)] },
        ],
    },
    { id: 2, name: 'Push', startTime: day(22), endTime: day(22), duration: 3000, exercises: [{ id: 'bench', name: 'Bench', muscle: 'CHEST', sets: [set(95, 5)] }] },
    { id: 3, name: 'Old', startTime: new Date(2026, 5, 1).getTime(), endTime: 0, duration: 0, exercises: [{ id: 'bench', name: 'Bench', muscle: 'CHEST', sets: [set(50, 5)] }] },
] as any[];

const build = () =>
    buildAnalysisInput({ logs, bodyLogs: [{ id: 1, date: day(30), weight: 80.04 }], lang: 'es', unit: 'kg', exerciseName: (ex) => String(ex.name), now: NOW })!;

describe('U11: buildAnalysisInput', () => {
    it('summarises 8 weeks: working sets per muscle, sessions, RIR, best e1RM per week', () => {
        const input = build();
        expect(input.weeks).toHaveLength(8);
        const w1 = input.weeks.find((w) => w.weekStart === '2026-09-28')!;
        expect(w1).toEqual({ weekStart: '2026-09-28', sessions: 1, setsByMuscle: { CHEST: 2, BACK: 1 }, avgRir: 1.5 });
        const w0 = input.weeks.find((w) => w.weekStart === '2026-09-21')!;
        expect(w0.setsByMuscle).toEqual({ CHEST: 1 });
        expect(w0.avgRir).toBeNull();
        expect(input.lifts).toEqual([{ name: 'Bench', points: [{ date: '2026-09-21', e1rm: 110.8 }, { date: '2026-09-28', e1rm: 116.7 }] }]);
        expect(input.bodyweight).toEqual([{ date: '2026-09-30', value: 80 }]);
    });

    it('contains nothing personal and passes the server validation', () => {
        const input = build();
        const text = JSON.stringify(input);
        expect(text).not.toContain('private note');
        expect(text).not.toContain('"id"');
        expect(parseAnalysisInput(JSON.parse(text))).not.toBeNull();
    });

    it('converts loads to the display unit; null with no recent sessions', () => {
        const lb = buildAnalysisInput({ logs, bodyLogs: [], lang: 'en', unit: 'lb', exerciseName: (ex) => String(ex.name), convert: (kg) => kg * 2, now: NOW })!;
        expect(lb.lifts[0].points[1].e1rm).toBe(233.3);
        expect(buildAnalysisInput({ logs: [logs[2]], bodyLogs: [], lang: 'es', unit: 'kg', exerciseName: () => 'x', now: NOW })).toBeNull();
    });
});

describe('U11: requestAnalysis', () => {
    const input = build();
    const reply = (status: number, body: unknown) => vi.fn(async () => new Response(JSON.stringify(body), { status }));

    it('sends the ID token and returns the analysis', async () => {
        const fetchImpl = reply(200, { analysis: { summary: 'ok', strengths: [], issues: [], suggestions: [] } });
        const res = await requestAnalysis(input, { endpoint: '/api/ai-analysis', getIdToken: async () => 'tok', fetchImpl });
        expect(res.summary).toBe('ok');
        const [, init] = (fetchImpl.mock.calls[0] as unknown) as [string, RequestInit];
        expect((init.headers as Record<string, string>).Authorization).toBe('Bearer tok');
    });

    it('maps failures to codes', async () => {
        const code = async (getIdToken: () => Promise<string | null>, fetchImpl: any) =>
            requestAnalysis(input, { endpoint: '/x', getIdToken, fetchImpl }).catch((e: AnalysisError) => e.code);
        expect(await code(async () => null, reply(200, {}))).toBe('unauthenticated');
        expect(await code(async () => 't', reply(429, {}))).toBe('rate_limited');
        expect(await code(async () => 't', reply(503, { error: 'not_configured' }))).toBe('not_configured');
        expect(await code(async () => 't', reply(502, { error: 'refused' }))).toBe('refused');
        expect(await code(async () => 't', vi.fn(async () => { throw new TypeError('offline'); }))).toBe('network');
    });
});

describe('U11: AiAnalysisCard', () => {
    beforeEach(() => localStorage.clear());
    const props = { lang: 'es' as const, logs, bodyLogs: [], unit: 'kg' as const, exerciseName: (ex: any) => String(ex.name), convert: (kg: number) => kg };

    it('hidden without an endpoint; asks to sign in when signed out', () => {
        const { container, unmount } = render(<AiAnalysisCard {...props} signedIn endpoint={null} />);
        expect(container.innerHTML).toBe('');
        unmount();
        render(<AiAnalysisCard {...props} signedIn={false} endpoint="/x" />);
        expect(screen.getByText('Inicia sesión para usar el análisis con IA.')).toBeInTheDocument();
    });

    it('nothing is sent before consent; accepting runs the analysis and keeps the result', async () => {
        const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ analysis: { summary: 'Vas bien.', strengths: ['Constancia'], issues: ['Poca espalda'], suggestions: ['Más remo'] } }), { status: 200 }));
        render(<AiAnalysisCard {...props} signedIn endpoint="/x" getIdToken={async () => 't'} fetchImpl={fetchImpl as any} />);
        expect(screen.getByText(/No se envían tu nombre, email ni notas/)).toBeInTheDocument();
        expect(fetchImpl).not.toHaveBeenCalled();
        fireEvent.click(screen.getByRole('button', { name: 'Aceptar y analizar' }));
        expect(await screen.findByText('Vas bien.')).toBeInTheDocument();
        expect(screen.getByText('Poca espalda')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Analizar de nuevo' })).toBeInTheDocument();
        expect(loadLastAnalysis()?.result.summary).toBe('Vas bien.');
    });

    it('shows the error message when the server refuses', async () => {
        localStorage.setItem('il_ai_analysis_consent_v1', '1');
        const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ error: 'rate_limited' }), { status: 429 }));
        render(<AiAnalysisCard {...props} signedIn endpoint="/x" getIdToken={async () => 't'} fetchImpl={fetchImpl as any} />);
        fireEvent.click(screen.getByRole('button', { name: 'Analizar mis entrenamientos' }));
        expect(await screen.findByRole('alert')).toHaveTextContent('Demasiados análisis seguidos');
    });
});
