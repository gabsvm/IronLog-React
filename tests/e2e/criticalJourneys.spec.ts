import { test, expect } from '@playwright/test';

test.describe('GainsLab Critical Journeys', () => {
    test.beforeEach(async ({ page }) => {
        // Clear local storage and sessionStorage to start fresh
        await page.goto('/');
        await page.evaluate(() => {
            localStorage.clear();
            sessionStorage.clear();
        });
    });

    test('Journey A — Suggested onboarding flow leads to Home with recommended plan', async ({ page }) => {
        await page.goto('/');

        // On landing, scroll to and click Get Started button
        const startBtn = page.getByRole('button', { name: /empezar gratis|get started free|empezar|comenzar/i });
        await expect(startBtn).toBeVisible({ timeout: 8000 });
        await startBtn.scrollIntoViewIfNeeded();
        await page.waitForTimeout(400);
        await startBtn.click({ force: true });

        // Step 0: Level
        await expect(page.getByText(/¿cuál es tu nivel\?|what's your level\?/i)).toBeVisible({ timeout: 12000 });
        await page.locator('button:has-text("Siguiente"), button:has-text("Next")').first().click();

        // Step 1: Frequency
        await expect(page.getByText(/¿cuántos días por semana\?|how many days per week\?/i)).toBeVisible({ timeout: 8000 });
        await page.locator('button:has-text("Siguiente"), button:has-text("Next")').first().click();

        // Step 2: Goal
        await expect(page.getByText(/¿cuál es tu objetivo\?|what's your goal\?/i)).toBeVisible({ timeout: 8000 });
        await page.locator('button:has-text("Siguiente"), button:has-text("Next")').first().click();

        // Step 3: Duration
        await expect(page.getByText(/¿cuánto tiempo tienes\?|how much time do you have\?/i)).toBeVisible({ timeout: 8000 });
        const analyzeBtn = page.locator('button:has-text("Analizar mi perfil"), button:has-text("Analyze my profile")').first();
        await expect(analyzeBtn).toBeVisible({ timeout: 8000 });
        await analyzeBtn.click({ force: true });

        // Step 4: Recommendation screen -> Apply suggested routine
        const applyBtn = page.locator('button:has-text("Comenzar con rutina sugerida"), button:has-text("Start with suggested routine")').first();
        await expect(applyBtn).toBeVisible({ timeout: 8000 });
        await applyBtn.click({ force: true });

        // Should land on home with semantic navigation bar
        await expect(page.locator('nav[aria-label="Main navigation"]')).toBeVisible({ timeout: 10000 });
    });

    test('Journey C — Quick Start sheet opens workout initiation', async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => {
            localStorage.setItem('il_onboarded_v2', 'true');
        });
        await page.reload();

        // Check for Main navigation
        const nav = page.locator('nav[aria-label="Main navigation"]');
        await expect(nav).toBeVisible({ timeout: 8000 });

        // Click '+' primary action button in navigation
        const plusBtn = page.locator('button[aria-label*="start" i], button[aria-label*="iniciar" i]').first();
        await expect(plusBtn).toBeVisible({ timeout: 5000 });
        await plusBtn.click();

        // Quick start sheet options should be visible
        await expect(page.getByText(/freestyle|libre|quick start/i).first()).toBeVisible({ timeout: 5000 });
    });

    test('Journey D — Active workout state persistence across reload', async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => {
            localStorage.setItem('il_onboarded_v2', 'true');
            const testSession = {
                id: 1700000000000,
                dayIdx: 0,
                name: 'Persistence Test Workout',
                startTime: Date.now() - 60000,
                mesoId: 1,
                week: 1,
                exercises: [
                    {
                        id: 'bench_press',
                        name: 'Barbell Bench Press',
                        muscle: 'chest',
                        instanceId: 1001,
                        sets: [
                            { id: 1, weight: '80', reps: '8', completed: true, type: 'regular' },
                            { id: 2, weight: '85', reps: '6', completed: false, type: 'regular' },
                        ],
                    },
                ],
            };
            localStorage.setItem('il_session_v16', JSON.stringify(testSession));
        });

        // Deep entry into active session via PWA shortcut action
        await page.goto('/?action=start');

        // Verify active workout view is mounted via Finish button
        const finishBtn = page.locator('#tut-finish-btn, button:has-text("Terminar"), button:has-text("Finish")').first();
        await expect(finishBtn).toBeVisible({ timeout: 10000 });

        // Reload page to simulate app refresh / backgrounding
        await page.reload();

        // Open Quick Start to resume the persistent session
        const plusBtn = page.locator('button[aria-label*="start" i], button[aria-label*="iniciar" i]').first();
        await expect(plusBtn).toBeVisible({ timeout: 8000 });
        await plusBtn.click();
        await page.waitForTimeout(500);

        // Resume live session
        const resumeBtn = page.locator('button:has-text("Reanudar"), button:has-text("Resume")').first();
        await expect(resumeBtn).toBeVisible({ timeout: 6000 });
        await resumeBtn.click({ force: true });

        // Workout view should be resumed and mounted
        await expect(finishBtn).toBeVisible({ timeout: 10000 });
    });
});
