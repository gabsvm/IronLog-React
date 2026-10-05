import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Capacitor } from '@capacitor/core';
import { RestTimerOverlay } from '../../components/ui/RestTimerOverlay';
import * as TimerContext from '../../context/TimerContext';
import * as AppContext from '../../context/AppContext';
import * as useTimerModule from '../../hooks/useTimer';
import { TRANSLATIONS } from '../../constants/translations';

vi.mock('../../utils/audio', () => ({
    triggerHaptic: vi.fn(),
    playRestBeep: vi.fn(),
}));

vi.mock('../../hooks/useTimer', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../../hooks/useTimer')>();
    return { ...actual, requestTimerNotificationPermission: vi.fn() };
});

describe('G6: one-time notification opt-in after the first completed rest', () => {
    const originalNotification = (globalThis as any).Notification;

    const completeRest = () => {
        act(() => {
            window.dispatchEvent(new CustomEvent('ironlog:rest-completed'));
        });
    };

    beforeEach(() => {
        vi.clearAllMocks();
        window.localStorage.removeItem('il_notif_prompted');
        (globalThis as any).Notification = { permission: 'default' };
        vi.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(false);

        vi.spyOn(TimerContext, 'useTimerState').mockReturnValue({
            active: false,
            timeLeft: 0,
            duration: 90,
            endAt: 0,
        } as any);
        vi.spyOn(TimerContext, 'useTimerActions').mockReturnValue({
            setRestTimer: vi.fn(),
        } as any);
        vi.spyOn(AppContext, 'useAppPreferences').mockReturnValue({
            lang: 'es',
            reducedEffects: false,
        } as any);
        vi.spyOn(AppContext, 'useAppConfig').mockReturnValue({
            config: { showRIR: false, rpEnabled: false, restTimerDisplay: 'compact' } as any,
            setConfig: vi.fn(),
        } as any);
    });

    afterEach(() => {
        vi.restoreAllMocks();
        window.localStorage.removeItem('il_notif_prompted');
        if (originalNotification === undefined) {
            delete (globalThis as any).Notification;
        } else {
            (globalThis as any).Notification = originalNotification;
        }
    });

    it('appears on the first completed rest and persists the once-flag', () => {
        render(<RestTimerOverlay />);
        expect(screen.queryByText(TRANSLATIONS.es.notifPromptTitle)).not.toBeInTheDocument();

        completeRest();

        expect(screen.getByText(TRANSLATIONS.es.notifPromptTitle)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: TRANSLATIONS.es.notifPromptEnable })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: TRANSLATIONS.es.notifPromptLater })).toBeInTheDocument();
        expect(window.localStorage.getItem('il_notif_prompted')).toBe('1');
    });

    it('S4: the prompt warns that web alerts are unreliable with the screen off', () => {
        render(<RestTimerOverlay />);
        completeRest();
        expect(screen.getByText(TRANSLATIONS.es.notifWebCaveat)).toBeInTheDocument();
    });

    it('"Ahora no" dismisses it and it never shows again', () => {
        render(<RestTimerOverlay />);
        completeRest();
        expect(screen.getByText(TRANSLATIONS.es.notifPromptTitle)).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: TRANSLATIONS.es.notifPromptLater }));
        expect(screen.queryByText(TRANSLATIONS.es.notifPromptTitle)).not.toBeInTheDocument();

        // Later rests stay silent: the flag was set at show time.
        completeRest();
        completeRest();
        expect(screen.queryByText(TRANSLATIONS.es.notifPromptTitle)).not.toBeInTheDocument();
    });

    it('"Activar" requests permission from the click and dismisses', () => {
        render(<RestTimerOverlay />);
        completeRest();

        fireEvent.click(screen.getByRole('button', { name: TRANSLATIONS.es.notifPromptEnable }));

        expect(useTimerModule.requestTimerNotificationPermission).toHaveBeenCalledTimes(1);
        expect(screen.queryByText(TRANSLATIONS.es.notifPromptTitle)).not.toBeInTheDocument();
    });

    it('auto-dismisses after 10 s without clearing the once-flag', () => {
        vi.useFakeTimers();
        try {
            render(<RestTimerOverlay />);
            completeRest();
            expect(screen.getByText(TRANSLATIONS.es.notifPromptTitle)).toBeInTheDocument();

            act(() => {
                vi.advanceTimersByTime(9999);
            });
            expect(screen.getByText(TRANSLATIONS.es.notifPromptTitle)).toBeInTheDocument();

            act(() => {
                vi.advanceTimersByTime(1);
            });
            expect(screen.queryByText(TRANSLATIONS.es.notifPromptTitle)).not.toBeInTheDocument();
            expect(window.localStorage.getItem('il_notif_prompted')).toBe('1');

            // And it never comes back.
            completeRest();
            expect(screen.queryByText(TRANSLATIONS.es.notifPromptTitle)).not.toBeInTheDocument();
        } finally {
            vi.useRealTimers();
        }
    });

    it('never shows on native platforms', () => {
        vi.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(true);
        render(<RestTimerOverlay />);

        completeRest();

        expect(screen.queryByText(TRANSLATIONS.es.notifPromptTitle)).not.toBeInTheDocument();
        expect(window.localStorage.getItem('il_notif_prompted')).toBeNull();
    });

    it('never shows when permission is already granted or denied', () => {
        (globalThis as any).Notification = { permission: 'granted' };
        const { unmount } = render(<RestTimerOverlay />);
        completeRest();
        expect(screen.queryByText(TRANSLATIONS.es.notifPromptTitle)).not.toBeInTheDocument();
        unmount();

        (globalThis as any).Notification = { permission: 'denied' };
        render(<RestTimerOverlay />);
        completeRest();
        expect(screen.queryByText(TRANSLATIONS.es.notifPromptTitle)).not.toBeInTheDocument();
        expect(window.localStorage.getItem('il_notif_prompted')).toBeNull();
    });
});
