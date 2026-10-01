import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { NavBtn } from '../../components/layout/Layout';
import { SetRow } from '../../components/workout/SetRow';
import { WorkoutSet } from '../../types';

describe('A2: Contrast and Text Sizing', () => {
    it('ensures inactive NavBtn uses text-muted token and minimum 11px font size', () => {
        render(
            <NavBtn
                id="history"
                label="HISTORIAL"
                icon="Clock"
                isActive={false}
                onSelect={vi.fn()}
            />
        );

        const label = screen.getByText('HISTORIAL');
        expect(label.className).toContain('text-muted');
        expect(label.className).toContain('text-[11px]');
        expect(label.className).not.toContain('text-zinc-600');
        expect(label.className).not.toContain('text-[9px]');
    });

    it('ensures prescription hints in SetRow use minimum 11px font size', () => {
        const mockSet: WorkoutSet = {
            id: 101,
            weight: 80,
            reps: 10,
            rpe: 8,
            completed: false,
            type: 'regular',
            prescribedReps: 12
        };

        render(
            <SetRow
                set={mockSet}
                exInstanceId={1}
                onUpdate={vi.fn()}
                onToggleComplete={vi.fn()}
                onChangeType={vi.fn()}
                lang="es"
            />
        );

        const hint = screen.getByText(/OBJ: 12/);
        expect(hint.className).toContain('text-[11px]');
        expect(hint.className).not.toContain('text-[10px]');
    });
});
