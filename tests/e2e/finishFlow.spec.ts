import { test, expect, type Page } from '@playwright/test';

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

    const finishBtn = page.locator('#tut-finish-btn');
    await expect(finishBtn).toBeVisible({ timeout: 10000 });
    return finishBtn;
};

/**
 * Records every moment #root has no rendered content until readEmptySamples runs.
 * "No content" means no text AND no meaningful elements: an empty Layout shell
 * (bare divs) counts as blank, while a Suspense spinner (svg) does not.
 */
const armEmptyRootWatch = (page: Page) =>
    page.evaluate(() => {
        const w = window as any;
        w.__emptySamples = [];
        const root = document.getElementById('root')!;
        const MEANINGFUL = 'svg, img, canvas, video, input, button, select, textarea, nav, [role="dialog"], [role="alert"]';
        const check = () => {
            if ((root.textContent ?? '').trim() === '' && !root.querySelector(MEANINGFUL)) {
                w.__emptySamples.push(Math.round(performance.now()));
            }
        };
        check();
        w.__emptyWatch = new MutationObserver(check);
        w.__emptyWatch.observe(root, { childList: true, subtree: true, characterData: true });
    });

const readEmptySamples = (page: Page): Promise<number[]> =>
    page.evaluate(() => {
        (window as any).__emptyWatch?.disconnect();
        return (window as any).__emptySamples ?? [-1];
    });

test.describe('Finish / discard without blank screen (F2)', () => {
    test('finish workout reaches summary with #root never empty', async ({ page }) => {
        await seedOnboardedProfile(page);
        const finishBtn = await startFreestyleWorkout(page);

        await armEmptyRootWatch(page);
        await finishBtn.click();

        const confirmFinishBtn = page.locator('button:has-text("Terminar"), button:has-text("Finish")').last();
        await expect(confirmFinishBtn).toBeVisible({ timeout: 5000 });
        await confirmFinishBtn.click();

        const summaryDoneBtn = page.locator('button:has-text("Finalizar y Volver"), button:has-text("Finish & Go Home")').first();
        await expect(summaryDoneBtn).toBeVisible({ timeout: 10000 });

        await expect(page.getByText(ERROR_BOUNDARY_TEXT)).toHaveCount(0);
        expect(await readEmptySamples(page)).toEqual([]);
    });

    test('discard workout returns home with #root never empty', async ({ page }) => {
        await seedOnboardedProfile(page);
        const finishBtn = await startFreestyleWorkout(page);

        await armEmptyRootWatch(page);
        await finishBtn.click();

        const discardOption = page.locator('button:has-text("Descartar"), button:has-text("Discard")').first();
        await expect(discardOption).toBeVisible({ timeout: 5000 });
        await discardOption.click();

        const dialog = page.getByRole('dialog', { name: /Descartar|Discard/ });
        await expect(dialog).toBeVisible({ timeout: 5000 });
        await dialog.getByRole('button', { name: /Eliminar|Delete/ }).click();

        const nav = page.locator('nav[aria-label="Main navigation"]');
        await expect(nav).toBeVisible({ timeout: 10000 });
        await expect(page.getByText(/Nuevo Mesociclo|New Mesocycle/)).toBeVisible({ timeout: 8000 });

        await expect(page.getByText(ERROR_BOUNDARY_TEXT)).toHaveCount(0);
        expect(await readEmptySamples(page)).toEqual([]);
    });
});
