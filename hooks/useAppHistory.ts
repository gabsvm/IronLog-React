import { useEffect, useRef, type MutableRefObject } from 'react';
import { flushSync } from 'react-dom';

// Wraps a DOM mutation in a View Transition (graceful fallback when unsupported).
export const withTransition = (direction: string, callback: () => void) => {
    document.documentElement.dataset.transition = direction;
    const reducedEffects = document.documentElement.dataset.effects === 'reduced';
    if (!reducedEffects && typeof (document as any).startViewTransition === 'function') {
        try {
            const transition = (document as any).startViewTransition(callback);
            if (transition?.finished && typeof transition.finished.finally === 'function') {
                transition.finished.finally(() => { document.documentElement.dataset.transition = ''; });
            } else {
                document.documentElement.dataset.transition = '';
            }
            return transition;
        } catch {
            callback();
            document.documentElement.dataset.transition = '';
        }
    } else {
        callback();
        document.documentElement.dataset.transition = '';
    }
};

// View Hierarchy for Directional Animations
export const VIEW_DEPTH: Record<string, number> = {
    'home': 1,
    'history': 1,
    'stats': 1,
    'workout': 2,
    'exercises': 2,
    'program': 2,
    'nutrition': 1
};

/**
 * Q18: history management logic, moved verbatim from App. Nav tabs use
 * replaceState to keep a clean history stack; depth 2 views (workout,
 * program, exercises) use pushState. The unified profile sheet pushes its
 * own single entry from Layout (profile: true). After a popstate, the
 * browser entry already matches the render, so the sync effect compares
 * against window.history.state instead of tracking pops with a flag (a flag
 * gets stuck when a pop changes no App state, e.g. when closing the profile
 * sheet, and then swallows the next pushState).
 */
export const useAppHistory = (
    view: string,
    setViewState: (view: any) => void,
    targetViewRef: MutableRefObject<string>,
) => {
    const isFirstMountRef = useRef(true);

    // Seed the initial entry ONCE. (It used to live in the listener effect
    // below, which re-ran on every view change and overwrote the real entry —
    // e.g. Back from program landed on home instead of the previous tab.)
    useEffect(() => {
        try {
            if (typeof window !== 'undefined' && window.history) {
                window.history.replaceState({ view: 'home' }, '', '#home');
            }
        } catch (e) { }
    }, []);

    useEffect(() => {
        const handlePop = (e: PopStateEvent) => {
            const state = e.state;
            if (state) {
                withTransition('back', () => {
                    flushSync(() => {
                        if (state.view) { targetViewRef.current = state.view; setViewState(state.view); }
                    });
                });
            } else {
                // 'home' needs no preload: flip the view atomically like setView does.
                targetViewRef.current = 'home';
                withTransition('back', () => {
                    flushSync(() => {
                        setViewState('home');
                    });
                });
            }
            window.dispatchEvent(new CustomEvent('ironlog:popstate', { detail: state }));
        };
        window.addEventListener('popstate', handlePop);
        return () => window.removeEventListener('popstate', handlePop);
    }, [setViewState, targetViewRef]);

    useEffect(() => {
        if (isFirstMountRef.current) {
            isFirstMountRef.current = false;
            return;
        }

        const state = { view };
        const isNav = view === 'home' || view === 'history' || view === 'stats' || view === 'nutrition';

        try {
            if (typeof window !== 'undefined' && window.history) {
                const current = window.history.state as { view?: string } | null;
                // A popstate already moved the browser to the entry matching
                // this render: writing again would fork or duplicate history.
                // Extra keys pushed by sheets (profile: true) are ignored.
                if (current && current.view === state.view) {
                    return;
                }
                if (isNav) {
                    window.history.replaceState(state, '', `#${view}`);
                } else {
                    window.history.pushState(state, '', `#${view}`);
                }
            }
        } catch (e) { }
    }, [view]);
};
