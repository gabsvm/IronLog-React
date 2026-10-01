import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { NavBtn } from '../../components/layout/Layout';
import { SetRow } from '../../components/workout/SetRow';
import { WorkoutSet } from '../../types';

describe('A2: minimum text-size floor (11px)', () => {
    // jsdom cannot compute Tailwind styles, so the real pixel value of the
    // shared `text-[11px]` utility is proven in tests/e2e/cssFoundations.spec.ts
    // (computed font-size of the rendered nav label). This test guards the
    // other half of the contract: every small-text surface must keep using
    // that same utility instead of drifting back to 9-10px classes.
    const fontSizeUtility = (className: string): string | undefined =>
        className.split(/\s+/).find(c => /^text-\[?\d+px\]?$/.test(c) || /^text-(xs|sm|base|lg)/.test(c));

    it('keeps the inactive NavBtn label and the SetRow prescription hint on the same 11px utility', () => {
        const { unmount } = render(
            <NavBtn
                id="history"
                label="HISTORIAL"
                icon="Clock"
                isActive={false}
                onSelect={vi.fn()}
            />
        );
        const navLabel = screen.getByText('HISTORIAL');
        expect(fontSizeUtility(navLabel.className)).toBe('text-[11px]');
        unmount();

        const mockSet: WorkoutSet = {
            id: 101,
            weight: 80,
            reps: 10,
            rpe: 8,
            completed: false,
            type: 'regular',
            prescribedReps: 12,
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
        expect(fontSizeUtility(hint.className)).toBe('text-[11px]');
    });
});
