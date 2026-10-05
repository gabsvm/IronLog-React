import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

// T4: dirty tracking extracted from AppProvider into a real hook.
const { mark } = vi.hoisted(() => ({ mark: vi.fn(async () => {}) }));
vi.mock('../../services/dirtySyncState', () => ({ dirtySyncState: { mark } }));

import { useDirtySection, type DirtyTrackingContext } from '../../context/app/useDirtySection';
import type { DirtySyncSection } from '../../types';

const makeCtx = (over: Partial<DirtyTrackingContext> = {}) => {
    let meta: Record<string, number> = {};
    const ctx: DirtyTrackingContext = {
        isAppLoading: false,
        hasCheckedSync: true,
        suppressDirtyRef: { current: false },
        dirtyInitRef: { current: new Set<DirtySyncSection>() },
        setLocalSectionSyncMeta: (v: any) => {
            meta = typeof v === 'function' ? v(meta) : v;
        },
        ...over,
    };
    return { ctx, meta: () => meta };
};

describe('T4: useDirtySection', () => {
    beforeEach(() => mark.mockClear());

    it('first run only arms the section; a later change marks it dirty', () => {
        const { ctx, meta } = makeCtx();
        const { rerender } = renderHook(({ value }) => useDirtySection('logs', [value], ctx), { initialProps: { value: 1 } });
        expect(mark).not.toHaveBeenCalled();
        expect(ctx.dirtyInitRef.current.has('logs')).toBe(true);
        rerender({ value: 2 });
        expect(mark).toHaveBeenCalledWith(['logs']);
        expect(typeof meta().logs).toBe('number');
    });

    it('does nothing while loading, before the first cloud check, or when suppressed', () => {
        for (const over of [{ isAppLoading: true }, { hasCheckedSync: false }, { suppressDirtyRef: { current: true } }]) {
            const { ctx } = makeCtx(over);
            const { rerender } = renderHook(({ value }) => useDirtySection('program', [value], ctx), { initialProps: { value: 1 } });
            rerender({ value: 2 });
            expect(ctx.dirtyInitRef.current.has('program')).toBe(false);
        }
        expect(mark).not.toHaveBeenCalled();
    });

    it('unrelated re-renders (same watched values) never mark', () => {
        const { ctx } = makeCtx();
        const { rerender } = renderHook(({ value }) => useDirtySection('config', [value], ctx), { initialProps: { value: 'a' } });
        rerender({ value: 'a' });
        rerender({ value: 'a' });
        expect(mark).not.toHaveBeenCalled();
    });
});
