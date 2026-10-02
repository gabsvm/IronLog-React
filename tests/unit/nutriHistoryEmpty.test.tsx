import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HistoryTab, DaySummary } from '../../views/nutri/HistoryTab';
import { TRANSLATIONS } from '../../constants';

const empty14: DaySummary[] = Array.from({ length: 14 }, (_, i) => ({
    date: `2026-09-${String(i + 1).padStart(2, '0')}`,
    label: 'Mon',
    shortDate: `${i + 1}`,
    isToday: i === 13,
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
}));

const goal = { calories: 2500, protein: 180, carbs: 250, fat: 70 };

describe('K6: diet history empty state', () => {
    it('shows icon + text + go-today button when nothing is tracked', () => {
        const onGoToday = vi.fn();
        const { container } = render(
            <HistoryTab lang="es" last14Days={empty14} historyDayList={[]} nutritionGoal={goal} onGoToday={onGoToday} />
        );
        expect(screen.getByText(TRANSLATIONS.es.nutriHistoryEmptyTitle)).toBeTruthy();
        expect(screen.getByText(TRANSLATIONS.es.nutriHistoryEmptyBody)).toBeTruthy();
        expect(container.querySelector('svg')).not.toBeNull();
        // No bars rendered.
        expect(container.querySelectorAll('[class*="rounded-t"]').length).toBe(0);
        fireEvent.click(screen.getByText(TRANSLATIONS.es.nutriHistoryEmptyCta));
        expect(onGoToday).toHaveBeenCalledTimes(1);
    });

    it('renders bars once at least one day is tracked', () => {
        const days = empty14.map((d, i) => (i === 13 ? { ...d, calories: 2000, protein: 150, carbs: 200, fat: 60 } : d));
        const { container } = render(
            <HistoryTab lang="es" last14Days={days} historyDayList={[days[13]]} nutritionGoal={goal} onGoToday={() => {}} />
        );
        expect(screen.queryByText(TRANSLATIONS.es.nutriHistoryEmptyTitle)).toBeNull();
        // Calories chart + protein chart both render 14 bar slots.
        expect(container.querySelectorAll('[class*="rounded-t"]').length).toBeGreaterThan(0);
    });

    it('renders in English too', () => {
        render(
            <HistoryTab lang="en" last14Days={empty14} historyDayList={[]} nutritionGoal={goal} onGoToday={() => {}} />
        );
        expect(screen.getByText(TRANSLATIONS.en.nutriHistoryEmptyTitle)).toBeTruthy();
        expect(screen.getByText(TRANSLATIONS.en.nutriHistoryEmptyCta)).toBeTruthy();
    });
});
