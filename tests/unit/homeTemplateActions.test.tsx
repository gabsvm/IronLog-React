import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTemplateActions } from '../../views/home/applyTemplate';
import { KONG_4DAY_V1 } from '../../programs/kong/kong4Day';
import type { TemplateActions } from '../../views/home/applyTemplate';
import type { ActiveSession, GlobalTemplate } from '../../types';
import type { TimerState } from '../../hooks/useTimer';

const mocks = vi.hoisted(() => ({
    current: null as ActiveSession | null,
    setActiveSession: vi.fn(),
    setRestTimer: vi.fn(),
}));
vi.mock('../../lib/store', () => ({ useStore: { getState: () => ({ activeSession: mocks.current, setActiveSession: mocks.setActiveSession }) } }));
vi.mock('../../context/TimerContext', () => ({ useTimerActions: () => ({ setRestTimer: mocks.setRestTimer }) }));
vi.mock('../../utils/audio', () => ({ triggerHaptic: vi.fn() }));

const session: ActiveSession = { id: 9, dayIdx: 2, name: 'Other day in progress', startTime: 100, mesoId: 7, week: 1, exercises: [] };
const template: GlobalTemplate = { id: 'custom-template', name: 'Plan', title: { es: 'Plan', en: 'Plan' }, description: { es: '', en: '' }, isPro: false, order: 1, program: [{ id: 'd1', dayName: { es: 'Día 1', en: 'Day 1' }, slots: [] }] };
const setup = () => {
    const deps = { setProgram: vi.fn(), setActiveMeso: vi.fn(), setShowTemplateSelector: vi.fn(), onEditProgram: vi.fn(), checkPro: vi.fn(() => true), lang: 'en' as const };
    const hook = renderHook(() => useTemplateActions(deps));
    return { ...hook, deps };
};

describe('shared Home/Routine live-session plan-change guard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.current = session;
        mocks.setActiveSession.mockImplementation((value: ActiveSession | null) => { mocks.current = value; });
    });
    for (const kind of ['template', 'kong', 'custom'] as const) {
        const request = (actions: TemplateActions) => {
            if (kind === 'template') actions.handleSelectTemplate(template);
            else if (kind === 'kong') actions.handleSelectProgram(KONG_4DAY_V1.id);
            else actions.handleCreateCustom();
        };
        it(`preserves the original session, timer and plan when cancelling ${kind}`, () => {
            const { result, deps } = setup();
            act(() => request(result.current));
            expect(result.current.templateChangeConfirmation.isOpen).toBe(true);
            act(() => result.current.templateChangeConfirmation.onCancel());
            expect(mocks.current).toBe(session);
            expect(mocks.setRestTimer).not.toHaveBeenCalled();
            expect(deps.setProgram).not.toHaveBeenCalled();
            expect(deps.setActiveMeso).not.toHaveBeenCalled();
            expect(deps.onEditProgram).not.toHaveBeenCalled();
        });
        it(`explicitly discards and stops rest before applying ${kind}`, () => {
            const { result, deps } = setup();
            deps.setProgram.mockImplementation(() => {
                expect(mocks.current).toBeNull();
                expect(mocks.setRestTimer).toHaveBeenCalledOnce();
            });
            act(() => request(result.current));
            expect(deps.setProgram).not.toHaveBeenCalled();
            act(() => result.current.templateChangeConfirmation.onConfirm());
            expect(deps.setProgram).toHaveBeenCalledOnce();
            const stop = mocks.setRestTimer.mock.calls[0][0] as (prev: TimerState) => TimerState;
            expect(stop({ active: true, timeLeft: 90, endAt: 1000, duration: 90 })).toMatchObject({ active: false, timeLeft: 0, endAt: 0 });
            if (kind === 'custom') expect(deps.onEditProgram).toHaveBeenCalledOnce();
            act(() => result.current.templateChangeConfirmation.onConfirm());
            expect(deps.setProgram).toHaveBeenCalledOnce();
        });
    }
    it('applies immediately without touching rest when no session exists', () => {
        mocks.current = null;
        const { result, deps } = setup();
        act(() => result.current.handleSelectTemplate(template));
        expect(deps.setProgram).toHaveBeenCalledWith(template.program);
        expect(mocks.setRestTimer).not.toHaveBeenCalled();
        expect(result.current.templateChangeConfirmation.isOpen).toBe(false);
    });
    it('checks the actual session at click time and keeps the Pro gate ahead of discard', () => {
        mocks.current = null;
        const { result, deps } = setup();
        mocks.current = session;
        deps.checkPro.mockReturnValue(false);
        act(() => result.current.handleSelectTemplate({ ...template, isPro: true }));
        expect(result.current.templateChangeConfirmation.isOpen).toBe(false);
        expect(deps.setProgram).not.toHaveBeenCalled();
        act(() => result.current.handleCreateCustom());
        expect(result.current.templateChangeConfirmation.isOpen).toBe(true);
        expect(mocks.current).toBe(session);
    });
});
