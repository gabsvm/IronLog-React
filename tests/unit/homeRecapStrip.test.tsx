import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HomeRecapStrip } from '../../views/home/HomeRecapStrip';
import { TRANSLATIONS } from '../../constants';

let setSeq = 700;
const set = (weight: string, reps: string): any => ({
    id: setSeq++, weight, reps, completed: true, type: 'regular',
});

const log = (id: number, week: number, dayIdx: number, sets: any[], endTime: number): any => ({
    id, dayIdx, name: `s${id}`, startTime: endTime - 3600, endTime,
    duration: 1800, mesoId: 7, week, skipped: false,
    exercises: [{ id: 'ex_chest', name: 'Press', muscle: 'CHEST', sets }],
});

const meso: any = { id: 7, mesoType: 'hyp_1', week: 2, duration: 5, plan: [[null], [null], [null]] };

const renderStrip = (logs: any[], lang: 'es' | 'en' = 'es') =>
    render(
        <HomeRecapStrip logs={logs} meso={meso} plannedDays={3} lang={lang} t={TRANSLATIONS[lang]} unit="kg" />,
    );

describe('Q16: HomeRecapStrip', () => {
    it('shows week progress, streak and the last session', () => {
        const week1 = [log(1, 1, 0, [set('50', '10')], 1000), log(2, 1, 1, [set('50', '10')], 1100), log(3, 1, 2, [set('50', '10')], 1200)];
        const week2 = [log(4, 2, 0, [set('60', '10'), set('60', '10')], 2000)];
        renderStrip([...week1, ...week2]);

        expect(screen.getByText('Esta semana')).toBeTruthy();
        expect(screen.getByText('1/3')).toBeTruthy();
        // Week 1 complete, week 2 in progress → streak 1.
        expect(screen.getByText('1')).toBeTruthy();
        expect(screen.getByText('semana de racha')).toBeTruthy();

        expect(screen.getByText('Última sesión')).toBeTruthy();
        expect(screen.getByText('1.200 kg')).toBeTruthy();
        expect(screen.getByText(/~30 min/)).toBeTruthy();
        // 60x10 beats the 50x10 best → one PR chip.
        expect(screen.getByText('×1')).toBeTruthy();
    });

    it('shows a friendly empty state without sessions', () => {
        renderStrip([]);
        expect(screen.getByText('0/3')).toBeTruthy();
        expect(screen.getByText('Todavía no hay sesiones. ¡La primera cuenta doble!')).toBeTruthy();
    });

    it('renders in English', () => {
        renderStrip([], 'en');
        expect(screen.getByText('This week')).toBeTruthy();
        expect(screen.getByText('No sessions yet. The first one counts double!')).toBeTruthy();
    });
});
