import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const { mockState, invalidateChartCacheSpy, selectorCalls } = vi.hoisted(() => ({
    mockState: {
        exercises: [] as any[],
        program: [] as any[],
        personalTemplates: [] as any[],
    },
    invalidateChartCacheSpy: vi.fn(async () => {}),
    selectorCalls: [] as any[],
}));

vi.mock('../../context/AppContext', () => ({
    useApp: () => ({
        exercises: mockState.exercises,
        setExercises: (updater: any) => {
            mockState.exercises = typeof updater === 'function' ? updater(mockState.exercises) : updater;
        },
        lang: 'es',
        program: mockState.program,
        setProgram: vi.fn(),
        personalTemplates: mockState.personalTemplates,
        setPersonalTemplates: vi.fn(),
    }),
}));

vi.mock('../../lib/store', () => ({
    useStore: (selector: any) => selector({ activeMeso: null, setActiveMeso: vi.fn() }),
}));

vi.mock('../../utils/audio', () => ({
    triggerHaptic: vi.fn(),
}));

vi.mock('../../services/statsCache', () => ({
    statsCache: {
        invalidateChartCache: () => {
            invalidateChartCacheSpy();
            return Promise.resolve();
        },
    },
}));

vi.mock('react-virtuoso', () => ({
    Virtuoso: ({ data, itemContent }: any) => (
        <>{(data ?? []).map((item: any, index: number) => itemContent(index, item))}</>
    ),
}));

vi.mock('../../components/ui/ExerciseDetailModal', () => ({
    ExerciseDetailModal: () => null,
}));

vi.mock('../../components/ui/ExerciseSelector', () => ({
    ExerciseSelector: ({ onSelect, onClose, excludeIds }: any) => {
        selectorCalls.push({ excludeIds });
        return (
            <div data-testid="merge-target-selector">
                {mockState.exercises
                    .filter((e: any) => !(excludeIds ?? []).includes(e.id))
                    .map((e: any) => (
                        <button key={e.id} type="button" onClick={() => onSelect(e.id, e)}>
                            pick:{typeof e.name === 'string' ? e.name : e.name.es}
                        </button>
                    ))}
                <button type="button" onClick={onClose}>close-selector</button>
            </div>
        );
    },
}));

vi.mock('../../components/ui/ConfirmModal', () => ({
    ConfirmModal: (props: any) =>
        props.isOpen ? (
            <div data-testid="confirm-modal">
                <p>{props.title}</p>
                <p>{props.description}</p>
                <button type="button" onClick={props.onConfirm}>{props.confirmText}</button>
                <button type="button" onClick={props.onCancel}>cancel-stub</button>
            </div>
        ) : null,
}));

import { ExercisesView } from '../../views/ExercisesView';

const seedLibrary = (merged: boolean) => {
    mockState.exercises = [
        { id: 'bp_bar', name: { en: 'Barbell Bench Press', es: 'Press Banca Barra' }, muscle: 'CHEST' },
        merged
            ? { id: 'custom_1', name: 'Press Banca', muscle: 'CHEST', isCustom: true, mergedInto: 'bp_bar' }
            : { id: 'custom_1', name: 'Press Banca', muscle: 'CHEST', isCustom: true },
        { id: 'ohp', name: { en: 'Overhead Press', es: 'Press Militar' }, muscle: 'SHOULDERS' },
    ];
};

describe('Q14: ExercisesView merge UI', () => {
    beforeEach(() => {
        invalidateChartCacheSpy.mockClear();
        selectorCalls.length = 0;
    });

    it('merges via row button → target selector → confirm, then shows the badge', async () => {
        seedLibrary(false);
        const { rerender } = render(<ExercisesView onBack={() => {}} />);
        expect(screen.getByText('Press Banca')).toBeTruthy();

        fireEvent.click(screen.getByRole('button', {
            name: 'Fusionar con otro ejercicio: Press Banca',
        }));

        // Target selector opens with the source excluded.
        const selector = await screen.findByTestId('merge-target-selector');
        expect(selectorCalls[0]!.excludeIds).toEqual(['custom_1']);
        fireEvent.click(screen.getByRole('button', { name: 'pick:Press Banca Barra' }));

        // Confirm modal explains the merge without rewriting logs.
        const modal = await screen.findByTestId('confirm-modal');
        expect(modal.textContent).toContain('¿Fusionar ejercicios?');
        expect(modal.textContent).toContain('Press Banca');
        expect(modal.textContent).toContain('Press Banca Barra');
        fireEvent.click(screen.getByRole('button', { name: 'Fusionar' }));

        rerender(<ExercisesView onBack={() => {}} />);
        expect(mockState.exercises.find((e: any) => e.id === 'custom_1')!.mergedInto).toBe('bp_bar');
        expect(screen.getByText('Fusionado')).toBeTruthy();
        expect(invalidateChartCacheSpy).toHaveBeenCalledTimes(1);
    });

    it('unmerges from the row and drops the badge', async () => {
        seedLibrary(true);
        const { rerender } = render(<ExercisesView onBack={() => {}} />);
        expect(screen.getByText('Fusionado')).toBeTruthy();

        fireEvent.click(screen.getByRole('button', { name: 'Deshacer fusión: Press Banca' }));
        rerender(<ExercisesView onBack={() => {}} />);

        expect(mockState.exercises.find((e: any) => e.id === 'custom_1')!).not.toHaveProperty('mergedInto');
        expect(screen.queryByText('Fusionado')).toBeNull();
        expect(invalidateChartCacheSpy).toHaveBeenCalledTimes(1);
    });

    it('suggests same-name duplicates with a one-tap merge', async () => {
        mockState.exercises = [
            { id: 'a1', name: 'Press Banca', muscle: 'CHEST', isCustom: true },
            { id: 'a2', name: 'PRESS BANCA', muscle: 'CHEST', isCustom: true },
        ];
        render(<ExercisesView onBack={() => {}} />);

        expect(screen.getByText('Posibles duplicados')).toBeTruthy();
        expect(screen.getByText('Mismo nombre')).toBeTruthy();

        // One tap skips the target selector and opens the confirm modal.
        const mergeButtons = screen.getAllByRole('button', { name: /Fusionar: Press Banca/i });
        fireEvent.click(mergeButtons[0]!);
        expect(await screen.findByTestId('confirm-modal')).toBeTruthy();
        expect(screen.queryByTestId('merge-target-selector')).toBeNull();
    });

    it('searches across both languages and aliases, accent-insensitive', () => {
        seedLibrary(false);
        render(<ExercisesView onBack={() => {}} />);

        const search = screen.getByPlaceholderText('Buscar ejercicio...');
        fireEvent.change(search, { target: { value: 'bench' } });
        // English name matches bp_bar; the Spanish-only duplicate is filtered out.
        expect(screen.getByText('Press Banca Barra')).toBeTruthy();
        expect(screen.queryByText('Press Militar')).toBeNull();

        // Curated alias: "press banca" matches bp_bar even though neither of
        // its primary names contains that exact phrase.
        fireEvent.change(search, { target: { value: 'press banca' } });
        expect(screen.getByText('Press Banca Barra')).toBeTruthy();
        expect(screen.getByText('Press Banca')).toBeTruthy();
    });
});
