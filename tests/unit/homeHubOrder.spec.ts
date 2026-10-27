import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { HomeWeekDayList } from '../../views/home/HomeWeekDayList';
import { TRANSLATIONS } from '../../constants';

// Task 2 (RP restructure §3.1): Home is the mesocycle hub, in this order:
// header -> week selector -> day rows -> Entrenar -> recap -> free session.
// The repo tests structure by reading source (see tests/unit/cssLayers.test.ts),
// so the block order is asserted on the composed sources, and the day rows
// themselves are rendered with a fake HomeViewState.

const read = (rel: string) => readFileSync(resolve(process.cwd(), rel), 'utf8');

describe('Task 2: Home hub block order', () => {
    it('renders header, week selector, day list, Entrenar, recap, free session in order', () => {
        const impl = read('views/HomeViewImpl.tsx');
        const top = read('views/home/HomeTopSection.tsx');

        const header = top.indexOf('home-hub-header');
        const weekSelector = top.indexOf('home-week-selector');
        expect(header).toBeGreaterThan(-1);
        expect(weekSelector).toBeGreaterThan(header);

        const topSection = impl.indexOf('<HomeTopSection');
        const dayList = impl.indexOf('<HomeWeekDayList');
        const train = impl.indexOf('home-train-action');
        const recap = impl.indexOf('<HomeRecapStrip');
        const free = impl.indexOf('home-free-session');

        expect(topSection).toBeGreaterThan(-1);
        expect(dayList).toBeGreaterThan(topSection);
        expect(train).toBeGreaterThan(dayList);
        expect(recap).toBeGreaterThan(train);
        expect(free).toBeGreaterThan(recap);

        // The train action reuses the same startSession entry point as before.
        expect(impl).toContain('startSession(selectedDayIdx)');
        // No dominant hero in Home anymore (the component file itself is kept).
        expect(impl).not.toContain('<HomeHeroCard');
        expect(impl).not.toContain('HomeHeroCard');
    });

    it('week selector exposes prev/next and a deload indicator when deload is on', () => {
        const top = read('views/home/HomeTopSection.tsx');
        expect(top).toContain('home-week-selector');
        expect(top).toContain('goWeek(-1)');
        expect(top).toContain('goWeek(1)');
        expect(top).toContain('activeMeso.isDeload');
    });
});

describe('Task 2: HomeWeekDayList rows', () => {
    const makeState = (setSelectedDayIdx = vi.fn()) => ({
        safeProgram: [
            { dayName: { es: 'Pecho', en: 'Chest' }, slots: [{ muscle: 'CHEST', setTarget: 4 }, { muscle: 'TRICEPS', setTarget: 3 }] },
            { dayName: { es: 'Espalda', en: 'Back' }, slots: [{ muscle: 'BACK', setTarget: 5 }] },
            { dayName: { es: 'Pierna', en: 'Legs' }, slots: [{ muscle: 'QUADS', setTarget: 3 }] },
        ],
        selectedDayIdx: 1,
        setSelectedDayIdx,
        uniqueDaysDone: new Set([0]),
        nextWorkoutIdx: 1,
        lang: 'es',
        h: TRANSLATIONS.es.homeView,
        t: TRANSLATIONS.es,
        tm: (key: string) => (TRANSLATIONS.es.muscle as any)[key] ?? key,
    });

    it('shows name, muscles, done/today/pending state and total sets per row', () => {
        render(React.createElement(HomeWeekDayList as any, { state: makeState() }));

        expect(screen.getByText('Pecho')).toBeTruthy();
        expect(screen.getByText(/Pecho · Tríceps/)).toBeTruthy();
        expect(screen.getByText('Completado')).toBeTruthy();
        expect(screen.getByText('7 series')).toBeTruthy();

        expect(screen.getByTestId('home-day-row-1').textContent).toContain('Espalda');
        expect(screen.getByText('Hoy')).toBeTruthy();
        expect(screen.getByText('5 series')).toBeTruthy();

        expect(screen.getByTestId('home-day-row-2').textContent).toContain('Pierna');
        expect(screen.getByText('Pendiente')).toBeTruthy();
        expect(screen.getByText('3 series')).toBeTruthy();
    });

    it('tapping a row selects that day', () => {
        const setSelectedDayIdx = vi.fn();
        render(React.createElement(HomeWeekDayList as any, { state: makeState(setSelectedDayIdx) }));

        fireEvent.click(screen.getByTestId('home-day-row-2'));
        expect(setSelectedDayIdx).toHaveBeenCalledWith(2);
        expect(screen.getByTestId('home-day-row-1').getAttribute('aria-pressed')).toBe('true');
    });
});
