import { test, expect } from '@playwright/test';

// The command palette opens from the primary nav button only at >=640px.
test.use({ viewport: { width: 800, height: 600 } });

test.describe('H2: deep-view Back returns to the previous tab', () => {
    test('Stats -> palette -> Edit program -> Back lands on Stats', async ({ page }) => {
        await page.addInitScript(() => {
            localStorage.setItem('il_onboarded_v2', 'true');
            localStorage.setItem('il_tutorial_v2', JSON.stringify({
                home: true, workout: true, history: true, stats: true, mesoSettings: true, nutrition: true,
            }));
        });
        await page.goto('/');

        const nav = page.locator('nav[aria-label="Main navigation"]');
        await expect(nav).toBeVisible({ timeout: 15000 });

        // 1. Go to the Stats tab.
        const statsNavBtn = page.locator('nav[aria-label="Main navigation"] button', { hasText: 'Stats' });
        await statsNavBtn.click();
        await expect(page.getByRole('tablist').first()).toBeVisible({ timeout: 10000 });

        // 2. Open the command palette and pick "Edit my program" (depth-2 push).
        const primaryBtn = page.locator('nav[aria-label="Main navigation"] button[aria-label*="Iniciar" i], nav[aria-label="Main navigation"] button[aria-label*="Start" i]').first();
        await primaryBtn.click();
        const palette = page.getByRole('dialog', { name: /Acciones r.pidas|Quick actions/ });
        await expect(palette).toBeVisible({ timeout: 6000 });
        await palette.getByRole('button', { name: /Editar mi programa|Edit my program/ }).click();

        // 3. Program editor is showing.
        await expect(page.getByRole('heading', { name: /Nueva Rutina|New Routine|Editar Rutina Activa|Edit Active Routine/ }).first()).toBeVisible({ timeout: 10000 });

        // 4. Back returns to Stats — not Home, not out of the app.
        await page.goBack();
        await expect(page.getByRole('tablist').first()).toBeVisible({ timeout: 10000 });
        await expect.poll(async () => page.url(), { timeout: 8000 }).toContain('#stats');
        await expect(page.getByText(/ERROR CR.TICO|CRITICAL ERROR/)).toHaveCount(0);
    });
});
