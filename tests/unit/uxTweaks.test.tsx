import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VolumeMuscleList } from '../../views/StatsViewImpl';
import { BodyTab } from '../../views/nutri/BodyTab';
describe('K8: volume list hides the Cardio row without touching counts', () => {
    const volumeData: [string, number][] = [['CHEST', 14], ['CARDIO', 99], ['BACK', 8]];

    it('renders muscle rows but no Cardio row (es)', () => {
        render(<VolumeMuscleList volumeData={volumeData} maxVal={99} lang="es" />);
        expect(screen.getByText('Pecho')).toBeTruthy();
        expect(screen.getByText('Espalda')).toBeTruthy();
        expect(screen.queryByText('Cardio')).toBeNull();
    });

    it('renders muscle rows but no Cardio row (en)', () => {
        render(<VolumeMuscleList volumeData={volumeData} maxVal={99} lang="en" />);
        expect(screen.getByText('Chest')).toBeTruthy();
        expect(screen.getByText('Back')).toBeTruthy();
        expect(screen.queryByText('Cardio')).toBeNull();
    });

    it('keeps the cached counts of the remaining rows', () => {
        render(<VolumeMuscleList volumeData={volumeData} maxVal={99} lang="es" />);
        expect(screen.getByText('14')).toBeTruthy();
        expect(screen.getByText('8')).toBeTruthy();
    });
});


describe('K8: stale weigh-in nudge in Dieta > Cuerpo', () => {
    const baseProps = {
        lang: 'es' as const,
        latestWeight: null as null | { id: number; date: number; weight: number },
        weightTrend: [],
        recentWeighIns: [],
        nutritionGoal: { calories: 2500, protein: 180, carbs: 250, fat: 70 },
        todayCalories: 1200,
        tdee: 2800,
        bodyWeight: 85,
        bodyFat: 15,
        onLogWeight: () => {},
    };
    const daysAgo = (n: number) => Date.now() - n * 86400000;

    it('shows the nudge when the last weigh-in is older than 14 days (es)', () => {
        render(<BodyTab {...baseProps} latestWeight={{ id: 1, date: daysAgo(20), weight: 85 }} />);
        expect(screen.getByText('Hace 20 días que no registras tu peso')).toBeTruthy();
    });

    it('shows the nudge in English', () => {
        render(
            <BodyTab
                {...baseProps}
                lang="en"
                latestWeight={{ id: 1, date: daysAgo(30), weight: 85 }}
            />,
        );
        expect(screen.getByText("You haven't logged your weight in 30 days")).toBeTruthy();
    });

    it('stays silent with a recent weigh-in or none at all', () => {
        const { unmount, container } = render(
            <BodyTab {...baseProps} latestWeight={{ id: 1, date: daysAgo(3), weight: 85 }} />,
        );
        expect(container.textContent).not.toMatch(/días que no registras/i);
        unmount();
        const fresh = render(<BodyTab {...baseProps} latestWeight={null} />);
        expect(fresh.container.textContent).not.toMatch(/días que no registras/i);
    });
});
