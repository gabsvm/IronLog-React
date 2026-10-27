import { test, expect, type Page } from '@playwright/test';
import { bottomNav, openProfileSheet, openStrongPanel, startFreestyleWorkout } from './strongNav';

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

        const nav = bottomNav(page);
        await expect(nav).toBeVisible({ timeout: 15000 });

        // 1. Open the Strong Profile panel (pushes a #strong-profile entry).
        const dashboard = await openStrongPanel(page);
        await expect(dashboard).toBeVisible({ timeout: 8000 });

        // 2. Close it with the Back button: no App-level view/settings change.
        await page.goBack();
        await expect(page.getByTestId('profile-dashboard')).toHaveCount(0, { timeout: 8000 });
        await expect(nav).toBeVisible();

        // 3. Start a freestyle workout from the Entreno FAB (must push a workout entry).
        await startFreestyleWorkout(page);

        // 4. Back from the workout returns to the origin tab inside the app (no exit).
        await page.goBack();
        expect(page.url()).toContain('localhost');
        await expect(nav).toBeVisible();
        // Home and routine belong to the training family: Entreno stays active.
        const workoutBtn = nav.locator('button[aria-current="page"]', { hasText: /^Entreno$|^Workout$/ });
        await expect(workoutBtn).toBeVisible({ timeout: 8000 });
        await expect(page.locator('#tut-finish-btn')).toHaveCount(0);

        await expect(page.getByText(ERROR_BOUNDARY_TEXT)).toHaveCount(0);
    });
});

test.describe('Profile import dialogs own only their overlay', () => {
    test('invalid JSON traps Tab and Escape/outside tap leave Profile open with usable controls', async ({ page }) => {
        await seedOnboardedProfile(page);
        await page.goto('/');
        const avatar = page.getByLabel(/Abrir perfil|Open profile/);
        // Unified sheet opens from the Strong panel's Ajustes gear.
        const profile = await openProfileSheet(page);
        const gear = page.getByTestId('profile-dashboard').getByRole('button', { name: /^Ajustes$|^Settings$/ });
        const close = profile.getByRole('button', { name: /^(Close|Cerrar)$/ });
        await close.focus();
        const upload = profile.locator('input[type="file"][accept=".json"]');
        await upload.setInputFiles({
            name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{broken'),
        });
        const error = page.getByRole('dialog', { name: /Error de Importación|Import Error/i });
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
        // Focus returns to the sheet trigger (panel gear), not the avatar.
        await expect(gear).toBeFocused();
        await expect.poll(() => page.evaluate(() => ({
            pointerEvents: document.body.style.pointerEvents,
            overflow: document.body.style.overflow,
        }))).toEqual({ pointerEvents: '', overflow: '' });
        // Verify interaction, not just a style reset, after the final close:
        // dismiss the panel (focus returns to the avatar), then reopen fully.
        await page.getByTestId('profile-dashboard').getByRole('button', { name: /^Cerrar$|^Close$/ }).click();
        await expect(avatar).toBeFocused();
        await expect(page.getByTestId('profile-dashboard')).toHaveCount(0);
        await avatar.tap();
        await expect(page.getByTestId('profile-dashboard')).toBeVisible();
    });

    test('Cancel and Import accept real taps above Profile and import restores actual data', async ({ page }) => {
        await seedOnboardedProfile(page);
        await page.goto('/');
        const profile = await openProfileSheet(page);
        const backup = JSON.stringify({
            schema: 'gainslab-backup', version: 1, exportedAt: Date.now(), appVersion: '4.0.3',
            state: {
                userProfile: { bodyWeight: 79.5, height: 180, daysPerWeek: 4, goal: 'hypertrophy', sessionDuration: 'medium' },
            },
        });
        const upload = profile.locator('input[type="file"][accept=".json"]');
        await upload.setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(backup) });
        const confirm = page.getByRole('dialog', { name: /^Importar Datos$|^Import Data$/i });
        await expect(confirm).toBeVisible();
        const cancel = confirm.getByRole('button', { name: /^Cancelar$|^Cancel$/ });
        const restore = confirm.getByRole('button', { name: /^Importar Datos$|^Import Data$/i });
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
            confirm.getByRole('button', { name: /^Importar Datos$|^Import Data$/i }).tap(),
        ]);
        await expect(page.locator('nav[aria-label="Main navigation"]')).toBeVisible({ timeout: 15000 });
        // Reload preserves the sheet entry with the restored data (the panel
        // stays mounted behind it); the avatar is correctly behind both.
        const reopened = page.locator('[role="dialog"]').first();
        await expect(reopened).toBeVisible();
        await expect(reopened.locator('#profile-section-body').getByText(/79[.,]5\s*kg/i)).toBeVisible();
        await reopened.getByRole('button', { name: /^(Close|Cerrar)$/ }).tap();
        await expect(reopened).toHaveCount(0);
        await expect.poll(() => page.evaluate(() => ({
            pointerEvents: document.body.style.pointerEvents,
            overflow: document.body.style.overflow,
        }))).toEqual({ pointerEvents: '', overflow: '' });
    });
});
