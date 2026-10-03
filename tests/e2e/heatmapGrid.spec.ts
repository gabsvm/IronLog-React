import { test, expect, type Page } from '@playwright/test';

// L7: heatmap cells keep a uniform box even at high volume (no scale overlap).
const ERROR_BOUNDARY_TEXT = /ERROR CRÍTICO|CRITICAL ERROR/;

const seedHighVolume = (page: Page) =>
    page.addInitScript(() => {
        localStorage.setItem('il_onboarded_v2', 'true');
        localStorage.setItem('il_tutorial_v2', JSON.stringify({
            home: true, workout: true, history: true, stats: true, mesoSettings: true, nutrition: true,
        }));
        const sets = (n: number, fromId: number) =>
            Array.from({ length: n }, (_, i) => ({ id: fromId + i, completed: true, skipped: false }));
        localStorage.setItem('il_meso_v16', JSON.stringify({ id: 202, week: 1 }));
        localStorage.setItem('il_logs_v16', JSON.stringify([
            {
                id: 1, dayIdx: 0, name: 'B1', startTime: 5, endTime: 6, duration: 1,
                skipped: false, mesoId: 202, week: 1,
                exercises: [
                    { id: 'e-back', muscle: 'BACK', sets: sets(30, 1) },
                    { id: 'e-chest', muscle: 'CHEST', sets: sets(30, 101) },
                ],
            },
        ]));
    });

test.describe('L7 muscle heatmap grid', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('all 12 cells share one box size and never overlap', async ({ page }) => {
        await seedHighVolume(page);
        await page.goto('/');
        await page.locator('nav[aria-label="Main navigation"] button', { hasText: /Stats|Métricas/ }).click();
        // Overview section with the heatmap; BACK/CHEST average 30 → top heat.
        await expect(page.getByText('Espalda').first()).toBeVisible({ timeout: 15000 });
        await page.waitForTimeout(700);
        const cells = await page.locator('div.grid-cols-3 > div').all();
        expect(cells.length).toBe(12);
        const boxes = await Promise.all(cells.map((c) => c.boundingBox()));
        for (const box of boxes) {
            expect(box, 'cell box').not.toBeNull();
        }
        const widths = boxes.map((b) => b!.width);
        const heights = boxes.map((b) => b!.height);
        for (const w of widths) {
            expect(Math.abs(w - widths[0]), `width ${w} vs ${widths[0]}`).toBeLessThanOrEqual(1);
        }
        for (const h of heights) {
            expect(Math.abs(h - heights[0]), `height ${h} vs ${heights[0]}`).toBeLessThanOrEqual(1);
        }
        for (let i = 0; i < boxes.length; i++) {
            for (let j = i + 1; j < boxes.length; j++) {
                const a = boxes[i]!;
                const b = boxes[j]!;
                const intersects =
                    a.x < b.x + b.width && a.x + a.width > b.x &&
                    a.y < b.y + b.height && a.y + a.height > b.y;
                expect(intersects, `cells ${i} and ${j} overlap`).toBe(false);
            }
        }
        await expect(page.getByText(ERROR_BOUNDARY_TEXT)).toHaveCount(0);
    });
});
