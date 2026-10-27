import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { HomeRecapStrip } from '../../views/home/HomeRecapStrip';
import { AppConfigContext } from '../../context/app/appContexts';
import type { AppState } from '../../types';
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

const defaultTestConfig: AppState['config'] = { showRIR: false, rpEnabled: false, rpTargetRIR: 2, keepScreenOn: false, restTimerDisplay: 'compact', weightUnit: 'kg', previousScope: 'any', incompleteSets: 'ask', defaultSets: 3, defaultRestSeconds: 120, warmupRestSeconds: 60, restIncrementSeconds: 15, restSound: true, restVibrate: true, autoStartRest: true, autoFullscreen: false, simpleTimers: false, restSoundName: 'boxingBell', bodyWeightUnit: 'kg', distanceUnit: 'km', sizeUnit: 'cm', weekStart: 'monday', oneRmFormula: 'epley', factorInRpe: false, plateBarKg: 20, platePlatesKg: [25, 20, 15, 10, 5, 2.5, 1.25] };

const renderStrip = (logs: any[], lang: 'es' | 'en' = 'es') =>
    render(
        <AppConfigContext.Provider value={{ config: defaultTestConfig, setConfig: vi.fn() }}>
            <HomeRecapStrip logs={logs} meso={meso} plannedDays={3} lang={lang} t={TRANSLATIONS[lang]} unit="kg" />
        </AppConfigContext.Provider>,
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
        expect(screen.getAllByText(/1.200 kg/).length).toBeGreaterThanOrEqual(1);
        // Week time (30 min trained) duplicates the last-session duration text.
        expect(screen.getAllByText('30 min').length).toBeGreaterThanOrEqual(2);
        // 60x10 beats the 50x10 best → one PR chip.
        expect(screen.getByText('×1')).toBeTruthy();
        // Week time + previous sessions come from real log data.
        expect(screen.getByText('Tiempo entrenado')).toBeTruthy();
        expect(screen.getByText('Sesiones recientes')).toBeTruthy();
    });

    it('shows a friendly empty state without sessions', () => {
        renderStrip([]);
        expect(screen.getByText('0/3')).toBeTruthy();
        expect(screen.getByText('Todavía no hay sesiones esta semana.')).toBeTruthy();
    });

    it('renders in English', () => {
        renderStrip([], 'en');
        expect(screen.getByText('This week')).toBeTruthy();
        expect(screen.getByText('No sessions logged this week yet.')).toBeTruthy();
    });

    it('opens the real Diary sessions destination from a named recent record', () => {
        const listener = vi.fn();
        window.addEventListener('gainslab:navigate', listener);
        renderStrip([log(1, 2, 0, [set('60', '10')], Date.now())], 'en');
        fireEvent.click(screen.getByRole('button', { name: 's1 · Completed · View in Diary' }));
        expect(listener).toHaveBeenCalledOnce();
        expect((listener.mock.calls[0][0] as CustomEvent).detail).toEqual({ view: 'diary', section: 'sessions' });
        window.removeEventListener('gainslab:navigate', listener);
    });
});
