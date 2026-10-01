import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { withTransition, VIEW_DEPTH, VIEW_LOADERS } from '../../App';

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

    it('exposes VIEW_LOADERS for all secondary and lazy views', async () => {
        const requiredViews = ['workout', 'history', 'stats', 'nutrition', 'exercises', 'program', 'summary'];
        for (const viewName of requiredViews) {
            expect(typeof VIEW_LOADERS[viewName]).toBe('function');
            const mod = await VIEW_LOADERS[viewName]!();
            expect(mod).toBeDefined();
        }
    });

    it('defines consistent VIEW_DEPTH for directional page transitions', () => {
        expect(VIEW_DEPTH['home']).toBe(1);
        expect(VIEW_DEPTH['history']).toBe(1);
        expect(VIEW_DEPTH['stats']).toBe(1);
        expect(VIEW_DEPTH['nutrition']).toBe(1);
        expect(VIEW_DEPTH['workout']).toBe(2);
        expect(VIEW_DEPTH['exercises']).toBe(2);
        expect(VIEW_DEPTH['program']).toBe(2);
    });
});
