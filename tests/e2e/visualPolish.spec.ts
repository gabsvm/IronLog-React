import { test, expect, type Page } from '@playwright/test';

// K7: visual polish verified through computed styles.
const ERROR_BOUNDARY_TEXT = /ERROR CRÍTICO|CRITICAL ERROR/;

const seed = (page: Page) =>
    page.addInitScript(() => {
        localStorage.setItem('il_onboarded_v2', 'true');
        localStorage.setItem('il_tutorial_v2', JSON.stringify({
            home: true, workout: true, history: true, stats: true, mesoSettings: true, nutrition: true,
        }));
    });

async function openUnifiedSheet(page: Page) {
    await page.getByLabel(/Abrir perfil|Open profile/).click();
    const sheet = page.locator('[role="dialog"]').first();
    await expect(sheet).toBeVisible({ timeout: 10000 });
    return sheet;
}

function alphasOf(colorFn: string): number[] {
    const out: number[] = [];
    for (const m of colorFn.matchAll(/rgba?\(([^)]+)\)/g)) {
        const inner = m[1];
        const slash = inner.split('/');
        if (slash.length === 2) {
            out.push(parseFloat(slash[1]));
        } else {
            const parts = inner.split(',').map((s) => s.trim());
            out.push(parts.length === 4 ? parseFloat(parts[3]) : 1);
        }
    }
    return out;
}

test.describe('K7 visual polish', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('L6: topbar background is fully opaque in balanced mode', async ({ page }) => {
        await seed(page);
        await page.goto('/');
        await page.locator('nav[aria-label="Main navigation"] button', { hasText: /Stats|Métricas/ }).click();
        await expect(page.locator('.app-topbar')).toBeVisible({ timeout: 10000 });
        const bg = await page.evaluate(() => {
            const el = document.querySelector('.app-topbar') as HTMLElement;
            const cs = getComputedStyle(el);
            const descendants = [...el.querySelectorAll('*')]
                .map((d) => getComputedStyle(d as HTMLElement).backgroundImage);
            return { image: cs.backgroundImage, color: cs.backgroundColor, descendants };
        });
        expect(bg.image).toBe('none');
        expect(alphasOf(bg.color)).toEqual([1]);
        for (const img of bg.descendants) {
            for (const a of alphasOf(img)) {
                expect(a, `descendant stop alpha in "${img}"`).toBeGreaterThanOrEqual(1);
            }
        }
        await expect(page.getByText(ERROR_BOUNDARY_TEXT)).toHaveCount(0);
    });

    test('reduced effects: topbar is fully solid', async ({ page }) => {
        await seed(page);
        await page.goto('/');
        await expect(page.locator('.app-topbar')).toBeVisible({ timeout: 10000 });
        await page.evaluate(() => { document.documentElement.dataset.effects = 'reduced'; });
        const bg = await page.evaluate(() => {
            const el = document.querySelector('.app-topbar') as HTMLElement;
            const cs = getComputedStyle(el);
            return { image: cs.backgroundImage, color: cs.backgroundColor };
        });
        expect(bg.image).toBe('none');
        expect(alphasOf(bg.color)).toEqual([1]);
        await expect(page.getByText(ERROR_BOUNDARY_TEXT)).toHaveCount(0);
    });

    test('rest-timer segmented uses lime fill and sentence-case labels', async ({ page }) => {
        await seed(page);
        await page.goto('/');
        const sheet = await openUnifiedSheet(page);
        // Sentence case, single label set in the unified sheet.
        await expect(sheet.getByText('Mantener pantalla encendida')).toBeVisible();
        await expect(sheet.getByText('Mostrar columna RIR')).toBeVisible();
        await expect(sheet.getByText(/Pantalla Encendida|Mostrar Columna RIR/)).toHaveCount(0);
        // Selected segment = lime fill + black text, like the other tabs.
        const compactBtn = sheet.getByRole('button', { name: /Píldora Compacta|Compact Pill/ });
        await expect(compactBtn).toBeVisible();
        const colors = await compactBtn.evaluate((el) => {
            const cs = getComputedStyle(el);
            const raw = getComputedStyle(document.documentElement).getPropertyValue('--primary-500').trim();
            return { btnBg: cs.backgroundColor, btnFg: cs.color, raw };
        });
        const expectedLime = `rgb(${colors.raw.split(/\s+/).join(', ')})`;
        expect(colors.btnBg).toBe(expectedLime);
        expect(colors.btnFg).toBe('rgb(0, 0, 0)');
        await expect(page.getByText(ERROR_BOUNDARY_TEXT)).toHaveCount(0);
    });

    test('profile toggle knobs are white like settings toggles', async ({ page }) => {
        await seed(page);
        await page.goto('/');
        await page.getByLabel(/Abrir perfil|Open profile/).click();
        const dialog = page.locator('[role="dialog"]').first();
        await expect(dialog).toBeVisible({ timeout: 10000 });
        const knobs = await dialog.evaluate((d) =>
            [...d.querySelectorAll('button > span[class*="absolute"]')]
                .filter((s) => s.className.includes('w-5') && s.className.includes('h-5'))
                .map((s) => getComputedStyle(s as HTMLElement).backgroundColor),
        );
        expect(knobs.length).toBeGreaterThanOrEqual(2);
        for (const c of knobs) {
            expect(c).toBe('rgb(255, 255, 255)');
        }
        await expect(page.getByText(ERROR_BOUNDARY_TEXT)).toHaveCount(0);
    });

    test('diet sub-views share the body background (no lighter band)', async ({ page }) => {
        await seed(page);
        await page.goto('/');
        await page.locator('nav[aria-label="Main navigation"] button', { hasText: /Dieta|Diet/ }).click();
        await expect(page.getByRole('button', { name: /^Hoy$|^Today$/ })).toBeVisible({ timeout: 10000 });
        const count = await page.evaluate(() => {
            const hoy = [...document.querySelectorAll('button')]
                .find((b) => /^(Hoy|Today)$/.test((b.textContent || '').trim()));
            const root = hoy?.closest('div.h-full');
            return root ? root.querySelectorAll(':scope > div:first-child button').length : 0;
        });
        expect(count).toBe(3);
        for (let i = 0; i < count; i++) {
            const res = await page.evaluate((idx) => {
                const hoy = [...document.querySelectorAll('button')]
                    .find((b) => /^(Hoy|Today)$/.test((b.textContent || '').trim()));
                const root = hoy?.closest('div.h-full') as HTMLElement | null;
                if (!root) return null;
                (root.querySelectorAll(':scope > div:first-child button')[idx] as HTMLElement).click();
                return {
                    rootBg: getComputedStyle(root).backgroundColor,
                    bodyBg: getComputedStyle(document.body).backgroundColor,
                };
            }, i);
            expect(res, `sub-tab ${i} root found`).not.toBeNull();
            expect(res!.rootBg, `sub-tab ${i} background`).toBe(res!.bodyBg);
        }
        await expect(page.getByText(ERROR_BOUNDARY_TEXT)).toHaveCount(0);
    });
});
