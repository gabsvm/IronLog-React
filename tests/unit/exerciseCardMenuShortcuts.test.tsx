import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExerciseCardMenu } from '../../components/workout/ExerciseCardMenu';
import { TRANSLATIONS } from '../../constants';
import type { SessionExercise } from '../../types';

const base = {
    ex: { instanceId: 1, id: 'bench', sets: [] } as unknown as SessionExercise,
    isOpen: true, onClose: () => {}, isCardio: false, cardioMode: 'steady' as const,
    hasSuperset: false, isLinking: false, onCardioModeChange: () => {}, onEditNote: () => {}, onInjectWarmup: () => {}, onEditRest: () => {},
    onSupersetAction: () => {}, onReplace: () => {}, onRequestDelete: () => {},
    t: TRANSLATIONS.es, lang: 'es' as const,
};

describe('ExerciseCardMenu set shortcuts', () => {
    it('shows fill/copy actions only when provided and wires them', () => {
        const fill = vi.fn();
        const copy = vi.fn();
        const { rerender } = render(<ExerciseCardMenu {...base} />);
        expect(screen.queryByText('Rellenar con lo anterior')).toBeNull();
        expect(screen.queryByText('Copiar último set al resto')).toBeNull();

        rerender(<ExerciseCardMenu {...base} onFillFromPrevious={fill} onCopyToFollowing={copy} />);
        fireEvent.click(screen.getByText('Rellenar con lo anterior'));
        fireEvent.click(screen.getByText('Copiar último set al resto'));
        expect(fill).toHaveBeenCalledTimes(1);
        expect(copy).toHaveBeenCalledTimes(1);
    });
});
