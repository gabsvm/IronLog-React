import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

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

import { SortableExerciseCard as SortableExerciseCardImpl } from '../../components/workout/SortableExerciseCardImpl';
import { TRANSLATIONS } from '../../constants';

const noop = () => {};

const baseProps = (overrides: Record<string, any> = {}) => ({
    exercise: {
        id: 'bp', instanceId: 1, name: 'Press Banca', muscle: 'CHEST',
        targetReps: '8-12',
        sets: [
            { id: 11, weight: '', reps: '', completed: false, type: 'regular' },
            { id: 12, weight: '', reps: '', completed: false, type: 'regular' },
        ],
    },
    onSetUpdate: noop,
    onSetComplete: noop,
    onSetTypeChange: noop,
    onAddSet: noop,
    onDeleteSet: noop,
    onLink: noop,
    onReplace: noop,
    onEditMuscle: noop,
    onUpdateSession: noop,
    openMenuId: null,
    setOpenMenuId: noop,
    linkingId: null,
    t: TRANSLATIONS.es,
    lang: 'es',
    isLinkingTarget: false,
    config: { weightUnit: 'kg', rpTargetRIR: 2 },
    stageConfig: null,
    dragEnabled: false,
    logs: [],
    ...overrides,
}) as any;

const pastLog = (sets: any[]) => ({
    id: 9, dayIdx: 0, name: 'past', startTime: 1000, endTime: 2000, duration: 60,
    mesoId: 1, week: 1, skipped: false,
    exercises: [{ id: 'bp', name: 'Press Banca', muscle: 'CHEST', sets }],
});

const pastSet = (id: number, weight: string, reps: string, rpe?: string) => ({
    id, weight, reps, rpe: rpe ?? '', completed: true, type: 'regular',
});

describe('Q15: progression hero line on the workout card', () => {
    it('shows the up reason after topping the range at target RIR', () => {
        render(
            <SortableExerciseCardImpl
                {...baseProps({
                    logs: [pastLog([pastSet(1, '60', '12', '2'), pastSet(2, '60', '12', '2')])],
                })}
            />,
        );
        expect(screen.getByText('Llegaste a 12 reps con RIR 2: +2,5 kg')).toBeTruthy();
    });

    it('shows the hold reason mid-range without logged RIR', () => {
        render(
            <SortableExerciseCardImpl
                {...baseProps({
                    logs: [pastLog([pastSet(1, '60', '10'), pastSet(2, '60', '9')])],
                })}
            />,
        );
        expect(screen.getByText('Misma carga, apuntá a 11 reps')).toBeTruthy();
    });

    it('shows the down reason below the floor of the range', () => {
        render(
            <SortableExerciseCardImpl
                {...baseProps({
                    logs: [pastLog([pastSet(1, '60', '6', '2'), pastSet(2, '60', '6', '3')])],
                })}
            />,
        );
        expect(screen.getByText('Bajá a 57 kg (6 reps con RIR 2)')).toBeTruthy();
    });

    it('shows no progression line when the last session is incomplete (legacy null)', () => {
        render(
            <SortableExerciseCardImpl
                {...baseProps({
                    logs: [pastLog([
                        { ...pastSet(1, '60', '12', '2'), completed: false },
                        pastSet(2, '60', '12', '2'),
                    ])],
                })}
            />,
        );
        expect(screen.queryByText(/Llegaste|Misma carga|Bajá/)).toBeNull();
    });
});
