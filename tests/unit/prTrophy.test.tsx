import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PersonalRecordRow } from '../../views/StatsViewImpl';

describe('K3: personal record rows show a trophy icon, not a literal T', () => {
    it('renders the Trophy svg and no standalone "T" text', () => {
        const { container } = render(
            <PersonalRecordRow
                name="Press de banca"
                muscleLabel="Pecho"
                dateStr="ene 5, 26"
                weight={100}
                reps={5}
                e1rm={116.7}
            />
        );

        expect(container.querySelector('svg')).not.toBeNull();
        expect(screen.queryByText('T', { exact: true })).toBeNull();
        expect(screen.getByText('Press de banca')).toBeTruthy();
        expect(screen.getByText('117kg')).toBeTruthy();
    });
});
