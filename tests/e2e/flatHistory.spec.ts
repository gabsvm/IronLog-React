import { test, expect } from '@playwright/test';

test.describe('Flat tab history (F8)', () => {
    test('switching 4 tabs pushes no entries; a single back stays at start', async ({ page }) => {
        await page.addInitScript(() => {
            localStorage.setItem('il_onboarded_v2', 'true');
            localStorage.setItem('il_tutorial_v2', JSON.stringify({
                home: true, workout: true, history: true, stats: true, mesoSettings: true, nutrition: true,
            }));
        });
        await page.goto('/');

        const nav = page.locator('nav[aria-label="Main navigation"]');
        await expect(nav).toBeVisible({ timeout: 15000 });
        await expect(page.getByText(/Nuevo Mesociclo|New Mesocycle/)).toBeVisible({ timeout: 8000 });
        // Baseline includes the about:blank entry behind the fresh page.
        const baselineLength = await page.evaluate(() => window.history.length);

        const historyNavBtn = page.locator('nav[aria-label="Main navigation"] button', { hasText: /Historial|History/ });
        await historyNavBtn.click();
        await expect(page.getByRole('heading', { name: /Historial|History|Sin entrenamientos|No workouts/ }).first()).toBeVisible({ timeout: 10000 });

        const statsNavBtn = page.locator('nav[aria-label="Main navigation"] button', { hasText: 'Stats' });
        await statsNavBtn.click();
        await expect(page.getByRole('tablist').first()).toBeVisible({ timeout: 10000 });

        const dietNavBtn = page.locator('nav[aria-label="Main navigation"] button', { hasText: /Dieta|Diet/ });
        await dietNavBtn.click();
        await expect(page.getByText(/Cuerpo|Body/).first()).toBeVisible({ timeout: 10000 });

        const homeNavBtn = page.locator('nav[aria-label="Main navigation"] button', { hasText: /Entreno|Train/ });
        await homeNavBtn.click();
        await expect(page.getByText(/Nuevo Mesociclo|New Mesocycle/)).toBeVisible({ timeout: 10000 });

        // Four tab switches push no entries: tabs use replaceState.
        expect(await page.evaluate(() => window.history.length)).toBe(baselineLength);

        // A single Back cannot walk through tabs: it leaves the app instead of
        // stepping back tab by tab.
        await page.goBack();
        await expect.poll(async () => page.url(), { timeout: 8000 }).toBe('about:blank');
    });
});
