import { test, expect } from '@playwright/test';
import { bottomNav, goHistory } from './strongNav';

test.describe('Flat tab history (F8)', () => {
    test('switching replace-tabs pushes no entries; a single back stays in app', async ({ page }) => {
        await page.addInitScript(() => {
            localStorage.setItem('il_onboarded_v2', 'true');
            localStorage.setItem('il_tutorial_v2', JSON.stringify({
                home: true, workout: true, history: true, stats: true, mesoSettings: true, nutrition: true,
            }));
        });
        await page.goto('/');

        const nav = page.locator('nav[aria-label="Main navigation"]');
        await expect(nav).toBeVisible({ timeout: 15000 });
        await expect(page.getByText(/Nuevo Mesociclo|New Mesocycle/i)).toBeVisible({ timeout: 8000 });
        // Baseline includes the about:blank entry behind the fresh page.
        const baselineLength = await page.evaluate(() => window.history.length);

        const historyNavBtn = bottomNav(page).getByRole('button', { name: /^Historial$|^History$/ });
        await historyNavBtn.click();
        await expect(page.getByRole('heading', { name: /Historial|History|Sin entrenamientos|No workouts/ }).first()).toBeVisible({ timeout: 10000 });

        // Medidas is a depth-1 route like the diary: switching tabs replaces.
        const measureNavBtn = bottomNav(page).getByRole('button', { name: /^Medidas$|^Measure$/ });
        await measureNavBtn.click();
        await expect(measureNavBtn).toHaveAttribute('aria-current', 'page', { timeout: 10000 });
        await expect(page.getByText(/Mediciones|Measurements/).first()).toBeVisible({ timeout: 10000 });

        await historyNavBtn.click();
        await expect(page.getByRole('heading', { name: /Historial|History|Sin entrenamientos|No workouts/ }).first()).toBeVisible({ timeout: 10000 });

        // Tab switches push no entries: tabs use replaceState.
        expect(await page.evaluate(() => window.history.length)).toBe(baselineLength);

        // A single Back cannot walk through tabs: it leaves the app instead of
        // stepping back tab by tab.
        await page.goBack();
        await expect.poll(async () => page.url(), { timeout: 8000 }).toBe('about:blank');
    });
});
