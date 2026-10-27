import { test, expect } from '@playwright/test';

const ERROR_BOUNDARY_TEXT = /ERROR CRÍTICO|CRITICAL ERROR/;

async function startWorkoutWithExercise(page: any) {
    await page.addInitScript(() => {
        localStorage.setItem('il_onboarded_v2', 'true');
        localStorage.setItem('il_tutorial_v2', JSON.stringify({
            home: true, workout: true, history: true, stats: true, mesoSettings: true, nutrition: true,
        }));
        localStorage.setItem('il_training_rest_simple', JSON.stringify(true));
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
}

test.describe('Simple rest timer (Strong parity)', () => {
    test('completing a set opens the fullscreen simple rest with skip', async ({ page }) => {
        await startWorkoutWithExercise(page);
        const completeSetBtn = page.locator('button[aria-label*="Completar serie" i], button[aria-label*="Complete set" i]').first();
        await expect(completeSetBtn).toBeVisible({ timeout: 6000 });
        await completeSetBtn.click();
        const fullscreen = page.locator('[data-testid="simple-rest-fullscreen"]');
        await expect(fullscreen).toBeVisible({ timeout: 8000 });
        const skipBtn = fullscreen.getByRole('button', { name: /Saltar descanso|Skip rest/ });
        await expect(skipBtn).toBeVisible({ timeout: 6000 });
        await skipBtn.click();
        await expect(fullscreen).toHaveCount(0, { timeout: 6000 });
        await expect(page.getByText(ERROR_BOUNDARY_TEXT)).toHaveCount(0);
    });
});

test.describe('Manual rest from label (Strong parity)', () => {
    test('tapping a completed set rest label starts the in-flow rest', async ({ page }) => {
        await page.addInitScript(() => {
            localStorage.setItem('il_onboarded_v2', 'true');
            localStorage.setItem('il_tutorial_v2', JSON.stringify({
                home: true, workout: true, history: true, stats: true, mesoSettings: true, nutrition: true,
            }));
            localStorage.setItem('il_training_rest_autostart', JSON.stringify(false));
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
        const completeSetBtn = page.locator('button[aria-label*="Completar serie" i], button[aria-label*="Complete set" i]').first();
        await expect(completeSetBtn).toBeVisible({ timeout: 6000 });
        await completeSetBtn.click();
        const restLabel = page.getByRole('button', { name: /^\d+:\d\d$/ }).first();
        await expect(restLabel).toBeVisible({ timeout: 8000 });
        await restLabel.click();
        const dock = page.locator('[data-workout-rest-dock]');
        await expect(dock).toBeVisible({ timeout: 8000 });
        await expect(page.getByText(ERROR_BOUNDARY_TEXT)).toHaveCount(0);
    });
});
