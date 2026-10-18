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
        const plus = page.locator('nav[aria-label="Main navigation"] button[aria-label*="Iniciar" i], nav[aria-label="Main navigation"] button[aria-label*="Start" i]').first();
        await plus.click();
        await page.locator('button:has-text("Sesión libre"), button:has-text("Freestyle")').first().click();
        await page.locator('button:has-text("Iniciar Sesión Libre"), button:has-text("Start Free Session"), button:has-text("Iniciar sesión libre")').first().click();
        await expect(page.locator('#tut-finish-btn')).toBeVisible({ timeout: 10000 });
        await page.locator('button[title*="Añadir ejercicio" i], button[title*="Add exercise" i]').first().click();
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
        const rect = await scroll.boundingBox();
        if (!rect) throw new Error('Missing Sheet scroll bounds');
        const client = await page.context().newCDPSession(page);
        await client.send('Input.synthesizeScrollGesture', {
            x: rect.x + rect.width / 2,
            y: rect.y + Math.min(250, rect.height / 2),
            xDistance: 0, yDistance: -450,
            gestureSourceType: 'touch', speed: 650,
        });
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
