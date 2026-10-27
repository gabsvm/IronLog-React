import { test, expect } from '@playwright/test';
import { openStrongPanel } from './strongNav';

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

        // 1. Go to the Progress view via the Profile panel tile.
        const dashboard = await openStrongPanel(page);
        await dashboard.getByRole('button', { name: /^Progreso$|^Progress$/ }).click();
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
