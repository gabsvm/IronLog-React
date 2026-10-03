import { test, expect } from '@playwright/test';

// L8: the dnd-kit DragOverlay clone must track the pointer while dragging
// inside the vaul sheet (a transformed ancestor breaks position:fixed).
const ERROR_BOUNDARY_TEXT = /ERROR CRÍTICO|CRITICAL ERROR/;

test.describe('L8: drag overlay position in reorder sheet', () => {
    test('clone center tracks the pointer during a row drag', async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => {
            localStorage.setItem('il_onboarded_v2', 'true');
            localStorage.setItem('il_tutorial_v2', JSON.stringify({
                home: true, workout: true, history: true, stats: true, mesoSettings: true, nutrition: true,
            }));
        });
        await page.reload();

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

        const reorderBtn = page.locator('button[aria-label*="Ordenar ejercicios" i], button[aria-label*="Reorder exercises" i]').first();
        await expect(reorderBtn).toBeVisible({ timeout: 6000 });
        await reorderBtn.click();
        const sheet = page.locator('[role="dialog"]').last();
        await expect(sheet).toBeVisible({ timeout: 6000 });
        await page.waitForTimeout(600);

        const handle3 = sheet.getByRole('button', { name: /Mover |Move / }).nth(2);
        await expect(handle3).toBeVisible({ timeout: 6000 });
        const hbox = await handle3.boundingBox();
        expect(hbox).not.toBeNull();
        const startX = hbox!.x + hbox!.width / 2;
        const startY = hbox!.y + hbox!.height / 2;
        const rowName = await sheet.locator('div.text-sm.font-medium').nth(2).textContent();

        await page.mouse.move(startX, startY);
        await page.mouse.down();
        await page.waitForTimeout(100);
        for (let step = 1; step <= 10; step++) {
            const px = startX;
            const py = startY + step * 12;
            await page.mouse.move(px, py, { steps: 2 });
            await page.waitForTimeout(60);
            const sample = await page.evaluate((name) => {
                const fixed = ([...document.querySelectorAll('body *')] as HTMLElement[]).filter((el) => {
                    if (getComputedStyle(el).position !== 'fixed') return false;
                    return (el.textContent || '').includes(name || '');
                });
                if (fixed.length === 0) return null;
                // The clone is the smallest fixed box with the row name.
                fixed.sort((a, b) => {
                    const ra = a.getBoundingClientRect();
                    const rb = b.getBoundingClientRect();
                    return ra.width * ra.height - rb.width * rb.height;
                });
                const r = fixed[0].getBoundingClientRect();
                return { x: r.x, y: r.y, width: r.width, height: r.height };
            }, rowName);
            expect(sample, `overlay clone found at step ${step}`).not.toBeNull();
            const cx = sample!.x + sample!.width / 2;
            const cy = sample!.y + sample!.height / 2;
            expect(Math.abs(cy - py), `clone tracks pointer vertically at step ${step} (clone ${cy}, pointer ${py})`).toBeLessThanOrEqual(24);
            const sheetBox = await sheet.boundingBox();
            expect(sheetBox).not.toBeNull();
            expect(cx, `clone stays horizontally inside the sheet at step ${step}`).toBeGreaterThanOrEqual(sheetBox!.x);
            expect(cx, `clone stays horizontally inside the sheet at step ${step}`).toBeLessThanOrEqual(sheetBox!.x + sheetBox!.width);
        }
        await page.mouse.up();
        await expect(page.getByText(ERROR_BOUNDARY_TEXT)).toHaveCount(0);
    });
});
