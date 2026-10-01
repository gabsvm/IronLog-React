import { test, expect } from '@playwright/test';

const ERROR_BOUNDARY_TEXT = /ERROR CRÍTICO|CRITICAL ERROR/;
const VIEW_LOAD_FAILED_TEXT = /No se pudo cargar esta pantalla|This screen couldn't be loaded/;

test.describe('Offline shell with lazy views precached (F1)', () => {
    test('online load, then offline: shortcut, History and Stats render without errors', async ({ page, context }) => {
        await page.addInitScript(() => {
            localStorage.setItem('il_onboarded_v2', 'true');
            localStorage.setItem('il_tutorial_v2', JSON.stringify({
                home: true, workout: true, history: true, stats: true, mesoSettings: true, nutrition: true,
            }));
        });

        // 1. Online first load with the Service Worker enabled (?sw=1 E2E override).
        await page.goto('/?sw=1');
        const nav = page.locator('nav[aria-label="Main navigation"]');
        await expect(nav).toBeVisible({ timeout: 15000 });

        // 2. Wait until the SW installs, activates and takes control.
        await page.waitForFunction(() => Boolean(navigator.serviceWorker?.controller), null, { timeout: 45000 });

        // 3. The precache must include lazy view chunks (the F1 regression: shell-only precache).
        const precachedUrls: string[] = await page.evaluate(async () => {
            const names = await caches.keys();
            const urls: string[] = [];
            for (const name of names) {
                const cache = await caches.open(name);
                const keys = await cache.keys();
                urls.push(...keys.map((request) => request.url));
            }
            return urls;
        });
        expect(precachedUrls.some((url) => url.includes('HistoryView-'))).toBe(true);
        expect(precachedUrls.some((url) => url.includes('StatsView-'))).toBe(true);
        expect(precachedUrls.some((url) => url.includes('WorkoutView-'))).toBe(true);

        // Reload while controlled so runtime-cached images are also available offline.
        await page.reload();
        await expect(nav).toBeVisible({ timeout: 15000 });

        // 4. Go offline and open the PWA shortcut URL (navigation with query params).
        await context.setOffline(true);
        await page.goto('/?action=start&source=shortcut');

        // Shortcut with no active meso creates a Quick Start session -> workout view.
        const finishBtn = page.locator('#tut-finish-btn');
        await expect(finishBtn).toBeVisible({ timeout: 15000 });
        await expect(page.getByText(ERROR_BOUNDARY_TEXT)).toHaveCount(0);
        await expect(page.getByText(VIEW_LOAD_FAILED_TEXT)).toHaveCount(0);

        // Back to a Layout view via the workout back button (bottom nav is hidden during workouts).
        await page.getByRole('button', { name: /Atrás|Back/ }).first().click();
        await expect(nav).toBeVisible({ timeout: 8000 });

        // 5. History renders offline from precache.
        const historyNavBtn = page.locator('nav[aria-label="Main navigation"] button', { hasText: /Historial|History/ });
        await expect(historyNavBtn).toBeVisible({ timeout: 8000 });
        await historyNavBtn.click();
        // Populated history shows an h2; a fresh profile shows the empty-state h3.
        await expect(page.getByRole('heading', { name: /Historial|History|Sin entrenamientos|No workouts/ }).first()).toBeVisible({ timeout: 15000 });
        await expect(page.getByText(ERROR_BOUNDARY_TEXT)).toHaveCount(0);
        await expect(page.getByText(VIEW_LOAD_FAILED_TEXT)).toHaveCount(0);

        // 6. Stats renders offline from precache.
        const statsNavBtn = page.locator('nav[aria-label="Main navigation"] button', { hasText: 'Stats' });
        await expect(statsNavBtn).toBeVisible({ timeout: 8000 });
        await statsNavBtn.click();
        await expect(page.getByRole('tablist').first()).toBeVisible({ timeout: 15000 });
        await expect(page.getByText(ERROR_BOUNDARY_TEXT)).toHaveCount(0);
        await expect(page.getByText(VIEW_LOAD_FAILED_TEXT)).toHaveCount(0);
    });
});
