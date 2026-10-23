import { test, expect, type Page } from '@playwright/test';

// The compact PRO locks (Progreso cards and the Diary footer) must still open the
// paywall and close it with Escape. No commercial action is triggered.
const seed = (page: Page) =>
    page.addInitScript(() => {
        const now = Date.now();
        const day = 86400000;
        localStorage.setItem('il_onboarded_v2', 'true');
        localStorage.setItem('il_tutorial_v2', JSON.stringify({ home: true, workout: true, history: true, stats: true, mesoSettings: true, nutrition: true }));
        const set = { id: 1, weight: '60', reps: '8', completed: true, type: 'regular' };
        const log = (id: number, daysAgo: number) => ({
            id, dayIdx: 0, name: `Sesión ${id}`, startTime: now - daysAgo * day - 3600000, endTime: now - daysAgo * day, duration: 3600, skipped: false,
            exercises: [{ id: 'bp_bar', name: 'Press Banca Barra', muscle: 'CHEST', sets: [set] }],
        });
        // One recent session and one older than the free 7-day window, so the Diary lock shows.
        localStorage.setItem('il_logs_v16', JSON.stringify([log(1, 1), log(2, 20)]));
    });

const paywall = (page: Page) => page.getByRole('dialog', { name: 'GainsLab Pro upgrade' });

test.describe('PRO locks open the paywall', () => {
    test.beforeEach(async ({ page }) => {
        await seed(page);
        await page.goto('/');
        await expect(page.locator('nav[aria-label="Main navigation"]')).toBeVisible({ timeout: 15000 });
    });

    test('from a locked Progreso card', async ({ page }) => {
        await page.locator('nav[aria-label="Main navigation"]').getByRole('button', { name: /^Progreso$|^Progress$/ }).click();
        await page.getByRole('button', { name: /^(Desbloquear PRO|Unlock PRO): / }).first().click();
        await expect(paywall(page)).toBeVisible({ timeout: 8000 });
        await page.keyboard.press('Escape');
        await expect(paywall(page)).toHaveCount(0);
    });

    test('from the Diary history lock', async ({ page }) => {
        await page.locator('nav[aria-label="Main navigation"]').getByRole('button', { name: /^Diario$|^Diary$/ }).click();
        await page.getByRole('button', { name: /^(Desbloquear PRO|Unlock PRO)$/ }).click();
        await expect(paywall(page)).toBeVisible({ timeout: 8000 });
        await page.keyboard.press('Escape');
        await expect(paywall(page)).toHaveCount(0);
    });
});
