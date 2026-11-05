import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { WorkoutMain } from '../../views/workout/WorkoutMain';
import { SortableExerciseCard } from '../../components/workout/SortableExerciseCardImpl';
import { ExerciseCardSets } from '../../components/workout/ExerciseCardSets';
import { SetRow } from '../../components/workout/SetRow';
import { TRANSLATIONS } from '../../constants';
import type { SessionExercise, WorkoutSet } from '../../types';

// Mock dnd-kit
vi.mock('@dnd-kit/sortable', () => ({
    useSortable: () => ({
        attributes: {},
        listeners: {},
        setNodeRef: vi.fn(),
        transform: null,
        transition: null,
        isDragging: false,
    }),
}));

// Mock timer state
let mockTimerState = { active: false, timeLeft: 0 };
vi.mock('../../context/TimerContext', () => ({
    useTimerState: () => mockTimerState,
    useTimerActions: () => ({ setRestTimer: vi.fn() }),
}));

// Mock store
let mockActiveMeso: any = {
    title: 'Mesociclo Hipertrofia',
    targetWeeks: 6,
    duration: 6,
};
vi.mock('../../lib/store', () => ({
    useStore: (selector: any) => selector({ activeMeso: mockActiveMeso }),
}));

// Mock audio
vi.mock('../../utils/audio', () => ({
    triggerHaptic: vi.fn(),
    playTimerFinishSound: vi.fn(),
}));

describe('Workout Header, Card Placement, and Touch Target Redundancy Fixes', () => {
    beforeEach(() => {
        mockTimerState = { active: false, timeLeft: 0 };
        mockActiveMeso = {
            title: 'Mesociclo Hipertrofia',
            targetWeeks: 6,
            duration: 6,
        };
    });

    describe('1. WorkoutMain (2-row header, timer redundancy, bottom scroll clearance)', () => {
        const createMockWorkoutState = (overrides?: Partial<any>): any => ({
            onBack: vi.fn(),
            onOpenReorder: vi.fn(),
            sessionExercises: [
                {
                    id: 'bench-press',
                    instanceId: 101,
                    name: 'Press de Banca',
                    muscle: 'CHEST',
                    sets: [{ id: 1, weight: '80', reps: '10', type: 'regular', completed: false }],
                },
                {
                    id: 'incline-db',
                    instanceId: 102,
                    name: 'Press Inclinado',
                    muscle: 'CHEST',
                    sets: [{ id: 2, weight: '30', reps: '12', type: 'regular', completed: false }],
                },
            ],
            openMenuId: null,
            setOpenMenuId: vi.fn(),
            setShowFinishModal: vi.fn(),
            setReplacingExId: vi.fn(),
            setAddingExercise: vi.fn(),
            linkingId: null,
            setLinkingId: vi.fn(),
            setEditingMuscleId: vi.fn(),
            setWarmupExId: vi.fn(),
            setDetailExercise: vi.fn(),
            handleSetUpdate: vi.fn(),
            handleAddSet: vi.fn(),
            handleDeleteSet: vi.fn(),
            updateSession: vi.fn(),
            exercises: [],
            logs: [],
            lang: 'es' as const,
            config: {},
            activeSession: {
                id: 'sess_1',
                name: '2 · Dia 1 - Pecho y Triceps',
                week: 2,
                dayIdx: 0,
                startTime: Date.now() - 120000,
                exercises: [],
            },
            t: TRANSLATIONS.es,
            w: TRANSLATIONS.es.workoutImpl,
            stageConfig: {},
            isCalisthenicsSession: false,
            supersetColorIndexes: {},
            handleSetTypeChange: vi.fn(),
            sortableItems: ['101', '102'],
            activeExerciseId: null,
            handleToggleExpand: vi.fn(),
            handleSetComplete: vi.fn(),
            handleReorder: vi.fn(),
            ctrl: { setShowDiscardConfirm: vi.fn() },
            ...overrides,
        });

        it('does not render duplicate rest timer badge in header when restTimer is active', () => {
            mockTimerState = { active: true, timeLeft: 75 }; // 1:15 remaining
            const state = createMockWorkoutState();
            render(<WorkoutMain state={state} />);

            // Finish button is present in row 1
            expect(screen.getByTestId('workout-finish-btn')).toBeInTheDocument();

            // The header should NOT render "1:15" (no duplicate rest timer badge in header)
            expect(screen.queryByText('1:15')).not.toBeInTheDocument();

            // Exercise list container gets extra bottom padding (pb-36) when rest timer is active
            const exerciseList = screen.getByTestId('workout-main');
            expect(exerciseList.className).toContain('pb-36');
            expect(exerciseList.className).not.toContain('pb-10');
        });

        it('uses pb-10 clearance on exercise list when restTimer is inactive', () => {
            mockTimerState = { active: false, timeLeft: 0 };
            const state = createMockWorkoutState();
            render(<WorkoutMain state={state} />);

            const exerciseList = screen.getByTestId('workout-main');
            expect(exerciseList.className).toContain('pb-10');
            expect(exerciseList.className).not.toContain('pb-36');
        });

        it('renders dayName and mesoTitle cleanly in row 2 without stray bullet before timer', () => {
            const state = createMockWorkoutState();
            const { container } = render(<WorkoutMain state={state} />);

            // Row 2 contains dayName: "Dia 1 - Pecho y Triceps"
            expect(screen.getByText('Dia 1 - Pecho y Triceps')).toBeInTheDocument();
            expect(screen.getByText('· Mesociclo Hipertrofia')).toBeInTheDocument();

            // Row 2 right container should contain the WorkoutTimer without a leading '·' character
            const row2 = container.querySelector('.flex.items-center.justify-between.gap-2\\.5.px-4.pb-2\\.5.pt-0\\.5');
            expect(row2).toBeInTheDocument();
            const timerContainer = row2?.querySelector('.shrink-0.flex.items-center');
            expect(timerContainer).toBeInTheDocument();
            // Verify there is no stray text node with "·" inside row 2 right container
            expect(timerContainer?.textContent?.startsWith('·')).toBe(false);
        });

        it('removes duplicate Finish button from the session options menu', () => {
            const state = createMockWorkoutState();
            render(<WorkoutMain state={state} />);

            // Open session options menu
            const moreBtn = screen.getByLabelText('Opciones de sesión');
            fireEvent.click(moreBtn);

            // Reorder Exercises and Discard Session should be in the menu
            expect(screen.getByText(TRANSLATIONS.es.reorderExercises)).toBeInTheDocument();
            expect(screen.getByText(TRANSLATIONS.es.discardSession)).toBeInTheDocument();

            // Duplicate finish in menu ("Terminar entreno" / "Terminar") should NOT be present in menu
            const menu = screen.getByText(TRANSLATIONS.es.reorderExercises).closest('.absolute') as HTMLElement | null;
            expect(menu).toBeInTheDocument();
            expect(within(menu!).getByText(TRANSLATIONS.es.addExercise)).toBeInTheDocument();
            const menuButtons = menu?.querySelectorAll('button') || [];
            const menuTexts = Array.from(menuButtons).map(b => b.textContent?.trim());
            expect(menuTexts).not.toContain('Terminar entreno');
            expect(menuTexts).not.toContain(TRANSLATIONS.es.finishWorkout);
        });
    });

    describe('2. ExerciseCardExpanded (compact header, no redundant fallback, aligned note)', () => {
        const createCardProps = (exerciseOverrides?: Record<string, any>, cardOverrides?: Record<string, any>): any => ({
            exercise: {
                id: 'bench-press',
                instanceId: 201,
                name: 'Press de Banca Plano',
                muscle: 'CHEST',
                slotLabel: 'CHEST',
                sets: [
                    { id: 1, type: 'regular', weight: '80', reps: '10', rpe: '8', completed: false } as WorkoutSet,
                ],
                ...exerciseOverrides,
            },
            onSetUpdate: vi.fn(),
            onSetComplete: vi.fn(),
            onSetTypeChange: vi.fn(),
            onAddSet: vi.fn(),
            onDeleteSet: vi.fn(),
            onOpenDetail: vi.fn(),
            onLink: vi.fn(),
            onReplace: vi.fn(),
            onEditMuscle: vi.fn(),
            onUpdateSession: vi.fn(),
            onOpenWarmup: vi.fn(),
            openMenuId: null,
            setOpenMenuId: vi.fn(),
            linkingId: null,
            t: TRANSLATIONS.es,
            lang: 'es' as const,
            isLinkingTarget: false,
            config: { showRIR: true },
            stageConfig: {},
            dragEnabled: true,
            logs: [],
            ...cardOverrides,
        });

        it('does NOT render redundant "Estándar" / "Standard" fallback subtitle on standard exercises', () => {
            const props = createCardProps({
                equipment: undefined,
                skillFamily: undefined,
                isBodyweight: false,
            });
            render(<SortableExerciseCard {...props} />);

            expect(screen.getByText('Press de Banca Plano')).toBeInTheDocument();
            expect(screen.queryByText('Estándar')).not.toBeInTheDocument();
            expect(screen.queryByText('Standard')).not.toBeInTheDocument();
        });

        it('renders meaningful subtitle when equipment or bodyweight is specified', () => {
            const propsWithEquip = createCardProps({
                equipment: 'Mancuerna',
            });
            const { unmount } = render(<SortableExerciseCard {...propsWithEquip} />);
            expect(screen.getByText('Mancuerna')).toBeInTheDocument();
            unmount();

            const propsBW = createCardProps({
                isBodyweight: true,
            });
            render(<SortableExerciseCard {...propsBW} />);
            expect(screen.getByText('Peso corporal')).toBeInTheDocument();
        });

        it('places action icons (History + MoreVertical) in the top header row above the full-width title', () => {
            const props = createCardProps();
            const { container } = render(<SortableExerciseCard {...props} />);

            // Top row container
            const topRow = container.querySelector('.flex.items-center.justify-between.gap-2.px-3.pt-2\\.5.pb-1');
            expect(topRow).toBeInTheDocument();

            // Right action group inside top row
            const actionGroup = topRow?.querySelector('.flex.items-center.gap-1.shrink-0.-mr-1');
            expect(actionGroup).toBeInTheDocument();

            // History button and MoreVertical button are inside actionGroup
            const historyBtn = actionGroup?.querySelector('button[aria-label="Detalles"]') || actionGroup?.querySelector('button[aria-label="History"]');
            expect(historyBtn).toBeInTheDocument();

            // Title row is separate below top row
            const titleRow = container.querySelector('.px-3.pb-2.pt-0\\.5');
            expect(titleRow).toBeInTheDocument();
            expect(titleRow?.querySelector('h3')?.textContent).toBe('Press de Banca Plano');
        });

        it('renders heroMetric inside the aligned note container with micro-badge styling', () => {
            const props = createCardProps({
                note: 'RPE 8 objetivo',
            }, {
                logs: [
                    {
                        id: 'log1',
                        date: '2026-10-01',
                        sessionName: 'Prev',
                        exercises: [
                            {
                                id: 'bench-press',
                                name: 'Press de Banca Plano',
                                sets: [
                                    { id: 99, weight: '100', reps: '8', completed: true, type: 'regular' },
                                ],
                            },
                        ],
                    } as any,
                ],
            });
            render(<SortableExerciseCard {...props} />);

            expect(screen.getByText('RPE 8 objetivo')).toBeInTheDocument();
            // Note edit button contains Edit3 icon outside the flex wrap container
            const noteBanner = screen.getByText('RPE 8 objetivo').closest('button');
            expect(noteBanner).toBeInTheDocument();
        });
    });

    describe('3. ExerciseCardSets (centered REPS header without inert (i) badge)', () => {
        it('renders REPS header cleanly without inert (i) circle badge', () => {
            const ex: SessionExercise = {
                id: 'squat',
                instanceId: 301,
                name: 'Sentadilla Trasera',
                muscle: 'QUADS',
                sets: [],
            };

            const { container } = render(
                <ExerciseCardSets
                    ex={ex}
                    regularSets={[]}
                    isCardio={false}
                    isInterval={false}
                    cardioMode="steady"
                    unit="kg"
                    unitLabel="kg"
                    isEMOM={false}
                    isMyorep={false}
                    isCluster={false}
                    isSpecialProtocol={false}
                    activeEmomMinute={0}
                    nextSetIdx={0}
                    setBadgeLabels={[]}
                    onSetUpdate={vi.fn()}
                    onSetComplete={vi.fn()}
                    onSetTypeChange={vi.fn()}
                    config={{ showRIR: true }}
                    stageConfig={{}}
                    t={TRANSLATIONS.es}
                    lang="es"
                />
            );

            // REPS text is present
            const repsHeader = screen.getByText('REPS');
            expect(repsHeader).toBeInTheDocument();

            // The header cell should simply be <div>REPS</div>
            expect(repsHeader.tagName).toBe('DIV');
            expect(repsHeader.textContent).toBe('REPS');

            // No inert 'i' badge inside the table header
            const headerRow = repsHeader.parentElement;
            expect(headerRow?.textContent).not.toContain('i');
            expect(container.querySelector('.rounded-full.border.border-zinc-600')).not.toBeInTheDocument();
        });
    });

    describe('4. SetRow LOG checkbox touch target expansion', () => {
        const mockSet: WorkoutSet = {
            id: 1,
            type: 'regular',
            weight: '80',
            reps: '10',
            rpe: '8',
            completed: false,
        };

        it('SetRow completion checkbox has pseudo-element touch target expansion for standard sets', () => {
            render(
                <SetRow
                    set={mockSet}
                    exInstanceId={101}
                    setIndex={0}
                    onUpdate={vi.fn()}
                    onToggleComplete={vi.fn()}
                    onChangeType={vi.fn()}
                    lang="es"
                />
            );

            const checkBtn = screen.getByRole('button', { pressed: false });
            expect(checkBtn).toBeInTheDocument();
            expect(checkBtn.className).toContain('after:absolute');
            expect(checkBtn.className).toContain('after:-inset-2');
            expect(checkBtn.className).toContain("after:content-['']");
        });

        it('SetRow completion checkbox has pseudo-element touch target expansion for bodyweight sets', () => {
            render(
                <SetRow
                    set={mockSet}
                    exInstanceId={102}
                    setIndex={0}
                    isBodyweight={true}
                    onUpdate={vi.fn()}
                    onToggleComplete={vi.fn()}
                    onChangeType={vi.fn()}
                    lang="es"
                />
            );

            const checkBtn = screen.getByRole('button', { pressed: false });
            expect(checkBtn).toBeInTheDocument();
            expect(checkBtn.className).toContain('after:absolute');
            expect(checkBtn.className).toContain('after:-inset-2');
            expect(checkBtn.className).toContain("after:content-['']");
        });

        it('SetRow completion checkbox has pseudo-element touch target expansion for isometric sets', () => {
            const isoSet: WorkoutSet = {
                ...mockSet,
                duration: 30,
                type: 'regular',
            };

            render(
                <SetRow
                    set={isoSet}
                    exInstanceId={103}
                    setIndex={0}
                    isIsometric={true}
                    isometricTargetSecs={30}
                    onUpdate={vi.fn()}
                    onToggleComplete={vi.fn()}
                    onChangeType={vi.fn()}
                    lang="es"
                />
            );

            const checkBtn = screen.getByRole('button', { pressed: false });
            expect(checkBtn).toBeInTheDocument();
            expect(checkBtn.className).toContain('after:absolute');
            expect(checkBtn.className).toContain('after:-inset-2');
            expect(checkBtn.className).toContain("after:content-['']");
        });
    });
});
