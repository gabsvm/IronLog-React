import { test, expect } from '@playwright/test';

// Task 1 (Strong parity): the in-progress workout screen renders ALL exercises
// stacked in one continuous scroll — no focused-exercise + rail model.
// Fixture pattern follows tests/e2e/weightUnits.spec.ts.
test.describe('Strong parity T1: stacked continuous exercise list', () => {
    test('both exercises visible at once, all set rows reachable, no rail', async ({ page }) => {
        await page.addInitScript(() => {
            localStorage.setItem('il_onboarded_v2', 'true');
            localStorage.setItem('il_tutorial_v2', JSON.stringify({
                home: true, workout: true, history: true, stats: true, mesoSettings: true, nutrition: true,
            }));
        });
        await page.goto('/');
        await expect(page.locator('nav[aria-label="Main navigation"]')).toBeVisible({ timeout: 20000 });

        await page.getByRole('button', { name: /^(Sesión libre|Freestyle session) ·/ }).click();
        await page.getByRole('dialog', { name: /Iniciar entrenamiento|Start training/ })
            .getByRole('button', { name: /Sesión libre|Freestyle/ }).click();
        await page.getByRole('dialog', { name: /Nueva Sesión|New Session/i })
            .getByRole('button', { name: /Iniciar Sesión Libre|Start Free Session/i }).click();
        await expect(page.locator('#tut-finish-btn')).toBeVisible({ timeout: 10000 });

        // Add 2 distinct exercises via the header add button, without touching any rail.
        const addExHeaderBtn = page.locator('button[title*="Añadir ejercicio" i], button[title*="Add exercise" i]').first();
        for (let i = 0; i < 2; i++) {
            await addExHeaderBtn.click();
            const dialog = page.locator('[role="dialog"]').last();
            await expect(dialog).toBeVisible({ timeout: 6000 });
            const option = dialog.locator('button[class*="text-left"]').nth(i);
            await expect(option).toBeVisible({ timeout: 6000 });
            await option.click();
            await page.waitForTimeout(400);
        }

        // Both exercise titles visible at once — no rail interaction happened.
        const cardNames = page.locator('#tut-exercise-list h3');
        await expect(cardNames).toHaveCount(2, { timeout: 8000 });
        await expect(cardNames.nth(0)).toBeVisible();
        await expect(cardNames.nth(1)).toBeVisible();

        // Every set row of the session (incl. the second exercise) is visible.
        const completeBtns = page.locator(
            '#tut-exercise-list button[aria-label*="Completar serie" i], #tut-exercise-list button[aria-label*="Complete set" i]',
        );
        const total = await completeBtns.count();
        expect(total).toBeGreaterThan(0);
        for (let i = 0; i < total; i++) {
            await expect(completeBtns.nth(i)).toBeVisible();
        }

        // The exercise rail is gone from this view (mobile viewport comes from config).
        await expect(page.locator(
            '#tut-exercise-list nav[aria-label="Exercises"], #tut-exercise-list nav[aria-label="Ejercicios"]',
        )).toHaveCount(0);
    });
});
