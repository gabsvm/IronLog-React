import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

// T3: CSV shared to the native Android app (Share / Open with).
const { mockBridge, mockIsNative } = vi.hoisted(() => ({
    mockBridge: { consumeSharedFile: vi.fn() },
    mockIsNative: vi.fn(() => true),
}));

vi.mock('@capacitor/core', () => ({
    Capacitor: { isNativePlatform: () => mockIsNative(), getPlatform: () => 'android' },
    registerPlugin: vi.fn(() => mockBridge),
}));

import { consumeNativeSharedFile } from '../../utils/audio';
import { useNativeSharedCsv } from '../../hooks/useNativeSharedCsv';

const REAL_VISIBILITY = Object.getOwnPropertyDescriptor(document, 'visibilityState');
const setVisible = (visible: boolean) =>
    Object.defineProperty(document, 'visibilityState', { value: visible ? 'visible' : 'hidden', configurable: true });

describe('T3: consumeNativeSharedFile', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockIsNative.mockReturnValue(true);
    });

    it('is null off-native without touching the bridge', async () => {
        mockIsNative.mockReturnValue(false);
        expect(await consumeNativeSharedFile()).toBeNull();
        expect(mockBridge.consumeSharedFile).not.toHaveBeenCalled();
    });

    it('maps the bridge answer: nothing, a file, an unreadable file, a bridge failure', async () => {
        mockBridge.consumeSharedFile.mockResolvedValueOnce({ available: false });
        expect(await consumeNativeSharedFile()).toBeNull();
        mockBridge.consumeSharedFile.mockResolvedValueOnce({ available: true, name: 'hevy.csv', text: 'title,start_time' });
        expect(await consumeNativeSharedFile()).toEqual({ name: 'hevy.csv', text: 'title,start_time' });
        mockBridge.consumeSharedFile.mockResolvedValueOnce({ available: true, error: 'read' });
        expect(await consumeNativeSharedFile()).toBe('error');
        mockBridge.consumeSharedFile.mockRejectedValueOnce(new Error('no plugin'));
        expect(await consumeNativeSharedFile()).toBeNull();
    });
});

describe('T3: useNativeSharedCsv (cold + warm start)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockIsNative.mockReturnValue(true);
        setVisible(true);
    });
    afterEach(() => {
        if (REAL_VISIBILITY) Object.defineProperty(document, 'visibilityState', REAL_VISIBILITY);
    });

    it('delivers a file shared before launch (cold start) once', async () => {
        mockBridge.consumeSharedFile
            .mockResolvedValueOnce({ available: true, name: 'a.csv', text: 'A' })
            .mockResolvedValue({ available: false });
        const { result } = renderHook(() => useNativeSharedCsv(true));
        await waitFor(() => expect(result.current?.launch).toEqual({ kind: 'file', payload: { name: 'a.csv', text: 'A' } }));
        expect(result.current?.seq).toBe(1);
    });

    it('picks up a file shared while running (warm start) with a new seq', async () => {
        mockBridge.consumeSharedFile.mockResolvedValue({ available: false });
        const { result } = renderHook(() => useNativeSharedCsv(true));
        await waitFor(() => expect(mockBridge.consumeSharedFile).toHaveBeenCalledTimes(1));
        expect(result.current).toBeNull();

        mockBridge.consumeSharedFile.mockResolvedValueOnce({ available: true, name: 'b.csv', text: 'B' });
        await act(async () => {
            document.dispatchEvent(new Event('visibilitychange'));
        });
        await waitFor(() => expect(result.current?.seq).toBe(1));
        mockBridge.consumeSharedFile.mockResolvedValueOnce({ available: true, error: 'read' });
        await act(async () => {
            document.dispatchEvent(new Event('visibilitychange'));
        });
        await waitFor(() => expect(result.current).toEqual({ seq: 2, launch: { kind: 'error' } }));
    });

    it('does nothing when disabled (web / PWA)', async () => {
        renderHook(() => useNativeSharedCsv(false));
        await new Promise((r) => setTimeout(r, 20));
        expect(mockBridge.consumeSharedFile).not.toHaveBeenCalled();
    });
});
