import { test, expect } from '@playwright/test';

const ERROR_BOUNDARY_TEXT = /ERROR CRÍTICO|CRITICAL ERROR/;

test.describe('Rest controls touch targets (F3)', () => {
    test('in-flow dock pause, restart and skip buttons measure at least 44x44px', async ({ page }) => {
        await page.addInitScript(() => {
            localStorage.setItem('il_onboarded_v2', 'true');
            localStorage.setItem('il_tutorial_v2', JSON.stringify({
                home: true, workout: true, history: true, stats: true, mesoSettings: true, nutrition: true,
            }));
        });
        await page.goto('/');

        const nav = page.locator('nav[aria-label="Main navigation"]');
        await expect(nav).toBeVisible({ timeout: 15000 });

        const freeSessionBtn = page.getByRole('button', { name: /^(Sesión libre|Freestyle session) ·/ });
        await expect(freeSessionBtn).toBeVisible({ timeout: 8000 });
        await freeSessionBtn.click();

        const freestyleOption = page.getByRole('dialog', { name: /Iniciar entrenamiento|Start training/ })
            .getByRole('button', { name: /Sesión libre|Freestyle/ });
        await expect(freestyleOption).toBeVisible({ timeout: 6000 });
        await freestyleOption.click();

        const startFreeBtn = page.getByRole('dialog', { name: /Nueva Sesión|New Session/i })
            .getByRole('button', { name: /Iniciar Sesión Libre|Start Free Session/i });
        await expect(startFreeBtn).toBeVisible({ timeout: 8000 });
        await startFreeBtn.scrollIntoViewIfNeeded();
        await startFreeBtn.click();

        const addExHeaderBtn = page.getByRole('button', { name: /Añadir ejercicio|Add exercise/ }).last();
        await expect(addExHeaderBtn).toBeVisible({ timeout: 6000 });
        await addExHeaderBtn.click();

        const firstExOption = page.locator('[role="dialog"] button, .modal button').filter({ hasText: /press|squat|curl|banca/i }).first();
        await expect(firstExOption).toBeVisible({ timeout: 6000 });
        await firstExOption.click();

        // Completing a set starts the rest timer in the in-flow dock.
        // (The floating pill never renders outside the workout.)
        const completeSetBtn = page.locator('button[aria-label*="Completar serie" i], button[aria-label*="Complete set" i]').first();
        await expect(completeSetBtn).toBeVisible({ timeout: 6000 });
        await completeSetBtn.click();

        const pill = page.locator('[data-workout-rest-dock]');
        await expect(pill.getByRole('button', { name: /Pausar|Pause/ })).toBeVisible({ timeout: 8000 });

        for (const name of [/Pausar|Pause/, /Reiniciar|Restart/, /Saltar descanso|Skip rest/]) {
            const box = await pill.getByRole('button', { name }).boundingBox();
            expect(box, `${name} bounding box`).not.toBeNull();
            expect(box!.width, `${name} width`).toBeGreaterThanOrEqual(44);
            expect(box!.height, `${name} height`).toBeGreaterThanOrEqual(44);
        }

        await expect(page.getByText(ERROR_BOUNDARY_TEXT)).toHaveCount(0);
    });
});
