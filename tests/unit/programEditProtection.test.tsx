import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { useStore } from '../../lib/store';
import { KONG_4DAY_V1 } from '../../programs/kong/kong4Day';
import { convertKongToPersonalRoutine } from '../../programs/engine/ProgramConversion';
import { buildWorkoutLog, isDetachedSession } from '../../services/workoutCompletionService';
import { resolveRoutineStartAction, canConfirmKongConversion } from '../../components/app/routineGuards';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import type { ActiveSession, MesoCycle } from '../../types';

beforeEach(() => {
    cleanup();
    useStore.setState({ activeSession: null });
});
describe('Bloque B: Program edit/convert protection and routine resume', () => {
    it('preserves KONG attribution and mesoId when workout log is completed while activeSession is undisturbed', () => {
        const kongMeso: MesoCycle = {
            id: 12345,
            name: 'KONG · Savage Size',
            mesoType: KONG_4DAY_V1.id,
            week: 6, // Block 2 week 2
            targetWeeks: 12,
            isDeload: false,
            plan: [],
            duration: 12,
            programSystem: {
                systemId: KONG_4DAY_V1.id,
                systemVersion: 1,
                startedAt: 1000,
                substitutions: {},
            },
        };

        const kongSession: ActiveSession = {
            id: 9999,
            dayIdx: 1,
            name: 'Upper Body A',
            startTime: 1000,
            mesoId: kongMeso.id,
            week: 6,
            exercises: [
                {
                    instanceId: 1,
                    id: 'bench-press',
                    name: 'Bench Press',
                    muscle: 'CHEST',
                    sets: [{ id: 1, reps: 8, weight: 100, completed: true, rpe: 8, type: 'regular' }],
                },
            ],
        };

        expect(isDetachedSession(kongSession, kongMeso)).toBe(false);

        const completedLog = buildWorkoutLog(kongSession, kongMeso, null, 5000);

        expect(completedLog.mesoId).toBe(12345);
        expect(completedLog.week).toBe(6);
        expect(completedLog.programSystem).toBeDefined();
        expect(completedLog.programSystem?.systemId).toBe(KONG_4DAY_V1.id);
        expect(completedLog.programSystem?.blockNumber).toBe(2);
        expect(completedLog.programSystem?.blockWeek).toBe(2);
    });

    it('blocks conversion if an active session is running or appears before confirmation', () => {
        const activeMeso: MesoCycle = {
            id: 555,
            name: 'KONG · 4 Day',
            mesoType: KONG_4DAY_V1.id,
            week: 2,
            plan: [],
            duration: 4,
            programSystem: { systemId: KONG_4DAY_V1.id, systemVersion: 1, startedAt: 500, substitutions: {} },
        };

        const activeSession: ActiveSession = {
            id: 777,
            dayIdx: 0,
            name: 'Chest Day',
            startTime: 500,
            mesoId: 555,
            week: 2,
            exercises: [],
        };

        // State has activeSession
        useStore.setState({ activeMeso, activeSession });

        // Production guard from routineGuards: session present blocks conversion.
        expect(canConfirmKongConversion(useStore.getState().activeSession)).toBe(false);
        expect(useStore.getState().activeMeso?.id).toBe(555);

        // After explicitly discarding the session, conversion succeeds on real code.
        useStore.setState({ activeSession: null });
        expect(canConfirmKongConversion(useStore.getState().activeSession)).toBe(true);
        const { convertedMeso } = convertKongToPersonalRoutine(useStore.getState().activeMeso!, 'es');
        useStore.setState({ activeMeso: convertedMeso });
        expect(useStore.getState().activeMeso?.id).not.toBe(555);
        expect(useStore.getState().activeMeso?.programSystem).toBeUndefined();
    });

    it('resumes from RoutineView for the same active meso and dayIdx without reconstruction or replacement prompt', () => {
        const meso: MesoCycle = {
            id: 888,
            name: 'Routine Meso',
            mesoType: 'personal',
            week: 1,
            plan: [],
            duration: 4,
        };

        const runningSession: ActiveSession = {
            id: 4321,
            dayIdx: 2,
            name: 'Leg Day',
            startTime: 2000,
            mesoId: 888,
            week: 1,
            exercises: [
                {
                    instanceId: 2,
                    id: 'squat',
                    name: 'Squat',
                    muscle: 'QUADS',
                    sets: [{ id: 1, reps: 5, weight: 140, completed: true, rpe: 9, type: 'regular' }],
                },
            ],
        };

        useStore.setState({ activeMeso: meso, activeSession: runningSession });

        // Production decision function used by AppViews onStartDay.
        expect(resolveRoutineStartAction(useStore.getState().activeSession, useStore.getState().activeMeso, 2)).toBe('resume');
        expect(resolveRoutineStartAction(useStore.getState().activeSession, useStore.getState().activeMeso, 0)).toBe('replace');
        // Session data is completely preserved
        expect(useStore.getState().activeSession?.exercises[0].sets[0].weight).toBe(140);
        useStore.setState({ activeSession: null });
        expect(resolveRoutineStartAction(useStore.getState().activeSession, useStore.getState().activeMeso, 0)).toBe('start');
    });

    it('ConfirmModal confirms a second entity after reopening without remount', () => {
        const seen: string[] = [];
        const onCancel = vi.fn();
        const { rerender } = render(
            <ConfirmModal
                isOpen={true}
                title="Remove slot"
                description="Remove first"
                confirmText="Remove"
                cancelText="Cancel"
                variant="danger"
                onConfirm={() => { seen.push('first'); }}
                onCancel={onCancel}
            />,
        );
        fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
        expect(seen).toEqual(['first']);
        rerender(
            <ConfirmModal
                isOpen={false}
                title="Remove slot"
                description="Remove second"
                confirmText="Remove"
                cancelText="Cancel"
                variant="danger"
                onConfirm={() => { seen.push('second'); }}
                onCancel={onCancel}
            />,
        );
        rerender(
            <ConfirmModal
                isOpen={true}
                title="Remove slot"
                description="Remove second"
                confirmText="Remove"
                cancelText="Cancel"
                variant="danger"
                onConfirm={() => { seen.push('second'); }}
                onCancel={onCancel}
            />,
        );
        fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
        expect(seen).toEqual(['first', 'second']);
    });
});
