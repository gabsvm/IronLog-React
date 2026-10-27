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

        // Add 2 distinct exercises via the end-of-list add button, without touching any rail.
        const addExHeaderBtn = page.getByRole('button', { name: /Añadir ejercicio|Add exercise/ }).last();
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

// Task 2 (Strong parity): single-row Strong-style session header — no progress
// bar, text-only Finish always visible, session stats under the title.
test.describe('Strong parity T2: Strong-style session header', () => {
    test('no progressbar, Finish always visible, X/Y stats under title', async ({ page }) => {
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

        // Add 2 exercises via the end-of-list add button (dup header + is gone).
        const addExBtn = page.getByRole('button', { name: /Añadir ejercicio|Add exercise/ }).last();
        for (let i = 0; i < 2; i++) {
            await addExBtn.click();
            const dialog = page.locator('[role="dialog"]').last();
            await expect(dialog).toBeVisible({ timeout: 6000 });
            const option = dialog.locator('button[class*="text-left"]').nth(i);
            await expect(option).toBeVisible({ timeout: 6000 });
            await option.click();
            await page.waitForTimeout(400);
        }

        // No progress bar anywhere in the workout view.
        await expect(page.locator('[role="progressbar"]')).toHaveCount(0);

        // No duplicate "+" add button in the header (only end-of-list remains).
        await expect(page.locator(
            'button[title*="Añadir ejercicio" i], button[title*="Add exercise" i]',
        )).toHaveCount(0);

        // Session stats X/Y visible under the title, next to the timer.
        await expect(page.getByTestId('workout-session-stats')).toContainText(/\d+\/\d+/, { timeout: 8000 });

        // Finish is a text-only action, visible with 0 sets completed, >=44px target.
        const finishBtn = page.locator('#tut-finish-btn');
        await expect(finishBtn).toBeVisible();
        const box = await finishBtn.boundingBox();
        expect(box?.height).toBeGreaterThanOrEqual(44);

        // Complete every set — Finish stays visible with all sets done.
        const completeBtns = page.locator(
            '#tut-exercise-list button[aria-label*="Completar serie" i], #tut-exercise-list button[aria-label*="Complete set" i]',
        );
        const total = await completeBtns.count();
        expect(total).toBeGreaterThan(0);
        for (let i = 0; i < total; i++) {
            await completeBtns.nth(i).click();
            await page.waitForTimeout(150);
        }
        await expect(finishBtn).toBeVisible();
        await expect(page.getByTestId('workout-session-stats')).toContainText(/\d+\/\d+/);
    });
});

// Task 3 (Strong parity): flat exercise card (radius 0) with a single 48dp
// exercise band holding the name + a rest chip (m:ss) that starts the
// existing rest dock/overlay.
test.describe('Strong parity T3: flat exercise band with rest chip', () => {
    test('card radius 0, rest chip 1:30 opens rest dock', async ({ page }) => {
        await page.addInitScript(() => {
            localStorage.setItem('il_onboarded_v2', 'true');
            localStorage.setItem('il_tutorial_v2', JSON.stringify({
                home: true, workout: true, history: true, stats: true, mesoSettings: true, nutrition: true,
            }));
        });
        await page.goto('/');
        await expect(page.locator('nav[aria-label="Main navigation"]')).toBeVisible({ timeout: 20000 });

        await page.getByRole('button', { name: /^(Sesi\u00f3n libre|Freestyle session) \u00b7/ }).click();
        await page.getByRole('dialog', { name: /Iniciar entrenamiento|Start training/ })
            .getByRole('button', { name: /Sesi\u00f3n libre|Freestyle/ }).click();
        await page.getByRole('dialog', { name: /Nueva Sesi\u00f3n|New Session/i })
            .getByRole('button', { name: /Iniciar Sesi\u00f3n Libre|Start Free Session/i }).click();
        await expect(page.locator('#tut-finish-btn')).toBeVisible({ timeout: 10000 });

        // Add one exercise via the end-of-list add button.
        await page.getByRole('button', { name: /A\u00f1adir ejercicio|Add exercise/ }).last().click();
        const dialog = page.locator('[role="dialog"]').last();
        await expect(dialog).toBeVisible({ timeout: 6000 });
        const option = dialog.locator('button[class*="text-left"]').first();
        await expect(option).toBeVisible({ timeout: 6000 });
        await option.click();
        await page.waitForTimeout(400);

        // Flat card: computed border-radius is 0px.
        const card = page.locator('#tut-exercise-list .card-strong').first();
        await expect(card).toBeVisible({ timeout: 8000 });
        const radius = await card.evaluate((el) => getComputedStyle(el).borderRadius);
        expect(radius).toBe('0px');

        // Rest chip next to the name shows the resolved duration (default 90s -> 1:30).
        const chip = page.getByTestId('exercise-rest-chip').first();
        await expect(chip).toBeVisible({ timeout: 8000 });
        await expect(chip).toContainText('1:30');

        // Clicking the chip opens the existing rest surface (in-flow dock).
        await chip.click();
        await expect(page.locator('[data-workout-rest-dock="true"]')).toBeVisible({ timeout: 8000 });
    });
});
