// Q8: one-time exact-alarm notice in RestTimerOverlay after the first rest.
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const { mocks } = vi.hoisted(() => ({
    mocks: {
        isNative: true,
        platform: 'android',
        alarmState: { granted: false, sdkInt: 34 } as { granted: boolean; sdkInt: number } | null,
        openExactAlarmSettings: vi.fn(),
    },
}));

vi.mock('@capacitor/core', () => ({
    Capacitor: {
        isNativePlatform: () => mocks.isNative,
        getPlatform: () => mocks.platform,
    },
    registerPlugin: () => ({}),
}));

vi.mock('../../utils/audio', async (importOriginal) => {
    const orig = await importOriginal<typeof import('../../utils/audio')>();
    return {
        ...orig,
        getExactAlarmState: async () => mocks.alarmState,
        openExactAlarmSettings: (...args: unknown[]) => mocks.openExactAlarmSettings(...args),
    };
});

vi.mock('../../context/TimerContext', () => ({
    useTimerState: () => ({ active: false }),
    useTimerActions: () => ({ setRestTimer: vi.fn() }),
}));

vi.mock('../../context/AppContext', () => ({
    useAppPreferences: () => ({ lang: 'es', reducedEffects: true }),
    useAppConfig: () => ({ config: {} }),
}));

vi.mock('../../lib/store', () => ({
    useStore: (sel: (s: { activeSession: null; setActiveSession: () => void }) => unknown) =>
        sel({ activeSession: null, setActiveSession: vi.fn() }),
}));

import { RestTimerOverlay } from '../../components/ui/RestTimerOverlay';

describe('Q8: exact-alarm notice', () => {
    beforeEach(() => {
        window.localStorage.removeItem('il_exact_alarm_noticed');
        window.localStorage.setItem('il_notif_prompted', '1');
        mocks.isNative = true;
        mocks.platform = 'android';
        mocks.alarmState = { granted: false, sdkInt: 34 };
        mocks.openExactAlarmSettings.mockClear();
    });

    it('appears once after the first rest and stamps the flag', async () => {
        render(<RestTimerOverlay />);
        expect(screen.queryByText(/pantalla bloqueada/)).toBeNull();

        window.dispatchEvent(new CustomEvent('ironlog:rest-completed'));

        expect(await screen.findByText(/pantalla bloqueada/)).toBeDefined();
        expect(window.localStorage.getItem('il_exact_alarm_noticed')).toBe('1');

        fireEvent.click(screen.getByText('Activar'));
        expect(mocks.openExactAlarmSettings).toHaveBeenCalledTimes(1);
        await waitFor(() => expect(screen.queryByText(/pantalla bloqueada/)).toBeNull());
    });

    it('dismisses without enabling and never comes back', async () => {
        render(<RestTimerOverlay />);
        window.dispatchEvent(new CustomEvent('ironlog:rest-completed'));
        expect(await screen.findByText(/pantalla bloqueada/)).toBeDefined();

        fireEvent.click(screen.getByText('Ahora no'));
        await waitFor(() => expect(screen.queryByText(/pantalla bloqueada/)).toBeNull());

        window.dispatchEvent(new CustomEvent('ironlog:rest-completed'));
        await new Promise((r) => setTimeout(r, 100));
        expect(screen.queryByText(/pantalla bloqueada/)).toBeNull();
        expect(mocks.openExactAlarmSettings).not.toHaveBeenCalled();
    });

    it('never shows on web, when granted, or below API 31', async () => {
        mocks.alarmState = { granted: true, sdkInt: 34 };
        const { unmount } = render(<RestTimerOverlay />);
        window.dispatchEvent(new CustomEvent('ironlog:rest-completed'));
        await new Promise((r) => setTimeout(r, 100));
        expect(screen.queryByText(/pantalla bloqueada/)).toBeNull();
        expect(window.localStorage.getItem('il_exact_alarm_noticed')).toBeNull();
        unmount();

        mocks.alarmState = { granted: false, sdkInt: 30 };
        render(<RestTimerOverlay />);
        window.dispatchEvent(new CustomEvent('ironlog:rest-completed'));
        await new Promise((r) => setTimeout(r, 100));
        expect(screen.queryByText(/pantalla bloqueada/)).toBeNull();
    });
});
