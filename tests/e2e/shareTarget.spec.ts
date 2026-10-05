import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// S3: a CSV shared to the installed PWA goes through the REAL service worker
// (manifest share_target → POST /share-target → cache → 303 redirect) and
// opens the same import flow as Perfil → Datos. Manifest shortcuts for
// nutrition/history open their views.

const HERE = dirname(fileURLToPath(import.meta.url));
const HEVY_FIXTURE = join(HERE, 'fixtures', 'hevy-sample.csv');
const ERROR_BOUNDARY_TEXT = /ERROR CRÍTICO|CRITICAL ERROR/;

const seedOnboarded = (page: Page) =>
    page.addInitScript(() => {
        localStorage.setItem('il_onboarded_v2', 'true');
        localStorage.setItem('il_tutorial_v2', JSON.stringify({
            home: true, workout: true, history: true, stats: true, mesoSettings: true, nutrition: true,
        }));
    });

test.describe('S3: share target + shortcuts', () => {
    test.setTimeout(120000);
    test.use({ viewport: { width: 390, height: 844 } });

    test('a shared Hevy CSV opens the import sheet through the service worker', async ({ page }) => {
        await seedOnboarded(page);
        await page.goto('/?sw=1');
        await expect(page.locator('nav[aria-label="Main navigation"]')).toBeVisible({ timeout: 15000 });
        await page.waitForFunction(() => Boolean(navigator.serviceWorker?.controller), null, { timeout: 45000 });

        // Simulate the OS share sheet: a multipart POST navigation to the share_target action.
        const csv = readFileSync(HEVY_FIXTURE, 'utf8');
        await page.evaluate((text) => {
            const form = document.createElement('form');
            form.method = 'POST';
            form.enctype = 'multipart/form-data';
            form.action = '/share-target';
            const input = document.createElement('input');
            input.type = 'file';
            input.name = 'file';
            const transfer = new DataTransfer();
            transfer.items.add(new File([text], 'hevy.csv', { type: 'text/csv' }));
            input.files = transfer.files;
            form.appendChild(input);
            document.body.appendChild(form);
            form.submit();
        }, csv);

        await page.waitForURL((url) => url.pathname === '/', { timeout: 15000 });
        const importSheet = page.locator('[role="dialog"]').last();
        await expect(importSheet.getByText('Hevy', { exact: true })).toBeVisible({ timeout: 15000 });
        await expect(importSheet.getByText(/Press Banca Barra/)).toBeVisible();
        // The query is stripped so a reload never re-imports; the payload is consumed.
        expect(new URL(page.url()).search).toBe('');
        const leftover = await page.evaluate(async () => {
            const cache = await caches.open('gainslab-share-v1');
            return Boolean(await cache.match('/__shared-csv__'));
        });
        expect(leftover).toBe(false);
        await expect(page.getByText(ERROR_BOUNDARY_TEXT)).toHaveCount(0);
    });

    test('nutrition and history shortcuts open their views', async ({ page }) => {
        await seedOnboarded(page);
        await page.goto('/?action=history&source=shortcut');
        const nav = page.locator('nav[aria-label="Main navigation"]');
        await expect(nav.getByRole('button', { name: /Historial|History/ })).toHaveAttribute('aria-current', 'page', { timeout: 15000 });
        expect(new URL(page.url()).search).toBe('');

        await page.goto('/?action=nutrition&source=shortcut');
        await expect(nav.getByRole('button', { name: /Dieta|Diet/ })).toHaveAttribute('aria-current', 'page', { timeout: 15000 });
    });
});
