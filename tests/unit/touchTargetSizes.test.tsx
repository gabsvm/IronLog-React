import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { SetRow } from '../../components/workout/SetRow';
import { WorkoutSet } from '../../types';

describe('A1: Touch Target Sizes (>= 44px effective touch areas)', () => {
    const mockSet: WorkoutSet = {
        id: 101,
        weight: 80,
        reps: 10,
        rpe: 8,
        completed: false,
        type: 'regular'
    };

    it('ensures set check button has >= 44px effective hit area via pseudo-element', () => {
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

        const checkBtn = screen.getByRole('button', { name: /completar serie/i });
        expect(checkBtn.className).toContain('after:absolute');
        expect(checkBtn.className).toContain('after:-inset-[5px]');
    });

    it('ensures set type badge has >= 44px effective hit area via pseudo-element', () => {
        render(
            <SetRow
                set={mockSet}
                setIndex={0}
                exInstanceId={1}
                onUpdate={vi.fn()}
                onToggleComplete={vi.fn()}
                onChangeType={vi.fn()}
                lang="es"
            />
        );

        // When type change is enabled, badge is a button
        const badgeBtn = screen.getByText('1').closest('button');
        expect(badgeBtn).toBeTruthy();
        expect(badgeBtn?.className).toContain('after:absolute');
        expect(badgeBtn?.className).toContain('after:-inset-2');
    });

    it('ensures isometric reset button has >= 44px effective hit area', () => {
        const isometricSet: WorkoutSet = {
            id: 202,
            weight: 0,
            reps: 0,
            rpe: 0,
            duration: 15,
            completed: false,
            type: 'regular'
        };

        render(
            <SetRow
                set={isometricSet}
                exInstanceId={1}
                onUpdate={vi.fn()}
                onToggleComplete={vi.fn()}
                onChangeType={vi.fn()}
                lang="es"
                isIsometric={true}
            />
        );

        const resetBtn = screen.getByRole('button', { name: /reiniciar timer/i });
        expect(resetBtn.className).toContain('after:absolute');
        expect(resetBtn.className).toContain('after:-inset-x-2');
    });
});
