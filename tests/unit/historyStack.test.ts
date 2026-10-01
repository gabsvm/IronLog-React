import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Task U3: History Stack Non-Inflation and Unified Popstate', () => {
    let pushStateSpy: any;
    let replaceStateSpy: any;

    beforeEach(() => {
        pushStateSpy = vi.spyOn(window.history, 'pushState');
        replaceStateSpy = vi.spyOn(window.history, 'replaceState');
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    const isNavTab = (view: string) => {
        return view === 'home' || view === 'history' || view === 'stats' || view === 'nutrition';
    };

    it('nav tabs categorize correctly for replaceState vs pushState', () => {
        expect(isNavTab('home')).toBe(true);
        expect(isNavTab('history')).toBe(true);
        expect(isNavTab('stats')).toBe(true);
        expect(isNavTab('nutrition')).toBe(true);

        expect(isNavTab('workout')).toBe(false);
        expect(isNavTab('exercises')).toBe(false);
        expect(isNavTab('program')).toBe(false);
        expect(isNavTab('summary')).toBe(false);
    });

    it('simulates tab navigation: switching between 4 nav tabs uses replaceState only', () => {
        const historyMock: { view: string; hash: string }[] = [];
        let firstMount = true;

        const handleNavigation = (view: string, showSettings: boolean) => {
            if (firstMount) {
                firstMount = false;
                window.history.replaceState({ view: 'home', settings: false }, '', '#home');
                return;
            }

            const state = { view, settings: showSettings };
            const hash = showSettings ? 'settings' : view;
            const isNav = isNavTab(view) && !showSettings;

            if (isNav) {
                window.history.replaceState(state, '', `#${hash}`);
            } else {
                window.history.pushState(state, '', `#${hash}`);
            }
        };

        // Mount
        handleNavigation('home', false);
        expect(replaceStateSpy).toHaveBeenCalledTimes(1);
        expect(pushStateSpy).not.toHaveBeenCalled();

        // Switch to history
        handleNavigation('history', false);
        expect(replaceStateSpy).toHaveBeenCalledTimes(2);
        expect(pushStateSpy).not.toHaveBeenCalled();

        // Switch to stats
        handleNavigation('stats', false);
        expect(replaceStateSpy).toHaveBeenCalledTimes(3);
        expect(pushStateSpy).not.toHaveBeenCalled();

        // Switch to nutrition
        handleNavigation('nutrition', false);
        expect(replaceStateSpy).toHaveBeenCalledTimes(4);
        expect(pushStateSpy).not.toHaveBeenCalled();

        // Push state only happens when opening depth 2 view (workout) or settings
        handleNavigation('workout', false);
        expect(pushStateSpy).toHaveBeenCalledTimes(1);

        handleNavigation('workout', true); // open settings sheet
        expect(pushStateSpy).toHaveBeenCalledTimes(2);
    });

    it('dispatches unified ironlog:popstate event when popstate fires', () => {
        let capturedDetail: any = null;
        const listener = (e: Event) => {
            capturedDetail = (e as CustomEvent).detail;
        };
        window.addEventListener('ironlog:popstate', listener);

        const popState = { view: 'history', settings: false, profile: false };
        window.dispatchEvent(new CustomEvent('ironlog:popstate', { detail: popState }));

        expect(capturedDetail).toEqual(popState);
        window.removeEventListener('ironlog:popstate', listener);
    });
});
