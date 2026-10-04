import { test, expect, type Page } from '@playwright/test';

// Q11: the kg/lb preference changes presentation and entry only — stored
// data stays canonical kg. Switching units never rewrites stored values.

const seedOnboarded = (page: Page) =>
    page.addInitScript(() => {
        localStorage.setItem('il_onboarded_v2', 'true');
        localStorage.setItem('il_tutorial_v2', JSON.stringify({
            home: true, workout: true, history: true, stats: true, mesoSettings: true, nutrition: true,
        }));
    });

const PLUS_BTN = 'nav[aria-label="Main navigation"] button[aria-label*="Iniciar" i], nav[aria-label="Main navigation"] button[aria-label*="Start" i]';

const startFreestyleWithOneExercise = async (page: Page) => {
    await page.locator(PLUS_BTN).first().click();
    const freestyleOption = page.locator('button:has-text("Sesión libre"), button:has-text("Freestyle")').first();
    await expect(freestyleOption).toBeVisible({ timeout: 6000 });
    await freestyleOption.click();
    const startFreeBtn = page.locator('button:has-text("Iniciar Sesión Libre"), button:has-text("Start Free Session"), button:has-text("Iniciar sesión libre")').first();
    await expect(startFreeBtn).toBeVisible({ timeout: 8000 });
    await startFreeBtn.scrollIntoViewIfNeeded();
    await startFreeBtn.click();
    await expect(page.locator('#tut-finish-btn')).toBeVisible({ timeout: 10000 });

    const addExHeaderBtn = page.locator('button[title*="Añadir ejercicio" i], button[title*="Add exercise" i]').first();
    await addExHeaderBtn.click();
    const dialog = page.locator('[role="dialog"]').last();
    await expect(dialog).toBeVisible({ timeout: 6000 });
    // Deterministic pick: a barbell strength exercise (has weight inputs).
    await dialog.getByLabel('Search exercises').fill('press banca');
    const option = dialog.locator('button[class*="text-left"]').first();
    await expect(option).toBeVisible({ timeout: 6000 });
    await option.click();
    await expect(page.locator('#tut-exercise-list h3')).toHaveCount(1, { timeout: 8000 });
};

const setWeightUnitFromHome = async (page: Page, unit: 'KG' | 'LBS') => {
    await page.getByLabel(/Abrir perfil|Open profile/).click();
    const sheet = page.locator('[role="dialog"]').first();
    await expect(sheet).toBeVisible({ timeout: 10000 });
    const training = sheet.locator('#profile-section-training');
    await training.scrollIntoViewIfNeeded();
    const group = training.getByRole('group', { name: /Unidad de peso|Weight unit/ });
    await expect(group).toBeVisible({ timeout: 6000 });
    await group.getByRole('button', { name: unit, exact: true }).click();
    await page.goBack();
    await expect(sheet).toBeHidden({ timeout: 6000 });
};

const resumeWorkoutFromHome = async (page: Page) => {
    await page.locator(PLUS_BTN).first().click();
    const resume = page.locator('button:has-text("Reanudar sesión"), button:has-text("Resume session")').first();
    await expect(resume).toBeVisible({ timeout: 6000 });
    await resume.click();
    await expect(page.locator('#tut-finish-btn')).toBeVisible({ timeout: 10000 });
};

const goHomeFromWorkout = async (page: Page) => {
    await page.getByLabel(/Atrás|Back/, { exact: true }).first().click();
    await expect(page.locator('nav[aria-label="Main navigation"]')).toBeVisible({ timeout: 8000 });
};

/** Raw stored weight of the first set, straight from IndexedDB. */
const storedFirstSetWeight = (page: Page) =>
    page.evaluate(() => new Promise((resolve, reject) => {
        const req = indexedDB.open('keyval-store');
        req.onsuccess = () => {
            const tx = req.result.transaction('keyval', 'readonly');
            const get = tx.objectStore('keyval').get('il_session_v16');
            get.onsuccess = () => resolve((get.result as any)?.exercises?.[0]?.sets?.[0]?.weight ?? null);
            get.onerror = () => reject(get.error);
        };
        req.onerror = () => reject(req.error);
    }));

test.describe('Q11: weight units kg/lb', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('lb shows inputs and cards in lb; stored data stays kg', async ({ page }) => {
        await seedOnboarded(page);
        await page.goto('/');
        await expect(page.locator('nav[aria-label="Main navigation"]')).toBeVisible({ timeout: 15000 });
        await startFreestyleWithOneExercise(page);

        const card = page.locator('#tut-exercise-list');
        await expect(card.getByText('(KG)', { exact: false })).toBeVisible({ timeout: 6000 });
        const weightInput = card.locator('input[type="number"][inputmode="decimal"]').first();
        await weightInput.fill('60');
        // Stored raw in kg mode (no conversion on either side).
        await expect.poll(() => storedFirstSetWeight(page), { timeout: 8000 }).toBe('60');

        await goHomeFromWorkout(page);
        await setWeightUnitFromHome(page, 'LBS');
        expect(await page.evaluate(() => localStorage.getItem('il_cfg_weight_unit'))).toBe('"lb"');
        await resumeWorkoutFromHome(page);

        // Same stored 60 kg now presented as lb.
        await expect(card.getByText('(LBS)', { exact: false })).toBeVisible({ timeout: 6000 });
        await expect(weightInput).toHaveValue('132.3');

        // Typing in lb commits canonical kg.
        await weightInput.fill('135');
        await expect.poll(() => storedFirstSetWeight(page), { timeout: 8000 }).toBe(61.235);

        // Back in kg the exact canonical value shows: nothing was rewritten.
        await goHomeFromWorkout(page);
        await setWeightUnitFromHome(page, 'KG');
        await resumeWorkoutFromHome(page);
        await expect(card.getByText('(KG)', { exact: false })).toBeVisible({ timeout: 6000 });
        await expect(weightInput).toHaveValue('61.235');
    });
});
