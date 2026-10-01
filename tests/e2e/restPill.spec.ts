import { test, expect } from '@playwright/test';

const ERROR_BOUNDARY_TEXT = /ERROR CRÍTICO|CRITICAL ERROR/;

test.describe('Rest pill touch targets (F3)', () => {
    test('compact -10s, +30s and skip buttons measure at least 44x44px', async ({ page }) => {
        await page.addInitScript(() => {
            localStorage.setItem('il_onboarded_v2', 'true');
            localStorage.setItem('il_tutorial_v2', JSON.stringify({
                home: true, workout: true, history: true, stats: true, mesoSettings: true, nutrition: true,
            }));
        });
        await page.goto('/');

        const nav = page.locator('nav[aria-label="Main navigation"]');
        await expect(nav).toBeVisible({ timeout: 15000 });

        const plusBtn = page.locator('nav[aria-label="Main navigation"] button[aria-label*="Iniciar" i], nav[aria-label="Main navigation"] button[aria-label*="Start" i]').first();
        await expect(plusBtn).toBeVisible({ timeout: 8000 });
        await plusBtn.click();

        const freestyleOption = page.locator('button:has-text("Sesión libre"), button:has-text("Freestyle")').first();
        await expect(freestyleOption).toBeVisible({ timeout: 6000 });
        await freestyleOption.click();

        const startFreeBtn = page.locator('button:has-text("Iniciar Sesión Libre"), button:has-text("Start Free Session"), button:has-text("Iniciar sesión libre")').first();
        await expect(startFreeBtn).toBeVisible({ timeout: 8000 });
        await startFreeBtn.scrollIntoViewIfNeeded();
        await startFreeBtn.click();

        const addExHeaderBtn = page.locator('button[title*="Añadir ejercicio" i], button[title*="Add exercise" i], button[title*="Añadir Ejercicio" i]').first();
        await expect(addExHeaderBtn).toBeVisible({ timeout: 6000 });
        await addExHeaderBtn.click();

        const firstExOption = page.locator('[role="dialog"] button, .modal button').filter({ hasText: /press|squat|curl|banca/i }).first();
        await expect(firstExOption).toBeVisible({ timeout: 6000 });
        await firstExOption.click();

        // Completing a set starts the rest timer pill (compact by default).
        const completeSetBtn = page.locator('button[aria-label*="Completar serie" i], button[aria-label*="Complete set" i]').first();
        await expect(completeSetBtn).toBeVisible({ timeout: 6000 });
        await completeSetBtn.click();

        const pill = page.locator('aside');
        await expect(pill.getByRole('button', { name: '-10s' })).toBeVisible({ timeout: 8000 });

        for (const name of ['-10s', '+30s']) {
            const box = await pill.getByRole('button', { name }).boundingBox();
            expect(box, `${name} bounding box`).not.toBeNull();
            expect(box!.width, `${name} width`).toBeGreaterThanOrEqual(44);
            expect(box!.height, `${name} height`).toBeGreaterThanOrEqual(44);
        }
        const skipBox = await pill.getByRole('button', { name: /Saltar descanso|Skip rest/ }).boundingBox();
        expect(skipBox, 'skip bounding box').not.toBeNull();
        expect(skipBox!.width, 'skip width').toBeGreaterThanOrEqual(44);
        expect(skipBox!.height, 'skip height').toBeGreaterThanOrEqual(44);

        await expect(page.getByText(ERROR_BOUNDARY_TEXT)).toHaveCount(0);
    });
});
