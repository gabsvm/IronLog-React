import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Icon } from '../../components/ui/Icon';
import { SetRow } from '../../components/workout/SetRow';
import { NavBtn } from '../../components/layout/Layout';
import { WorkoutSet } from '../../types';

describe('A3: accessible names and semantics', () => {
    describe('Icon component aria-hidden semantics', () => {
        it('renders decorative icons with aria-hidden="true" by default', () => {
            const { container } = render(<Icon name="Check" />);
            const svg = container.querySelector('svg');
            expect(svg).toBeTruthy();
            expect(svg?.getAttribute('aria-hidden')).toBe('true');
        });

        it('does not force aria-hidden="true" when an explicit aria-label is provided', () => {
            const { container } = render(<Icon name="Check" aria-label="Confirm checkmark" />);
            const svg = container.querySelector('svg');
            expect(svg).toBeTruthy();
            expect(svg?.getAttribute('aria-hidden')).toBeNull();
            expect(svg?.getAttribute('aria-label')).toBe('Confirm checkmark');
        });
    });

    describe('SetRow accessible inputs and controls', () => {
        const mockSet: WorkoutSet = {
            id: 101,
            type: 'regular',
            weight: '80',
            reps: '10',
            completed: false,
        };

        it('provides accessible labels for weight, reps, RIR and type badge in Spanish', () => {
            render(
                <SetRow
                    set={mockSet}
                    exInstanceId={1}
                    onUpdate={vi.fn()}
                    onToggleComplete={vi.fn()}
                    onChangeType={vi.fn()}
                    lang="es"
                    setIndex={0}
                    showRIR={true}
                />
            );

            expect(screen.getByLabelText('Peso')).toBeInTheDocument();
            expect(screen.getByLabelText('Repeticiones')).toBeInTheDocument();
            expect(screen.getByLabelText('RIR')).toBeInTheDocument();
            expect(screen.getByLabelText('Serie 1, cambiar tipo')).toBeInTheDocument();
        });

        it('uses constant label and aria-pressed for complete set toggle button', () => {
            const { rerender } = render(
                <SetRow
                    set={mockSet}
                    exInstanceId={1}
                    onUpdate={vi.fn()}
                    onToggleComplete={vi.fn()}
                    onChangeType={vi.fn()}
                    lang="es"
                    setIndex={0}
                />
            );

            const incompleteBtn = screen.getByRole('button', { name: 'Completar serie' });
            expect(incompleteBtn).toBeInTheDocument();
            expect(incompleteBtn).toHaveAttribute('aria-pressed', 'false');

            // When completed, label stays constant and aria-pressed flips to true
            rerender(
                <SetRow
                    set={{ ...mockSet, completed: true }}
                    exInstanceId={1}
                    onUpdate={vi.fn()}
                    onToggleComplete={vi.fn()}
                    onChangeType={vi.fn()}
                    lang="es"
                    setIndex={0}
                />
            );

            const completedBtn = screen.getByRole('button', { name: 'Completar serie' });
            expect(completedBtn).toBeInTheDocument();
            expect(completedBtn).toHaveAttribute('aria-pressed', 'true');
        });
    });

    describe('NavBtn semantic state', () => {
        it('sets aria-current="page" on the active button and omits it on inactive buttons', () => {
            const onSelect = vi.fn();
            const { rerender } = render(
                <NavBtn id="home" label="Inicio" icon="Home" isActive={true} onSelect={onSelect} />
            );

            const activeBtn = screen.getByRole('button', { name: /inicio/i });
            expect(activeBtn).toHaveAttribute('aria-current', 'page');

            rerender(
                <NavBtn id="home" label="Inicio" icon="Home" isActive={false} onSelect={onSelect} />
            );

            const inactiveBtn = screen.getByRole('button', { name: /inicio/i });
            expect(inactiveBtn).not.toHaveAttribute('aria-current');
        });
    });
});
