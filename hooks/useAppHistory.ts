import { useEffect, useRef, type MutableRefObject } from 'react';
import { flushSync } from 'react-dom';
import { peekProgrammaticBackAt, clearProgrammaticBackAt } from '../components/ui/useModalLayer';

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

// View Hierarchy for Directional Animations (Fase 2 shell: four roots + children)
export const VIEW_DEPTH: Record<string, number> = {
    'home': 1,
    'routine': 1,
    'progress': 1,
    'diary': 1,
    'measure': 1,
    'workout': 2,
    'summary': 2,
    'exercises': 2,
    'program': 2,
    // Legacy names resolve before reaching renderers, but history entries and
    // tests may still reference them: keep the same depths.
    'history': 1,
    'stats': 1,
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
                const existing = window.history.state as { view?: string } | null;
                // Reload with a restored sheet (profile:true) must not be
                // flattened to a bare home entry: the open sheet is bound to it.
                if (existing && typeof existing.view === 'string') return;
                window.history.replaceState({ view: 'home' }, '', '#home');
            }
        } catch (e) { }
    }, []);

    useEffect(() => {
        const handlePop = (e: PopStateEvent) => {
            const state = e.state;
            // A programmatic modal-entry consumption only removes that entry;
            // the app drives the view explicitly in the same action. A pop
            // carrying our marker must never regress or advance the view,
            // regardless of arrival order (finish->summary, discard->home).
            if (peekProgrammaticBackAt() !== 0) {
                clearProgrammaticBackAt();
            } else if (state) {
                if (state.view && state.view !== targetViewRef.current) {
                    withTransition('back', () => {
                        flushSync(() => {
                            targetViewRef.current = state.view;
                            setViewState(state.view);
                        });
                    });
                }
            } else {
                if (targetViewRef.current !== 'home') {
                    // 'home' needs no preload: flip the view atomically like setView does.
                    targetViewRef.current = 'home';
                    withTransition('back', () => {
                        flushSync(() => {
                            setViewState('home');
                        });
                    });
                }
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
        const isNav = view === 'home' || view === 'routine' || view === 'progress' || view === 'diary' || view === 'measure';

        try {
            if (typeof window !== 'undefined' && window.history) {
                const current = window.history.state as { view?: string } | null;
                // A popstate already moved the browser to the entry matching
                // this render: writing again would fork or duplicate history.
                // Extra keys pushed by sheets (profile: true) are ignored.
                if (current && current.view === view) {
                    return;
                }
                const parentView = current && VIEW_DEPTH[current.view ?? ''] === 1
                    ? current.view
                    : (current as { parentView?: string } | null)?.parentView;
                if (isNav) {
                    window.history.replaceState({ view }, '', `#${view}`);
                } else if (current && VIEW_DEPTH[current.view ?? ''] === 2) {
                    // Completing a workout replaces its entry; Back must not
                    // resurrect a finished session underneath its summary.
                    window.history.replaceState({ view, parentView }, '', `#${view}`);
                } else {
                    window.history.pushState({ view, parentView }, '', `#${view}`);
                }
            }
        } catch (e) { }
    }, [view]);
};
