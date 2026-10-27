import { test, expect, type Page } from '@playwright/test';
import { enterViaKeypad as enterWeightViaKeypad } from './helpers/keypad';
import { openProfileSheet } from './strongNav';

// Q11: the kg/lb preference changes presentation and entry only — stored
// data stays canonical kg. Switching units never rewrites stored values.

const seedOnboarded = (page: Page) =>
    page.addInitScript(() => {
        localStorage.setItem('il_onboarded_v2', 'true');
        localStorage.setItem('il_tutorial_v2', JSON.stringify({
            home: true, workout: true, history: true, stats: true, mesoSettings: true, nutrition: true,
        }));
    });

const startFreestyleWithTwoExercises = async (page: Page) => {
    await page.getByRole('button', { name: /^(Sesión libre|Freestyle session) ·/ }).click();
    const freestyleOption = page.getByRole('dialog', { name: /Iniciar entrenamiento|Start training/ })
        .getByRole('button', { name: /Sesión libre|Freestyle/ });
    await expect(freestyleOption).toBeVisible({ timeout: 6000 });
    await freestyleOption.click();
    const startFreeBtn = page.getByRole('dialog', { name: /Nueva Sesión|New Session/i })
        .getByRole('button', { name: /Iniciar Sesión Libre|Start Free Session/i });
    await expect(startFreeBtn).toBeVisible({ timeout: 8000 });
    await startFreeBtn.scrollIntoViewIfNeeded();
    await startFreeBtn.click();
    await expect(page.locator('#tut-finish-btn')).toBeVisible({ timeout: 10000 });

    // End-of-list add button (header dup-add removed in Strong parity T1/T2).
    const addExHeaderBtn = page.getByRole('button', { name: /Añadir ejercicio|Add exercise/ }).last();
    // Stacked list (Strong parity T1): every added exercise renders expanded —
    // assert the total count, not just the focused card.
    for (let n = 0; n < 2; n++) {
        await addExHeaderBtn.click();
        const dialog = page.locator('[role="dialog"]').last();
        await expect(dialog).toBeVisible({ timeout: 6000 });
        // Deterministic picks: barbell strength exercises (have weight inputs).
        await dialog.getByLabel(/Buscar ejercicios|Search exercises/).fill('press banca');
        const option = dialog.locator('button[class*="text-left"]').nth(n);
        await expect(option).toBeVisible({ timeout: 6000 });
        await option.click();
        await page.waitForTimeout(400);
    }
    await expect(page.locator('#tut-exercise-list h3')).toHaveCount(2, { timeout: 8000 });
};

const setWeightUnitFromHome = async (page: Page, unit: 'KG' | 'LBS') => {
    // Weight unit lives in the unified sheet (Strong panel gear).
    const sheet = await openProfileSheet(page);
    const training = sheet.locator('#profile-section-training');
    await training.scrollIntoViewIfNeeded();
    const group = training.getByRole('group', { name: /Unidad de peso|Weight unit/ });
    await expect(group).toBeVisible({ timeout: 6000 });
    await group.getByRole('button', { name: unit, exact: true }).click();
    // Back closes the sheet; the Strong panel stays open behind it, so go
    // back once more to return to a clean home (panel owns one entry).
    await page.goBack();
    await expect(sheet).toBeHidden({ timeout: 6000 });
    await page.goBack();
    await expect(page.getByTestId('profile-dashboard')).toHaveCount(0, { timeout: 6000 });
};

const resumeWorkoutFromHome = async (page: Page) => {
    await page.getByRole('button', { name: /^(Sesión libre|Freestyle session) ·/ }).click();
    const resume = page.getByRole('dialog', { name: /Iniciar entrenamiento|Start training/ })
        .getByRole('button', { name: /Reanudar sesión|Resume session/ });
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
        await startFreestyleWithTwoExercises(page);

        const card = page.locator('#tut-exercise-list');
        // Strong parity flat header shows the unit badge (KG/LBS, no parens).
        const firstCardUnit = (unit: string) => card.getByTestId('sets-header').first().getByText(unit, { exact: true });
        await expect(firstCardUnit('KG')).toBeVisible({ timeout: 6000 });
        const weightInput = card.locator('input[type="number"][inputmode="decimal"]').first();
        await enterWeightViaKeypad(page, weightInput, '60');
        // Stored raw in kg mode (no conversion on either side).
        await expect.poll(() => storedFirstSetWeight(page), { timeout: 8000 }).toBe('60');

        await goHomeFromWorkout(page);
        await setWeightUnitFromHome(page, 'LBS');
        expect(await page.evaluate(() => localStorage.getItem('il_cfg_weight_unit'))).toBe('"lb"');
        await resumeWorkoutFromHome(page);

        // Same stored 60 kg now presented as lb.
        await expect(firstCardUnit('LBS')).toBeVisible({ timeout: 6000 });
        await expect(weightInput).toHaveValue('132.3');

        // Typing in lb commits canonical kg.
        await enterWeightViaKeypad(page, weightInput, '135');
        await expect.poll(() => storedFirstSetWeight(page), { timeout: 8000 }).toBe(61.235);

        // Back in kg the exact canonical value shows: nothing was rewritten.
        await goHomeFromWorkout(page);
        await setWeightUnitFromHome(page, 'KG');
        await resumeWorkoutFromHome(page);
        await expect(firstCardUnit('KG')).toBeVisible({ timeout: 6000 });
        await expect(weightInput).toHaveValue('61.235');
    });
});
