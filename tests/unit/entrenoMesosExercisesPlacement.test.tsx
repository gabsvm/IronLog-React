import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { HomeTopSection } from '../../views/home/HomeTopSection';
import { HomeWeekDayList } from '../../views/home/HomeWeekDayList';
import { HomeRecapStrip } from '../../views/home/HomeRecapStrip';
import { HomeMesosView } from '../../views/home/HomeMesosView';
import { ExercisesView } from '../../views/ExercisesView';
import { ExerciseDetailModal } from '../../components/ui/ExerciseDetailModal';
import { TRANSLATIONS } from '../../constants';
import type { ExerciseDef } from '../../types';

// Mock audio
vi.mock('../../utils/audio', () => ({
    triggerHaptic: vi.fn(),
}));

const mockAppContext = {
    exercises: [
        { id: 'bp_bar', name: { es: 'Press Banca Barra', en: 'Barbell Bench Press' }, muscle: 'CHEST' },
        { id: 'custom_1', name: 'Press Inclinado Custom', muscle: 'CHEST', isCustom: true },
        { id: 'ohp', name: { es: 'Press Militar', en: 'Overhead Press' }, muscle: 'SHOULDERS' },
    ] as any[],
    setExercises: vi.fn(),
    lang: 'es' as 'es' | 'en',
    program: [] as any[],
    setProgram: vi.fn(),
    personalTemplates: [] as any[],
    setPersonalTemplates: vi.fn(),
    logs: [] as any[],
    setLogs: vi.fn(),
    setActiveSession: vi.fn(),
    unit: 'kg' as const,
    t: TRANSLATIONS.es,
    h: TRANSLATIONS.es.homeView,
};

vi.mock('../../context/AppContext', () => ({
    useApp: () => mockAppContext,
    useAppPreferences: () => ({ lang: 'es', setLang: vi.fn() }),
}));

vi.mock('../../lib/store', () => ({
    useStore: (selector: any) => selector({ activeMeso: null, setActiveMeso: vi.fn() }),
}));

vi.mock('react-virtuoso', () => ({
    Virtuoso: ({ data, itemContent }: any) => (
        <div data-testid="mock-virtuoso">
            {(data ?? []).map((item: any, index: number) => itemContent(index, item))}
        </div>
    ),
}));

describe('Entreno, Mesos & Ejercicios UI Placement & Hierarchy Fixes', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockAppContext.exercises = [
            { id: 'bp_bar', name: { es: 'Press Banca Barra', en: 'Barbell Bench Press' }, muscle: 'CHEST' },
            { id: 'custom_1', name: 'Press Inclinado Custom', muscle: 'CHEST', isCustom: true },
            { id: 'ohp', name: { es: 'Press Militar', en: 'Overhead Press' }, muscle: 'SHOULDERS' },
        ];
    });

    describe('PART 1: Entreno (Home Hub) Placement', () => {
        const createMockHomeState = (overrides?: Partial<any>): any => ({
            safeProgram: [
                {
                    dayName: { es: 'Pecho', en: 'Chest' },
                    slots: [
                        { id: 's1', muscle: 'CHEST', exerciseId: 'bp_bar', setTarget: 3, reps: '8-12' },
                        { id: 's2', muscle: 'TRICEPS', exerciseId: 'triceps_ext', setTarget: 3 },
                    ],
                },
                {
                    dayName: { es: 'Espalda', en: 'Back' },
                    slots: [
                        { id: 's3', muscle: 'BACK', exerciseId: 'pull_up', setTarget: 4 },
                    ],
                },
            ],
            selectedDayIdx: 0,
            setSelectedDayIdx: vi.fn(),
            uniqueDaysDone: new Set([0]),
            nextWorkoutIdx: 0,
            activeMeso: {
                id: 1,
                name: 'Mesociclo Fuerza',
                week: 2,
                targetWeeks: 4,
                duration: 4,
                isDeload: false,
            },
            setActiveMeso: vi.fn(),
            exercises: [
                { id: 'bp_bar', name: { es: 'Press Banca Barra', en: 'Barbell Bench Press' }, muscle: 'CHEST' },
                { id: 'triceps_ext', name: { es: 'Extensiones Tríceps', en: 'Triceps Extensions' }, muscle: 'TRICEPS' },
                { id: 'pull_up', name: { es: 'Dominadas', en: 'Pull-ups' }, muscle: 'BACK' },
            ],
            lang: 'es',
            t: TRANSLATIONS.es,
            h: TRANSLATIONS.es.homeView,
            tm: (key: string) => (TRANSLATIONS.es.muscle as any)[key] ?? key,
            kongBlock: null,
            isPro: true,
            checkPro: () => true,
            setShowPlanActions: vi.fn(),
            setShowGuidelines: vi.fn(),
            setShowKongHub: vi.fn(),
            currentGuidelineImages: [],
            onEditProgram: vi.fn(),
            setShowMesoSettings: vi.fn(),
            setShowCompleteModal: vi.fn(),
            startSession: vi.fn(),
            ...overrides,
        });

        it('HomeTopSection: removes duplicate calendar drawer button and formats weeks as W1..Wn', () => {
            const state = createMockHomeState();
            render(<HomeTopSection state={state} />);

            const header = screen.getByTestId('home-hub-header');
            expect(header).toBeTruthy();

            // MoreVertical options button is present
            expect(screen.getByTestId('home-hub-header').querySelector('#tut-settings-btn')).toBeTruthy();

            // Calendar drawer button is removed from header
            expect(screen.queryByLabelText('Semanas y días')).toBeNull();

            // Subtitle uses data-testid="home-hub-subtitle" and displays dayName and mesoTitle cleanly
            const subtitle = screen.getByTestId('home-hub-subtitle');
            expect(subtitle.textContent).toContain('Pecho');
            expect(subtitle.textContent).toContain('Mesociclo Fuerza');
            // Does NOT repeat "1 de 2 días"
            expect(subtitle.textContent).not.toContain('1 de 2');

            // Week selector shows W1, W2, W3, W4 format
            const weekSelector = screen.getByTestId('home-week-selector');
            expect(within(weekSelector).getByText('W1')).toBeTruthy();
            expect(within(weekSelector).getByText('W2')).toBeTruthy();
            expect(within(weekSelector).getByText('W3')).toBeTruthy();
            expect(within(weekSelector).getByText('W4')).toBeTruthy();
        });

        it('HomeWeekDayList: removes misleading ChevronRight icon from day selection rows', () => {
            const state = createMockHomeState();
            render(<HomeWeekDayList state={state} />);

            const row0 = screen.getByTestId('home-day-row-0');
            expect(row0).toBeTruthy();
            expect(row0.textContent).toContain('Pecho');

            // No ChevronRight icon rendered in the row
            const svgs = row0.querySelectorAll('svg');
            // Day 0 is marked done, so only the Check icon SVG should be present
            expect(svgs.length).toBe(1);

            // Day 1 has no check icon and no chevron
            const row1 = screen.getByTestId('home-day-row-1');
            const svgsRow1 = row1.querySelectorAll('svg');
            expect(svgsRow1.length).toBe(0);

            // Clicking row selects the day
            fireEvent.click(row1);
            expect(state.setSelectedDayIdx).toHaveBeenCalledWith(1);
        });

        it('HomeRecapStrip: includes · separators between last session metrics', () => {
            const meso: any = { id: 10, week: 2, duration: 4, plan: [[null], [null]] };
            const now = Date.now();
            const logs: any[] = [
                {
                    id: 1,
                    dayIdx: 0,
                    name: 'Sesión 1',
                    startTime: now - 3600000,
                    endTime: now,
                    duration: 2400,
                    mesoId: 10,
                    week: 2,
                    skipped: false,
                    exercises: [
                        {
                            id: 'bp_bar',
                            name: 'Press Banca',
                            muscle: 'CHEST',
                            sets: [{ id: 1, weight: '80', reps: '10', completed: true, type: 'regular' }],
                        },
                    ],
                },
            ];

            const { container } = render(
                <HomeRecapStrip
                    logs={logs}
                    meso={meso}
                    plannedDays={2}
                    lang="es"
                    t={TRANSLATIONS.es}
                    unit="kg"
                />,
            );

            expect(screen.getByText('Última sesión')).toBeTruthy();
            // Verify aria-hidden dot separators exist
            const dots = container.querySelectorAll('span[aria-hidden="true"]');
            expect(dots.length).toBeGreaterThanOrEqual(2);
            dots.forEach(d => expect(d.textContent).toBe('·'));
        });
    });

    describe('PART 2: Mesos (HomeMesosView) Placement', () => {
        const createMockMesosState = (overrides?: Partial<any>): any => ({
            safeProgram: [
                {
                    dayName: { es: 'Día 1: Torso', en: 'Day 1: Torso' },
                    slots: [
                        { id: 's1', muscle: 'CHEST', exerciseId: 'bp_bar', setTarget: 4, reps: '8-10' },
                    ],
                },
                {
                    dayName: { es: 'Día 2: Pierna', en: 'Day 2: Legs' },
                    slots: [
                        { id: 's2', muscle: 'QUADS', exerciseId: 'squat', setTarget: 3 },
                    ],
                },
            ],
            selectedDayIdx: 0,
            setSelectedDayIdx: vi.fn(),
            uniqueDaysDone: new Set([0]),
            nextWorkoutIdx: 1,
            activeMeso: {
                id: 5,
                name: 'Mesociclo Hipertrofia V1',
                week: 3,
                targetWeeks: 6,
                duration: 6,
                isDeload: false,
            },
            setActiveMeso: vi.fn(),
            exercises: [
                { id: 'bp_bar', name: { es: 'Press Banca Barra', en: 'Barbell Bench Press' }, muscle: 'CHEST' },
                { id: 'squat', name: { es: 'Sentadilla Libre', en: 'Back Squat' }, muscle: 'QUADS' },
            ],
            lang: 'es',
            t: TRANSLATIONS.es,
            h: TRANSLATIONS.es.homeView,
            tm: (key: string) => (TRANSLATIONS.es.muscle as any)[key] ?? key,
            kongBlock: null,
            onEditProgram: vi.fn(),
            setShowMesoSettings: vi.fn(),
            setShowCompleteModal: vi.fn(),
            setShowKongHub: vi.fn(),
            startSession: vi.fn(),
            ...overrides,
        });

        it('merges progress bar and week switcher into data-testid="mesos-progress-and-weeks"', () => {
            const state = createMockMesosState();
            render(<HomeMesosView state={state} />);

            const progressAndWeeks = screen.getByTestId('mesos-progress-and-weeks');
            expect(progressAndWeeks).toBeTruthy();
            expect(progressAndWeeks.textContent).toContain('Progreso y semana activa');
            expect(progressAndWeeks.textContent).toContain('50%');

            // Week buttons W1..W6
            for (let i = 1; i <= 6; i++) {
                expect(within(progressAndWeeks).getByText(`W${i}`)).toBeTruthy();
            }
        });

        it('relocates finish cycle button from header to data-testid="mesos-finish-cycle-bar"', () => {
            const state = createMockMesosState();
            render(<HomeMesosView state={state} />);

            // Weekly structure header shows non-destructive day count
            expect(screen.getByText('2 días')).toBeTruthy();

            // Finish cycle bar is rendered at the bottom
            const finishBar = screen.getByTestId('mesos-finish-cycle-bar');
            expect(finishBar).toBeTruthy();
            expect(finishBar.textContent).toContain('¿Quieres dar por finalizado el mesociclo actual?');

            const finishBtn = within(finishBar).getByText(TRANSLATIONS.es.finishCycle);
            fireEvent.click(finishBtn);
            expect(state.setShowCompleteModal).toHaveBeenCalledWith('meso');
        });

        it('renders quick Entrenar action in day header and compact 1-line slot rows in accordion', () => {
            const state = createMockMesosState();
            render(<HomeMesosView state={state} />);

            // Day 0 is expanded by default (index 0)
            const slotRow = screen.getByTestId('mesos-slot-row-0-0');
            expect(slotRow).toBeTruthy();
            expect(slotRow.textContent).toContain('Press Banca Barra');
            expect(slotRow.textContent).toContain('4 × 8-10');

            // Entrenar quick action in day header
            const trainButtons = screen.getAllByText('Entrenar');
            expect(trainButtons.length).toBeGreaterThanOrEqual(1);
            fireEvent.click(trainButtons[0]);
            expect(state.startSession).toHaveBeenCalledWith(0);
        });
    });

    describe('PART 3: Ejercicios (ExercisesView & ExerciseDetailModal) Placement', () => {
        it('ExercisesView: displays result count badge next to title and segmented control for categories', () => {
            render(<ExercisesView onBack={vi.fn()} />);

            // Count badge
            const badge = screen.getByTestId('exercises-count-badge');
            expect(badge).toBeTruthy();
            expect(badge.textContent).toBe('3');

            // Category filter segmented control
            const allBtn = screen.getByText(TRANSLATIONS.es.exercisesView.filterAll);
            const customBtn = screen.getByText(TRANSLATIONS.es.exercisesView.filterCustom);
            const archivedBtn = screen.getByText(TRANSLATIONS.es.exercisesView.filterArchived);

            expect(allBtn).toBeTruthy();
            expect(customBtn).toBeTruthy();
            expect(archivedBtn).toBeTruthy();
        });

        it('Row: removes inert Lock icon on built-in exercises and keeps delete on custom', () => {
            render(<ExercisesView onBack={vi.fn()} />);

            // Built-in exercise: "Press Banca Barra"
            const builtInRow = screen.getByText('Press Banca Barra').closest('.p-3') || screen.getByText('Press Banca Barra').closest('.rounded-\\[6px\\]');
            expect(builtInRow).toBeTruthy();
            // Should NOT have a Lock icon or title="Catálogo oficial"
            expect(builtInRow?.querySelector('[title="Catálogo oficial"]')).toBeNull();

            // Custom exercise: "Press Inclinado Custom"
            const customRow = screen.getByText('Press Inclinado Custom').closest('.p-3') || screen.getByText('Press Inclinado Custom').closest('.rounded-\\[6px\\]');
            expect(customRow).toBeTruthy();
            // Should have delete button
            expect(customRow?.querySelector(`[aria-label="${TRANSLATIONS.es.exercisesView.deleteEx}"]`)).toBeTruthy();
        });

        it('ExerciseDetailModal: removes duplicate MuscleTag and only renders youtube fallback bar when no videoId', () => {
            const onClose = vi.fn();

            // Case A: Custom exercise without videoId
            const customEx: ExerciseDef = {
                id: 'custom_1',
                name: 'Press Inclinado Custom',
                muscle: 'CHEST',
                isCustom: true,
            };

            const { unmount } = render(<ExerciseDetailModal exercise={customEx} onClose={onClose} />);

            // Fallback bar IS rendered
            expect(screen.getByTestId('youtube-search-fallback-bar')).toBeTruthy();
            expect(screen.getByText(TRANSLATIONS.es.copy.exerciseDetailModal.searchTutorialOnline)).toBeTruthy();

            unmount();

            // Case B: Exercise with videoId
            const videoEx: ExerciseDef = {
                id: 'bp_bar',
                name: { es: 'Press de Banca', en: 'Bench Press' },
                muscle: 'CHEST',
                videoId: 'dQw4w9WgXcQ',
            };

            render(<ExerciseDetailModal exercise={videoEx} onClose={onClose} />);

            // Fallback bar is NOT rendered
            expect(screen.queryByTestId('youtube-search-fallback-bar')).toBeNull();
        });
    });
});
