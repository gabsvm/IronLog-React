import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TemplateSelector, getTemplateSchool, SCHOOLS } from '../../views/home/TemplateSelector';
import { INITIAL_TEMPLATES } from '../../data/defaultTemplates';
import { TRANSLATIONS } from '../../constants';

describe('TemplateSelector School Grouping & Filtering', () => {
    it('classifies templates into expected schools', () => {
        const dsTpl = INITIAL_TEMPLATES.find((t) => t.id === 'david_shaughnessy_silverback_3d');
        expect(dsTpl).toBeDefined();
        expect(getTemplateSchool(dsTpl!)).toBe('DS');

        const rpTpl = INITIAL_TEMPLATES.find((t) => t.id === 'rp_fb_3x');
        expect(rpTpl).toBeDefined();
        expect(getTemplateSchool(rpTpl!)).toBe('RP');

        const nhTpl = INITIAL_TEMPLATES.find((t) => t.id === 'toji_fushiguro');
        expect(nhTpl).toBeDefined();
        expect(getTemplateSchool(nhTpl!)).toBe('NH');

        const pcTpl = INITIAL_TEMPLATES.find((t) => t.id === 'ji3');
        expect(pcTpl).toBeDefined();
        expect(getTemplateSchool(pcTpl!)).toBe('PC');

        const calTpl = INITIAL_TEMPLATES.find((t) => t.id === 'cal_beginner');
        expect(calTpl).toBeDefined();
        expect(getTemplateSchool(calTpl!)).toBe('CALISTHENICS');
    });

    it('renders all school chips in the UI', () => {
        render(
            <TemplateSelector
                onClose={vi.fn()}
                onSelectTemplate={vi.fn()}
                onCreateCustom={vi.fn()}
                templates={INITIAL_TEMPLATES}
                t={TRANSLATIONS.es}
                lang="es"
                inline
            />
        );

        // School chips check
        expect(screen.getByRole('button', { name: 'TODAS' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'RP · DR. MIKE' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'NATURAL HYPERTROPHY' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'DAVID SHAUGHNESSY' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'PAUL CARTER' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'CALISTENIA' })).toBeTruthy();
    });

    it('filters directly by David Shaughnessy school when clicked', () => {
        render(
            <TemplateSelector
                onClose={vi.fn()}
                onSelectTemplate={vi.fn()}
                onCreateCustom={vi.fn()}
                templates={INITIAL_TEMPLATES}
                t={TRANSLATIONS.es}
                lang="es"
                inline
            />
        );

        const dsChip = screen.getByRole('button', { name: 'DAVID SHAUGHNESSY' });
        fireEvent.click(dsChip);

        // Should display the David Shaughnessy banner and routine
        expect(screen.getByText(/David Shaughnessy y Tristan Jacobs/i)).toBeTruthy();
        expect(screen.getByText(/Silverback/i)).toBeTruthy();
    });
});
