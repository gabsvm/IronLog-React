import { test, expect, type Page } from '@playwright/test';

const seedOnboardedProfile = (page: Page) =>
    page.addInitScript(() => {
        localStorage.setItem('il_onboarded_v2', 'true');
        localStorage.setItem('il_tutorial_v2', JSON.stringify({
            home: true, workout: true, history: true, stats: true, mesoSettings: true, nutrition: true,
        }));
    });

test.describe('CSS foundations, real computed values (F8)', () => {
    test('overscroll, touch-action, 11px floor, muted token and self-hosted font', async ({ page }) => {
        const requestedUrls: string[] = [];
        page.on('request', (request) => {
            requestedUrls.push(request.url());
        });

        await seedOnboardedProfile(page);
        await page.goto('/');
        const nav = page.locator('nav[aria-label="Main navigation"]');
        await expect(nav).toBeVisible({ timeout: 15000 });
        // Let font loading settle (networkidle never fires: Firebase keeps
        // long-lived connections open).
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(1000);

        // 1. No render-blocking Google Fonts: nothing is ever requested from
        // fonts.googleapis.com / fonts.gstatic.com (replaces fontStack.test.ts).
        expect(requestedUrls.filter((url) => url.includes('fonts.googleapis.com'))).toEqual([]);
        expect(requestedUrls.filter((url) => url.includes('fonts.gstatic.com'))).toEqual([]);

        // 2. The self-hosted Inter Variable font is actually usable.
        const interLoaded = await page.evaluate(() => document.fonts.check('16px "Inter Variable"'));
        expect(interLoaded).toBe(true);
        const htmlFont = await page.evaluate(() => getComputedStyle(document.documentElement).fontFamily);
        expect(htmlFont).toContain('Inter');

        // 3. Pull-to-refresh guard: overscroll contained on html, body and #root
        // (replaces touchGestures.test.ts).
        const overscroll = await page.evaluate(() => ({
            html: getComputedStyle(document.documentElement).overscrollBehavior,
            body: getComputedStyle(document.body).overscrollBehavior,
            root: getComputedStyle(document.getElementById('root')!).overscrollBehavior,
        }));
        expect(overscroll.html).toContain('contain');
        expect(overscroll.body).toContain('contain');
        expect(overscroll.root).toContain('contain');

        // 4. Tap delay guard: interactive controls use touch-action manipulation.
        const dietBtn = nav.locator('button', { hasText: /Dieta|Diet/ });
        await expect(dietBtn).toBeVisible();
        const touchAction = await dietBtn.evaluate((el) => getComputedStyle(el).touchAction);
        expect(touchAction).toContain('manipulation');

        // 5. Minimum text-size floor + muted token on the inactive nav label
        // (proves the real pixel value of the shared `text-[11px]` utility;
        // see also tests/unit/textSizeFloor.test.tsx).
        const label = dietBtn.locator('span');
        const labelStyle = await label.evaluate((el) => {
            const style = getComputedStyle(el);
            return { fontSize: style.fontSize, color: style.color };
        });
        expect(parseFloat(labelStyle.fontSize)).toBeGreaterThanOrEqual(11);
        const mutedToken = await page.evaluate(() => {
            const triplet = getComputedStyle(document.documentElement)
                .getPropertyValue('--text-muted').trim().split(/\s+/).map(Number);
            return `rgb(${triplet[0]}, ${triplet[1]}, ${triplet[2]})`;
        });
        expect(labelStyle.color).toBe(mutedToken);
    });
});
