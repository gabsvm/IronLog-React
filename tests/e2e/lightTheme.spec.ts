import { test, expect, type Page } from '@playwright/test';

// S9: in light theme the next set to do must not render as a dark island
// (it used a hard-coded #1b1b20 background). Dark theme keeps that color.

const seed = (page: Page, theme: 'light' | 'dark') =>
    page.addInitScript((t) => {
        localStorage.setItem('il_onboarded_v2', 'true');
        localStorage.setItem('il_last_backup_at', String(Date.now()));
        localStorage.setItem('il_theme_v1', JSON.stringify(t));
        localStorage.setItem('il_tutorial_v2', JSON.stringify({
            home: true, workout: true, history: true, stats: true, mesoSettings: true, nutrition: true,
        }));
        localStorage.setItem('il_meso_v16', JSON.stringify({ id: 7, name: 'Plan', mesoType: 'hyp_1', week: 1, duration: 5, plan: [[null]] }));
        localStorage.setItem('il_prog_v16', JSON.stringify([
            { id: 'd0', dayName: { es: 'Torso', en: 'Torso' }, slots: [{ muscle: 'CHEST', setTarget: 2, exerciseId: 'bp_bar' }] },
        ]));
    }, theme);

const nextRowBackground = async (page: Page) => {
    await page.getByRole('button', { name: /Empezar|Start/ }).first().click();
    await expect(page.locator('#tut-finish-btn')).toBeVisible({ timeout: 15000 });
    const row = page.locator('[id^="set-row-"]').first();
    await expect(row).toBeVisible();
    return row.evaluate((el) => getComputedStyle(el).backgroundColor);
};

const luminance = (rgb: string) => {
    const [r, g, b] = (rgb.match(/\d+(\.\d+)?/g) || []).map(Number);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

test.describe('S9: next-set row follows the theme', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('light theme: the next set row is light', async ({ page }) => {
        await seed(page, 'light');
        await page.goto('/');
        const bg = await nextRowBackground(page);
        expect(luminance(bg), bg).toBeGreaterThan(200);
    });

    test('dark theme: the next set row keeps #1b1b20', async ({ page }) => {
        await seed(page, 'dark');
        await page.goto('/');
        expect(await nextRowBackground(page)).toBe('rgb(27, 27, 32)');
    });
});
