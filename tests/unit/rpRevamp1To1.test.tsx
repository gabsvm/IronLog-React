import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
    ALL_EQUIPMENT_TYPES,
    getEquipmentLabel,
    inferExerciseEquipment,
    recommendExercisesForMuscle,
} from '../../utils/equipment';
import {
    clearMesocycleDraft,
    extractPastMesocycles,
    loadMesocycleDraft,
    saveMesocycleDraft,
} from '../../utils/mesoDraft';
import { MuscleTag } from '../../components/ui/MuscleTag';
import { ExerciseSelector } from '../../components/ui/ExerciseSelector';
import { MusclePrioritiesSheet } from '../../components/workout/MusclePrioritiesSheet';
import { TrainingSection } from '../../components/profile/sections/TrainingSection';
import * as AppContext from '../../context/AppContext';
import type { ExerciseDef, Log } from '../../types';

vi.mock('../../utils/audio', () => ({
    triggerHaptic: vi.fn(),
    getExactAlarmState: vi.fn().mockResolvedValue('granted'),
}));

vi.mock('react-virtuoso', () => ({
    Virtuoso: ({ data, itemContent }: any) => (
        <div data-testid="mock-virtuoso">
            {(data ?? []).map((item: any, index: number) => itemContent(index, item))}
        </div>
    ),
}));

vi.mock('../../context/AuthContext', () => ({
    useAuth: () => ({ user: null, isAdmin: false }),
}));

vi.mock('../../hooks/usePro', () => ({
    usePro: () => ({
        isPro: true,
        checkPro: () => true,
        showPaywall: false,
        setShowPaywall: vi.fn(),
        featureAttempted: '',
    }),
}));

vi.mock('@capacitor/core', () => ({
    Capacitor: { isNativePlatform: () => false, getPlatform: () => 'web' },
    registerPlugin: () => ({}),
}));

vi.mock('../../hooks/useTimer', () => ({
    requestTimerNotificationPermission: vi.fn(),
}));

vi.mock('../../components/profile/ExactAlarmRow', () => ({
    ExactAlarmRow: () => null,
}));

vi.mock('../../components/profile/ReminderSettingsRow', () => ({
    ReminderSettingsRow: () => null,
}));

describe('RP Hypertrophy App 1:1 Revamp Suite', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        clearMesocycleDraft();
    });

    describe('Equipment taxonomy & recommendations', () => {
        it('exposes the 9 RP equipment types and infers equipment from names', () => {
            expect(ALL_EQUIPMENT_TYPES).toHaveLength(9);
            expect(getEquipmentLabel('smith_machine', 'en')).toBe('Smith machine');

            expect(inferExerciseEquipment({ id: '1', name: 'Incline Machine Press' })).toBe('machine');
            expect(inferExerciseEquipment({ id: '2', name: 'Barbell Bench Press' })).toBe('barbell');
            expect(inferExerciseEquipment({ id: '3', name: 'Dumbbell Lateral Raise' })).toBe('dumbbell');
            expect(inferExerciseEquipment({ id: '4', name: 'Cable Fly' })).toBe('cable');
            expect(inferExerciseEquipment({ id: '5', name: 'Smith Squat' })).toBe('smith_machine');
            expect(inferExerciseEquipment({ id: '6', name: 'Assisted Pull-up' })).toBe('machine_assistance');
            expect(inferExerciseEquipment({ id: '7', name: 'Weighted Dip', isBodyweight: true })).toBe('bodyweight_loadable');
        });

        it('prioritizes preferred equipment in ⚡ recommendExercisesForMuscle', () => {
            const library: ExerciseDef[] = [
                { id: 'bp_bar', name: { es: 'Press Banca Barra', en: 'Barbell Bench Press' }, muscle: 'CHEST', equipment: 'barbell' },
                { id: 'inc_db', name: { es: 'Press Inclinado Mancuernas', en: 'Incline DB Press' }, muscle: 'CHEST', equipment: 'dumbbell' },
                { id: 'chest_mach', name: { es: 'Press Pecho Máquina', en: 'Chest Press Machine' }, muscle: 'CHEST', equipment: 'machine' },
            ];

            const recs = recommendExercisesForMuscle(library, 'CHEST', ['dumbbell'], [], 'en');
            expect(recs[0].id).toBe('inc_db');
        });
    });

    describe('Mesocycle draft persistence & past meso extraction', () => {
        it('saves, loads, and clears mesocycle drafts cleanly', () => {
            expect(loadMesocycleDraft()).toBeNull();
            saveMesocycleDraft({
                name: 'Hypertrophy Block 1',
                mesoType: 'hyp_1',
                weeks: 6,
                program: [{ id: 'd1', dayName: { en: 'Push', es: 'Empuje' }, slots: [{ muscle: 'CHEST', setTarget: 3 }] }],
                musclePriorities: { CHEST: 'emphasize' },
                updatedAt: Date.now(),
            });
            const loaded = loadMesocycleDraft();
            expect(loaded?.name).toBe('Hypertrophy Block 1');
            expect(loaded?.weeks).toBe(6);
            clearMesocycleDraft();
            expect(loadMesocycleDraft()).toBeNull();
        });

        it('extracts completed/historical mesocycles from workout logs for Copy', () => {
            const logs: Log[] = [
                {
                    id: 100,
                    mesoId: 77,
                    dayIdx: 0,
                    week: 3,
                    name: 'Push Day',
                    startTime: 1000,
                    endTime: 2000,
                    duration: 1000,
                    exercises: [
                        {
                            id: 'bp_bar',
                            instanceId: 1,
                            name: 'Barbell Bench Press',
                            muscle: 'CHEST',
                            sets: [
                                { id: 1, weight: 80, reps: 10, rpe: 8, completed: true, type: 'regular' },
                                { id: 2, weight: 80, reps: 9, rpe: 8, completed: true, type: 'regular' },
                            ],
                        },
                    ],
                },
            ];

            const past = extractPastMesocycles(logs, 999, []);
            expect(past).toHaveLength(1);
            expect(past[0].mesoId).toBe(77);
            expect(past[0].weeksLogged).toBe(3);
            expect(past[0].days[0].slots[0].setTarget).toBe(2);
        });
    });

    describe('MuscleTag priority bars & MusclePrioritiesSheet', () => {
        it('renders priority bar levels accurately via data-priority and SVG opacity', () => {
            const { rerender, container } = render(<MuscleTag label="CHEST" muscle="CHEST" priority="emphasize" />);
            expect(container.querySelector('[data-priority="emphasize"]')).toBeTruthy();
            expect(container.querySelectorAll('rect[opacity="1"]')).toHaveLength(3);

            rerender(<MuscleTag label="CHEST" muscle="CHEST" priority="grow" />);
            expect(container.querySelectorAll('rect[opacity="1"]')).toHaveLength(2);

            rerender(<MuscleTag label="CHEST" muscle="CHEST" priority="maintain" />);
            expect(container.querySelectorAll('rect[opacity="1"]')).toHaveLength(1);
        });

        it('steps priorities and saves via MusclePrioritiesSheet', () => {
            const onSave = vi.fn();
            const onOpenChange = vi.fn();
            render(
                <MusclePrioritiesSheet
                    open={true}
                    onOpenChange={onOpenChange}
                    muscles={['CHEST']}
                    initialPriorities={{ CHEST: 'grow' }}
                    onSave={onSave}
                    lang="en"
                />
            );

            fireEvent.click(screen.getByLabelText('Increase priority for Chest'));
            fireEvent.click(screen.getByText('Save'));

            expect(onSave).toHaveBeenCalledWith({ CHEST: 'emphasize' });
            expect(onOpenChange).toHaveBeenCalledWith(false);
        });
    });

    describe('ExerciseSelector equipment filter & replace Repeat mode', () => {
        it('supports equipment filtering and Repeat checkbox confirmation in replace mode', () => {
            const mockExercises: ExerciseDef[] = [
                { id: 'bench_bar', name: { es: 'Press Banca', en: 'Barbell Bench' }, muscle: 'CHEST', equipment: 'barbell' },
                { id: 'chest_mach', name: { es: 'Press Máquina', en: 'Chest Machine' }, muscle: 'CHEST', equipment: 'machine' },
            ];
            vi.spyOn(AppContext, 'useApp').mockReturnValue({
                exercises: mockExercises,
                setExercises: vi.fn(),
                config: { useExerciseTypeFilters: false },
            } as any);
            vi.spyOn(AppContext, 'useAppPreferences').mockReturnValue({ lang: 'en' } as any);

            const onReplaceConfirm = vi.fn();
            render(
                <ExerciseSelector
                    mode="replace"
                    onSelect={vi.fn()}
                    onReplaceConfirm={onReplaceConfirm}
                    onClose={vi.fn()}
                    presetMuscle="CHEST"
                />
            );

            // Toggle equipment chip bar and filter by Machine
            fireEvent.click(screen.getByTestId('selector-equip-toggle'));
            const equipBar = screen.getByTestId('selector-equipment-chips');
            fireEvent.click(equipBar.querySelectorAll('button')[1]); // Machine

            expect(screen.getByText('Chest Machine')).toBeTruthy();
            expect(screen.queryByText('Barbell Bench')).toBeNull();

            // Select radio row and confirm replace with Repeat checked
            fireEvent.click(screen.getByRole('radio'));
            fireEvent.click(screen.getByTestId('selector-replace-confirm-btn'));

            expect(onReplaceConfirm).toHaveBeenCalledWith('chest_mach', mockExercises[1], true);
        });
    });

    describe('TrainingSection RP Preferences', () => {
        it('toggles Auto match weight updates and Use exercise type filters', () => {
            const setConfig = vi.fn();
            vi.spyOn(AppContext, 'useApp').mockReturnValue({
                lang: 'en',
                config: {
                    showRIR: false,
                    keepScreenOn: false,
                    autoMatchWeight: true,
                    useExerciseTypeFilters: false,
                    preferredEquipment: ['machine'],
                },
                setConfig,
                program: [],
                personalTemplates: [],
                setPersonalTemplates: vi.fn(),
            } as any);

            render(
                <TrainingSection
                    onClose={vi.fn()}
                    onOpenProgram={vi.fn()}
                    onOpenExercises={vi.fn()}
                />
            );

            fireEvent.click(screen.getByLabelText('Auto match weight updates'));
            expect(setConfig).toHaveBeenCalledWith({ autoMatchWeight: false });

            fireEvent.click(screen.getByLabelText('Use exercise type filters'));
            expect(setConfig).toHaveBeenCalledWith({ useExerciseTypeFilters: true });
        });
    });
});
