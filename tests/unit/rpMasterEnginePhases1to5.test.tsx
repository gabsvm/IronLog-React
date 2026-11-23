import React, { useRef } from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
    EXERCISE_SFR_STORAGE_KEY,
    applyRecoverySessionToExercise,
    computePriorityAwareSetDelta,
    detectConsecutiveMissesAndEarlyDeload,
    getExerciseSfrScore,
    getTargetRirForWeek,
    hasJointPainWarning,
    loadExerciseSfrHistory,
    predictSetTarget,
    recordExerciseSfrFeedback,
} from '../../utils/rpAutoregulation';
import {
    applyMusclePrioritiesToProgram,
    detectSplitConflicts,
    reorderDaysToResolveConflicts,
} from '../../utils/rpSplitBuilder';
import { buildNextMesocycleCarryOver, condenseDeloadDays } from '../../utils/mesoDraft';
import { computeRpDietRecommendation, evaluateCardioInterference } from '../../utils/rpDietEngine';
import { detectExercisePlateaus, getExerciseSfrCue } from '../../utils/rpExerciseCues';
import { BadSessionTriageSheet, DeloadRecoveryCard } from '../../components/workout/DeloadRecoveryCard';
import { SetRowActionMenu } from '../../components/workout/setRow/SetRowActionMenu';
import { TodayTab } from '../../views/nutri/TodayTab';
import { StatsProgressTab } from '../../views/stats/StatsProgressTab';
import { TRANSLATIONS } from '../../constants';
import type { ExerciseDef, Log, MesoCycle, ProgramDay, SessionExercise, WorkoutSet } from '../../types';

describe('RP Periodization Master Engine Phases 1-5', () => {
    beforeEach(() => {
        localStorage.removeItem(EXERCISE_SFR_STORAGE_KEY);
    });

    it('computes 3->2->1->0 RIR accumulation ramp and 5 RIR deload', () => {
        expect(getTargetRirForWeek(1, 5, false)).toBe(3);
        expect(getTargetRirForWeek(2, 5, false)).toBe(2);
        expect(getTargetRirForWeek(3, 5, false)).toBe(1);
        expect(getTargetRirForWeek(4, 5, false)).toBe(0);
        expect(getTargetRirForWeek(5, 5, true)).toBe(5);
    });

    it('predicts rep overload on weight edit within +-18% and falls back to RIR beyond +-18%', () => {
        const sameWeight = predictSetTarget({
            prevWeightKg: 100,
            prevReps: 10,
            currentWeightKg: 100,
            unit: 'kg',
            targetRir: 2,
            week: 2,
            isDeload: false,
        });
        expect(sameWeight.mode).toBe('reps');
        expect(sameWeight.targetReps).toBeGreaterThanOrEqual(11);

        const smallDrop = predictSetTarget({
            prevWeightKg: 100,
            prevReps: 10,
            currentWeightKg: 90,
            unit: 'kg',
            targetRir: 2,
            week: 2,
            isDeload: false,
        });
        expect(smallDrop.mode).toBe('reps');
        expect(smallDrop.targetReps).toBeGreaterThanOrEqual(12);

        const bigSwing = predictSetTarget({
            prevWeightKg: 100,
            prevReps: 10,
            currentWeightKg: 60,
            unit: 'kg',
            targetRir: 2,
            week: 2,
            isDeload: false,
        });
        expect(bigSwing.mode).toBe('rir');
        expect(bigSwing.targetRir).toBe(2);
    });

    it('enforces priority-aware volume deltas (Maintain MV cap, Emphasize ramp, workload cap)', () => {
        expect(computePriorityAwareSetDelta({ jointPain: 0, soreness: 0, pump: 0, workload: 0, priority: 'maintain' })).toBe(0);
        expect(computePriorityAwareSetDelta({ jointPain: 0, soreness: 0, pump: 0, workload: 0, priority: 'emphasize' })).toBe(2);
        expect(computePriorityAwareSetDelta({ jointPain: 0, soreness: 0, pump: 1, workload: 2, priority: 'emphasize' })).toBe(0);
        expect(computePriorityAwareSetDelta({ jointPain: 2, soreness: 1, pump: 1, workload: 1, priority: 'grow' })).toBe(-1);
    });

    it('detects 1-miss grace vs 2 consecutive misses early deload recommendation', () => {
        const meso: MesoCycle = { id: 42, name: 'Test Meso', mesoType: 'hyp', week: 3, duration: 5, plan: [] };
        const baseLogs: Log[] = [
            {
                id: 1, mesoId: 42, week: 1, dayIdx: 0, name: 'Push', startTime: 1000, endTime: 2000, duration: 45,
                exercises: [{ id: 'bench', instanceId: 1, name: 'Bench', muscle: 'CHEST', sets: [{ id: 1, weight: 100, reps: 10, rpe: 8, completed: true, type: 'regular' }] }],
            },
            {
                id: 2, mesoId: 42, week: 2, dayIdx: 0, name: 'Push', startTime: 3000, endTime: 4000, duration: 45,
                exercises: [{ id: 'bench', instanceId: 1, name: 'Bench', muscle: 'CHEST', sets: [{ id: 1, weight: 80, reps: 8, rpe: 8, completed: true, type: 'regular' }] }],
            },
        ];
        expect(detectConsecutiveMissesAndEarlyDeload(baseLogs, meso).status).toBe('single_miss');

        const twoMisses: Log[] = [
            ...baseLogs,
            {
                id: 3, mesoId: 42, week: 3, dayIdx: 0, name: 'Push', startTime: 5000, endTime: 6000, duration: 45,
                exercises: [{ id: 'bench', instanceId: 1, name: 'Bench', muscle: 'CHEST', sets: [{ id: 1, weight: 70, reps: 6, rpe: 9, completed: true, type: 'regular' }] }],
            },
        ];
        const status2 = detectConsecutiveMissesAndEarlyDeload(twoMisses, meso);
        expect(status2.status).toBe('early_deload_recommended');
        expect(status2.consecutiveMisses).toBe(2);
    });

    it('persists per-exercise SFR scores, joint pain warnings, and recovery flush conversion', () => {
        recordExerciseSfrFeedback('skull_crusher', { jointPain: 2, pump: 0, soreness: 1 });
        recordExerciseSfrFeedback('rope_pushdown', { jointPain: 0, pump: 2, soreness: 1 });
        const history = loadExerciseSfrHistory();
        expect(hasJointPainWarning(history.skull_crusher)).toBe(true);
        expect(getExerciseSfrScore(history.rope_pushdown)).toBeGreaterThan(getExerciseSfrScore(history.skull_crusher));

        const ex: SessionExercise = {
            id: 'bench', instanceId: 1, name: 'Bench', muscle: 'CHEST',
            sets: [
                { id: 1, weight: 100, reps: 8, rpe: 8, completed: false, type: 'regular' },
                { id: 2, weight: 100, reps: 8, rpe: 8, completed: false, type: 'regular' },
                { id: 3, weight: 100, reps: 8, rpe: 8, completed: false, type: 'regular' },
            ],
        };
        const recovery = applyRecoverySessionToExercise(ex, 'kg');
        expect(recovery.sets).toHaveLength(2);
        expect(Number(recovery.sets[0].weight)).toBe(50);
        expect(recovery.sets[0].targetRpe).toBe(5);
    });

    it('builds priority-aware splits, caps synergists, detects conflicts, and condenses deload days', () => {
        const split: ProgramDay[] = [
            {
                id: 'd1', dayName: { en: 'Day 1', es: 'Día 1' },
                slots: [
                    { muscle: 'TRICEPS', setTarget: 3 },
                    { muscle: 'CHEST', setTarget: 3 },
                    { muscle: 'BACK', setTarget: 3 },
                ],
            },
            {
                id: 'd2', dayName: { en: 'Day 2', es: 'Día 2' },
                slots: [
                    { muscle: 'TRICEPS', setTarget: 4 },
                    { muscle: 'QUADS', setTarget: 3 },
                ],
            },
            {
                id: 'd3', dayName: { en: 'Day 3', es: 'Día 3' },
                slots: [{ muscle: 'HAMSTRINGS', setTarget: 3 }],
            },
            {
                id: 'd4', dayName: { en: 'Day 4', es: 'Día 4' },
                slots: [{ muscle: 'SHOULDERS', setTarget: 3 }],
            },
        ];

        const { program, updatedPriorities } = applyMusclePrioritiesToProgram(
            split,
            { CHEST: 'emphasize', BACK: 'grow' },
            { reduceSynergists: true },
        );
        expect(updatedPriorities.TRICEPS).toBe('maintain');
        expect(program[0].slots[0].muscle).toBe('CHEST');
        expect(program[0].slots[0].reps).toBe('5-10');

        const conflicts = detectSplitConflicts(split);
        expect(conflicts.some((c) => c.type === 'consecutive_muscle' || c.type === 'synergist_adjacent')).toBe(true);
        const reordered = reorderDaysToResolveConflicts(split);
        expect(reordered).toHaveLength(4);

        const condensed = condenseDeloadDays(split);
        expect(condensed).toHaveLength(2);
        expect(condensed[0].slots[0].setTarget).toBe(2);
    });

    it('carries over Week 1 loads (+5% / +2.5%), MEV sets, and specialization cycle advance', () => {
        const prevMeso: MesoCycle = {
            id: 77, name: 'Spec Meso', mesoType: 'hyp_1', week: 5, duration: 5, targetWeeks: 5, plan: [],
            musclePriorities: { CHEST: 'emphasize', BICEPS: 'maintain' },
            specializationBlock: { targetMuscles: ['CHEST'], currentMeso: 3, totalMesos: 3, phase: 'accumulate' },
        };
        const program: ProgramDay[] = [
            {
                id: 'd1', dayName: { en: 'Push', es: 'Empuje' },
                slots: [
                    { exerciseId: 'bench', muscle: 'CHEST', setTarget: 6, reps: '8-12' },
                    { exerciseId: 'curl', muscle: 'BICEPS', setTarget: 4, reps: '12-15' },
                ],
            },
        ];
        const logs: Log[] = [
            {
                id: 1, mesoId: 77, week: 1, dayIdx: 0, name: 'W1', startTime: 1000, endTime: 2000, duration: 40,
                exercises: [{ id: 'bench', instanceId: 1, name: 'Bench', muscle: 'CHEST', sets: [{ id: 1, weight: 80, reps: 10, rpe: 8, completed: true, type: 'regular' }] }],
            },
            {
                id: 2, mesoId: 77, week: 4, dayIdx: 0, name: 'W4', startTime: 3000, endTime: 4000, duration: 45,
                exercises: [{ id: 'bench', instanceId: 1, name: 'Bench', muscle: 'CHEST', sets: [{ id: 1, weight: 95, reps: 10, rpe: 9, completed: true, type: 'regular' }] }],
            },
        ];

        const carry = buildNextMesocycleCarryOver({
            prevMeso, program, logs, experience: 'intermediate', lang: 'es', jointPainIds: ['curl'],
        });
        expect(carry.carryOverLoads.bench.w1PrevKg).toBe(80);
        expect(carry.carryOverLoads.bench.nextW1Kg).toBe(84);
        expect(carry.draft.program[0].slots[0].setTarget).toBe(3);
        expect(carry.draft.program[0].slots[1].setTarget).toBe(2);
        expect(carry.flaggedForRotation).toEqual(['curl']);
        expect(carry.specializationNextPhase).toBe('active_rest');
    });

    it('computes RP Diet 2.0 rate, 8-week diet break alert, NEAT interference, cues & plateaus', () => {
        const now = Date.now();
        const day = 86_400_000;
        const dietRec = computeRpDietRecommendation({
            goal: {
                calories: 2200, protein: 180, carbs: 220, fat: 65,
                phase: 'cut',
                phaseStartDate: new Date(now - 60 * day).toISOString().slice(0, 10),
            },
            bodyLogs: [
                { id: 1, date: now - 12 * day, weight: 82 },
                { id: 2, date: now - 10 * day, weight: 81.8 },
                { id: 3, date: now - 3 * day, weight: 81.9 },
                { id: 4, date: now - day, weight: 81.9 },
            ],
            nowMs: now,
        });
        expect(dietRec.dietBreakRecommended).toBe(true);
        expect(dietRec.status).toBe('too_slow');
        expect(dietRec.suggestedCalorieDelta).toBe(-200);
        expect(dietRec.trainingDayMacros.carbs).toBeGreaterThan(dietRec.restDayMacros.carbs);

        const cardio = evaluateCardioInterference({
            stepsToday: 8500,
            stepsTarget: 10000,
            todayCardio: [{ id: 'c1', date: '2026-11-23', timestamp: now, activityType: 'hiit', durationMin: 25 }],
            upcomingDay: { id: 'legs', dayName: { en: 'Legs', es: 'Pierna' }, slots: [{ muscle: 'QUADS', setTarget: 4 }] },
        });
        expect(cardio.interferenceWarning).toBe(true);

        expect(getExerciseSfrCue('CHEST').cue.es.length).toBeGreaterThan(10);

        const exDefs: ExerciseDef[] = [{ id: 'row', name: { es: 'Remo Barra', en: 'Barbell Row' }, muscle: 'BACK', isBodyweight: false }];
        const plateauLogs: Log[] = [
            { id: 1, mesoId: 1, week: 1, dayIdx: 0, name: 'Pull', startTime: 100, endTime: 200, duration: 40, exercises: [{ id: 'row', instanceId: 1, name: 'Row', muscle: 'BACK', sets: [{ id: 1, weight: 100, reps: 10, rpe: 8, completed: true, type: 'regular' }] }] },
            { id: 2, mesoId: 1, week: 2, dayIdx: 0, name: 'Pull', startTime: 300, endTime: 400, duration: 40, exercises: [{ id: 'row', instanceId: 1, name: 'Row', muscle: 'BACK', sets: [{ id: 1, weight: 100, reps: 10, rpe: 8, completed: true, type: 'regular' }] }] },
            { id: 3, mesoId: 2, week: 1, dayIdx: 0, name: 'Pull', startTime: 500, endTime: 600, duration: 40, exercises: [{ id: 'row', instanceId: 1, name: 'Row', muscle: 'BACK', sets: [{ id: 1, weight: 98, reps: 10, rpe: 9, completed: true, type: 'regular' }] }] },
            { id: 4, mesoId: 2, week: 2, dayIdx: 0, name: 'Pull', startTime: 700, endTime: 800, duration: 40, exercises: [{ id: 'row', instanceId: 1, name: 'Row', muscle: 'BACK', sets: [{ id: 1, weight: 98, reps: 10, rpe: 9, completed: true, type: 'regular' }] }] },
        ];
        const plateaus = detectExercisePlateaus(plateauLogs, exDefs, 'es');
        expect(plateaus).toHaveLength(1);
        expect(plateaus[0].exerciseId).toBe('row');
    });

    it('renders DeloadRecoveryCard, SetRowActionMenu Lengthened Partials, TodayTab Diet 2.0, and StatsProgressTab plateau alert', () => {
        const onSelectStage = vi.fn();
        render(<DeloadRecoveryCard stage="wired" lang="es" onSelectStage={onSelectStage} />);
        expect(screen.getByTestId('deload-stage-wired')).toHaveAttribute('aria-pressed', 'true');
        fireEvent.click(screen.getByTestId('deload-stage-tired'));
        expect(onSelectStage).toHaveBeenCalledWith('tired');

        const onUpdateSpy = vi.fn();
        const MenuHost: React.FC = () => {
            const ref = useRef<HTMLButtonElement>(null);
            const mockSet: WorkoutSet = { id: 9, type: 'regular', weight: '50', reps: '12', rpe: '', completed: false };
            return (
                <>
                    <button ref={ref} type="button">Anchor</button>
                    <SetRowActionMenu
                        isOpen={true}
                        onClose={vi.fn()}
                        set={mockSet}
                        exInstanceId={77}
                        lang="es"
                        onUpdate={onUpdateSpy}
                        onChangeType={vi.fn()}
                        anchorRef={ref}
                    />
                </>
            );
        };
        render(<MenuHost />);
        fireEvent.click(screen.getByText('Parciales en estiramiento'));
        expect(onUpdateSpy).toHaveBeenCalledWith(77, 9, 'type', 'lengthened_partials');

        const onUpdateSteps = vi.fn();
        const onUpdateNutritionGoal = vi.fn();
        render(
            <TodayTab
                lang="es"
                streak={3}
                todayMacros={{ calories: 1600, protein: 140, carbs: 160, fat: 45 }}
                todayWater={1500}
                todayCardio={[{ id: 'h1', date: '2026-11-23', timestamp: Date.now(), activityType: 'hiit', durationMin: 25 }]}
                todayLog={{ date: '2026-11-23', entries: [], steps: 4000, isTrainingDay: true }}
                nutritionGoal={{ calories: 2200, protein: 180, carbs: 220, fat: 65, phase: 'maintenance', dailyStepsTarget: 9000 }}
                caloriesRemaining={600}
                caloriesBurned={200}
                proteinRemaining={40}
                expandedMeal={null}
                setExpandedMeal={vi.fn()}
                onAddMeal={vi.fn()}
                onAddCardio={vi.fn()}
                onEditGoals={vi.fn()}
                onAddWater={vi.fn()}
                onDeleteCardio={vi.fn()}
                onEditEntry={vi.fn()}
                onDeleteEntry={vi.fn()}
                upcomingDay={{ id: 'legs', dayName: { en: 'Legs', es: 'Pierna' }, slots: [{ muscle: 'QUADS', setTarget: 4 }] }}
                onUpdateNutritionGoal={onUpdateNutritionGoal}
                onUpdateSteps={onUpdateSteps}
                onToggleTrainingDay={vi.fn()}
            />,
        );
        expect(screen.getByTestId('rp-diet-phase-card')).toBeInTheDocument();
        expect(screen.getByTestId('rp-neat-card')).toBeInTheDocument();
        fireEvent.click(screen.getByTestId('rp-diet-phase-cut'));
        expect(onUpdateNutritionGoal).toHaveBeenCalledWith(expect.objectContaining({ phase: 'cut' }));
        fireEvent.click(screen.getByTestId('add-neat-steps-btn'));
        expect(onUpdateSteps).toHaveBeenCalledWith(6000);

        const setSelectedExId = vi.fn();
        render(
            <StatsProgressTab
                stats={{
                    lang: 'es',
                    t: TRANSLATIONS.es,
                    s: TRANSLATIONS.es.statsView,
                    unit: 'kg',
                    weightSuffix: 'kg',
                    selectedExId: null,
                    setSelectedExId,
                    chartMetric: '1rm',
                    setChartMetric: vi.fn(),
                    setShowPicker: vi.fn(),
                    setPickerSearch: vi.fn(),
                    availableExercises: [],
                    chartPoints: [],
                    loadingOverview: false,
                    loadingChart: false,
                    currentEx: null,
                    hasExerciseHistory: false,
                    prHistory: [],
                    showAllPRs: false,
                    setShowAllPRs: vi.fn(),
                    displayedPRs: [],
                    metricButtons: ['1rm', 'volume'],
                    selectedExerciseInsight: null,
                    repMaxRows: [],
                    exercisePlateaus: [
                        {
                            exerciseId: 'bench',
                            exerciseName: 'Press Banca',
                            muscle: 'CHEST',
                            stalledSessions: 4,
                            bestE1rmKg: 120,
                            latestE1rmKg: 118,
                            suggestion: { es: 'Rotar variación', en: 'Rotate lift' },
                        },
                    ],
                } as any}
            />,
        );
        expect(screen.getByTestId('plateau-alert-card')).toBeInTheDocument();
        fireEvent.click(screen.getByText('Inspeccionar'));
        expect(setSelectedExId).toHaveBeenCalledWith('bench');

        render(<BadSessionTriageSheet open={true} onOpenChange={vi.fn()} lang="es" onTriggerDeload={vi.fn()} />);
        expect(screen.getByTestId('bad-session-triage-sheet')).toBeInTheDocument();
    });
});
