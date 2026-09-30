import { test, expect } from '@playwright/test';

test.describe('GainsLab Critical Journeys', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => {
            localStorage.clear();
            sessionStorage.clear();
            try {
                indexedDB.deleteDatabase('keyval-store');
            } catch (_) {}
        });
    });

    test('Journey A — Suggested onboarding flow leads to Home with recommended plan and opens session', async ({ page }) => {
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

        // Up next card exists and can actually be opened
        const upNextCard = page.locator('#tut-up-next');
        await expect(upNextCard).toBeVisible({ timeout: 8000 });
        await upNextCard.click();

        // Proves workout view is mounted with finish button
        const finishBtn = page.locator('#tut-finish-btn');
        await expect(finishBtn).toBeVisible({ timeout: 10000 });
    });

    test('Journey B — Custom onboarding flow leads to editor and persisted personal routine', async ({ page }) => {
        await page.goto('/');

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

        // Choose "Crear mi propia plantilla"
        const customBtn = page.locator('button:has-text("Crear mi propia plantilla"), button:has-text("Create my own template")').first();
        await expect(customBtn).toBeVisible({ timeout: 8000 });
        await customBtn.click({ force: true });

        // Lands in program editor
        await expect(page.getByRole('heading', { name: /nueva rutina|new routine|editar rutina/i })).toBeVisible({ timeout: 10000 });

        // Add a slot
        const addSlotBtn = page.locator('button:has-text("Añadir Slot"), button:has-text("+ Slot"), button:has-text("Add Exercise Slot")').first();
        await expect(addSlotBtn).toBeVisible({ timeout: 6000 });
        await addSlotBtn.click();
        await page.waitForTimeout(400);

        // Select exercise for slot
        const selectExBtn = page.locator('button:has-text("Seleccionar ejercicio"), button:has-text("Select exercise")').first();
        await expect(selectExBtn).toBeVisible({ timeout: 6000 });
        await selectExBtn.click();
        await page.waitForTimeout(400);

        const firstEx = page.locator('[role="dialog"] button, .modal button').filter({ hasText: /press|squat|curl|banca/i }).first();
        await expect(firstEx).toBeVisible({ timeout: 6000 });
        await firstEx.click();
        await page.waitForTimeout(400);

        // Click Start / Comenzar
        const startMesoBtn = page.locator('button:has-text("Comenzar"), button:has-text("Start")').first();
        await expect(startMesoBtn).toBeVisible({ timeout: 6000 });
        await startMesoBtn.click();
        await page.waitForTimeout(400);

        // Confirm start in modal
        const confirmStart = page.locator('button:has-text("Empezar Ciclo"), button:has-text("Start Cycle"), button:has-text("Iniciar Mesociclo"), button:has-text("Iniciar")').last();
        await expect(confirmStart).toBeVisible({ timeout: 6000 });
        await confirmStart.click();

        // Lands on Home with active personal mesocycle
        await expect(page.locator('nav[aria-label="Main navigation"]')).toBeVisible({ timeout: 10000 });
        await expect(page.locator('#tut-up-next')).toBeVisible({ timeout: 8000 });
    });

    test('Journey C — Quick Start freestyle workout creation, sets, finish, summary, and History', async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => {
            localStorage.setItem('il_onboarded_v2', 'true');
            localStorage.setItem('il_tutorial_v2', JSON.stringify({
                home: true, workout: true, history: true, stats: true, mesoSettings: true, nutrition: true
            }));
        });
        await page.reload();

        // Open Quick Start sheet via central primary action in bottom nav
        const plusBtn = page.locator('nav[aria-label="Main navigation"] button[aria-label*="Iniciar" i], nav[aria-label="Main navigation"] button[aria-label*="Start" i]').first();
        await expect(plusBtn).toBeVisible({ timeout: 8000 });
        await plusBtn.click();
        await page.waitForTimeout(500);

        // Start Freestyle Gym session
        const freestyleOption = page.locator('button:has-text("Sesión libre"), button:has-text("Freestyle")').first();
        await expect(freestyleOption).toBeVisible({ timeout: 6000 });
        await freestyleOption.click();
        await page.waitForTimeout(500);

        // Start button in modal: "Iniciar Sesión Libre" / "Start Free Session"
        const startFreeBtn = page.locator('button:has-text("Iniciar Sesión Libre"), button:has-text("Start Free Session"), button:has-text("Iniciar sesión libre")').first();
        await expect(startFreeBtn).toBeVisible({ timeout: 8000 });
        await page.waitForTimeout(400);
        await startFreeBtn.scrollIntoViewIfNeeded();
        await startFreeBtn.click();
        await page.waitForTimeout(500);

        // Workout view is mounted
        const finishBtn = page.locator('#tut-finish-btn');
        await expect(finishBtn).toBeVisible({ timeout: 10000 });

        // Add an exercise via header plus button
        const addExHeaderBtn = page.locator('button[title*="Añadir ejercicio" i], button[title*="Add exercise" i], button[title*="Añadir Ejercicio" i]').first();
        await expect(addExHeaderBtn).toBeVisible({ timeout: 6000 });
        await addExHeaderBtn.click();
        await page.waitForTimeout(500);

        // Pick an exercise from ExerciseSelector
        const firstExOption = page.locator('[role="dialog"] button, .modal button').filter({ hasText: /press|squat|curl|banca/i }).first();
        await expect(firstExOption).toBeVisible({ timeout: 6000 });
        await firstExOption.click();
        await page.waitForTimeout(500);

        // Complete the first set
        const completeSetBtn = page.locator('button[aria-label*="Completar serie" i], button[aria-label*="Complete set" i]').first();
        await expect(completeSetBtn).toBeVisible({ timeout: 6000 });
        await completeSetBtn.click();
        await page.waitForTimeout(400);

        // Finish workout
        await finishBtn.click();
        await page.waitForTimeout(400);

        // Confirm finish in modal
        const confirmFinishBtn = page.locator('button:has-text("Terminar"), button:has-text("Finish")').last();
        await expect(confirmFinishBtn).toBeVisible({ timeout: 5000 });
        await confirmFinishBtn.click();

        // Arrive at SessionSummaryView
        const summaryDoneBtn = page.locator('button:has-text("Finalizar y Volver"), button:has-text("Finish & Go Home")').first();
        await expect(summaryDoneBtn).toBeVisible({ timeout: 10000 });
        await summaryDoneBtn.click();

        // Back on Home with navigation
        const nav = page.locator('nav[aria-label="Main navigation"]');
        await expect(nav).toBeVisible({ timeout: 8000 });

        // Navigate to History view and verify the completed workout exists
        const historyNavBtn = page.locator('button[aria-label*="Historial" i], button[aria-label*="History" i], nav button:has-text("Historial"), nav button:has-text("History")').first();
        await expect(historyNavBtn).toBeVisible({ timeout: 5000 });
        await historyNavBtn.click();
        await page.waitForTimeout(500);

        // History entry should exist
        await expect(page.locator('text=/Sesión Libre|Freestyle|min|reps/i').first()).toBeVisible({ timeout: 8000 });
    });

    test('Journey D — Active workout edited values and set completion survive persistence boundary', async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => {
            localStorage.setItem('il_onboarded_v2', 'true');
            localStorage.setItem('il_tutorial_v2', JSON.stringify({
                home: true, workout: true, history: true, stats: true, mesoSettings: true, nutrition: true
            }));
        });
        await page.reload();

        // Open Quick Start
        const plusBtn = page.locator('nav[aria-label="Main navigation"] button[aria-label*="Iniciar" i], nav[aria-label="Main navigation"] button[aria-label*="Start" i]').first();
        await expect(plusBtn).toBeVisible({ timeout: 8000 });
        await plusBtn.click();
        await page.waitForTimeout(500);

        // Start Freestyle Gym session
        const freestyleOption = page.locator('button:has-text("Sesión libre"), button:has-text("Freestyle")').first();
        await expect(freestyleOption).toBeVisible({ timeout: 6000 });
        await freestyleOption.click();
        await page.waitForTimeout(500);

        const startFreeBtn = page.locator('button:has-text("Iniciar Sesión Libre"), button:has-text("Start Free Session"), button:has-text("Iniciar sesión libre")').first();
        await expect(startFreeBtn).toBeVisible({ timeout: 8000 });
        await page.waitForTimeout(400);
        await startFreeBtn.scrollIntoViewIfNeeded();
        await startFreeBtn.click();
        await page.waitForTimeout(500);

        // Add an exercise
        const addExHeaderBtn = page.locator('button[title*="Añadir ejercicio" i], button[title*="Add exercise" i], button[title*="Añadir Ejercicio" i]').first();
        await expect(addExHeaderBtn).toBeVisible({ timeout: 6000 });
        await addExHeaderBtn.click();
        await page.waitForTimeout(500);

        const firstExOption = page.locator('[role="dialog"] button, .modal button').filter({ hasText: /press|squat|curl|banca/i }).first();
        await expect(firstExOption).toBeVisible({ timeout: 6000 });
        await firstExOption.click();
        await page.waitForTimeout(500);

        // Edit weight and reps in first set
        const weightInput = page.locator('input[type="number"][inputmode="decimal"], input[placeholder="kg"]').first();
        await expect(weightInput).toBeVisible({ timeout: 5000 });
        await weightInput.fill('92.5');

        const repsInput = page.locator('input[placeholder="reps"], input[placeholder="8-12"]').first();
        if (await repsInput.isVisible()) {
            await repsInput.fill('11');
        }

        // Complete the set
        const completeSetBtn = page.locator('button[aria-label*="Completar serie" i], button[aria-label*="Complete set" i]').first();
        await expect(completeSetBtn).toBeVisible({ timeout: 5000 });
        await completeSetBtn.click();
        await page.waitForTimeout(400);

        // Trigger production backgrounding/pagehide persistence boundary
        await page.evaluate(() => {
            document.dispatchEvent(new Event('visibilitychange'));
            window.dispatchEvent(new Event('pagehide'));
        });

        // Simulate application restart / page refresh
        await page.reload();
        await page.waitForTimeout(500);

        // Reopen Quick Start to resume the active workout
        const plusBtnAfterReload = page.locator('nav[aria-label="Main navigation"] button[aria-label*="Iniciar" i], nav[aria-label="Main navigation"] button[aria-label*="Start" i]').first();
        await expect(plusBtnAfterReload).toBeVisible({ timeout: 8000 });
        await plusBtnAfterReload.click();
        await page.waitForTimeout(500);

        const resumeBtn = page.locator('button:has-text("Reanudar"), button:has-text("Resume")').first();
        await expect(resumeBtn).toBeVisible({ timeout: 6000 });
        await resumeBtn.click({ force: true });

        // Workout view is resumed and edited values survived
        const resumedFinishBtn = page.locator('#tut-finish-btn');
        await expect(resumedFinishBtn).toBeVisible({ timeout: 10000 });

        const resumedWeightInput = page.locator('input[type="number"][inputmode="decimal"], input[placeholder="kg"]').first();
        await expect(resumedWeightInput).toHaveValue('92.5');

        // Completed set status survived
        const completedBtnAfterResume = page.locator('button[aria-label*="Serie completada" i], button[aria-label*="Set completed" i]').first();
        await expect(completedBtnAfterResume).toBeVisible({ timeout: 5000 });
    });

    test('Journey E — Fresh-device cloud restore decision preserves local user data', async ({ page }) => {
        await page.goto('/');

        // 1. Verify fresh empty installation allows auto-restore
        const isFreshEmpty = await page.evaluate(() => {
            const fn = (window as any).__ironlog_isMeaningfullyEmptyLocalState;
            if (typeof fn !== 'function') return null;
            return fn({
                activeSession: null,
                activeMeso: null,
                logs: [],
                nutritionLogs: [],
                cardioSessions: [],
                bodyLogs: [],
                customFoods: [],
                personalTemplates: [],
                exercises: [],
                userProfile: null,
            });
        });
        expect(isFreshEmpty).toBe(true);

        // 2. Verify device with meaningful local user data (e.g. nutrition tracking only) is NOT treated as empty
        const isNutritionUserEmpty = await page.evaluate(() => {
            const fn = (window as any).__ironlog_isMeaningfullyEmptyLocalState;
            if (typeof fn !== 'function') return null;
            return fn({
                activeSession: null,
                activeMeso: null,
                logs: [],
                nutritionLogs: [{ date: '2026-09-30', totalCalories: 2500 }],
                cardioSessions: [],
                bodyLogs: [],
                customFoods: [],
                personalTemplates: [],
                exercises: [],
                userProfile: null,
            });
        });
        expect(isNutritionUserEmpty).toBe(false);

        // 3. Verify device with custom template or custom foods is NOT treated as empty
        const isCustomTemplateUserEmpty = await page.evaluate(() => {
            const fn = (window as any).__ironlog_isMeaningfullyEmptyLocalState;
            if (typeof fn !== 'function') return null;
            return fn({
                activeSession: null,
                activeMeso: null,
                logs: [],
                nutritionLogs: [],
                cardioSessions: [],
                bodyLogs: [],
                customFoods: [],
                personalTemplates: [{ id: 'pt1', name: 'My Routine' }],
                exercises: [],
                userProfile: null,
            });
        });
        expect(isCustomTemplateUserEmpty).toBe(false);
    });
});
