import { test, expect, type Page } from '@playwright/test';

// K8: diet tab rename + named skip-session button.
const ERROR_BOUNDARY_TEXT = /ERROR CRÍTICO|CRITICAL ERROR/;

const seed = (page: Page) =>
    page.addInitScript(() => {
        localStorage.setItem('il_onboarded_v2', 'true');
        localStorage.setItem('il_tutorial_v2', JSON.stringify({
            home: true, workout: true, history: true, stats: true, mesoSettings: true, nutrition: true,
        }));
    });

test.describe('K8 ux tweaks', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('diet third tab reads Tendencias, not Historial', async ({ page }) => {
        await seed(page);
        await page.goto('/');
        await page.locator('nav[aria-label="Main navigation"] button', { hasText: /Dieta|Diet/ }).click();
        await expect(page.getByRole('button', { name: /^Hoy$|^Today$/ })).toBeVisible({ timeout: 10000 });
        // Scope to the NutriView sub-tab bar: the bottom nav also has a "Historial" button.
        const labels = await page.evaluate(() => {
            const hoy = [...document.querySelectorAll('button')]
                .find((b) => /^(Hoy|Today)$/.test((b.textContent || '').trim()));
            const root = hoy?.closest('div.h-full');
            if (!root) return [];
            return [...root.querySelectorAll(':scope > div:first-child button')]
                .map((b) => (b.textContent || '').trim());
        });
        expect(labels.length).toBe(3);
        expect(labels).toContain('Tendencias');
        expect(labels).not.toContain('Historial');
        await expect(page.getByText(ERROR_BOUNDARY_TEXT)).toHaveCount(0);
    });

    test('home skip button is named Saltar sesión', async ({ page }) => {
        // No onboard seed: walk the onboarding flow to get an active meso (cf. Journey B).
        await page.goto('/');
        const startBtn = page.getByRole('button', { name: /empezar gratis|get started free|empezar|comenzar/i });
        await expect(startBtn).toBeVisible({ timeout: 8000 });
        await startBtn.scrollIntoViewIfNeeded();
        await page.waitForTimeout(400);
        await startBtn.click({ force: true });
        await expect(page.getByText(/¿cuál es tu nivel\?|what's your level\?/i)).toBeVisible({ timeout: 12000 });
        await page.locator('button:has-text("Siguiente"), button:has-text("Next")').first().click();
        await expect(page.getByText(/¿cuántos días por semana\?|how many days per week\?/i)).toBeVisible({ timeout: 8000 });
        await page.locator('button:has-text("Siguiente"), button:has-text("Next")').first().click();
        await expect(page.getByText(/¿cuál es tu objetivo\?|what's your goal\?/i)).toBeVisible({ timeout: 8000 });
        await page.locator('button:has-text("Siguiente"), button:has-text("Next")').first().click();
        await expect(page.getByText(/¿cuánto tiempo tienes\?|how much time do you have\?/i)).toBeVisible({ timeout: 8000 });
        const analyzeBtn = page.locator('button:has-text("Analizar mi perfil"), button:has-text("Analyze my profile")').first();
        await expect(analyzeBtn).toBeVisible({ timeout: 8000 });
        await analyzeBtn.click({ force: true });
        const customBtn = page.locator('button:has-text("Crear mi propia plantilla"), button:has-text("Create my own template")').first();
        await expect(customBtn).toBeVisible({ timeout: 8000 });
        await customBtn.click({ force: true });
        await expect(page.getByRole('heading', { name: /nueva rutina|new routine|editar rutina/i })).toBeVisible({ timeout: 10000 });
        const addSlotBtn = page.locator('button:has-text("Añadir Slot"), button:has-text("+ Slot"), button:has-text("Add Exercise Slot")').first();
        await expect(addSlotBtn).toBeVisible({ timeout: 6000 });
        await addSlotBtn.click();
        await page.waitForTimeout(400);
        const selectExBtn = page.locator('button:has-text("Seleccionar ejercicio"), button:has-text("Select exercise")').first();
        await expect(selectExBtn).toBeVisible({ timeout: 6000 });
        await selectExBtn.click();
        await page.waitForTimeout(400);
        const firstEx = page.locator('[role="dialog"] button, .modal button').filter({ hasText: /press|squat|curl|banca/i }).first();
        await expect(firstEx).toBeVisible({ timeout: 6000 });
        await firstEx.click();
        await page.waitForTimeout(400);
        const startMesoBtn = page.locator('button:has-text("Comenzar"), button:has-text("Start")').first();
        await expect(startMesoBtn).toBeVisible({ timeout: 6000 });
        await startMesoBtn.click();
        await page.waitForTimeout(400);
        const confirmStart = page.locator('button:has-text("Empezar Ciclo"), button:has-text("Start Cycle"), button:has-text("Iniciar Mesociclo"), button:has-text("Iniciar")').last();
        await expect(confirmStart).toBeVisible({ timeout: 6000 });
        await confirmStart.click();
        await expect(page.locator('#tut-up-next')).toBeVisible({ timeout: 8000 });
        const skip = page.locator('#tut-up-next').getByRole('button', { name: 'Saltar sesión' });
        await expect(skip).toBeVisible();
        await expect(skip).toHaveAttribute('title', 'Saltar sesión');
        await expect(page.getByText(ERROR_BOUNDARY_TEXT)).toHaveCount(0);
    });
});
