// Q5: local error log — cap, truncation, redaction, diagnostics, listeners.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    buildDiagnosticsText,
    clearErrorLog,
    ERROR_LOG_MAX_ENTRIES,
    ERROR_LOG_STACK_MAX_CHARS,
    logError,
    readErrorLog,
    redactSensitive,
    registerGlobalErrorListeners,
} from '../../utils/errorLog';
import { db } from '../../utils/db';
import { APP_VERSION } from '../../services/backupService';

describe('Q5: error ring buffer', () => {
    beforeEach(async () => {
        await clearErrorLog();
    });

    it('keeps only the newest 50 entries', async () => {
        for (let i = 0; i < 55; i++) {
            await logError({ message: `err-${i}`, source: 'boundary' });
        }
        const entries = await readErrorLog();
        expect(entries).toHaveLength(ERROR_LOG_MAX_ENTRIES);
        expect(entries[0].message).toBe('err-5');
        expect(entries[entries.length - 1].message).toBe('err-54');
    });

    it('loses no entries under concurrent writes', async () => {
        await Promise.all(
            Array.from({ length: 10 }, (_, i) => logError({ message: `race-${i}`, source: 'boundary' })),
        );
        const entries = await readErrorLog();
        expect(entries).toHaveLength(10);
        expect(new Set(entries.map((e) => e.message)).size).toBe(10);
    });

    it('truncates stacks to 2 KB and records entry metadata', async () => {
        await logError({ message: 'boom', stack: 's'.repeat(5000), source: 'chunk', view: 'home' });
        const [entry] = await readErrorLog();
        expect(entry.stack?.length).toBeLessThanOrEqual(ERROR_LOG_STACK_MAX_CHARS);
        expect(entry.source).toBe('chunk');
        expect(entry.view).toBe('home');
        expect(entry.appVersion).toBe(APP_VERSION);
        expect(entry.platform).toMatch(/^(web|native)$/);
        expect(typeof entry.ts).toBe('number');
    });

    it('redacts emails and secrets from messages and stacks', async () => {
        await logError({
            message: 'login failed for juan.perez@example.com, password=hunter2',
            stack: 'at f (token=abc123)',
            source: 'boundary',
        });
        const [entry] = await readErrorLog();
        expect(entry.message).not.toContain('juan.perez@example.com');
        expect(entry.message).toContain('[email]');
        expect(entry.message).not.toContain('hunter2');
        expect(entry.stack).not.toContain('abc123');
        expect(redactSensitive('a@b.co')).toBe('[email]');
    });

    it('never throws when storage fails', async () => {
        const spy = vi.spyOn(db, 'get').mockImplementationOnce(() => {
            throw new Error('idb down');
        });
        try {
            await expect(logError({ message: 'x', source: 'boundary' })).resolves.toBeUndefined();
        } finally {
            spy.mockRestore();
        }
        await expect(readErrorLog()).resolves.toEqual(expect.any(Array));
    });

    it('clears the log', async () => {
        await logError({ message: 'x', source: 'boundary' });
        expect(await readErrorLog()).toHaveLength(1);
        await clearErrorLog();
        expect(await readErrorLog()).toHaveLength(0);
    });
});

describe('Q5: diagnostics blob', () => {
    it('contains version, sync state and the latest errors (redacted)', async () => {
        await clearErrorLog();
        await logError({ message: 'first fail', source: 'boundary', view: 'stats' });
        await logError({ message: 'mail ana@test.com broke', source: 'chunk', view: 'home' });
        const entries = await readErrorLog();
        const text = buildDiagnosticsText({ syncStatusText: 'Up to date in cloud', entries });
        expect(text).toContain(`App: ${APP_VERSION}`);
        expect(text).toContain('Up to date in cloud');
        expect(text).toContain('Errors: 2');
        expect(text).toContain('first fail');
        expect(text).toContain('[boundary] [stats]');
        expect(text).toContain('[chunk] [home]');
        expect(text).not.toContain('ana@test.com');
    });
});

describe('Q5: global listeners', () => {
    beforeEach(async () => {
        await clearErrorLog();
    });

    it('captures window error events and unhandled rejections, ignores noise', async () => {
        const unregister = registerGlobalErrorListeners();
        try {
            window.dispatchEvent(new ErrorEvent('error', { message: 'global boom' }));
            const rejection = new Event('unhandledrejection') as PromiseRejectionEvent;
            (rejection as { reason?: unknown }).reason = new Error('promise boom');
            window.dispatchEvent(rejection);
            window.dispatchEvent(
                new ErrorEvent('error', { message: 'ResizeObserver loop limit exceeded' }),
            );

            await vi.waitFor(async () => {
                expect(await readErrorLog()).toHaveLength(2);
            });
            const entries = await readErrorLog();
            expect(entries.map((e) => e.source).sort()).toEqual(['unhandledrejection', 'window.onerror']);
            expect(entries.map((e) => e.message).join('|')).toContain('global boom');
            expect(entries.map((e) => e.message).join('|')).toContain('promise boom');
        } finally {
            unregister();
        }
    });

    it('stops capturing after unregister', async () => {
        const unregister = registerGlobalErrorListeners();
        unregister();
        window.dispatchEvent(new ErrorEvent('error', { message: 'late boom' }));
        await new Promise((r) => setTimeout(r, 50));
        expect(await readErrorLog()).toHaveLength(0);
    });
});
