import { test, expect, type Page } from '@playwright/test';

// GainsLab is free and open source: no paywall, no locks, full history and
// every Progreso chart for everyone.
const seed = (page: Page) =>
    page.addInitScript(() => {
        const now = Date.now();
        const day = 86400000;
        localStorage.setItem('il_onboarded_v2', 'true');
        localStorage.setItem('il_tutorial_v2', JSON.stringify({ home: true, workout: true, history: true, stats: true, mesoSettings: true, nutrition: true }));
        const set = { id: 1, weight: '60', reps: '8', completed: true, type: 'regular' };
        const log = (id: number, name: string, daysAgo: number) => ({
            id, dayIdx: 0, name, startTime: now - daysAgo * day - 3600000, endTime: now - daysAgo * day, duration: 3600, skipped: false,
            exercises: [{ id: 'bp_bar', name: 'Press Banca Barra', muscle: 'CHEST', sets: [set] }],
        });
        // The second session is older than the former free 7-day window.
        localStorage.setItem('il_logs_v16', JSON.stringify([log(1, 'Sesión reciente', 1), log(2, 'Sesión antigua', 40)]));
    });

test.describe('All features are open', () => {
    test.beforeEach(async ({ page }) => {
        await seed(page);
        await page.goto('/');
        await expect(page.locator('nav[aria-label="Main navigation"]')).toBeVisible({ timeout: 15000 });
    });

    test('the Diary shows the full history', async ({ page }) => {
        await page.locator('nav[aria-label="Main navigation"]').getByRole('button', { name: /^Diario$|^Diary$/ }).click();
        await expect(page.getByText('Sesión antigua')).toBeVisible({ timeout: 10000 });
        await expect(page.getByRole('button', { name: /Desbloquear PRO|Unlock PRO/ })).toHaveCount(0);
    });

    test('Profile links to the AGPL source code', async ({ page }) => {
        await page.getByRole('button', { name: /Abrir perfil|Open profile/ }).first().click();
        const source = page.getByRole('link', { name: /Código fuente|Source code/ });
        await expect(source).toHaveAttribute('href', 'https://github.com/gabsvm/IronLog-React');
    });

    test('Progreso renders its charts without locks', async ({ page }) => {
        await page.locator('nav[aria-label="Main navigation"]').getByRole('button', { name: /^Progreso$|^Progress$/ }).click();
        await expect(page.locator('#tut-radar-chart canvas, #tut-radar-chart svg').first()).toBeVisible({ timeout: 10000 });
        await expect(page.getByRole('button', { name: /Desbloquear PRO|Unlock PRO/ })).toHaveCount(0);
    });
});
