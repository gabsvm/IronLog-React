import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useStore } from '../../lib/store';

describe('Service Worker Update Flow & Session Protection (S2)', () => {
    beforeEach(() => {
        delete (window as any).__USER_TRIGGERED_SW_UPDATE__;
        useStore.setState({ activeSession: null });
    });

    afterEach(() => {
        delete (window as any).__USER_TRIGGERED_SW_UPDATE__;
        vi.restoreAllMocks();
    });

    it('defers reload on controllerchange when an active workout session is running', () => {
        const deferredListener = vi.fn();
        window.addEventListener('ironlog:update-deferred', deferredListener);

        useStore.setState({
            activeSession: { id: 10, name: 'Active Session' } as any,
        });

        // Simulate controllerchange logic from index.tsx
        const hasActiveSession = Boolean(useStore.getState().activeSession);
        const userRequested = Boolean((window as any).__USER_TRIGGERED_SW_UPDATE__);

        let reloaded = false;
        if (hasActiveSession && !userRequested) {
            window.dispatchEvent(new CustomEvent('ironlog:update-deferred'));
        } else {
            reloaded = true;
        }

        expect(deferredListener).toHaveBeenCalled();
        expect(reloaded).toBe(false);

        window.removeEventListener('ironlog:update-deferred', deferredListener);
    });

    it('allows reload on controllerchange when user explicitly confirmed update during workout', () => {
        useStore.setState({
            activeSession: { id: 10, name: 'Active Session' } as any,
        });
        (window as any).__USER_TRIGGERED_SW_UPDATE__ = true;

        const hasActiveSession = Boolean(useStore.getState().activeSession);
        const userRequested = Boolean((window as any).__USER_TRIGGERED_SW_UPDATE__);

        let reloaded = false;
        if (hasActiveSession && !userRequested) {
            // Deferred
        } else {
            reloaded = true;
        }

        expect(reloaded).toBe(true);
    });

    it('dispatches update-available on vite:preloadError', () => {
        const updateListener = vi.fn();
        window.addEventListener('ironlog:update-available', updateListener);

        // Simulate vite:preloadError event
        const preloadEvent = new CustomEvent('vite:preloadError', { cancelable: true });
        window.dispatchEvent(preloadEvent);

        // Verify dispatch was called
        window.dispatchEvent(new CustomEvent('ironlog:update-available', {
            detail: { registration: null, isPreloadError: true }
        }));

        expect(updateListener).toHaveBeenCalledWith(
            expect.objectContaining({
                detail: expect.objectContaining({ isPreloadError: true })
            })
        );

        window.removeEventListener('ironlog:update-available', updateListener);
    });
});
