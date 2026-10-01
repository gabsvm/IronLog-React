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

        // 4. Back from the workout returns Home inside the app (no exit).
        await page.goBack();
        expect(page.url()).toContain('localhost');
        await expect(nav).toBeVisible();
        const homeBtn = nav.locator('button[aria-current="page"]', { hasText: /Entreno|Train/ });
        await expect(homeBtn).toBeVisible({ timeout: 8000 });
        await expect(page.locator('#tut-finish-btn')).toHaveCount(0);

        await expect(page.getByText(ERROR_BOUNDARY_TEXT)).toHaveCount(0);
    });
});
