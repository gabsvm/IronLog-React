import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VolumeAverageCaption } from '../../views/StatsViewImpl';

describe('L4: volume block states the weeks behind the average', () => {
    it('shows "Promedio sobre N semanas · alcance" in Spanish', () => {
        render(<VolumeAverageCaption weeks={3} scope="history" lang="es" />);
        expect(screen.getByText('Promedio sobre 3 semanas · Todo el historial')).toBeTruthy();
    });

    it('shows "Average over N weeks · scope" in English', () => {
        render(<VolumeAverageCaption weeks={6} scope="plan" lang="en" />);
        expect(screen.getByText('Average over 6 weeks · This plan')).toBeTruthy();
    });

    it('shows "Esta semana" instead of "1 semanas"', () => {
        render(<VolumeAverageCaption weeks={1} scope="plan" lang="es" />);
        expect(screen.getByText('Esta semana · Este plan')).toBeTruthy();
    });

    it('shows "This week" instead of "1 weeks"', () => {
        render(<VolumeAverageCaption weeks={1} scope="history" lang="en" />);
        expect(screen.getByText('This week · Full history')).toBeTruthy();
    });
});
