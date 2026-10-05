import { test, expect } from '@playwright/test';

// U8: the session summary can be shared as a PNG (web: download fallback).
test.describe('U8: share session summary image', () => {
    test.use({ viewport: { width: 390, height: 844 }, acceptDownloads: true });

    test('finishing a workout and tapping "Compartir imagen" produces a PNG', async ({ page }) => {
        await page.addInitScript(() => {
            localStorage.setItem('il_onboarded_v2', 'true');
            localStorage.setItem('il_last_backup_at', String(Date.now()));
            localStorage.setItem('il_tutorial_v2', JSON.stringify({
                home: true, workout: true, history: true, stats: true, mesoSettings: true, nutrition: true,
            }));
        });
        await page.goto('/');
        const nav = page.locator('nav[aria-label="Main navigation"]');
        await expect(nav).toBeVisible({ timeout: 15000 });
        await nav.locator('button[aria-label*="Iniciar" i], button[aria-label*="Start" i]').first().click();
        await page.locator('button:has-text("Sesión libre"), button:has-text("Freestyle")').first().click();
        const startFree = page.locator('button:has-text("Iniciar Sesión Libre"), button:has-text("Start Free Session"), button:has-text("Iniciar sesión libre")').first();
        await startFree.scrollIntoViewIfNeeded();
        await startFree.click();
        await page.locator('#tut-finish-btn').click();
        await page.locator('button:has-text("Terminar"), button:has-text("Finish")').last().click();
        await expect(page.locator('button:has-text("Finalizar y Volver")')).toBeVisible({ timeout: 10000 });

        const downloadPromise = page.waitForEvent('download');
        await page.getByRole('button', { name: 'Compartir imagen' }).click();
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toMatch(/^gainslab-\d{4}-\d{2}-\d{2}\.png$/);
        const path = await download.path();
        const { readFileSync } = await import('node:fs');
        const bytes = readFileSync(path!);
        // PNG signature + a real image (not an empty canvas export).
        expect([...bytes.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
        expect(bytes.length).toBeGreaterThan(10_000);
        await expect(page.getByRole('alert')).toHaveCount(0);
    });
});
