import { test, expect, type Page } from '@playwright/test';

// L5: short Strong nav labels with clearance from the viewport edge.
const ERROR_BOUNDARY_TEXT = /ERROR CRÍTICO|CRITICAL ERROR/;

const seed = (page: Page) =>
    page.addInitScript(() => {
        localStorage.setItem('il_onboarded_v2', 'true');
        localStorage.setItem('il_tutorial_v2', JSON.stringify({
            home: true, workout: true, history: true, stats: true, mesoSettings: true, nutrition: true,
        }));
    });

for (const viewport of [{ width: 360, height: 800 }, { width: 390, height: 844 }]) {
    test.describe(`L5 nav labels at ${viewport.width}x${viewport.height}`, () => {
        test.use({ viewport });

        test('Strong labels are short and every label clears the viewport edge', async ({ page }) => {
            await seed(page);
            await page.goto('/');
            const nav = page.locator('nav[aria-label="Main navigation"]');
            await expect(nav).toBeVisible({ timeout: 10000 });

            // The five Strong destinations (short labels, no Fase-2 names).
            for (const name of [/^Perfil$|^Profile$/, /^Historial$|^History$/, /^Entreno$|^Workout$/, /^Ejercicios$|^Exercises$/, /^Medidas$|^Measure$/]) {
                await expect(nav.getByRole('button', { name }).first()).toBeVisible({ timeout: 8000 });
            }
            for (const name of [/^Rutina$|^Routine$/, /^Progreso$|^Progress$/, /^Diario$|^Diary$/, /^Hoy$|^Today$/]) {
                await expect(nav.getByRole('button', { name })).toHaveCount(0);
            }

            // Truncation safety net on every label (icon pills excluded).
            const truncations = await page.evaluate(() => {
                const navEl = document.querySelector('nav[aria-label="Main navigation"]');
                if (!navEl) return [];
                return [...navEl.querySelectorAll(':scope button > span.strong-tab-label')].map((el) => {
                    const cs = getComputedStyle(el as HTMLElement);
                    return {
                        text: (el.textContent || '').trim(),
                        overflowX: cs.overflowX,
                        textOverflow: cs.textOverflow,
                        minWidth: cs.minWidth,
                    };
                });
            });
            // Five Strong labels: each stays short (<= 10 chars) and readable.
            expect(truncations.length).toBe(5);
            for (const t of truncations) {
                expect(t.text.length, `${t.text} is short`).toBeLessThanOrEqual(10);
                expect(t.overflowX, `${t.text} clips`).toBe('hidden');
                expect(t.textOverflow, `${t.text} ellipsizes`).toBe('ellipsis');
                expect(t.minWidth, `${t.text} shrinks`).toBe('0px');
            }

            // Geometry: right edge ≥ 8px from the viewport, no overlaps.
            const labelLocators = await nav.locator(':scope button > span.strong-tab-label').all();
            expect(labelLocators.length).toBe(5);
            const boxes = await Promise.all(labelLocators.map((loc) => loc.boundingBox()));
            for (const box of boxes) {
                expect(box, 'label box').not.toBeNull();
                expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width - 8);
            }
            for (let i = 0; i < boxes.length; i++) {
                for (let j = i + 1; j < boxes.length; j++) {
                    const a = boxes[i]!;
                    const b = boxes[j]!;
                    const intersects =
                        a.x < b.x + b.width && a.x + a.width > b.x &&
                        a.y < b.y + b.height && a.y + a.height > b.y;
                    expect(intersects, `labels ${i} and ${j} overlap`).toBe(false);
                }
            }
            await expect(page.getByText(ERROR_BOUNDARY_TEXT)).toHaveCount(0);
        });
    });
}
