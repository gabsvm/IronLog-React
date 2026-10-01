import { describe, it, expect } from 'vitest';
import type { SessionExercise, WorkoutSet } from '../../types';
import {
    isWorkingSet,
    countWorkingSets,
    isTemplateUpdateEligible,
    resolveInitialActiveExerciseId,
    toggleExerciseCardExpansion,
    advanceActiveExerciseOnCompletion,
} from '../../utils/workoutProgress';
import {
    reorderSupersetExercises,
    buildSupersetLetterMap,
} from '../../components/workout/ReorderExercisesSheet';
import {
    calculateTimerPercentage,
    calculateRingDashOffset,
    TIMER_RING_RADIUS,
    TIMER_RING_CIRCUMFERENCE,
    applyEffortRatingToExercises,
    resolveRestNextAction,
} from '../../components/ui/RestTimerOverlay';
import { ICON_MAP } from '../../components/ui/Icon';

describe('Visual Redesign Critical Interactions & Corrective Logic', () => {
    const createExercise = (
        instanceId: number,
        supersetId?: string,
        sets?: Partial<WorkoutSet>[]
    ): SessionExercise => ({
        id: `ex_${instanceId}`,
        instanceId,
        name: `Exercise ${instanceId}`,
        muscle: 'CHEST',
        sets: (sets || [
            { id: 1, type: 'regular', weight: 80, reps: 10, rpe: '8', completed: false },
            { id: 2, type: 'regular', weight: 80, reps: 10, rpe: '8', completed: false },
        ]) as WorkoutSet[],
        supersetId,
    });

    describe('Reorder & Superset Grouping Integrity (Production Helpers)', () => {
        it('moves superset exercises together as a contiguous block via reorderSupersetExercises', () => {
            const list: SessionExercise[] = [
                createExercise(1),
                createExercise(2, 'ss_1'),
                createExercise(3, 'ss_1'),
                createExercise(4),
            ];

            // Move instanceId 2 (part of ss_1) to bottom (after instanceId 4)
            const resultDown = reorderSupersetExercises(list, 2, 4);
            expect(resultDown.map(e => e.instanceId)).toEqual([1, 4, 2, 3]);

            // Move instanceId 3 (part of ss_1) to top (before instanceId 1)
            const resultUp = reorderSupersetExercises(list, 3, 1);
            expect(resultUp.map(e => e.instanceId)).toEqual([2, 3, 1, 4]);
        });

        it('assigns sequential superset letters A, B, C via buildSupersetLetterMap', () => {
            const list: SessionExercise[] = [
                createExercise(1, 'ss_alpha'),
                createExercise(2, 'ss_alpha'),
                createExercise(3),
                createExercise(4, 'ss_beta'),
                createExercise(5, 'ss_beta'),
            ];

            const letterMap = buildSupersetLetterMap(list);
            expect(letterMap.get('ss_alpha')).toBe('A');
            expect(letterMap.get('ss_beta')).toBe('B');
            expect(letterMap.get('non_existent')).toBeUndefined();
        });
    });

    describe('Finish Session Sheet & Template Update Eligibility (Production Helper)', () => {
        const createSession = (overrides?: any): any => ({
            id: 1,
            dayIdx: 0,
            date: new Date().toISOString(),
            completed: false,
            dayTitle: 'Push Day',
            mesoId: 100,
            exercises: [
                createExercise(1, undefined, [
                    { id: 1, type: 'regular', weight: 80, reps: 10, completed: true },
                    { id: 2, type: 'regular', weight: 80, reps: 10, completed: false },
                ]),
            ],
            ...overrides,
        });

        const createMeso = (overrides?: any): any => ({
            id: 100,
            name: 'Hypertrophy Meso',
            weeks: 4,
            daysPerWeek: 3,
            plan: [
                { dayIdx: 0, title: 'Push Day', exercises: [] },
                { dayIdx: 1, title: 'Pull Day', exercises: [] },
                { dayIdx: 2, title: 'Leg Day', exercises: [] },
            ],
            ...overrides,
        });

        it('allows template update for valid editable personal programs with completed working sets', () => {
            const session = createSession();
            const meso = createMeso();
            expect(isTemplateUpdateEligible(session, meso)).toBe(true);
        });

        it('denies template update for official KONG programs', () => {
            const session = createSession({ mesoId: 'kong_savage_v1' });
            const meso = createMeso({ id: 'kong_savage_v1', name: 'KONG: Savage Hypertrophy' });
            expect(isTemplateUpdateEligible(session, meso)).toBe(false);
        });

        it('denies template update for detached sessions (freestyle, wod, calisthenics, two_block)', () => {
            const meso = createMeso();

            // Freestyle / detached dayIdx = -1
            expect(isTemplateUpdateEligible(createSession({ dayIdx: -1 }), meso)).toBe(false);
            expect(isTemplateUpdateEligible(createSession({ dayIdx: undefined }), meso)).toBe(false);

            // Detached program types
            expect(isTemplateUpdateEligible(createSession({ mesoId: 'wod' }), meso)).toBe(false);
            expect(isTemplateUpdateEligible(createSession({ mesoId: 'calisthenics' }), meso)).toBe(false);
            expect(isTemplateUpdateEligible(createSession({ mesoId: 'two_block' }), meso)).toBe(false);
        });

        it('denies template update when dayIdx is out of bounds or mesocycle does not match', () => {
            const session = createSession({ dayIdx: 99 });
            const meso = createMeso();
            expect(isTemplateUpdateEligible(session, meso)).toBe(false);

            const mismatchedSession = createSession({ mesoId: 'other_meso' });
            expect(isTemplateUpdateEligible(mismatchedSession, meso)).toBe(false);
        });

        it('denies template update when no working sets are completed', () => {
            const session = createSession({
                exercises: [
                    createExercise(1, undefined, [
                        { id: 1, type: 'warmup', weight: 40, reps: 15, completed: true },
                        { id: 2, type: 'avt_hop', weight: 0, reps: 20, completed: true },
                        { id: 3, type: 'regular', weight: 80, reps: 10, completed: false },
                    ]),
                ],
            });
            const meso = createMeso();
            expect(isTemplateUpdateEligible(session, meso)).toBe(false);
        });
    });

    describe('Working-Set Progress & Domain Classification (Production Helpers)', () => {
        it('correctly classifies working vs non-working sets via isWorkingSet', () => {
            // Non-working
            expect(isWorkingSet({ type: 'warmup' })).toBe(false);
            expect(isWorkingSet({ type: 'avt_hop' })).toBe(false);

            // Working types
            expect(isWorkingSet({ type: 'regular' })).toBe(true);
            expect(isWorkingSet({ type: 'myorep' })).toBe(true);
            expect(isWorkingSet({ type: 'myorep_match' })).toBe(true);
            expect(isWorkingSet({ type: 'top' })).toBe(true);
            expect(isWorkingSet({ type: 'backoff' })).toBe(true);
            expect(isWorkingSet({ type: 'drop' })).toBe(true);
            expect(isWorkingSet({ type: 'giant' })).toBe(true);
            expect(isWorkingSet({ type: 'cluster' })).toBe(true);
            expect(isWorkingSet({ type: 'emom' })).toBe(true);
            expect(isWorkingSet({ type: 'rest_pause' })).toBe(true);
            expect(isWorkingSet({ type: 'time_volume' })).toBe(true);
            expect(isWorkingSet({ type: 'triple_add' })).toBe(true);
            expect(isWorkingSet({})).toBe(true); // default type is regular
        });

        it('calculates unified set progress via countWorkingSets', () => {
            const exercises: SessionExercise[] = [
                createExercise(1, undefined, [
                    { id: 1, type: 'warmup', completed: true }, // ignored
                    { id: 2, type: 'regular', completed: true },
                    { id: 3, type: 'regular', completed: true },
                ]),
                createExercise(2, undefined, [
                    { id: 4, type: 'avt_hop', completed: true }, // ignored
                    { id: 5, type: 'myorep', completed: true },
                    { id: 6, type: 'drop', completed: false, skipped: true }, // skipped not counted as completed
                    { id: 7, type: 'regular', completed: false },
                ]),
            ];

            const counts = countWorkingSets(exercises);
            expect(counts.totalWorkingSets).toBe(5); // sets 2, 3, 5, 6, 7
            expect(counts.completedWorkingSets).toBe(3); // sets 2, 3, 5
            expect(counts.remainingWorkingSets).toBe(2); // sets 6, 7
            expect(counts.progressPct).toBe(60);
        });
    });

    describe('Rest Timer Calculations & Theme Compliance (Production Helpers)', () => {
        it('computes circular SVG progress circumference and stroke dashoffset correctly', () => {
            expect(TIMER_RING_RADIUS).toBe(52);
            expect(TIMER_RING_CIRCUMFERENCE).toBeCloseTo(326.73, 1);

            // 100% time left: full ring visible -> dashOffset is 0
            expect(calculateRingDashOffset(100)).toBe(0);

            // 50% time left: half ring -> dashOffset is circumference * 0.5
            expect(calculateRingDashOffset(50)).toBeCloseTo(TIMER_RING_CIRCUMFERENCE * 0.5, 2);

            // 0% time left: ring empty -> dashOffset is circumference
            expect(calculateRingDashOffset(0)).toBeCloseTo(TIMER_RING_CIRCUMFERENCE, 2);
        });

        it('clamps timer percentage correctly via calculateTimerPercentage', () => {
            expect(calculateTimerPercentage(90, 90)).toBe(100);
            expect(calculateTimerPercentage(45, 90)).toBe(50);
            expect(calculateTimerPercentage(0, 90)).toBe(0);
            expect(calculateTimerPercentage(-5, 90)).toBe(0);
            expect(calculateTimerPercentage(120, 90)).toBe(100);
            expect(calculateTimerPercentage(30, 0)).toBe(0);
        });
    });

    describe('Rest Source Context & Effort Rating (Production Helpers)', () => {
        it('updates ONLY the exact source set via applyEffortRatingToExercises', () => {
            const exercises: SessionExercise[] = [
                createExercise(10, undefined, [
                    { id: 1, type: 'regular', weight: 80, reps: 10, rpe: '7', completed: true },
                    { id: 2, type: 'regular', weight: 80, reps: 10, rpe: '8', completed: true },
                ]),
                createExercise(20, undefined, [
                    { id: 101, type: 'regular', weight: 30, reps: 12, rpe: '8', completed: true },
                ]),
            ];

            // Rate effort 'hard' (RPE 10) for exerciseInstanceId 10, setId 2
            const updated = applyEffortRatingToExercises(exercises, 10, 2, 'hard');

            // Exact set is updated
            const targetSet = updated.find(e => e.instanceId === 10)?.sets.find(s => s.id === 2);
            expect(targetSet?.rpe).toBe('10');

            // Sibling set is untouched
            const siblingSet = updated.find(e => e.instanceId === 10)?.sets.find(s => s.id === 1);
            expect(siblingSet?.rpe).toBe('7');

            // Other exercise set is untouched
            const otherExSet = updated.find(e => e.instanceId === 20)?.sets.find(s => s.id === 101);
            expect(otherExSet?.rpe).toBe('8');

            // Test 'easy' (RPE 6) and 'ok' (RPE 8)
            const easyUpdated = applyEffortRatingToExercises(exercises, 10, 2, 'easy');
            expect(easyUpdated.find(e => e.instanceId === 10)?.sets.find(s => s.id === 2)?.rpe).toBe('6');

            const okUpdated = applyEffortRatingToExercises(exercises, 10, 2, 'ok');
            expect(okUpdated.find(e => e.instanceId === 10)?.sets.find(s => s.id === 2)?.rpe).toBe('8');
        });

        it('resolves truthful next action based on source and workout state via resolveRestNextAction', () => {
            const exercises: SessionExercise[] = [
                createExercise(1, undefined, [
                    { id: 1, type: 'regular', weight: 100, reps: 5, completed: true },
                    { id: 2, type: 'regular', weight: 100, reps: 5, completed: false },
                ]),
                createExercise(2, undefined, [
                    { id: 3, type: 'regular', weight: 50, reps: 12, completed: false },
                ]),
            ];

            // Source is ex 1, set 1 -> next action is ex 1, set 2 ("Siguiente serie")
            const nextActionSameEx = resolveRestNextAction(exercises, { exerciseInstanceId: 1, setId: 1 }, 'es');
            expect(nextActionSameEx).not.toBeNull();
            expect(nextActionSameEx?.category).toBe('Siguiente serie');
            expect(nextActionSameEx?.name).toBe('Exercise 1');
            expect(nextActionSameEx?.target).toBe('100 kg × 5');

            // Source is ex 1, set 2 completed -> ex 1 is done, next action advances to ex 2 ("Siguiente ejercicio")
            const ex1DoneExercises: SessionExercise[] = [
                createExercise(1, undefined, [
                    { id: 1, type: 'regular', weight: 100, reps: 5, completed: true },
                    { id: 2, type: 'regular', weight: 100, reps: 5, completed: true },
                ]),
                createExercise(2, undefined, [
                    { id: 3, type: 'regular', weight: 50, reps: 12, completed: false },
                ]),
            ];
            const nextActionAdvance = resolveRestNextAction(ex1DoneExercises, { exerciseInstanceId: 1, setId: 2 }, 'es');
            expect(nextActionAdvance).not.toBeNull();
            expect(nextActionAdvance?.category).toBe('Siguiente ejercicio');
            expect(nextActionAdvance?.name).toBe('Exercise 2');
            expect(nextActionAdvance?.target).toBe('50 kg × 12');

            // Superset partner resolution
            const ssExercises: SessionExercise[] = [
                createExercise(10, 'ss_ab', [
                    { id: 1, type: 'regular', weight: 40, reps: 10, completed: true },
                ]),
                createExercise(20, 'ss_ab', [
                    { id: 2, type: 'regular', weight: 20, reps: 15, completed: false },
                ]),
            ];
            const nextActionSuperset = resolveRestNextAction(ssExercises, { exerciseInstanceId: 10, setId: 1 }, 'es');
            expect(nextActionSuperset).not.toBeNull();
            expect(nextActionSuperset?.category).toBe('Siguiente en superserie');
            expect(nextActionSuperset?.name).toBe('Exercise 20');
            expect(nextActionSuperset?.isSuperset).toBe(true);

            // All exercises complete -> returns null
            const allDoneExercises: SessionExercise[] = [
                createExercise(1, undefined, [{ id: 1, type: 'regular', completed: true }]),
            ];
            expect(resolveRestNextAction(allDoneExercises, { exerciseInstanceId: 1, setId: 1 })).toBeNull();
        });
    });

    describe('Active Exercise Card Collapse & Navigation (Production Helpers)', () => {
        it('allows toggling active exercise card to genuinely stay collapsed via toggleExerciseCardExpansion', () => {
            // Clicking currently active card collapses it to null
            expect(toggleExerciseCardExpansion(1, 1)).toBeNull();

            // Clicking another card expands that card
            expect(toggleExerciseCardExpansion(1, 2)).toBe(2);

            // Clicking a card when none is expanded expands that card
            expect(toggleExerciseCardExpansion(null, 1)).toBe(1);
        });

        it('resolves initial active exercise to first incomplete exercise via resolveInitialActiveExerciseId', () => {
            const exercises: SessionExercise[] = [
                createExercise(1, undefined, [{ id: 1, type: 'regular', completed: true }]),
                createExercise(2, undefined, [{ id: 2, type: 'regular', completed: false }]),
                createExercise(3, undefined, [{ id: 3, type: 'regular', completed: false }]),
            ];

            expect(resolveInitialActiveExerciseId(exercises)).toBe(2);
        });

        it('advances active exercise upon completion via advanceActiveExerciseOnCompletion', () => {
            const exercises: SessionExercise[] = [
                createExercise(1, undefined, [{ id: 1, type: 'regular', completed: true }]),
                createExercise(2, undefined, [{ id: 2, type: 'regular', completed: false }]),
            ];

            expect(advanceActiveExerciseOnCompletion(1, 1, exercises)).toBe(2);

            // If active exercise is not complete, stays on current
            const inProgressExercises: SessionExercise[] = [
                createExercise(1, undefined, [{ id: 1, type: 'regular', completed: false }]),
                createExercise(2, undefined, [{ id: 2, type: 'regular', completed: false }]),
            ];
            expect(advanceActiveExerciseOnCompletion(1, 1, inProgressExercises)).toBe(1);
        });
    });

    describe('Icon System Registry Integrity', () => {
        it('registers critical icons MoreHorizontal and ArrowUpDown in ICON_MAP', () => {
            expect(ICON_MAP['MoreHorizontal']).toBeDefined();
            expect(ICON_MAP['ArrowUpDown']).toBeDefined();
            expect(ICON_MAP['GripVertical']).toBeDefined();
            expect(ICON_MAP['Clock']).toBeDefined();
        });
    });
});
