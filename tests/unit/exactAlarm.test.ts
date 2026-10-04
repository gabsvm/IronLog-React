// Q8: exact-alarm bridge wrappers and notice rule (bridge simulated).
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { capState } = vi.hoisted(() => ({
    capState: {
        isNative: false,
        platform: 'web',
        bridge: {
            canScheduleExactAlarms: vi.fn(async () => ({ granted: true, sdkInt: 34 })),
            openExactAlarmSettings: vi.fn(async () => {}),
        },
    },
}));

vi.mock('@capacitor/core', () => ({
    Capacitor: {
        isNativePlatform: () => capState.isNative,
        getPlatform: () => capState.platform,
    },
    registerPlugin: () => capState.bridge,
}));

import {
    getExactAlarmState,
    openExactAlarmSettings,
    shouldShowExactAlarmNotice,
} from '../../utils/audio';

describe('Q8: getExactAlarmState', () => {
    beforeEach(() => {
        capState.isNative = false;
        capState.platform = 'web';
        capState.bridge.canScheduleExactAlarms.mockClear();
        capState.bridge.canScheduleExactAlarms.mockResolvedValue({ granted: true, sdkInt: 34 });
    });

    it('returns null on web without touching the bridge', async () => {
        expect(await getExactAlarmState()).toBeNull();
        expect(capState.bridge.canScheduleExactAlarms).not.toHaveBeenCalled();
    });

    it('returns null on non-Android native shells', async () => {
        capState.isNative = true;
        capState.platform = 'ios';
        expect(await getExactAlarmState()).toBeNull();
        expect(capState.bridge.canScheduleExactAlarms).not.toHaveBeenCalled();
    });

    it('passes through the bridge state on native Android', async () => {
        capState.isNative = true;
        capState.platform = 'android';
        capState.bridge.canScheduleExactAlarms.mockResolvedValue({ granted: false, sdkInt: 33 });
        expect(await getExactAlarmState()).toEqual({ granted: false, sdkInt: 33 });
    });

    it('returns null on bridge errors or malformed payloads', async () => {
        capState.isNative = true;
        capState.platform = 'android';
        capState.bridge.canScheduleExactAlarms.mockRejectedValueOnce(new Error('dead'));
        expect(await getExactAlarmState()).toBeNull();
        capState.bridge.canScheduleExactAlarms.mockResolvedValueOnce({ granted: 'yes' } as never);
        expect(await getExactAlarmState()).toBeNull();
    });
});

describe('Q8: openExactAlarmSettings', () => {
    it('opens on native, no-ops on web', async () => {
        capState.bridge.openExactAlarmSettings.mockClear();
        capState.isNative = false;
        openExactAlarmSettings();
        await new Promise((r) => setTimeout(r, 10));
        expect(capState.bridge.openExactAlarmSettings).not.toHaveBeenCalled();

        capState.isNative = true;
        openExactAlarmSettings();
        await new Promise((r) => setTimeout(r, 10));
        expect(capState.bridge.openExactAlarmSettings).toHaveBeenCalledTimes(1);
    });
});

describe('Q8: shouldShowExactAlarmNotice', () => {
    const base = { platform: 'android', isNative: true, sdkInt: 34, granted: false, alreadyNoticed: false };

    it('shows once on Android 12+ without grant', () => {
        expect(shouldShowExactAlarmNotice(base)).toBe(true);
    });

    it('hides on web, old APIs, grants and repeats', () => {
        expect(shouldShowExactAlarmNotice({ ...base, isNative: false, platform: 'web' })).toBe(false);
        expect(shouldShowExactAlarmNotice({ ...base, platform: 'ios' })).toBe(false);
        expect(shouldShowExactAlarmNotice({ ...base, sdkInt: 30 })).toBe(false);
        expect(shouldShowExactAlarmNotice({ ...base, granted: true })).toBe(false);
        expect(shouldShowExactAlarmNotice({ ...base, alreadyNoticed: true })).toBe(false);
    });
});
