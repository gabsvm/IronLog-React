import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { withTransition } from '../../hooks/useAppHistory';

describe('Task L4: View Transitions and View Loaders', () => {
    const originalStartViewTransition = (document as any).startViewTransition;

    beforeEach(() => {
        document.documentElement.dataset.transition = '';
        document.documentElement.dataset.effects = 'balanced';
    });

    afterEach(() => {
        (document as any).startViewTransition = originalStartViewTransition;
        document.documentElement.dataset.transition = '';
        delete document.documentElement.dataset.effects;
        vi.restoreAllMocks();
    });

    it('sets transition dataset attribute and calls startViewTransition when supported', async () => {
        let callbackExecuted = false;
        let resolveFinished: () => void = () => {};
        const finishedPromise = new Promise<void>((res) => {
            resolveFinished = res;
        });

        const startViewTransitionMock = vi.fn((cb: () => void) => {
            cb();
            return {
                finished: finishedPromise,
            };
        });
        (document as any).startViewTransition = startViewTransitionMock;

        withTransition('forward', () => {
            callbackExecuted = true;
        });

        expect(startViewTransitionMock).toHaveBeenCalledTimes(1);
        expect(callbackExecuted).toBe(true);
        expect(document.documentElement.dataset.transition).toBe('forward');

        resolveFinished();
        await finishedPromise;
        // Allow microtask to run finally block
        await Promise.resolve();

        expect(document.documentElement.dataset.transition).toBe('');
    });

    it('bypasses startViewTransition when data-effects="reduced"', () => {
        document.documentElement.dataset.effects = 'reduced';
        const startViewTransitionMock = vi.fn((cb: () => void) => {
            cb();
            return { finished: Promise.resolve() };
        });
        (document as any).startViewTransition = startViewTransitionMock;

        let callbackExecuted = false;
        withTransition('back', () => {
            callbackExecuted = true;
        });

        expect(startViewTransitionMock).not.toHaveBeenCalled();
        expect(callbackExecuted).toBe(true);
        expect(document.documentElement.dataset.transition).toBe('');
    });

    it('gracefully runs callback when startViewTransition is unsupported', () => {
        delete (document as any).startViewTransition;

        let callbackExecuted = false;
        withTransition('fade', () => {
            callbackExecuted = true;
        });

        expect(callbackExecuted).toBe(true);
        expect(document.documentElement.dataset.transition).toBe('');
    });

    it('handles startViewTransition throwing synchronously', () => {
        (document as any).startViewTransition = vi.fn(() => {
            throw new Error('Invalid state');
        });

        let callbackExecuted = false;
        expect(() => {
            withTransition('forward', () => {
                callbackExecuted = true;
            });
        }).not.toThrow();

        expect(callbackExecuted).toBe(true);
        expect(document.documentElement.dataset.transition).toBe('');
    });


    it('resolves legacy view names to the Fase 2 roots', async () => {
        const { resolveAppView } = await import('../../components/layout/navigation');
        expect(resolveAppView('history')).toBe('diary');
        expect(resolveAppView('stats')).toBe('progress');
        expect(resolveAppView('nutrition')).toBe('diary');
        expect(resolveAppView('home')).toBe('home');
        expect(resolveAppView('workout')).toBe('workout');
        expect(resolveAppView('program')).toBe('program');
        expect(resolveAppView('nope')).toBeNull();
    });
});
