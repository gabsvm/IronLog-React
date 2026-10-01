import { test, expect, type Locator, type Page } from '@playwright/test';

const ERROR_BOUNDARY_TEXT = /ERROR CRÍTICO|CRITICAL ERROR/;

const seedOnboardedProfile = (page: Page) =>
    page.addInitScript(() => {
        localStorage.setItem('il_onboarded_v2', 'true');
        localStorage.setItem('il_tutorial_v2', JSON.stringify({
            home: true, workout: true, history: true, stats: true, mesoSettings: true, nutrition: true,
        }));
    });

const startFreestyleWorkout = async (page: Page) => {
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

    await expect(page.locator('#tut-finish-btn')).toBeVisible({ timeout: 10000 });
};

const openAddExercise = async (page: Page) => {
    const addExHeaderBtn = page.locator('button[title*="Añadir ejercicio" i], button[title*="Add exercise" i], button[title*="Añadir Ejercicio" i]').first();
    await expect(addExHeaderBtn).toBeVisible({ timeout: 6000 });
    await addExHeaderBtn.click();
};

/** Real rendered ::after hit-area box (pseudo-elements extend these dense-row targets). */
const afterBox = (button: Locator) =>
    button.evaluate((el) => {
        const cs = getComputedStyle(el, '::after');
        return { width: parseFloat(cs.width), height: parseFloat(cs.height), content: cs.content };
    });

test.describe('Set-row touch targets, real rendered size (F8)', () => {
    test('check button and type badge expose >=44px hit areas', async ({ page }) => {
        await seedOnboardedProfile(page);
        await startFreestyleWorkout(page);
        await openAddExercise(page);

        const firstExOption = page.locator('[role="dialog"] button, .modal button').filter({ hasText: /press|squat|curl|banca/i }).first();
        await expect(firstExOption).toBeVisible({ timeout: 6000 });
        await firstExOption.click();

        const checkBtn = page.locator('button[aria-label*="Completar serie" i], button[aria-label*="Complete set" i]').first();
        await expect(checkBtn).toBeVisible({ timeout: 6000 });
        const checkBox = await afterBox(checkBtn);
        expect(checkBox.content, 'check ::after content').not.toBe('none');
        expect(checkBox.width, 'check hit width').toBeGreaterThanOrEqual(44);
        expect(checkBox.height, 'check hit height').toBeGreaterThanOrEqual(44);

        const badgeBtn = page.getByRole('button', { name: /Serie 1, cambiar tipo|Set 1, change type/ }).first();
        await expect(badgeBtn).toBeVisible({ timeout: 6000 });
        const badgeBox = await afterBox(badgeBtn);
        expect(badgeBox.content, 'badge ::after content').not.toBe('none');
        expect(badgeBox.width, 'badge hit width').toBeGreaterThanOrEqual(44);
        expect(badgeBox.height, 'badge hit height').toBeGreaterThanOrEqual(44);

        await expect(page.getByText(ERROR_BOUNDARY_TEXT)).toHaveCount(0);
    });

    // NOTE: the isometric HoldTimer reset uses the same ::after mechanism
    // (28x36 + insets = 44x44, code-verified), but cal_* exercises are excluded
    // from the standard picker, so it cannot be staged in this flow.
});
