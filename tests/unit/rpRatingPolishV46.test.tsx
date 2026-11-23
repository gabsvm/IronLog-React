import React, { useRef } from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import {
    EXERCISE_SFR_STORAGE_KEY,
    computePriorityAwareSetDelta,
    explainPriorityAwareSetDelta,
    getExerciseSfrRanking,
    loadExerciseSfrHistory,
    predictSetTarget,
    recordExerciseSfrFeedback,
} from '../../utils/rpAutoregulation';
import { SessionBuilder } from '../../services/SessionBuilder';
import { FeedbackModal } from '../../components/ui/FeedbackModal';
import { SetRowActionMenu } from '../../components/workout/setRow/SetRowActionMenu';
import { HomeMesoSettingsModal } from '../../views/home/HomeMesoSettingsModal';
import { StatsProgressTab } from '../../views/stats/StatsProgressTab';
import { TRANSLATIONS } from '../../constants';
import * as AppContext from '../../context/AppContext';
import { useStore } from '../../lib/store';
import type { ExerciseDef, MesoCycle, ProgramDay, WorkoutSet } from '../../types';

describe('MEVRA v4.6.0 — RP Rating Polish, Anti-Volume Trap & SFR Analytics', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        localStorage.removeItem(EXERCISE_SFR_STORAGE_KEY);
        useStore.setState({ activeMeso: null } as any);
        vi.spyOn(AppContext, 'useAppPreferences').mockReturnValue({ lang: 'es' } as any);
    });

    it('supports conservative vs standard vs aggressive progression profiles & rationale copy', () => {
        const conservativeDelta = computePriorityAwareSetDelta({
            jointPain: 0,
            soreness: 1,
            pump: 0,
            workload: 0,
            priority: 'emphasize',
            volumeProfile: 'conservative',
        });
        expect(conservativeDelta).toBe(0);

        const aggressiveDelta = computePriorityAwareSetDelta({
            jointPain: 0,
            soreness: 0,
            pump: 0,
            workload: 0,
            priority: 'grow',
            volumeProfile: 'aggressive',
        });
        expect(aggressiveDelta).toBe(2);

        const rationale = explainPriorityAwareSetDelta({
            jointPain: 0,
            soreness: 0,
            pump: 1,
            workload: 2,
            priority: 'emphasize',
            delta: 0,
        });
        expect(rationale.es).toContain('MRV');
    });

    it('predicts +1 rep overload for pure bodyweight movements (weight = 0)', () => {
        const bwPred = predictSetTarget({
            prevWeightKg: 0,
            prevReps: 8,
            currentWeightKg: 0,
            unit: 'kg',
            targetRir: 2,
            week: 2,
            isDeload: false,
            isBodyweight: true,
        });
        expect(bwPred.mode).toBe('reps');
        expect(bwPred.targetReps).toBe(9);
        expect(bwPred.deltaType).toBe('rep_bump');
    });

    it('enforces Anti-Volume Trap maxSetsPerExercise cap and optional Deload accessory skip in SessionBuilder', () => {
        const exercises: ExerciseDef[] = [
            { id: 'bench', name: { es: 'Press Banca', en: 'Bench Press' }, muscle: 'CHEST' },
            { id: 'calf', name: { es: 'Gemelo Pie', en: 'Standing Calf Raise' }, muscle: 'CALVES' },
        ];
        const day: ProgramDay = {
            id: 'd1',
            dayName: { es: 'Torso + Gemelos', en: 'Upper + Calves' },
            slots: [
                { exerciseId: 'bench', muscle: 'CHEST', setTarget: 5 },
                { exerciseId: 'calf', muscle: 'CALVES', setTarget: 3 },
            ],
        };
        const meso: MesoCycle = {
            id: 99,
            name: 'Guardrails Meso',
            mesoType: 'hyp_1',
            week: 4,
            duration: 5,
            targetWeeks: 5,
            isDeload: false,
            maxSetsPerExercise: 4,
            plan: [['bench', 'calf']],
        };
        const rpFeedback = {
            99: {
                1: { CHEST: { soreness: 0, performance: 1, adjustment: 2 } },
                2: { CHEST: { soreness: 0, performance: 1, adjustment: 1 } },
            },
        };

        const session = SessionBuilder.buildFromProgramDay(0, day, meso, exercises, [], 'es', rpFeedback, { rpEnabled: true });
        expect(session?.exercises[0].sets).toHaveLength(4);

        const deloadMeso: MesoCycle = {
            ...meso,
            week: 5,
            isDeload: true,
            skipDeloadAccessories: true,
        };
        const deloadSession = SessionBuilder.buildFromProgramDay(0, day, deloadMeso, exercises, [], 'es', rpFeedback, { rpEnabled: true });
        expect(deloadSession?.exercises).toHaveLength(1);
        expect(deloadSession?.exercises[0].id).toBe('bench');
    });

    it('ranks exercises by SFR score and separates per-exercise joint pain in FeedbackModal + override & tooltips', () => {
        const onConfirm = vi.fn();
        render(
            <FeedbackModal
                muscles={['CHEST']}
                exercisesByMuscle={{
                    CHEST: [
                        { id: 'bench', name: 'Press Banca Plano' },
                        { id: 'pec_deck', name: 'Pec Deck Máquina' },
                    ],
                }}
                sessionWeek={2}
                prefilledSoreness={{ CHEST: { soreness: 1, recoveryMode: false, timestamp: 1 } }}
                onConfirm={onConfirm}
                onCancel={vi.fn()}
            />,
        );

        // Pre-filled soreness banner replaces duplicate grid until "Editar"
        expect(screen.getByTestId('prefilled-soreness-banner')).toBeInTheDocument();

        // Interactive ? tooltip opens popover
        fireEvent.click(screen.getByTestId('help-btn-joint'));
        expect(screen.getByTestId('help-popover-joint')).toBeInTheDocument();

        // Rate Bench = Moderado (2) vs Pec Deck = Ninguno (0)
        const benchCard = screen.getByTestId('joint-pain-ex-bench');
        const pecCard = screen.getByTestId('joint-pain-ex-pec_deck');
        fireEvent.click(within(benchCard).getByText('Moderado'));
        fireEvent.click(within(pecCard).getByText('Ninguno'));

        // Answer pump + workload
        fireEvent.click(screen.getByText('Gran bombeo'));
        fireEvent.click(screen.getByText('Óptimo'));

        // Manual override -> force +1
        expect(screen.getByTestId('feedback-rationale-card')).toBeInTheDocument();
        fireEvent.click(screen.getByTestId('feedback-override-1'));

        fireEvent.click(screen.getByTestId('feedback-save-btn'));
        expect(onConfirm).toHaveBeenCalledWith({
            CHEST: expect.objectContaining({ adjustment: 1, soreness: 1 }),
        });

        const history = loadExerciseSfrHistory();
        expect(history.bench.jointPain).toBe(2);
        expect(history.pec_deck.jointPain).toBe(0);

        const defs: ExerciseDef[] = [
            { id: 'bench', name: { es: 'Press Banca', en: 'Bench' }, muscle: 'CHEST' },
            { id: 'pec_deck', name: { es: 'Pec Deck', en: 'Pec Deck' }, muscle: 'CHEST' },
        ];
        const ranking = getExerciseSfrRanking(history, defs, 'es');
        expect(ranking[0].exerciseId).toBe('pec_deck');
        expect(ranking[1].exerciseId).toBe('bench');
        expect(ranking[1].jointPainWarning).toBe(true);
    });

    it('renders Guardrails RP in HomeMesoSettingsModal, L/R toggle in SetRowActionMenu, and SFR card in StatsProgressTab', () => {
        const setEditMaxSets = vi.fn();
        const setEditVolumeProfile = vi.fn();
        const setEditSkipDeloadAccessories = vi.fn();
        render(
            <HomeMesoSettingsModal
                state={{
                    onEditProgram: vi.fn(),
                    tutorialProgress: { mesoSettings: true },
                    markTutorialSeen: vi.fn(),
                    t: TRANSLATIONS.es,
                    h: TRANSLATIONS.es.homeView,
                    lang: 'es',
                    availableStages: null,
                    editStageId: '',
                    setEditStageId: vi.fn(),
                    setShowCompleteModal: vi.fn(),
                    showMesoSettings: true,
                    setShowMesoSettings: vi.fn(),
                    editWeeks: 5,
                    setEditWeeks: vi.fn(),
                    editDeload: false,
                    setEditDeload: vi.fn(),
                    editMaxSets: 5,
                    setEditMaxSets,
                    editVolumeProfile: 'standard',
                    setEditVolumeProfile,
                    editSkipDeloadAccessories: false,
                    setEditSkipDeloadAccessories,
                    editNote: '',
                    setEditNote: vi.fn(),
                    handleSaveSettings: vi.fn(),
                    mesoSettingsTutorialSteps: [],
                } as any}
            />,
        );

        expect(screen.getByTestId('meso-guardrails-section')).toBeInTheDocument();
        fireEvent.click(screen.getByTestId('guardrail-cap-4'));
        expect(setEditMaxSets).toHaveBeenCalledWith(4);
        fireEvent.click(screen.getByTestId('guardrail-profile-conservative'));
        expect(setEditVolumeProfile).toHaveBeenCalledWith('conservative');
        fireEvent.click(screen.getByTestId('guardrail-skip-deload-acc'));
        expect(setEditSkipDeloadAccessories).toHaveBeenCalledWith(true);

        const onUpdateSpy = vi.fn();
        const MenuHost: React.FC = () => {
            const ref = useRef<HTMLButtonElement>(null);
            const mockSet: WorkoutSet = { id: 1, type: 'regular', weight: '20', reps: '12', rpe: '', completed: false };
            return (
                <>
                    <button ref={ref} type="button">Anchor</button>
                    <SetRowActionMenu
                        isOpen={true}
                        onClose={vi.fn()}
                        set={mockSet}
                        exInstanceId={10}
                        lang="es"
                        onUpdate={onUpdateSpy}
                        onChangeType={vi.fn()}
                        anchorRef={ref}
                    />
                </>
            );
        };
        render(<MenuHost />);
        fireEvent.click(screen.getByTestId('menu-unilateral-side-btn'));
        expect(onUpdateSpy).toHaveBeenCalledWith(10, 1, 'limitingSide', 'L');

        recordExerciseSfrFeedback('pec_deck', { jointPain: 0, pump: 2, soreness: 1 });
        render(
            <StatsProgressTab
                stats={{
                    lang: 'es',
                    t: TRANSLATIONS.es,
                    s: TRANSLATIONS.es.statsView,
                    unit: 'kg',
                    weightSuffix: 'kg',
                    selectedExId: null,
                    setSelectedExId: vi.fn(),
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
                    exercisePlateaus: [],
                    sfrRanking: [
                        {
                            exerciseId: 'pec_deck',
                            exerciseName: 'Pec Deck Máquina',
                            muscle: 'CHEST',
                            sfrScore: 3,
                            avgJointPain: 0,
                            avgPump: 2,
                            jointPainWarning: false,
                            count: 1,
                        },
                    ],
                } as any}
            />,
        );
        expect(screen.getByTestId('sfr-ranking-card')).toBeInTheDocument();
        expect(screen.getByText('Pec Deck Máquina')).toBeInTheDocument();
    });
});
