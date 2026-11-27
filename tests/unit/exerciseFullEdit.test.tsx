import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExerciseDetailModal, extractYouTubeVideoId } from '../../components/ui/ExerciseDetailModal';
import { ExerciseCardMenu } from '../../components/workout/ExerciseCardMenu';
import { ExercisesView } from '../../views/ExercisesView';
import { TRANSLATIONS } from '../../constants';
import type { ActiveSession, ExerciseDef, GlobalTemplate, Log, ProgramDay, SessionExercise } from '../../types';

vi.mock('../../utils/audio', () => ({
    triggerHaptic: vi.fn(),
    playTimerFinishSound: vi.fn(),
}));

const invalidateChartCacheMock = vi.fn().mockResolvedValue(undefined);
vi.mock('../../services/statsCache', () => ({
    statsCache: {
        invalidateChartCache: () => invalidateChartCacheMock(),
    },
}));

vi.mock('../../hooks/useStatsWorker', () => ({
    useStatsWorker: () => ({
        isWorkerReady: false,
        calculateChartData: vi.fn().mockResolvedValue([]),
    }),
}));

vi.mock('react-virtuoso', () => ({
    Virtuoso: ({ data, itemContent }: any) => (
        <div data-testid="mock-virtuoso">
            {(data ?? []).map((item: any, index: number) => itemContent(index, item))}
        </div>
    ),
}));

let mockExercisesState: ExerciseDef[] = [];
let mockLogsState: Log[] = [];
let mockProgramState: ProgramDay[] = [];
let mockPersonalTemplatesState: GlobalTemplate[] = [];
let mockActiveSession: ActiveSession | null = null;

const setExercisesMock = vi.fn((updater: any) => {
    mockExercisesState = typeof updater === 'function' ? updater(mockExercisesState) : updater;
});
const setLogsMock = vi.fn((updater: any) => {
    mockLogsState = typeof updater === 'function' ? updater(mockLogsState) : updater;
});
const setProgramMock = vi.fn((updater: any) => {
    mockProgramState = typeof updater === 'function' ? updater(mockProgramState) : updater;
});
const setPersonalTemplatesMock = vi.fn((updater: any) => {
    mockPersonalTemplatesState = typeof updater === 'function' ? updater(mockPersonalTemplatesState) : updater;
});
const setActiveSessionMock = vi.fn((updater: any) => {
    mockActiveSession = typeof updater === 'function' ? updater(mockActiveSession) : updater;
});

vi.mock('../../context/AppContext', () => ({
    useApp: () => ({
        lang: 'es',
        config: { weightUnit: 'kg' },
        exercises: mockExercisesState,
        setExercises: setExercisesMock,
        logs: mockLogsState,
        setLogs: setLogsMock,
        program: mockProgramState,
        setProgram: setProgramMock,
        personalTemplates: mockPersonalTemplatesState,
        setPersonalTemplates: setPersonalTemplatesMock,
    }),
    useAppPreferences: () => ({ lang: 'es', setLang: vi.fn() }),
}));

vi.mock('../../lib/store', () => ({
    useStore: (selector: any) => selector({
        activeSession: mockActiveSession,
        setActiveSession: setActiveSessionMock,
        activeMeso: null,
        setActiveMeso: vi.fn(),
    }),
}));

describe('Full Exercise Edit & Create Parity', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        const misclassifiedExercise: ExerciseDef = {
            id: 'custom_preacher_curl',
            name: { es: 'Biceps Curl (Preacher Like)', en: 'Biceps Curl (Preacher Like)' },
            muscle: 'CHEST',
            equipment: 'barbell',
            isBodyweight: false,
            volumeCountingMode: 'total',
            pinnedNote: '8-12 reps',
            isCustom: true,
        };

        mockExercisesState = [
            misclassifiedExercise,
            {
                id: 'bp_bar',
                name: { es: 'Press de Banca', en: 'Bench Press' },
                muscle: 'CHEST',
                equipment: 'barbell',
            },
        ];

        mockActiveSession = {
            id: 1001,
            name: 'Día 3: Brazos y Hombros',
            startTime: 1000,
            dayIdx: 2,
            mesoId: 1,
            week: 1,
            exercises: [
                {
                    ...misclassifiedExercise,
                    instanceId: 101,
                    sets: [
                        { id: 1, weight: 12.5, reps: 10, rpe: 7, completed: true, type: 'regular' },
                        { id: 2, weight: 12.5, reps: 12, rpe: 7, completed: true, type: 'regular' },
                    ],
                },
            ],
        };

        mockProgramState = [
            {
                id: 'day_3',
                dayName: { es: 'Día 3', en: 'Day 3' },
                slots: [
                    { muscle: 'CHEST', setTarget: 3, exerciseId: 'custom_preacher_curl' },
                    { muscle: 'CHEST', setTarget: 3, exerciseId: 'bp_bar' },
                ],
            },
        ];

        mockPersonalTemplatesState = [
            {
                id: 'tpl_1',
                name: 'Mi Rutina',
                title: { es: 'Mi Rutina', en: 'My Routine' },
                description: { es: 'Desc', en: 'Desc' },
                isPro: false,
                order: 1,
                program: [
                    {
                        id: 'tpl_day_1',
                        dayName: { es: 'Día 1', en: 'Day 1' },
                        slots: [
                            { muscle: 'CHEST', setTarget: 4, exerciseId: 'custom_preacher_curl' },
                        ],
                    },
                ],
            },
        ];

        mockLogsState = [
            {
                id: 9001,
                dayIdx: 0,
                name: 'Sesión previa',
                startTime: 500,
                endTime: 900,
                duration: 400,
                mesoId: 1,
                week: 1,
                exercises: [
                    {
                        ...misclassifiedExercise,
                        instanceId: 55,
                        sets: [{ id: 1, weight: 12.5, reps: 10, rpe: 7, completed: true, type: 'regular' }],
                    },
                ],
            },
        ];
    });

    it('extractYouTubeVideoId parses standard, short, shorts, embed URLs and raw 11-char IDs', () => {
        expect(extractYouTubeVideoId('dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
        expect(extractYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ?t=12')).toBe('dQw4w9WgXcQ');
        expect(extractYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=abc')).toBe('dQw4w9WgXcQ');
        expect(extractYouTubeVideoId('https://youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
        expect(extractYouTubeVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
        expect(extractYouTubeVideoId('   ')).toBeUndefined();
        expect(extractYouTubeVideoId('not-a-valid-url')).toBeUndefined();
    });

    it('ExerciseDetailModal opens directly on Editar tab and propagates muscle, name, equipment, bw, tonnage, video & note everywhere', () => {
        const onClose = vi.fn();
        render(
            <ExerciseDetailModal
                exercise={mockExercisesState[0]}
                initialTab="edit"
                onClose={onClose}
            />
        );

        expect(screen.getByTestId('exercise-edit-tab')).toBeTruthy();

        fireEvent.change(screen.getByTestId('edit-exercise-name'), {
            target: { value: 'Biceps Curl Preacher Polea' },
        });
        fireEvent.click(screen.getByTestId('edit-muscle-BICEPS'));
        fireEvent.click(screen.getByTestId('edit-equipment-cable'));
        fireEvent.click(screen.getByTestId('edit-volume-per-side'));
        fireEvent.change(screen.getByTestId('edit-exercise-video'), {
            target: { value: 'https://youtu.be/dQw4w9WgXcQ' },
        });
        fireEvent.change(screen.getByTestId('edit-exercise-pinned-note'), {
            target: { value: 'Banco inclinado 45° + polea baja' },
        });

        fireEvent.click(screen.getByTestId('exercise-detail-save'));

        // Library updated
        expect(mockExercisesState[0]).toMatchObject({
            id: 'custom_preacher_curl',
            name: { es: 'Biceps Curl Preacher Polea', en: 'Biceps Curl Preacher Polea' },
            muscle: 'BICEPS',
            equipment: 'cable',
            isBodyweight: false,
            volumeCountingMode: 'per_side',
            videoId: 'dQw4w9WgXcQ',
            pinnedNote: 'Banco inclinado 45° + polea baja',
        });

        // Active workout updated without losing logged sets
        expect(mockActiveSession?.exercises[0]).toMatchObject({
            muscle: 'BICEPS',
            equipment: 'cable',
            volumeCountingMode: 'per_side',
            videoId: 'dQw4w9WgXcQ',
            note: 'Banco inclinado 45° + polea baja',
            notePinned: true,
        });
        expect(mockActiveSession?.exercises[0].sets).toHaveLength(2);
        expect(mockActiveSession?.exercises[0].sets[0].weight).toBe(12.5);

        // Program slot updated ONLY for the edited exercise
        expect(mockProgramState[0].slots[0].muscle).toBe('BICEPS');
        expect(mockProgramState[0].slots[1].muscle).toBe('CHEST');

        // Personal template updated
        expect(mockPersonalTemplatesState[0].program[0].slots[0].muscle).toBe('BICEPS');

        // Historical log updated while keeping logged sets
        expect(mockLogsState[0].exercises[0].muscle).toBe('BICEPS');
        expect(mockLogsState[0].exercises[0].equipment).toBe('cable');
        expect(mockLogsState[0].exercises[0].sets).toHaveLength(1);

        expect(invalidateChartCacheMock).toHaveBeenCalledTimes(1);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('ExerciseCardMenu triggers onOpenDetail(ex, "edit") when clicking Editar ejercicio', () => {
        const onOpenDetail = vi.fn();
        const onClose = vi.fn();
        const sessionEx: SessionExercise = {
            ...(mockExercisesState[0] as ExerciseDef),
            instanceId: 101,
            sets: [],
        };

        render(
            <ExerciseCardMenu
                ex={sessionEx}
                isOpen={true}
                onClose={onClose}
                isCardio={false}
                cardioMode="steady"
                hasSuperset={false}
                isLinking={false}
                onOpenDetail={onOpenDetail}
                onCardioModeChange={vi.fn()}
                onInjectWarmup={vi.fn()}
                onSupersetAction={vi.fn()}
                onReplace={vi.fn()}
                onRequestDelete={vi.fn()}
                t={TRANSLATIONS.es}
                lang="es"
            />
        );

        fireEvent.click(screen.getByTestId('card-menu-edit-exercise'));
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(onOpenDetail).toHaveBeenCalledWith(sessionEx, 'edit');
    });

    it('ExercisesView provides row edit shortcut to Editar tab and Create parity with equipment & bodyweight', () => {
        render(<ExercisesView onBack={vi.fn()} />);

        // Row Pencil button opens ExerciseDetailModal directly on Editar tab
        fireEvent.click(screen.getByTestId('edit-exercise-btn-custom_preacher_curl'));
        expect(screen.getByTestId('exercise-edit-tab')).toBeTruthy();

        // Close modal and open Create mode
        fireEvent.click(screen.getByText(TRANSLATIONS.es.close));
        const addBtn = screen.getByRole('button', { name: TRANSLATIONS.es.exercisesView.createEx });
        fireEvent.click(addBtn);

        fireEvent.change(screen.getByTestId('create-exercise-name'), {
            target: { value: 'Fondos Lastrados Paralelas' },
        });
        fireEvent.click(screen.getByTestId('create-muscle-TRICEPS'));
        fireEvent.click(screen.getByTestId('create-equipment-bodyweight_loadable'));

        const bwCheckbox = screen.getByTestId('create-exercise-bw') as HTMLInputElement;
        expect(bwCheckbox.checked).toBe(true);

        fireEvent.click(screen.getByTestId('create-exercise-save'));

        const created = mockExercisesState.find((ex) => ex.name === 'Fondos Lastrados Paralelas');
        expect(created).toBeTruthy();
        expect(created?.muscle).toBe('TRICEPS');
        expect(created?.equipment).toBe('bodyweight_loadable');
        expect(created?.isBodyweight).toBe(true);
        expect(created?.isCustom).toBe(true);
    });
});
