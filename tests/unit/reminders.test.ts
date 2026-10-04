import { describe, it, expect, vi, beforeEach } from 'vitest';

const { bridge, capacitor } = vi.hoisted(() => ({
    bridge: {
        scheduleWorkoutReminder: vi.fn(async () => {}),
        cancelWorkoutReminder: vi.fn(async () => {}),
        markWorkoutDone: vi.fn(async () => {}),
    },
    capacitor: { native: false, platform: 'web' },
}));

vi.mock('@capacitor/core', () => ({
    Capacitor: {
        isNativePlatform: () => capacitor.native,
        getPlatform: () => capacitor.platform,
    },
    registerPlugin: () => bridge,
}));

import {
    DEFAULT_REMINDER_CONFIG,
    REMINDER_CONFIG_KEY,
    TRAINED_DAY_KEY,
    computeNextReminder,
    isTrainedOn,
    loadReminderConfig,
    notifyWorkoutDone,
    saveReminderConfig,
    syncReminderSchedule,
    toISODate,
    trainedDayMarker,
} from '../../utils/reminders';

describe('Q13: workout reminders', () => {
    beforeEach(() => {
        localStorage.clear();
        capacitor.native = false;
        capacitor.platform = 'web';
        vi.clearAllMocks();
    });

    it('computes the next occurrence on the same day when the time is ahead', () => {
        // Monday 2026-10-05 10:00 local, trains Mon/Wed/Fri at 18:00.
        const now = new Date(2026, 9, 5, 10, 0, 0);
        const next = computeNextReminder(now, { enabled: true, days: [1, 3, 5], hour: 18, minute: 0 });
        expect(next).toEqual(new Date(2026, 9, 5, 18, 0, 0));
    });

    it('skips to the next training day when today already passed', () => {
        const now = new Date(2026, 9, 5, 19, 0, 0); // Monday 19:00
        const next = computeNextReminder(now, { enabled: true, days: [1, 3, 5], hour: 18, minute: 0 });
        expect(next).toEqual(new Date(2026, 9, 7, 18, 0, 0)); // Wednesday
    });

    it('wraps around the week and treats exact-now as passed', () => {
        const saturday = new Date(2026, 9, 10, 12, 0, 0);
        expect(computeNextReminder(saturday, { enabled: true, days: [1], hour: 7, minute: 30 }))
            .toEqual(new Date(2026, 9, 12, 7, 30, 0)); // Monday
        const exact = new Date(2026, 9, 5, 18, 0, 0);
        expect(computeNextReminder(exact, { enabled: true, days: [1], hour: 18, minute: 0 }))
            .toEqual(new Date(2026, 9, 12, 18, 0, 0)); // next Monday, strictly future
    });

    it('returns null when disabled, dayless, or given only invalid days', () => {
        const now = new Date(2026, 9, 5, 10, 0, 0);
        expect(computeNextReminder(now, { enabled: false, days: [1], hour: 8, minute: 0 })).toBeNull();
        expect(computeNextReminder(now, { enabled: true, days: [], hour: 8, minute: 0 })).toBeNull();
        expect(computeNextReminder(now, { enabled: true, days: [9, -1], hour: 8, minute: 0 })).toBeNull();
    });

    it('formats local ISO days (never UTC-shifted) and matches trained markers', () => {
        expect(toISODate(new Date(2026, 9, 20, 23, 30, 0))).toBe('2026-10-20');
        expect(toISODate(new Date(2026, 0, 5, 0, 5, 0))).toBe('2026-01-05');
        expect(isTrainedOn('2026-10-20', new Date(2026, 9, 20, 12, 0, 0))).toBe(true);
        expect(isTrainedOn('2026-10-19', new Date(2026, 9, 20, 12, 0, 0))).toBe(false);
        expect(isTrainedOn(null, new Date())).toBe(false);
    });

    it('persists the config and falls back to defaults on garbage', () => {
        expect(loadReminderConfig()).toEqual(DEFAULT_REMINDER_CONFIG);
        saveReminderConfig({ enabled: true, days: [0, 6], hour: 9, minute: 15 });
        expect(localStorage.getItem(REMINDER_CONFIG_KEY)).toBe('{"enabled":true,"days":[0,6],"hour":9,"minute":15}');
        expect(loadReminderConfig()).toEqual({ enabled: true, days: [0, 6], hour: 9, minute: 15 });
        localStorage.setItem(REMINDER_CONFIG_KEY, '{nope');
        expect(loadReminderConfig()).toEqual(DEFAULT_REMINDER_CONFIG);
        localStorage.setItem(REMINDER_CONFIG_KEY, '{"enabled":true,"days":["x"],"hour":99,"minute":-1}');
        expect(loadReminderConfig()).toEqual(DEFAULT_REMINDER_CONFIG);
    });

    it('syncs the native schedule only on Android native', async () => {
        const config = { enabled: true, days: [1, 3], hour: 18, minute: 30 };
        await syncReminderSchedule(config);
        expect(bridge.scheduleWorkoutReminder).not.toHaveBeenCalled();

        capacitor.native = true;
        capacitor.platform = 'android';
        await syncReminderSchedule(config);
        expect(bridge.scheduleWorkoutReminder).toHaveBeenCalledWith({
            enabled: true, days: [1, 3], hour: 18, minute: 30,
        });

        await syncReminderSchedule({ ...config, enabled: false });
        expect(bridge.cancelWorkoutReminder).toHaveBeenCalledTimes(1);
        await syncReminderSchedule({ ...config, days: [] });
        expect(bridge.cancelWorkoutReminder).toHaveBeenCalledTimes(2);
    });

    it('marks the trained day locally and tells the bridge on native', () => {
        notifyWorkoutDone(new Date(2026, 9, 20, 20, 0, 0));
        expect(localStorage.getItem(TRAINED_DAY_KEY)).toBe('2026-10-20');
        expect(trainedDayMarker()).toBe('2026-10-20');
        expect(bridge.markWorkoutDone).not.toHaveBeenCalled();

        capacitor.native = true;
        capacitor.platform = 'android';
        notifyWorkoutDone(new Date(2026, 9, 21, 20, 0, 0));
        expect(bridge.markWorkoutDone).toHaveBeenCalledWith({ date: '2026-10-21' });
    });
});
