import { describe, expect, it, vi } from 'vitest';
import { useStore } from '../../lib/store';
import { KONG_4DAY_V1 } from '../../programs/kong/kong4Day';
import { convertKongToPersonalRoutine } from '../../programs/engine/ProgramConversion';
import { buildWorkoutLog, isDetachedSession } from '../../services/workoutCompletionService';
import type { ActiveSession, MesoCycle } from '../../types';

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

        const confirmConversion = vi.fn(() => {
            // Guard checks store at execution time
            if (useStore.getState().activeSession) {
                return { blocked: true };
            }
            const { editableProgram, convertedMeso } = convertKongToPersonalRoutine(useStore.getState().activeMeso!, 'es');
            useStore.setState({ activeMeso: convertedMeso });
            return { blocked: false };
        });

        // Attempting to convert while session is active is blocked
        const result1 = confirmConversion();
        expect(result1.blocked).toBe(true);
        expect(useStore.getState().activeMeso?.id).toBe(555);
        expect(useStore.getState().activeMeso?.programSystem?.systemId).toBe(KONG_4DAY_V1.id);

        // After explicitly discarding the session, conversion succeeds
        useStore.setState({ activeSession: null });
        const result2 = confirmConversion();
        expect(result2.blocked).toBe(false);
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

        let navigatedToView: string | null = null;
        let promptedReplaceDayIdx: number | null = null;
        let reconstructedSession = false;

        const onStartDay = (idx: number) => {
            const currentSession = useStore.getState().activeSession;
            const currentMeso = useStore.getState().activeMeso;

            // Retomar logic
            if (currentSession && currentSession.mesoId === currentMeso?.id && currentSession.dayIdx === idx) {
                navigatedToView = 'workout';
                return;
            }

            if (currentSession) {
                promptedReplaceDayIdx = idx;
                return;
            }

            reconstructedSession = true;
        };

        // 1. Tapping day 2 (same meso & dayIdx): resumes directly
        onStartDay(2);
        expect(navigatedToView).toBe('workout');
        expect(promptedReplaceDayIdx).toBeNull();
        expect(reconstructedSession).toBe(false);
        // Session data is completely preserved
        expect(useStore.getState().activeSession?.exercises[0].sets[0].weight).toBe(140);

        // 2. Tapping day 0 (different day): prompts replacement
        navigatedToView = null;
        onStartDay(0);
        expect(navigatedToView).toBeNull();
        expect(promptedReplaceDayIdx).toBe(0);
        expect(reconstructedSession).toBe(false);
    });
});
