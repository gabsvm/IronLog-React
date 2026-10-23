import { test, expect } from '@playwright/test';

// The command palette opens from the desktop sidebar (lg+); the mobile shell
// uses the bottom nav + QuickStart sheet instead of a center button.
test.use({ viewport: { width: 1280, height: 800 } });

test.describe('H2: deep-view Back returns to the previous tab', () => {
    test('Progress -> palette -> Edit program -> Back lands on Progress', async ({ page }) => {
        await page.addInitScript(() => {
            localStorage.setItem('il_onboarded_v2', 'true');
            localStorage.setItem('il_tutorial_v2', JSON.stringify({
                home: true, workout: true, history: true, stats: true, mesoSettings: true, nutrition: true,
            }));
        });
        await page.goto('/');

        // Two navs exist in the DOM (sidebar + bottom bar) but only one is
        // visible per breakpoint; scope to the visible one.
        const nav = page.locator('nav[aria-label="Main navigation"]:visible');
        await expect(nav).toBeVisible({ timeout: 15000 });

        // 1. Go to the Progress tab.
        const progressNavBtn = nav.locator('button', { hasText: /^Progreso$|^Progress$/ });
        await progressNavBtn.click();
        await expect(page.getByRole('tablist').first()).toBeVisible({ timeout: 10000 });

        // 2. Open the command palette and pick "Edit my program" (depth-2 push).
        const paletteBtn = page.getByRole('button', { name: /Acciones rápidas|Quick actions/ });
        await paletteBtn.click();
        const palette = page.getByRole('dialog', { name: /Acciones r.pidas|Quick actions/ });
        await expect(palette).toBeVisible({ timeout: 6000 });
        await palette.getByRole('button', { name: /Editar mi programa|Edit my program/ }).click();

        // 3. Program editor is showing.
        await expect(page.getByRole('heading', { name: /Nueva Rutina|New Routine|Editar Rutina Activa|Edit Active Routine/i }).first()).toBeVisible({ timeout: 10000 });

        // 4. Back returns to Progress — not Home, not out of the app.
        await page.goBack();
        await expect(page.getByRole('tablist').first()).toBeVisible({ timeout: 10000 });
        await expect.poll(async () => page.url(), { timeout: 8000 }).toContain('#progress');
        await expect(page.getByText(/ERROR CR.TICO|CRITICAL ERROR/)).toHaveCount(0);
    });
});
