import { test, expect, type Page } from '@playwright/test';

// Q16: week-at-a-glance strip under the Home hero card.
const ERROR_BOUNDARY_TEXT = /ERROR CRÍTICO|CRITICAL ERROR/;

const seedHome = (page: Page) =>
    page.addInitScript(() => {
        localStorage.setItem('il_onboarded_v2', 'true');
        localStorage.setItem('il_tutorial_v2', JSON.stringify({
            home: true, workout: true, history: true, stats: true, mesoSettings: true, nutrition: true,
        }));
        localStorage.setItem('il_meso_v16', JSON.stringify({
            id: 7, name: 'Plan Q16', mesoType: 'hyp_1', week: 2, duration: 5,
            plan: [[null], [null], [null], [null]],
        }));
        localStorage.setItem('il_prog_v16', JSON.stringify([
            { dayName: 'Pecho', slots: [] },
            { dayName: 'Espalda', slots: [] },
            { dayName: 'Pierna', slots: [] },
            { dayName: 'Hombro', slots: [] },
        ]));
        const set = (id: number, weight: string, reps: string) =>
            ({ id, weight, reps, completed: true, type: 'regular' });
        const chest = (sets: any[]) => [{ id: 'ex_chest', name: 'Press', muscle: 'CHEST', sets }];
        localStorage.setItem('il_logs_v16', JSON.stringify([
            // Week 1 complete (3 of 4 days... plus the 4th below).
            { id: 1, dayIdx: 0, name: 'w1a', startTime: 1000, endTime: 2000, duration: 1800, skipped: false, mesoId: 7, week: 1, exercises: chest([set(1, '50', '10')]) },
            { id: 2, dayIdx: 1, name: 'w1b', startTime: 3000, endTime: 4000, duration: 1800, skipped: false, mesoId: 7, week: 1, exercises: chest([set(2, '50', '10')]) },
            { id: 3, dayIdx: 2, name: 'w1c', startTime: 5000, endTime: 6000, duration: 1800, skipped: false, mesoId: 7, week: 1, exercises: chest([set(3, '50', '10')]) },
            { id: 4, dayIdx: 3, name: 'w1d', startTime: 7000, endTime: 8000, duration: 1800, skipped: false, mesoId: 7, week: 1, exercises: chest([set(4, '50', '10')]) },
            // Week 2 in progress: day 0 with a PR (60x10 beats 50x10).
            { id: 5, dayIdx: 0, name: 'w2a', startTime: 9000, endTime: 10000, duration: 1800, skipped: false, mesoId: 7, week: 2, exercises: chest([set(5, '60', '10'), set(6, '60', '10')]) },
        ]));
    });

test.describe('Q16 home recap strip', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('shows week progress, streak and last session below the hero', async ({ page }) => {
        await seedHome(page);
        await page.goto('/');
        await expect(page.getByText('Esta semana')).toBeVisible({ timeout: 15000 });

        // 1 of 4 planned days trained this week.
        await expect(page.getByText('1/4')).toBeVisible();
        // Week 1 complete + week 2 in progress → streak of 1.
        await expect(page.getByText('semana de racha')).toBeVisible();
        // Last session: 2x60x10 = 1200 kg, ~30 min, one PR.
        await expect(page.getByText('Última sesión')).toBeVisible();
        await expect(page.getByText('1.200 kg')).toBeVisible();
        await expect(page.getByText('×1')).toBeVisible();

        // The strip sits below the hero day card, and the K8 skip label survives.
        const heroBtn = page.locator('button:has-text("Empezar Espalda")');
        await expect(heroBtn).toBeVisible();
        const heroBox = await heroBtn.boundingBox();
        const stripBox = await page.getByText('Esta semana').boundingBox();
        expect(stripBox!.y).toBeGreaterThan(heroBox!.y);
        await expect(page.locator('button[aria-label="Saltar sesión"]')).toBeVisible();

        await expect(page.getByText(ERROR_BOUNDARY_TEXT)).toHaveCount(0);
    });
});
