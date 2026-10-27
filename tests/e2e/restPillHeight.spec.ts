import { test, expect, type Page } from '@playwright/test';

const ERROR_BOUNDARY_TEXT = /ERROR CRÍTICO|CRITICAL ERROR/;

const seedShowRirProfile = (page: Page) =>
    page.addInitScript(() => {
        localStorage.setItem('il_onboarded_v2', 'true');
        localStorage.setItem('il_tutorial_v2', JSON.stringify({
            home: true, workout: true, history: true, stats: true, mesoSettings: true, nutrition: true,
        }));
        localStorage.setItem('il_cfg_rir', 'true');
    });

test.describe('Rest surfaces remain reachable without overlap (G2)', () => {
    test('focused workout scrolls to its rest controls and final action; effort chips are >=44px', async ({ page }) => {
        await seedShowRirProfile(page);
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

        // Add 4 exercises so the list overflows and the pill can cover content.
        // End-of-list add button (header dup-add removed in Strong parity T1/T2).
        const addExBtn = page.getByRole('button', { name: /Añadir ejercicio|Add exercise/ }).last();
        await expect(addExBtn).toBeVisible({ timeout: 6000 });
        for (let i = 0; i < 4; i++) {
            await addExBtn.click();
            // The dialog excludes already-added exercises, so always take
            // the first remaining match.
            const option = page.locator('[role="dialog"] button, .modal button')
                .filter({ hasText: /press|squat|curl|banca|remo|row|peso muerto|deadlift/i })
                .first();
            await expect(option).toBeVisible({ timeout: 6000 });
            await option.click();
            // Wait for the dialog to close before reopening it.
            await expect(page.locator('[role="dialog"], .modal')).toHaveCount(0, { timeout: 6000 });
        }

        // Completing a set starts the rest pill (compact, with RIR extras).
        const completeSetBtn = page.locator('button[aria-label*="Completar serie" i], button[aria-label*="Complete set" i]').first();
        await expect(completeSetBtn).toBeVisible({ timeout: 6000 });
        await completeSetBtn.click();

        const pill = page.locator('[data-workout-rest-dock]');
        await pill.scrollIntoViewIfNeeded();
        await expect(pill.getByRole('button', { name: /Pausar|Pause/ })).toBeVisible({ timeout: 8000 });
        await expect(pill.getByRole('button', { name: /Fácil|Easy/ })).toBeVisible({ timeout: 8000 });

        // Effort chips measure >=44px tall for real.
        for (const name of [/Fácil|Easy/, /^OK$/, /Duro|Hard/]) {
            const box = await pill.getByRole('button', { name }).boundingBox();
            expect(box, `chip ${name} bounding box`).not.toBeNull();
            expect(box!.height, `chip ${name} height`).toBeGreaterThanOrEqual(44);
        }


        const list = page.locator('#tut-exercise-list');
        const endBtn = list.getByRole('button', { name: /Añadir ejercicio|Add exercise/i }).last();
        await endBtn.scrollIntoViewIfNeeded();
        const btnBox = await endBtn.boundingBox();
        const listBox = await list.boundingBox();
        const restBox = await pill.boundingBox();
        expect(btnBox).not.toBeNull();
        expect(listBox).not.toBeNull();
        expect(restBox).not.toBeNull();
        expect(btnBox!.y).toBeGreaterThanOrEqual(listBox!.y);
        expect(btnBox!.y + btnBox!.height).toBeLessThanOrEqual(listBox!.y + listBox!.height + 1);
        const overlapsRest = btnBox!.y < restBox!.y + restBox!.height && btnBox!.y + btnBox!.height > restBox!.y;
        expect(overlapsRest).toBe(false);

        await expect(page.getByText(ERROR_BOUNDARY_TEXT)).toHaveCount(0);
    });

    test('H1: notif prompt never covers the rest dock', async ({ page }) => {
        await seedShowRirProfile(page);
        await page.addInitScript(() => {
            if (typeof window.Notification !== 'undefined') {
                Object.defineProperty(window.Notification, 'permission', { value: 'default', configurable: true });
            }
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

        // Add one exercise so the session has a set to complete.
        // End-of-list add button (header dup-add removed in Strong parity T1/T2).
        const addExBtn = page.getByRole('button', { name: /Añadir ejercicio|Add exercise/ }).last();
        await expect(addExBtn).toBeVisible({ timeout: 6000 });
        await addExBtn.click();
        const option = page.locator('[role="dialog"] button, .modal button')
            .filter({ hasText: /press|squat|curl|banca|remo|row|peso muerto|deadlift/i })
            .first();
        await expect(option).toBeVisible({ timeout: 6000 });
        await option.click();
        await expect(page.locator('[role="dialog"], .modal')).toHaveCount(0, { timeout: 6000 });

        // Completing a set starts the rest dock in-flow (the floating pill
        // never renders outside the workout).
        const completeSetBtn = page.locator('button[aria-label*="Completar serie" i], button[aria-label*="Complete set" i]').first();
        await expect(completeSetBtn).toBeVisible({ timeout: 6000 });
        await completeSetBtn.click();

        const pill = page.locator('[data-workout-rest-dock]');
        await expect(pill.getByRole('button', { name: /Pausar|Pause/ })).toBeVisible({ timeout: 8000 });
        // Center the dock so the bottom-anchored prompt cannot cover it
        // regardless of scroll position.
        await pill.scrollIntoViewIfNeeded();

        // Fire the real event the timer hook emits on natural rest completion.
        // (A real 90 s rest is impractical in e2e; the event contract itself is
        // covered by timerNotifications.test.ts against the real hook.)
        await page.evaluate(() => window.dispatchEvent(new Event('ironlog:rest-completed')));

        const prompt = page.locator('[role="status"]', { hasText: /aviso|notif/i });
        await expect(prompt).toBeVisible({ timeout: 6000 });

        // The prompt never covers the rest surface (in-flow dock: they must
        // simply not overlap, wherever the dock sits in the list).
        const promptBox = await prompt.boundingBox();
        const pillBox = await pill.boundingBox();
        expect(promptBox).not.toBeNull();
        expect(pillBox).not.toBeNull();
        const overlaps = promptBox!.y < pillBox!.y + pillBox!.height && promptBox!.y + promptBox!.height > pillBox!.y;
        expect(overlaps, 'notif prompt overlaps the rest dock').toBe(false);

        await expect(page.getByText(ERROR_BOUNDARY_TEXT)).toHaveCount(0);
    });
});
