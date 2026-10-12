import { describe, it, expect, vi } from 'vitest';
import { runAfterProfileClosed, PROFILE_POPSTATE_EVENT } from '../../utils/profileNav';

const makeWin = (profile: boolean) => {
    const listeners = new Map<string, Set<() => void>>();
    const timers: Array<{ fn: () => void; ms: number; id: number; cleared: boolean }> = [];
    const win = {
        history: { state: profile ? { view: 'home', profile: true } : { view: 'home' } },
        addEventListener: (t: string, l: () => void) => { (listeners.get(t) ?? listeners.set(t, new Set()).get(t)!).add(l); },
        removeEventListener: (t: string, l: () => void) => { listeners.get(t)?.delete(l); },
        setTimeout: (fn: () => void, ms: number) => { const id = timers.length + 1; timers.push({ fn, ms, id, cleared: false }); return id; },
        clearTimeout: (id: number) => { const t = timers.find(x => x.id === id); if (t) t.cleared = true; },
    };
    const fire = () => listeners.get(PROFILE_POPSTATE_EVENT)?.forEach(l => l());
    const flush = (maxMs = Infinity) => { for (const t of [...timers]) if (!t.cleared && t.ms <= maxMs) { t.cleared = true; t.fn(); } };
    return { win, fire, flush, listeners };
};

describe('runAfterProfileClosed', () => {
    it('runs immediately when the profile does not own a history entry', () => {
        const { win } = makeWin(false);
        const action = vi.fn();
        runAfterProfileClosed(action, win);
        expect(action).toHaveBeenCalledTimes(1);
    });

    it('waits for the profile popstate, then navigates exactly once', () => {
        const { win, fire, flush, listeners } = makeWin(true);
        const action = vi.fn();
        runAfterProfileClosed(action, win);
        expect(action).not.toHaveBeenCalled();

        fire();
        expect(action).not.toHaveBeenCalled(); // deferred one tick so App can apply the popstate view first
        flush(0);
        expect(action).toHaveBeenCalledTimes(1);

        fire();
        flush();
        expect(action).toHaveBeenCalledTimes(1);
        expect(listeners.get(PROFILE_POPSTATE_EVENT)?.size).toBe(0);
    });

    it('falls back to a timeout if no popstate ever arrives', () => {
        const { win, flush } = makeWin(true);
        const action = vi.fn();
        runAfterProfileClosed(action, win, 400);
        flush(0);
        expect(action).not.toHaveBeenCalled();
        flush(400);
        flush(0);
        expect(action).toHaveBeenCalledTimes(1);
    });
});
