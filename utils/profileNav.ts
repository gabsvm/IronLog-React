/**
 * The profile sheet owns one browser-history entry (`state.profile`). Closing it
 * calls `history.back()`, and the resulting `popstate` is handled asynchronously
 * (it resets the app view to the entry we returned to). Navigating in the same
 * tick therefore lost the race: `setView('program')` ran first and the late
 * `popstate` flipped the app back to Home, so "Program editor" / "Exercise
 * library" never opened from the profile.
 *
 * `runAfterProfileClosed` defers `action` until that `popstate` has been
 * processed (App re-dispatches it as `ironlog:popstate`), with a short safety
 * timeout in case no event arrives.
 */
export const PROFILE_POPSTATE_EVENT = 'ironlog:popstate';

interface NavWindow {
    history: { state?: { profile?: boolean } | null };
    addEventListener(type: string, listener: () => void): void;
    removeEventListener(type: string, listener: () => void): void;
    setTimeout(handler: () => void, ms: number): number;
    clearTimeout(id: number): void;
}

export const runAfterProfileClosed = (action: () => void, win: NavWindow = window as unknown as NavWindow, timeoutMs = 400): void => {
    let profileEntryOpen = false;
    try {
        profileEntryOpen = !!win.history.state?.profile;
    } catch {
        profileEntryOpen = false;
    }
    if (!profileEntryOpen) {
        action();
        return;
    }

    let done = false;
    let timer = 0;
    const finish = () => {
        if (done) return;
        done = true;
        win.removeEventListener(PROFILE_POPSTATE_EVENT, onPop);
        win.clearTimeout(timer);
        // Let App finish applying the popstate-driven view before navigating away from it.
        win.setTimeout(action, 0);
    };
    const onPop = () => finish();
    win.addEventListener(PROFILE_POPSTATE_EVENT, onPop);
    timer = win.setTimeout(finish, timeoutMs);
};
