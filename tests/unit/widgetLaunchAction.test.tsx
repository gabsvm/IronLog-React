import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

const { mockGetAction } = vi.hoisted(() => ({
    mockGetAction: vi.fn(async () => null as string | null),
}));

vi.mock('../../utils/audio', () => ({
    getNativeLaunchAction: () => mockGetAction(),
}));

import { useWidgetLaunchAction } from '../../hooks/useWidgetLaunchAction';

const REAL_VISIBILITY = Object.getOwnPropertyDescriptor(document, 'visibilityState');

const setVisible = (visible: boolean) => {
    Object.defineProperty(document, 'visibilityState', {
        value: visible ? 'visible' : 'hidden',
        configurable: true,
    });
};

describe('Q17: useWidgetLaunchAction (cold + warm start)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        setVisible(true);
    });

    afterEach(() => {
        if (REAL_VISIBILITY) Object.defineProperty(document, 'visibilityState', REAL_VISIBILITY);
    });

    it('runs once on mount when a launch action is pending (cold start)', async () => {
        mockGetAction.mockResolvedValueOnce('start').mockResolvedValue(null);
        const onStart = vi.fn();
        renderHook(() => useWidgetLaunchAction(true, onStart));
        await waitFor(() => expect(onStart).toHaveBeenCalledTimes(1));
        // The cleared action is not re-run.
        await new Promise((r) => setTimeout(r, 20));
        expect(onStart).toHaveBeenCalledTimes(1);
    });

    it('runs again when a new action arrives on resume (warm start)', async () => {
        mockGetAction.mockResolvedValue(null);
        const onStart = vi.fn();
        renderHook(() => useWidgetLaunchAction(true, onStart));
        await new Promise((r) => setTimeout(r, 20));
        expect(onStart).not.toHaveBeenCalled();

        // Warm tap: native holds a fresh action, app becomes visible.
        mockGetAction.mockResolvedValueOnce('start');
        document.dispatchEvent(new Event('visibilitychange'));
        await waitFor(() => expect(onStart).toHaveBeenCalledTimes(1));
    });

    it('ignores hidden transitions, unknown actions and disabled state', async () => {
        const onStart = vi.fn();
        mockGetAction.mockResolvedValue('start');

        // Hidden → no check at all.
        const { unmount } = renderHook(() => useWidgetLaunchAction(true, onStart));
        await waitFor(() => expect(onStart).toHaveBeenCalledTimes(1));
        setVisible(false);
        document.dispatchEvent(new Event('visibilitychange'));
        await new Promise((r) => setTimeout(r, 20));
        expect(onStart).toHaveBeenCalledTimes(1);
        unmount();

        // Unknown action → ignored.
        mockGetAction.mockReset();
        mockGetAction.mockResolvedValue('contract-renewal' as any);
        setVisible(true);
        renderHook(() => useWidgetLaunchAction(true, onStart));
        await new Promise((r) => setTimeout(r, 20));
        expect(onStart).toHaveBeenCalledTimes(1);

        // Disabled → bridge never consulted.
        mockGetAction.mockClear();
        renderHook(() => useWidgetLaunchAction(false, onStart));
        await new Promise((r) => setTimeout(r, 20));
        expect(mockGetAction).not.toHaveBeenCalled();
    });
});
