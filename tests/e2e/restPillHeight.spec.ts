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

test.describe('Rest pill height compensation (G2)', () => {
    test('padded list scrolls last content above the pill; effort chips are >=44px', async ({ page }) => {
        await seedShowRirProfile(page);
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

        // Add 4 exercises so the list overflows and the pill can cover content.
        const addExHeaderBtn = page.locator('button[title*="Añadir ejercicio" i], button[title*="Add exercise" i], button[title*="Añadir Ejercicio" i]').first();
        await expect(addExHeaderBtn).toBeVisible({ timeout: 6000 });
        for (let i = 0; i < 4; i++) {
            await addExHeaderBtn.click();
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

        const pill = page.locator('aside');
        await expect(pill.getByRole('button', { name: '-10s' })).toBeVisible({ timeout: 8000 });
        await expect(pill.getByRole('button', { name: /Fácil|Easy/ })).toBeVisible({ timeout: 8000 });

        // Effort chips measure >=44px tall for real.
        for (const name of [/Fácil|Easy/, /^OK$/, /Duro|Hard/]) {
            const box = await pill.getByRole('button', { name }).boundingBox();
            expect(box, `chip ${name} bounding box`).not.toBeNull();
            expect(box!.height, `chip ${name} height`).toBeGreaterThanOrEqual(44);
        }

        // The CSS var tracks the real pill height.
        const pillBox = await pill.boundingBox();
        expect(pillBox).not.toBeNull();
        const pillVar = await page.evaluate(() =>
            document.documentElement.style.getPropertyValue('--rest-pill-height'));
        expect(Math.abs(parseFloat(pillVar) - pillBox!.height)).toBeLessThanOrEqual(1);

        // Scroll the list to the very end: padding must clear the pill zone.
        const list = page.locator('#tut-exercise-list');
        await list.evaluate((el) => el.scrollTo(0, el.scrollHeight));
        const paddingBottom = await list.evaluate((el) => parseFloat(getComputedStyle(el).paddingBottom));
        expect(paddingBottom).toBeGreaterThanOrEqual(48 + 16 + pillBox!.height - 1);

        // The end-of-list "add exercise" button sits fully above the pill.
        const endBtn = list.locator('button', { hasText: /Añadir ejercicio|Add exercise/i }).last();
        await expect(endBtn).toBeVisible();
        const btnBox = await endBtn.boundingBox();
        expect(btnBox).not.toBeNull();
        expect(btnBox!.y + btnBox!.height).toBeLessThanOrEqual(pillBox!.y + 1);

        await expect(page.getByText(ERROR_BOUNDARY_TEXT)).toHaveCount(0);
    });
});
