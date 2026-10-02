import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BodyTab } from '../../views/nutri/BodyTab';
import { TRANSLATIONS } from '../../constants';
import { WATER_GOAL_ML } from '../../views/nutri/nutritionHelpers';

describe('K5: body targets show the goal first, then weight-based guidance', () => {
    const baseProps = {
        lang: 'es' as const,
        latestWeight: null,
        weightTrend: [],
        recentWeighIns: [],
        nutritionGoal: { calories: 2500, protein: 180, carbs: 250, fat: 70 },
        todayCalories: 1200,
        tdee: 2800,
        bodyWeight: 85,
        bodyFat: 15,
        onLogWeight: () => {},
    };

    it('shows "Tu meta" with the same protein/water goal source as Today', () => {
        render(<BodyTab {...baseProps} />);
        expect(screen.getByText(TRANSLATIONS.es.bodyYourGoal)).toBeTruthy();
        // Same sources the Today tab uses: nutritionGoal.protein + WATER_GOAL_ML.
        expect(screen.getByText('180g')).toBeTruthy();
        expect(screen.getByText(`${WATER_GOAL_ML}ml`)).toBeTruthy();
    });

    it('labels the calculated values as recommended for the body weight', () => {
        const { container } = render(<BodyTab {...baseProps} />);
        expect(screen.getByText(TRANSLATIONS.es.bodyRecommended)).toBeTruthy();
        // 85kg * 1.8 / 2.2 / 37
        expect(screen.getByText('153g')).toBeTruthy();
        expect(screen.getByText('187g')).toBeTruthy();
        expect(screen.getByText('3145ml')).toBeTruthy();
        // Goal group renders before the recommended group.
        const html = container.innerHTML;
        expect(html.indexOf(TRANSLATIONS.es.bodyYourGoal)).toBeLessThan(
            html.indexOf(TRANSLATIONS.es.bodyRecommended)
        );
    });
});
