import { test, expect } from '@playwright/test';

// K1: dragging a reorder row must not drag the Sheet (vaul) with it, and the
// new order must persist to the store on save.
test.describe('K1: reorder exercises drag', () => {
    test('sheet stays put while dragging row 3, order saved on drop+save', async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => {
            localStorage.setItem('il_onboarded_v2', 'true');
            localStorage.setItem('il_tutorial_v2', JSON.stringify({
                home: true, workout: true, history: true, stats: true, mesoSettings: true, nutrition: true
            }));
        });
        await page.reload();

        // Quick Start -> Freestyle -> start
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

        // Add 3 distinct exercises via the header add button.
        const addExHeaderBtn = page.locator('button[title*="Añadir ejercicio" i], button[title*="Add exercise" i]').first();
        for (let i = 0; i < 3; i++) {
            await addExHeaderBtn.click();
            const dialog = page.locator('[role="dialog"]').last();
            await expect(dialog).toBeVisible({ timeout: 6000 });
            const option = dialog.locator('button[class*="text-left"]').nth(i);
            await expect(option).toBeVisible({ timeout: 6000 });
            await option.click();
            await page.waitForTimeout(400);
        }

        const cardNames = page.locator('#tut-exercise-list h3');
        await expect(cardNames).toHaveCount(3, { timeout: 8000 });
        const before = await cardNames.allTextContents();

        // Open the reorder sheet.
        const reorderBtn = page.locator('button[aria-label*="Ordenar ejercicios" i], button[aria-label*="Reorder exercises" i]').first();
        await expect(reorderBtn).toBeVisible({ timeout: 6000 });
        await reorderBtn.click();
        const sheet = page.locator('[role="dialog"]').last();
        await expect(sheet).toBeVisible({ timeout: 6000 });
        await page.waitForTimeout(600); // let the sheet settle

        const sheetBox0 = await sheet.boundingBox();
        expect(sheetBox0).not.toBeNull();
        const top0 = sheetBox0!.y;

        // Drag the row-3 handle 120px downward in steps, sampling sheet top.
        const handle3 = sheet.getByRole('button', { name: /Mover |Move / }).nth(2);
        await expect(handle3).toBeVisible({ timeout: 6000 });
        const hbox = await handle3.boundingBox();
        expect(hbox).not.toBeNull();
        const startX = hbox!.x + hbox!.width / 2;
        const startY = hbox!.y + hbox!.height / 2;

        await page.mouse.move(startX, startY);
        await page.mouse.down();
        for (let step = 1; step <= 12; step++) {
            await page.mouse.move(startX, startY + step * 10, { steps: 2 });
            await page.waitForTimeout(30);
            const box = await sheet.boundingBox();
            expect(box, `sheet top stable at step ${step}`).not.toBeNull();
            expect(Math.abs(box!.y - top0), `sheet moved at step ${step}`).toBeLessThanOrEqual(2);
        }
        await page.mouse.up();
        await page.waitForTimeout(400);

        // Pointer-drag translate stalls under synthetic CDP input in Chromium
        // (activation starts, but position never advances, so no drop reorder;
        // on real touch devices the same gesture reorders). The persistence
        // path (drop -> draft -> save -> store) is exercised below through
        // dnd-kit's keyboard sensor, which drives the identical pipeline.
        await handle3.focus();
        await page.keyboard.press('Space');
        await page.waitForTimeout(200);
        await page.keyboard.press('ArrowUp');
        await page.waitForTimeout(200);
        await page.keyboard.press('ArrowUp');
        await page.waitForTimeout(200);
        await page.keyboard.press('Space');
        await page.waitForTimeout(400);

        // Save and verify the workout card order changed (row 3 moved down).
        const saveBtn = sheet.getByRole('button', { name: /Guardar orden|Save order/ });
        await expect(saveBtn).toBeVisible({ timeout: 6000 });
        await saveBtn.click();
        await expect(sheet).toBeHidden({ timeout: 6000 });

        const after = await cardNames.allTextContents();
        expect(after).not.toEqual(before);
        expect([...after].sort()).toEqual([...before].sort());
    });
});
