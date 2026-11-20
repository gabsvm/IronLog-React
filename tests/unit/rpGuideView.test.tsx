import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GuidelinesModal } from '../../views/home/GuidelinesModal';
import type { MesoCycle } from '../../types';

describe('GuidelinesModal & Native RpGuideView', () => {
    const activeMeso: MesoCycle = {
        id: 101,
        name: 'RP MPT Full Body (3 Days)',
        mesoType: 'rp_fb_3x',
        week: 2,
        targetWeeks: 5,
        duration: 5,
        isDeload: false,
        plan: [],
    };

    it('renders native interactive RP Periodization guide without screenshot images in Spanish', () => {
        const onClose = vi.fn();
        render(
            <GuidelinesModal
                isOpen={true}
                onClose={onClose}
                guideId="rp_mpt"
                lang="es"
                activeMeso={activeMeso}
            />,
        );

        expect(screen.getByText('Guía del Programa')).toBeTruthy();
        expect(screen.getByText('W2/5')).toBeTruthy();
        expect(screen.queryByLabelText('Volver')).toBeNull();
        expect(screen.queryByRole('img')).toBeNull();
        expect(screen.getByText('Hipertrofia Básica 1')).toBeTruthy();
        expect(screen.getByText('Hipertrofia Básica 2')).toBeTruthy();
        expect(screen.getByText('Entrenamiento Metabólico')).toBeTruthy();
        expect(screen.getByText('Resensibilización')).toBeTruthy();

        // Switch across native tabs
        fireEvent.click(screen.getByTestId('rp-guide-tab-principles'));
        expect(screen.getByText('Especificidad')).toBeTruthy();
        expect(screen.getByText('01')).toBeTruthy();
        fireEvent.click(screen.getByTestId('rp-age-beginner'));
        expect(screen.getByText(/Checklist de carga del principiante/i)).toBeTruthy();
        fireEvent.click(screen.getByTestId('rp-age-advanced'));
        expect(screen.getByText(/sesgo MEV-MRV/i)).toBeTruthy();

        fireEvent.click(screen.getByTestId('rp-guide-tab-effort'));
        expect(screen.getByText('3/fail')).toBeTruthy();
        expect(screen.getByText('Calibración del 10RM y Ajuste de Carga')).toBeTruthy();

        fireEvent.click(screen.getByTestId('rp-guide-tab-autoreg'));
        expect(screen.getByText('-2')).toBeTruthy();
        expect(screen.getByText('+2')).toBeTruthy();

        // Exercise MEV/RSM Estimator
        fireEvent.click(screen.getByTestId('mev-mmc-0'));
        fireEvent.click(screen.getByTestId('mev-pump-0'));
        fireEvent.click(screen.getByTestId('mev-disruption-0'));
        expect(screen.getByTestId('mev-result').textContent).toMatch(/Muy por debajo de tu MEV/i);

        // Exercise Set Progression Matrix
        fireEvent.click(screen.getByTestId('prog-perf-3'));
        expect(screen.getByTestId('prog-result').textContent).toMatch(/Sesión de recuperación/i);

        // Exercise SFR Calculator
        const initialSfrText = screen.getByTestId('sfr-result').textContent || '';
        fireEvent.click(screen.getByTestId('mev-mmc-3'));
        fireEvent.click(screen.getByTestId('mev-pump-3'));
        fireEvent.click(screen.getByTestId('sfr-joint-0'));
        fireEvent.click(screen.getByTestId('sfr-exertion-0'));
        fireEvent.click(screen.getByTestId('sfr-unusedPerformance-0'));
        const updatedSfrText = screen.getByTestId('sfr-result').textContent || '';
        expect(updatedSfrText).not.toBe(initialSfrText);
        expect(updatedSfrText).toMatch(/SFR Máximo/i);

        fireEvent.click(screen.getByTestId('rp-guide-tab-execution'));
        expect(screen.getByText('Semana de Descarga (Deload)')).toBeTruthy();
        expect(screen.getByText(/Checklist de 4 Puntos Antes de la Próxima Serie/i)).toBeTruthy();
        expect(screen.getByText(/Myoreps/i)).toBeTruthy();
        expect(screen.getByText(/Drop Sets/i)).toBeTruthy();
        expect(screen.getByText(/Oclusión/i)).toBeTruthy();

        fireEvent.click(screen.getByTestId('rp-guide-tab-nutrition'));
        expect(screen.getByText('Día Liviano')).toBeTruthy();
        expect(screen.getByText('Día Pesado')).toBeTruthy();

        fireEvent.click(screen.getByTestId('rp-guide-tab-special'));
        expect(screen.getByText(/Diagnóstico en 9 Puntos Cuando Falta Progreso/i)).toBeTruthy();
        expect(screen.getByText(/Entrenamiento de Muy Bajo Riesgo de Lesión/i)).toBeTruthy();
        expect(screen.getByText(/Regreso Gradual Post-Lesión en 6 Fases/i)).toBeTruthy();

        // Search and expand FAQ + Glossary filtering
        fireEvent.click(screen.getByTestId('rp-guide-tab-faq'));
        const searchInput = screen.getByLabelText('Buscar en preguntas frecuentes');
        fireEvent.change(searchInput, { target: { value: 'cinturón' } });
        const gearQuestion = screen.getByText(/cinturón, rodilleras o muñequeras/i);
        fireEvent.click(gearQuestion);
        expect(screen.getByText(/315 lb/i)).toBeTruthy();

        fireEvent.change(searchInput, { target: { value: 'SFR' } });
        expect(screen.getByTestId('rp-glossary-sfr')).toBeTruthy();

        // Close handler works
        fireEvent.click(screen.getByLabelText('Cerrar guía'));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('renders full English copy when lang="en"', () => {
        render(
            <GuidelinesModal
                isOpen={true}
                onClose={vi.fn()}
                guideId="rp_mpt"
                lang="en"
                activeMeso={activeMeso}
            />,
        );

        expect(screen.getByText('Program Guide')).toBeTruthy();
        expect(screen.queryByLabelText('Back')).toBeNull();
        expect(screen.getByText('Basic Hypertrophy 1')).toBeTruthy();
        fireEvent.click(screen.getByTestId('rp-guide-tab-execution'));
        expect(screen.getByText('Deload Week Protocol')).toBeTruthy();
    });

    it('keeps legacy zoomable image viewer for image-based templates (e.g. Tokita)', () => {
        render(
            <GuidelinesModal
                isOpen={true}
                onClose={vi.fn()}
                images={['/assets/templates/tokita/Tokita.png']}
            />,
        );

        const img = screen.getByAltText('Page 1') as HTMLImageElement;
        expect(img.getAttribute('src')).toBe('/assets/templates/tokita/Tokita.png');
    });
});
