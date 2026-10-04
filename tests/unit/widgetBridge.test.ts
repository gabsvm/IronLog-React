import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockBridge, mockIsNative } = vi.hoisted(() => ({
    mockBridge: {
        getLaunchAction: vi.fn(),
        updateWidgetData: vi.fn(),
    },
    mockIsNative: vi.fn(() => false),
}));

vi.mock('@capacitor/core', () => ({
    Capacitor: { isNativePlatform: () => mockIsNative() },
    registerPlugin: vi.fn(() => mockBridge),
}));

import { Capacitor } from '@capacitor/core';
import { getNativeLaunchAction, updateWidgetData } from '../../utils/audio';

describe('Q17: widget bridge wrappers', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockIsNative.mockReturnValue(false);
        (Capacitor as any).isNativePlatform = mockIsNative;
    });

    it('returns null on web without touching the bridge', async () => {
        mockIsNative.mockReturnValue(false);
        expect(await getNativeLaunchAction()).toBeNull();
        expect(mockBridge.getLaunchAction).not.toHaveBeenCalled();
        updateWidgetData('Pecho');
        expect(mockBridge.updateWidgetData).not.toHaveBeenCalled();
    });

    it('consumes the launch action once on native', async () => {
        mockIsNative.mockReturnValue(true);
        // Native consume semantics: first call delivers, then empty.
        mockBridge.getLaunchAction
            .mockResolvedValueOnce({ action: 'start' })
            .mockResolvedValueOnce({ action: '' });
        expect(await getNativeLaunchAction()).toBe('start');
        expect(await getNativeLaunchAction()).toBeNull();
        expect(mockBridge.getLaunchAction).toHaveBeenCalledTimes(2);
    });

    it('maps malformed payloads and failures to null', async () => {
        mockIsNative.mockReturnValue(true);
        mockBridge.getLaunchAction.mockResolvedValueOnce({ action: 42 } as any);
        expect(await getNativeLaunchAction()).toBeNull();
        mockBridge.getLaunchAction.mockRejectedValueOnce(new Error('dead bridge'));
        expect(await getNativeLaunchAction()).toBeNull();
    });

    it('publishes the widget title on native only', async () => {
        mockIsNative.mockReturnValue(true);
        mockBridge.updateWidgetData.mockResolvedValue(undefined);
        updateWidgetData('Pecho · Día 1');
        await Promise.resolve();
        expect(mockBridge.updateWidgetData).toHaveBeenCalledWith({ title: 'Pecho · Día 1' });
    });
});
