import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

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
    test('card radius 0, rest chip 2:00 opens rest dock', async ({ page }) => {
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

        // Rest chip next to the name shows the resolved duration (default 120s -> 2:00).
        const chip = page.getByTestId('exercise-rest-chip').first();
        await expect(chip).toBeVisible({ timeout: 8000 });
        await expect(chip).toContainText('2:00');

        // Clicking the chip opens the existing rest surface (in-flow dock).
        await chip.click();
        await expect(page.locator('[data-workout-rest-dock="true"]')).toBeVisible({ timeout: 8000 });
    });
});
// Task 4 (Strong parity): flat 36dp sets header, flat set rows, exactly one
// centered 48dp "Add set" per exercise; remove-set lives only in the card menu.
test.describe('Strong parity T4: flat header/rows, single Add set', () => {
    test('36px header, one Add set >=44px, no footer remove button, remove in menu', async ({ page }) => {
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

        const card = page.locator('#tut-exercise-list .card-strong').first();
        await expect(card).toBeVisible({ timeout: 8000 });

        // Sets header is exactly 36px tall (h-9) with the raised surface.
        const header = card.getByTestId('sets-header');
        await expect(header).toBeVisible({ timeout: 8000 });
        const headerBox = await header.boundingBox();
        expect(headerBox).not.toBeNull();
        expect(Math.round(headerBox!.height)).toBe(36);

        // Exactly one "Add set" button per exercise, centered and >=44px tall.
        const addBtns = card.getByRole('button', { name: /A\u00f1adir serie|Add set/ });
        await expect(addBtns).toHaveCount(1, { timeout: 8000 });
        const addBox = await addBtns.first().boundingBox();
        expect(addBox).not.toBeNull();
        expect(addBox!.height).toBeGreaterThanOrEqual(44);
        const cardBox = await card.boundingBox();
        const addCenterX = addBox!.x + addBox!.width / 2;
        const cardCenterX = cardBox!.x + cardBox!.width / 2;
        expect(Math.abs(addCenterX - cardCenterX)).toBeLessThan(24);

        // No remove-set button in the footer (menu closed => not rendered at all).
        await expect(page.getByRole('button', { name: /Quitar serie|Remove set/ })).toHaveCount(0);

        // The capability survives inside the card menu.
        await card.getByRole('button', { name: /More options|M\u00e1s opciones/ }).click();
        await expect(card.getByRole('menuitem', { name: /Quitar serie|Remove set/ })).toBeVisible({ timeout: 6000 });
    });
});
// Task 5 (Strong parity): in-app numeric keypad when editing weight/reps.
// Mobile (coarse pointer): focusing a weight input shows [data-testid="set-keypad"];
// typing 2,0 yields 20; next moves focus to reps; done closes and the value
// persists after completing the set. Desktop: no keypad, native entry intact.
test.describe('Strong parity T5: in-app numeric keypad (mobile)', () => {
    const startFreestyleWithBench = async (page: Page) => {
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

        await page.getByRole('button', { name: /Añadir ejercicio|Add exercise/ }).last().click();
        const dialog = page.locator('[role="dialog"]').last();
        await expect(dialog).toBeVisible({ timeout: 6000 });
        // Deterministic barbell pick: guarantees weight + reps inputs.
        await dialog.getByLabel(/Buscar ejercicios|Search exercises/).fill('press banca');
        const option = dialog.locator('button[class*="text-left"]').first();
        await expect(option).toBeVisible({ timeout: 6000 });
        await option.click();
        await page.waitForTimeout(400);
    };

    test('weight focus shows keypad; 2,0 -> 20; next focuses reps; done closes, value persists', async ({ page }) => {
        await startFreestyleWithBench(page);
        const card = page.locator('#tut-exercise-list .card-strong').first();
        await expect(card).toBeVisible({ timeout: 8000 });

        const weightInput = card.getByLabel(/^(peso|weight)$/i).first();
        const repsInput = card.getByLabel(/^reps$/i).first();
        await expect(weightInput).toBeVisible({ timeout: 8000 });

        // No keypad before focusing anything.
        await expect(page.getByTestId('set-keypad')).toHaveCount(0);

        await weightInput.click();
        const keypad = page.getByTestId('set-keypad');
        await expect(keypad).toBeVisible({ timeout: 6000 });

        // Type 2,0 through the in-app keypad only (no physical typing).
        await keypad.getByRole('button', { name: '2', exact: true }).click();
        await keypad.getByRole('button', { name: '0', exact: true }).click();
        await expect(weightInput).toHaveValue('20');

        // "Next" moves focus to reps, keypad stays open on the reps value.
        await keypad.getByTestId('set-keypad-next').click();
        await expect(repsInput).toBeFocused({ timeout: 6000 });
        await expect(keypad).toBeVisible();
        await keypad.getByRole('button', { name: '8', exact: true }).click();
        await expect(repsInput).toHaveValue('8');

        // "Done" closes the keypad; values stay in the inputs.
        await keypad.getByTestId('set-keypad-done').click();
        await expect(page.getByTestId('set-keypad')).toHaveCount(0);
        await expect(weightInput).toHaveValue('20');
        await expect(repsInput).toHaveValue('8');

        // Completing the set persists the keypad-entered value.
        await card.getByRole('button', { name: /Completar serie|Complete set/i }).first().click();
        await expect(weightInput).toHaveValue('20');
        await expect(repsInput).toHaveValue('8');
    });
});

test.describe('Strong parity T5: no keypad on desktop', () => {
    test.use({ viewport: { width: 1280, height: 800 }, hasTouch: false, isMobile: false });

    test('weight focus never shows the keypad; native entry works', async ({ page }) => {
        await page.addInitScript(() => {
            localStorage.setItem('il_onboarded_v2', 'true');
            localStorage.setItem('il_tutorial_v2', JSON.stringify({
                home: true, workout: true, history: true, stats: true, mesoSettings: true, nutrition: true,
            }));
        });
        await page.goto('/');
        // Desktop shell: sidebar Strong navigation, no bottom bar.
        await expect(page.locator('nav[aria-label="Strong navigation"]')).toBeVisible({ timeout: 20000 });

        await page.getByRole('button', { name: /^(Sesión libre|Freestyle session) ·/ }).click();
        await page.getByRole('dialog', { name: /Iniciar entrenamiento|Start training/ })
            .getByRole('button', { name: /Sesión libre|Freestyle/ }).click();
        await page.getByRole('dialog', { name: /Nueva Sesión|New Session/i })
            .getByRole('button', { name: /Iniciar Sesión Libre|Start Free Session/i }).click();
        await expect(page.locator('#tut-finish-btn')).toBeVisible({ timeout: 10000 });

        await page.getByRole('button', { name: /Añadir ejercicio|Add exercise/ }).last().click();
        const dialog = page.locator('[role="dialog"]').last();
        await expect(dialog).toBeVisible({ timeout: 6000 });
        await dialog.getByLabel(/Buscar ejercicios|Search exercises/).fill('press banca');
        const option = dialog.locator('button[class*="text-left"]').first();
        await expect(option).toBeVisible({ timeout: 6000 });
        await option.click();
        await page.waitForTimeout(400);

        const card = page.locator('#tut-exercise-list .card-strong').first();
        await expect(card).toBeVisible({ timeout: 8000 });
        const weightInput = card.getByLabel(/^(peso|weight)$/i).first();
        await weightInput.click();
        await page.waitForTimeout(500);
        await expect(page.getByTestId('set-keypad')).toHaveCount(0);

        // Native entry is untouched on desktop (input stays editable).
        const readOnly = await weightInput.evaluate((el) => (el as HTMLInputElement).readOnly);
        expect(readOnly).toBe(false);
        await weightInput.fill('20');
        await expect(weightInput).toHaveValue('20');
    });
});
