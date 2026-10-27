import { test, expect } from '@playwright/test';

test.describe('Exercise details can scroll above sticky footer', () => {
    test.use({ viewport: { width: 390, height: 700 }, isMobile: true, hasTouch: true });

    test('scroll to tonnage, select a mode, save and reopen on a short Android viewport', async ({ page }) => {
        await page.addInitScript(() => {
            localStorage.setItem('il_onboarded_v2', 'true');
            localStorage.setItem('il_tutorial_v2', JSON.stringify({
                home: true, workout: true, history: true, stats: true,
                mesoSettings: true, nutrition: true,
            }));
        });
        await page.goto('/');
        await expect(page.locator('nav[aria-label="Main navigation"]')).toBeVisible({ timeout: 20000 });

        // Exercise library navigation is Pro-gated in a guest account.
        // Enter the same details component through a real free workout.
        await page.getByRole('button', { name: /^(Sesión libre|Freestyle session) ·/ }).click();
        await page.getByRole('dialog', { name: /Iniciar entrenamiento|Start training/ })
            .getByRole('button', { name: /Sesión libre|Freestyle/ }).click();
        await page.getByRole('dialog', { name: /Nueva Sesión|New Session/i })
            .getByRole('button', { name: /Iniciar Sesión Libre|Start Free Session/i }).click();
        await expect(page.locator('#tut-finish-btn')).toBeVisible({ timeout: 10000 });
        await page.getByRole('button', { name: /Añadir ejercicio|Add exercise/ }).last().click();
        const picker = page.locator('[role="dialog"]');
        await expect(picker).toBeVisible();
        await picker.locator('input[type="text"]').first().fill('press banca barra');
        const exerciseOption = picker.getByRole('button', { name: /press banca barra/i }).first();
        await expect(exerciseOption).toBeVisible({ timeout: 10000 });
        await exerciseOption.click();
        const exerciseHeader = page.locator('#tut-exercise-list h3').first();
        await expect(exerciseHeader).toBeVisible({ timeout: 10000 });
        await exerciseHeader.click();

        const dialog = page.getByRole('dialog').last();
        const scroll = dialog.locator('#exercise-detail-scroll');
        await expect(scroll).toBeVisible();
        const options = scroll.locator('button[aria-pressed]');
        await expect(options).toHaveCount(2);
        const before = await scroll.evaluate(el => ({
            height: el.clientHeight, content: el.scrollHeight, top: el.scrollTop,
        }));
        expect(before.content).toBeGreaterThan(before.height + 100);

        // Simulates a finger swipe up on an Android touch display. The Vaul
        // drawer must not intercept the gesture; only the Sheet body scrolls.
        // Wait for Vaul's opening transform to finish before starting a
        // real finger drag. Synthetic scroll-wheel gestures don't exercise
        // the pointer capture path that broke scrolling on Android.
        await page.waitForTimeout(600);
        const rect = await scroll.boundingBox();
        if (!rect) throw new Error('Missing Sheet scroll bounds');
        const client = await page.context().newCDPSession(page);
        const startX = Math.round(rect.x + rect.width / 2);
        const startY = Math.round(Math.min(rect.y + rect.height - 85, page.viewportSize()!.height - 110));
        const endY = Math.round(Math.max(rect.y + 70, startY - 310));
        await client.send('Input.dispatchTouchEvent', {
            type: 'touchStart', touchPoints: [{ x: startX, y: startY, id: 1 }],
        });
        for (let step = 1; step <= 18; step++) {
            const y = startY + (endY - startY) * (step / 18);
            await client.send('Input.dispatchTouchEvent', {
                type: 'touchMove', touchPoints: [{ x: startX, y, id: 1 }],
            });
            await page.waitForTimeout(20);
        }
        await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        await expect.poll(async () => scroll.evaluate(el => el.scrollTop), { timeout: 10000 })
            .toBeGreaterThan(80);
        await options.nth(1).scrollIntoViewIfNeeded();
        await options.nth(1).click();
        await expect(options.nth(1)).toHaveAttribute('aria-pressed', 'true');
        await expect(dialog.getByRole('button', { name: /Guardar|Save/ }).last()).toBeVisible();
        await dialog.getByRole('button', { name: /^Guardar$|^Save$/ }).last().click();

        await exerciseHeader.click();
        const reopened = page.getByRole('dialog').last();
        await reopened.locator('#exercise-detail-scroll button[aria-pressed="true"]').last()
            .scrollIntoViewIfNeeded();
        await expect(reopened.locator('#exercise-detail-scroll button[aria-pressed]').nth(1))
            .toHaveAttribute('aria-pressed', 'true');
    });
});
