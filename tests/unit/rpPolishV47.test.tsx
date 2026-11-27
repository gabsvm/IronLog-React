import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TrainingSection } from '../../components/profile/sections/TrainingSection';
import { SetRowActionMenu } from '../../components/workout/setRow/SetRowActionMenu';
import { FeedbackModal } from '../../components/ui/FeedbackModal';
import { SessionBuilder } from '../../services/SessionBuilder';
import { recommendProgression, formatProgressionReason } from '../../utils/progressionEngine';
import { getEffectiveSetLoad } from '../../utils/trainingMetrics';
import {
    detectConsecutiveMissesAndEarlyDeload,
    getExerciseSfrScore,
    loadExerciseSfrHistory,
    predictSetTarget,
    recordExerciseSfrFeedback,
} from '../../utils/rpAutoregulation';
import { countWorkingSets, isMesoSessionTemplateEligible, isTemplateUpdateEligible } from '../../utils/workoutProgress';
import { TRANSLATIONS } from '../../constants';
import type { ExerciseDef, Log, MesoCycle, ProgramDay, WorkoutSet } from '../../types';

vi.mock('../../utils/audio', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../../utils/audio')>();
    return {
        ...actual,
        triggerHaptic: vi.fn(),
        playTimerFinishSound: vi.fn(),
    };
});

const setConfigMock = vi.fn();
let mockRpEnabled = true;

vi.mock('../../context/AppContext', () => ({
    useApp: () => ({
        lang: 'es',
        config: {
            rpEnabled: mockRpEnabled,
            showRIR: true,
            keepScreenOn: false,
            weightUnit: 'kg',
            restTimerDisplay: 'compact',
            autoMatchWeight: true,
            useExerciseTypeFilters: false,
            preferredEquipment: ['machine', 'barbell', 'dumbbell', 'cable'],
        },
        setConfig: setConfigMock,
        program: [],
        personalTemplates: [],
        setPersonalTemplates: vi.fn(),
    }),
    useAppPreferences: () => ({ lang: 'es', setLang: vi.fn() }),
}));

vi.mock('../../context/AuthContext', () => ({
    useAuth: () => ({ isAdmin: false }),
}));

vi.mock('../../hooks/usePro', () => ({
    usePro: () => ({
        isPro: true,
        checkPro: () => true,
        showPaywall: false,
        setShowPaywall: vi.fn(),
        featureAttempted: null,
    }),
}));

vi.mock('../../lib/store', () => ({
    useStore: (selector: any) => selector({
        activeMeso: {
            id: 42,
            name: 'Hypertrophy Block',
            mesoType: 'hyp_1',
            week: 2,
            targetWeeks: 5,
            duration: 5,
            plan: [],
            musclePriorities: { CHEST: 'emphasize' },
        },
        activeSession: null,
    }),
}));

describe('RP & Performance Polish Package (Blocks 1-3)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockRpEnabled = true;
        localStorage.clear();
    });

    it('exposes RP Autoregulation switch in Profile TrainingSection and toggles rpEnabled', () => {
        render(
            <TrainingSection
                onClose={vi.fn()}
                onOpenProgram={vi.fn()}
                onOpenExercises={vi.fn()}
            />
        );

        const rpToggle = screen.getByTestId('toggle-rp-enabled');
        expect(rpToggle).toHaveAttribute('aria-checked', 'true');
        fireEvent.click(rpToggle);
        expect(setConfigMock).toHaveBeenCalledWith({ rpEnabled: false });
    });

    it('inverts progression, deload, effective load, and miss detection for machine_assistance', () => {
        const assistedSets = [
            { weight: 30, reps: 12, rpe: 1, completed: true },
            { weight: 30, reps: 12, rpe: 1, completed: true },
        ];
        const suggestion = recommendProgression({
            sets: assistedSets,
            range: { min: 8, max: 12 },
            rirTarget: 2,
            unit: 'kg',
            equipment: 'machine_assistance',
        });
        expect(suggestion?.action).toBe('up');
        expect(suggestion?.deltaDisplay).toBe(-2.5);
        const reason = formatProgressionReason(TRANSLATIONS.es.progression, suggestion!, 'kg', 'es');
        expect(reason).toContain('-2,5 kg');
        expect(reason).not.toContain('+-');

        // Deload should ADD assistance counterweight (easier), not reduce it
        const deloadTarget = predictSetTarget({
            prevWeightKg: 30,
            prevReps: 10,
            unit: 'kg',
            targetRir: 5,
            week: 5,
            isDeload: true,
            equipment: 'machine_assistance',
            bodyWeightKg: 80,
        });
        expect(deloadTarget.targetWeightKg).toBeGreaterThan(30);

        // Effective load lifted increases as counterweight decreases (30kg -> 25kg at 80kg BW)
        const harderLoad = getEffectiveSetLoad({ weight: 25 }, { equipment: 'machine_assistance', isBodyweight: false }, 80);
        const easierLoad = getEffectiveSetLoad({ weight: 35 }, { equipment: 'machine_assistance', isBodyweight: false }, 80);
        expect(harderLoad).toBe(55);
        expect(easierLoad).toBe(45);

        // Dropping counterweight from 35 kg -> 27.5 kg across sessions must NOT trigger early deload miss alert
        const logs: Log[] = [
            {
                id: 1, dayIdx: 0, mesoId: 42, week: 1, name: 'Pull A', startTime: 1000, endTime: 2000, duration: 1000,
                exercises: [{ id: 'assisted_pullup', instanceId: 1, name: 'Assisted Pullup', muscle: 'BACK', equipment: 'machine_assistance', sets: [{ id: 1, weight: 35, reps: 10, rpe: 2, completed: true, type: 'regular' }] }],
            },
            {
                id: 2, dayIdx: 0, mesoId: 42, week: 2, name: 'Pull A', startTime: 3000, endTime: 4000, duration: 1000,
                exercises: [{ id: 'assisted_pullup', instanceId: 2, name: 'Assisted Pullup', muscle: 'BACK', equipment: 'machine_assistance', sets: [{ id: 1, weight: 27.5, reps: 10, rpe: 2, completed: true, type: 'regular' }] }],
            },
        ];
        const status = detectConsecutiveMissesAndEarlyDeload(logs, { id: 42 } as MesoCycle);
        expect(status.status).toBe('ok');
    });

    it('skips a single set via skipped flag without zeroing weights or counting it against progressPct', () => {
        const onUpdate = vi.fn();
        const set: WorkoutSet = { id: 10, weight: 60, reps: 10, rpe: 2, completed: false, type: 'regular' };

        render(
            <SetRowActionMenu
                isOpen={true}
                onClose={vi.fn()}
                set={set}
                exInstanceId={1}
                lang="es"
                onUpdate={onUpdate}
                onChangeType={vi.fn()}
            />
        );

        fireEvent.click(screen.getByTestId('menu-skip-set-btn'));
        expect(onUpdate).toHaveBeenCalledTimes(1);
        expect(onUpdate).toHaveBeenCalledWith(1, 10, 'skipped', true);

        const counts = countWorkingSets([
            {
                sets: [
                    { type: 'regular', completed: true },
                    { type: 'regular', completed: false, skipped: true },
                ],
            },
        ]);
        expect(counts.totalWorkingSets).toBe(1);
        expect(counts.completedWorkingSets).toBe(1);
        expect(counts.progressPct).toBe(100);
    });

    it('applies SessionBuilder weekly delta once per muscle per day, inherits weight for Set N+1, and avoids condensed deload double-halving', () => {
        const exercises: ExerciseDef[] = [
            { id: 'bench', name: { es: 'Press Banca', en: 'Bench' }, muscle: 'CHEST' },
            { id: 'fly', name: { es: 'Pec Deck', en: 'Pec Deck' }, muscle: 'CHEST' },
        ];
        const day: ProgramDay = {
            id: 'd1',
            dayName: { es: 'Empuje', en: 'Push' },
            slots: [
                { muscle: 'CHEST', setTarget: 3, exerciseId: 'bench' },
                { muscle: 'CHEST', setTarget: 3, exerciseId: 'fly' },
            ],
        };
        const meso: MesoCycle = {
            id: 42,
            name: 'Push/Pull',
            mesoType: 'hyp_1',
            week: 2,
            targetWeeks: 5,
            duration: 5,
            plan: [['bench', 'fly']],
        };
        const logs: Log[] = [
            {
                id: 100, dayIdx: 0, mesoId: 42, week: 1, name: 'Push W1', startTime: 1000, endTime: 2000, duration: 900,
                exercises: [
                    {
                        id: 'bench', instanceId: 1, name: 'Press Banca', muscle: 'CHEST',
                        sets: [
                            { id: 1, weight: 80, reps: 10, rpe: 3, completed: true, type: 'regular' },
                            { id: 2, weight: 80, reps: 10, rpe: 3, completed: true, type: 'regular' },
                            { id: 3, weight: 80, reps: 10, rpe: 3, completed: true, type: 'regular' },
                        ],
                    },
                ],
            },
        ];

        const session = SessionBuilder.buildFromProgramDay(
            0, day, meso, exercises, logs, 'es',
            { 42: { 1: { CHEST: { adjustment: 1 } } } },
            { rpEnabled: true, weightUnit: 'kg' }
        );
        // Only the first CHEST slot receives +1 set (4 sets), second CHEST slot stays 3 sets
        expect(session?.exercises[0].sets).toHaveLength(4);
        expect(session?.exercises[1].sets).toHaveLength(3);
        // Newly added Set 4 inherits previous load & reps from Set 3
        expect(session?.exercises[0].sets[3].prevWeight).toBe(80);
        expect(session?.exercises[0].sets[3].prevReps).toBe(10);

        // Condensed deload should NOT halve setTarget a second time
        const deloadSession = SessionBuilder.buildFromProgramDay(
            0,
            { id: 'dc', dayName: { es: 'Deload', en: 'Deload' }, slots: [{ muscle: 'CHEST', setTarget: 2, exerciseId: 'bench' }] },
            { ...meso, week: 5, isDeload: true, condensedDeload: true },
            exercises, [], 'es', {}, { rpEnabled: true }
        );
        expect(deloadSession?.exercises[0].sets).toHaveLength(2);
    });

    it('normalizes SFR score on 0-10 scale and exposes full [-2..+2] overrides + isolated joint pain in FeedbackModal', () => {
        const great = recordExerciseSfrFeedback('cable_curl', { jointPain: 0, pump: 2, soreness: 1 });
        const painful = recordExerciseSfrFeedback('preacher_ez', { jointPain: 2, pump: 0, soreness: 1 });
        expect(getExerciseSfrScore(great)).toBeGreaterThanOrEqual(9);
        expect(getExerciseSfrScore(painful)).toBeLessThanOrEqual(2);

        const onConfirm = vi.fn();
        render(
            <FeedbackModal
                muscles={['CHEST']}
                exercisesByMuscle={{
                    CHEST: [
                        { id: 'ex_rated', name: 'Press Inclinado' },
                        { id: 'ex_unrated', name: 'Cruces Polea' },
                    ],
                }}
                sessionWeek={1}
                trainedMusclesInMeso={['CHEST']}
                onConfirm={onConfirm}
                onCancel={vi.fn()}
            />
        );

        // Because CHEST was already trained in Week 1, soreness is NOT pre-filled as 0 (grid is shown)
        expect(screen.queryByTestId('prefilled-soreness-banner')).toBeNull();

        // Rate pain only on ex_rated, answer remaining sections
        const ratedCard = screen.getByTestId('joint-pain-ex-ex_rated');
        fireEvent.click(withinText(ratedCard, 'Mucho dolor'));
        fireEvent.click(screen.getByText('Sin agujetas'));
        fireEvent.click(screen.getByText('Bajo bombeo'));
        fireEvent.click(screen.getByText('Óptimo'));

        // Full [-2, -1, 0, +1, +2] override range available
        expect(screen.getByTestId('feedback-override--2')).toBeInTheDocument();
        expect(screen.getByTestId('feedback-override-2')).toBeInTheDocument();
        fireEvent.click(screen.getByTestId('feedback-override--2'));
        fireEvent.click(screen.getByTestId('feedback-save-btn'));

        expect(onConfirm).toHaveBeenCalledWith({
            CHEST: expect.objectContaining({ adjustment: -2 }),
        });

        // Unrated sibling exercise must NOT receive painful record
        const sfrHistory = loadExerciseSfrHistory();
        expect(sfrHistory.ex_rated?.jointPain).toBe(3);
        expect(sfrHistory.ex_unrated).toBeUndefined();
    });

    it('allows mid-session Repeat for meso swaps before Set 1 is completed while preserving finish-sheet gating', () => {
        const unstartedSession = {
            mesoId: 42,
            dayIdx: 0,
            exercises: [{ id: 'bench', sets: [{ type: 'regular', completed: false }] }],
        };
        const meso = { id: 42, plan: [['bench']] };
        expect(isMesoSessionTemplateEligible(unstartedSession, meso)).toBe(true);
        expect(isTemplateUpdateEligible(unstartedSession, meso)).toBe(false);
    });
});

function withinText(container: HTMLElement, text: string): HTMLElement {
    const buttons = Array.from(container.querySelectorAll('button'));
    const match = buttons.find(b => b.textContent?.includes(text));
    if (!match) throw new Error(`Button with text "${text}" not found`);
    return match;
}
