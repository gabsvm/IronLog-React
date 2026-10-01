import { test, expect, type Page } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ERROR_BOUNDARY_TEXT = /ERROR CRÍTICO|CRITICAL ERROR/;
const SW_PATH = resolve(process.cwd(), 'dist/sw.js');

const seedOnboardedProfile = (page: Page) =>
    page.addInitScript(() => {
        localStorage.setItem('il_onboarded_v2', 'true');
        localStorage.setItem('il_tutorial_v2', JSON.stringify({
            home: true, workout: true, history: true, stats: true, mesoSettings: true, nutrition: true,
        }));
    });

const startFreestyleWorkout = async (page: Page) => {
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

    await expect(page.locator('#tut-finish-btn')).toBeVisible({ timeout: 10000 });
};

const triggerSwUpdateCheck = (page: Page) =>
    page.evaluate(async () => {
        const registration = await navigator.serviceWorker.getRegistration();
        if (!registration) throw new Error('no SW registration');
        await registration.update();
    });

test.describe('Deferred SW update with active session (F8)', () => {
    test.setTimeout(120000);
    test('no reload until the user accepts the update', async ({ page }) => {
        await seedOnboardedProfile(page);
        await page.goto('/?sw=1');
        await page.waitForFunction(() => Boolean(navigator.serviceWorker?.controller), null, { timeout: 45000 });
        // The controllerchange guard in index.tsx only acts when a controller
        // already existed at page load (hadControllerOnLoad), so boot once
        // more under SW control before starting the session.
        await page.reload();
        await expect(page.locator('nav[aria-label="Main navigation"]')).toBeVisible({ timeout: 15000 });
        await startFreestyleWorkout(page);

        const originalSw = readFileSync(SW_PATH, 'utf8');
        const bumpSw = (tag: string) => writeFileSync(SW_PATH, `${originalSw}\n// __F8_UPDATE_${tag}__\n`, 'utf8');
        // Marker proves whether a reload happened (a reload wipes window state).
        await page.evaluate(() => { (window as any).__f8noreload = 1; });

        try {
            // 1. A redeploy appears: banner shows, but nothing reloads on its own.
            bumpSw('BUMP1');
            await triggerSwUpdateCheck(page);
            const banner = page.getByRole('status').filter({ hasText: /nueva versión lista|new version is ready/i });
            await expect(banner).toBeVisible({ timeout: 30000 });
            expect(await page.evaluate(() => (window as any).__f8noreload)).toBe(1);
            await expect(page.locator('#tut-finish-btn')).toBeVisible();

            // 2. Tapping update asks for confirmation (in-app modal); cancelling aborts.
            const updateBtn = banner.getByRole('button', { name: /Actualizar|Update/ });
            await updateBtn.click();
            const confirmDialog = page.getByRole('dialog');
            await expect(confirmDialog.getByText(/Actualizar durante el entreno|Update during workout/)).toBeVisible({ timeout: 8000 });
            await expect(confirmDialog.getByText(/entrenamiento en curso|workout in progress/i)).toBeVisible();
            await confirmDialog.getByRole('button', { name: /Cancelar|Cancel/ }).click();
            await expect(confirmDialog).toHaveCount(0, { timeout: 8000 });
            await page.waitForTimeout(500);
            expect(await page.evaluate(() => (window as any).__f8noreload)).toBe(1);
            await expect(page.locator('#tut-finish-btn')).toBeVisible();

            // 3. Even if the waiting worker activates behind our back, the reload
            // is deferred while the session runs (controllerchange guard).
            await page.evaluate(() => {
                (window as any).__f8deferred = false;
                window.addEventListener('ironlog:update-deferred', () => {
                    (window as any).__f8deferred = true;
                }, { once: true });
            });
            await page.evaluate(async () => {
                const registration = await navigator.serviceWorker.getRegistration();
                registration?.waiting?.postMessage({ type: 'SKIP_WAITING' });
            });
            await page.waitForFunction(() => (window as any).__f8deferred === true, null, { timeout: 10000 });
            expect(await page.evaluate(() => (window as any).__f8noreload)).toBe(1);
            await expect(page.locator('#tut-finish-btn')).toBeVisible();

            // 4. Accepting the update through the app path finally reloads.
            bumpSw('BUMP2');
            await triggerSwUpdateCheck(page);
            await expect(banner).toBeVisible({ timeout: 30000 });
            await updateBtn.click();
            const acceptDialog = page.getByRole('dialog');
            await expect(acceptDialog.getByText(/Actualizar durante el entreno|Update during workout/)).toBeVisible({ timeout: 8000 });
            await acceptDialog.getByRole('button', { name: /^Actualizar$|^Update$/ }).click();
            await page.waitForFunction(() => (window as any).__f8noreload === undefined, null, { timeout: 15000 });

            // App boots again after the reload.
            await expect(page.locator('nav[aria-label="Main navigation"]')).toBeVisible({ timeout: 15000 });
            await expect(page.getByText(ERROR_BOUNDARY_TEXT)).toHaveCount(0);
        } finally {
            writeFileSync(SW_PATH, originalSw, 'utf8');
        }
    });
});
