import { test, expect, type Page } from '@playwright/test';

const ERROR_BOUNDARY_TEXT = /ERROR CRÍTICO|CRITICAL ERROR/;

const seedOnboardedProfile = (page: Page) =>
    page.addInitScript(() => {
        localStorage.setItem('il_onboarded_v2', 'true');
        localStorage.setItem('il_tutorial_v2', JSON.stringify({
            home: true, workout: true, history: true, stats: true, mesoSettings: true, nutrition: true,
        }));
    });

test.describe('Profile back-button then workout back stays in app (G3)', () => {
    test('closing profile with Back does not swallow the next pushState', async ({ page }) => {
        await seedOnboardedProfile(page);
        await page.goto('/');

        const nav = page.locator('nav[aria-label="Main navigation"]');
        await expect(nav).toBeVisible({ timeout: 15000 });

        // 1. Open the profile sheet (pushes a #profile entry).
        const avatarBtn = page.getByLabel(/Abrir perfil|Open profile/);
        await expect(avatarBtn).toBeVisible({ timeout: 8000 });
        await avatarBtn.click();
        const profileSheet = page.locator('[role="dialog"]', { hasText: /Modo local|Local mode/ });
        await expect(profileSheet).toBeVisible({ timeout: 8000 });

        // 2. Close it with the Back button: no App-level view/settings change.
        await page.goBack();
        await expect(profileSheet).toHaveCount(0, { timeout: 8000 });
        await expect(nav).toBeVisible();

        // 3. Start a freestyle workout (must pushState a workout entry).
        // Fase 2 shell: freestyle entry lives in Rutina (no center + button).
        await nav.getByRole('button', { name: /^Rutina$|^Routine$/ }).click();
        const quickBtn = page.getByRole('button', { name: /Iniciar entreno|Start workout/ }).first();
        await expect(quickBtn).toBeVisible({ timeout: 8000 });
        await quickBtn.click();

        const freestyleOption = page.locator('button:has-text("Sesión libre"), button:has-text("Freestyle")').first();
        await expect(freestyleOption).toBeVisible({ timeout: 6000 });
        await freestyleOption.click();

        const startFreeBtn = page.locator('button:has-text("Iniciar Sesión Libre"), button:has-text("Start Free Session"), button:has-text("Iniciar sesión libre")').first();
        await expect(startFreeBtn).toBeVisible({ timeout: 8000 });
        await startFreeBtn.scrollIntoViewIfNeeded();
        await startFreeBtn.click();
        await expect(page.locator('#tut-finish-btn')).toBeVisible({ timeout: 10000 });

        // 4. Back from the workout returns to the origin tab inside the app (no exit).
        await page.goBack();
        expect(page.url()).toContain('localhost');
        await expect(nav).toBeVisible();
        const routineBtn = nav.locator('button[aria-current="page"]', { hasText: /^Rutina$|^Routine$/ });
        await expect(routineBtn).toBeVisible({ timeout: 8000 });
        await expect(page.locator('#tut-finish-btn')).toHaveCount(0);

        await expect(page.getByText(ERROR_BOUNDARY_TEXT)).toHaveCount(0);
    });
});

test.describe('Profile import dialogs own only their overlay', () => {
    test('invalid JSON traps Tab and Escape/outside tap leave Profile open with usable controls', async ({ page }) => {
        await seedOnboardedProfile(page);
        await page.goto('/');
        const avatar = page.getByLabel(/Abrir perfil|Open profile/);
        await avatar.click();
        const profile = page.locator('[data-vaul-drawer][role="dialog"]');
        await expect(profile).toBeVisible();
        const close = profile.getByRole('button', { name: /^(Close|Cerrar)$/ });
        await close.focus();
        const upload = profile.locator('input[type="file"][accept=".json"]');
        await upload.setInputFiles({
            name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{broken'),
        });
        const error = page.getByRole('dialog', { name: /Error de Importación|Import Error/ });
        await expect(error).toBeVisible();
        const dismiss = error.getByRole('button', { name: /Entendido|OK/ });
        await expect(dismiss).toBeFocused();
        await page.keyboard.press('Tab');
        await expect(dismiss).toBeFocused();
        await page.keyboard.press('Shift+Tab');
        await expect(dismiss).toBeFocused();
        // A real focus request into the lower Radix scope cannot steal focus.
        await close.focus();
        await expect(dismiss).toBeFocused();
        await page.keyboard.press('Escape');
        await expect(error).toHaveCount(0);
        await expect(profile).toBeVisible();
        await expect(close).toBeFocused();

        await upload.setInputFiles({
            name: 'invalid-again.json', mimeType: 'application/json', buffer: Buffer.from('{still broken'),
        });
        await expect(error).toBeVisible();
        await error.tap({ position: { x: 8, y: 8 } });
        await expect(error).toHaveCount(0);
        await expect(profile).toBeVisible();
        await expect(close).toBeFocused();
        await close.tap();
        await expect(profile).toHaveCount(0);
        await expect(avatar).toBeFocused();
        await expect.poll(() => page.evaluate(() => ({
            pointerEvents: document.body.style.pointerEvents,
            overflow: document.body.style.overflow,
        }))).toEqual({ pointerEvents: '', overflow: '' });
        // Verify interaction, not just a style reset, after the final close.
        await avatar.tap();
        await expect(profile).toBeVisible();
    });

    test('Cancel and Import accept real taps above Profile and import restores actual data', async ({ page }) => {
        await seedOnboardedProfile(page);
        await page.goto('/');
        const avatar = page.getByLabel(/Abrir perfil|Open profile/);
        await avatar.click();
        const profile = page.locator('[data-vaul-drawer][role="dialog"]');
        await expect(profile).toBeVisible();
        const backup = JSON.stringify({
            schema: 'gainslab-backup', version: 1, exportedAt: Date.now(), appVersion: '4.0.3',
            state: {
                userProfile: { bodyWeight: 79.5, height: 180, daysPerWeek: 4, goal: 'hypertrophy', sessionDuration: 'medium' },
            },
        });
        const upload = profile.locator('input[type="file"][accept=".json"]');
        await upload.setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(backup) });
        const confirm = page.getByRole('dialog', { name: /^Importar Datos$|^Import Data$/ });
        await expect(confirm).toBeVisible();
        const cancel = confirm.getByRole('button', { name: /^Cancelar$|^Cancel$/ });
        const restore = confirm.getByRole('button', { name: /^Importar Datos$|^Import Data$/ });
        await expect(cancel).toBeFocused();
        await page.keyboard.press('Tab');
        await expect(restore).toBeFocused();
        await page.keyboard.press('Tab');
        await expect(cancel).toBeFocused();
        await page.keyboard.press('Shift+Tab');
        await expect(restore).toBeFocused();
        await cancel.tap();
        await expect(confirm).toHaveCount(0);
        await expect(profile).toBeVisible();
        await upload.setInputFiles({ name: 'backup-again.json', mimeType: 'application/json', buffer: Buffer.from(backup) });
        await expect(confirm).toBeVisible();
        await Promise.all([
            page.waitForEvent('load'),
            confirm.getByRole('button', { name: /^Importar Datos$|^Import Data$/ }).tap(),
        ]);
        await expect(page.locator('nav[aria-label="Main navigation"]')).toBeVisible({ timeout: 15000 });
        // Reload preserves the #profile history entry, so Profile is already
        // open with the restored data; the avatar is correctly behind it.
        await expect(profile).toBeVisible();
        await expect(profile.locator('#profile-section-body').getByText(/79[.,]5\s*kg/i)).toBeVisible();
        await profile.getByRole('button', { name: /^(Close|Cerrar)$/ }).tap();
        await expect(profile).toHaveCount(0);
        await avatar.tap();
        await expect(profile.locator('#profile-section-body').getByText(/79[.,]5\s*kg/i)).toBeVisible();
        await profile.getByRole('button', { name: /^(Close|Cerrar)$/ }).tap();
        await expect(profile).toHaveCount(0);
        await expect.poll(() => page.evaluate(() => ({
            pointerEvents: document.body.style.pointerEvents,
            overflow: document.body.style.overflow,
        }))).toEqual({ pointerEvents: '', overflow: '' });
    });
});
