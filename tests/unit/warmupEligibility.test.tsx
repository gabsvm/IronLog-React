import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TRANSLATIONS } from '../../constants';
import { SortableExerciseCard } from '../../components/workout/SortableExerciseCardImpl';
import { WarmupModal } from '../../components/ui/WarmupModal';
import * as AppContext from '../../context/AppContext';

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

vi.mock('../../utils/audio', () => ({
    triggerHaptic: vi.fn(),
    playTimerFinishSound: vi.fn(),
}));

describe('Task U4: Warmup button eligibility and weight communication', () => {
    vi.spyOn(AppContext, 'useAppPreferences').mockReturnValue({
        lang: 'es',
        reducedEffects: false,
    } as any);

    const baseExercise: any = {
        id: 'ex-1',
        instanceId: 1,
        name: 'Bench Press',
        targetSets: 3,
        sets: [
            { id: 101, setNumber: 1, weight: '', reps: '', completed: false },
            { id: 102, setNumber: 2, weight: '', reps: '', completed: false },
        ],
    };

    const defaultProps: any = {
        index: 0,
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
        openMenuId: null,
        setOpenMenuId: vi.fn(),
        linkingId: null,
        t: TRANSLATIONS.es,
        lang: 'es',
        isLinkingTarget: false,
        config: {},
        stageConfig: {},
        logs: [],
    };

    it('disables warmup button and communicates reason when set 1 has no weight', () => {
        const mockOpenWarmup = vi.fn();
        render(
            <SortableExerciseCard
                {...defaultProps}
                exercise={baseExercise}
                onOpenWarmup={mockOpenWarmup}
            />
        );

        const warmupBtn = screen.getByLabelText(/Calentamiento Inteligente: Ingresa el peso en la serie 1/i);
        expect(warmupBtn).toBeDefined();
        expect((warmupBtn as HTMLButtonElement).disabled).toBe(true);

        fireEvent.click(warmupBtn);
        expect(mockOpenWarmup).not.toHaveBeenCalled();
    });

    it('enables warmup button and opens warmup modal when set 1 has positive weight', () => {
        const mockOpenWarmup = vi.fn();
        const exerciseWithWeight = {
            ...baseExercise,
            sets: [
                { id: 101, setNumber: 1, weight: 100, reps: 8, completed: false },
                { id: 102, setNumber: 2, weight: 100, reps: 8, completed: false },
            ],
        };

        render(
            <SortableExerciseCard
                {...defaultProps}
                exercise={exerciseWithWeight}
                onOpenWarmup={mockOpenWarmup}
            />
        );

        const warmupBtn = screen.getByTitle('Calentamiento Inteligente');
        expect(warmupBtn).toBeDefined();
        expect((warmupBtn as HTMLButtonElement).disabled).toBe(false);

        fireEvent.click(warmupBtn);
        expect(mockOpenWarmup).toHaveBeenCalledWith(1);
    });

    it('renders WarmupModal correctly when valid target weight is provided', () => {
        const mockClose = vi.fn();
        render(
            <WarmupModal
                targetWeight={100}
                exerciseName="Bench Press"
                onClose={mockClose}
            />
        );

        expect(screen.getByText('Bench Press')).toBeDefined();
        expect(screen.getByText('100')).toBeDefined();
        expect(screen.getByText('50')).toBeDefined();
        expect(screen.getByText('75')).toBeDefined();
        expect(screen.getByText('90')).toBeDefined();
        expect(screen.getByText('Ligera')).toBeDefined();
        expect(screen.getByText('Moderada')).toBeDefined();
        expect(screen.getByText('Potenciación')).toBeDefined();
    });

    it('renders WarmupModal with helpful message when target weight is 0', () => {
        const mockClose = vi.fn();
        render(
            <WarmupModal
                targetWeight={0}
                exerciseName="Bench Press"
                onClose={mockClose}
            />
        );

        expect(screen.getByText('Ingresa el peso en la serie 1 para calcular el calentamiento')).toBeDefined();
    });
});
