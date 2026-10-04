import { test, expect, type Page } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

// Q12: CSV import (Hevy/Strong) with preview + mapping, idempotent reimport,
// and CSV export with the chosen unit in the header.

const HERE = dirname(fileURLToPath(import.meta.url));
const HEVY_FIXTURE = join(HERE, 'fixtures', 'hevy-sample.csv');
const STRONG_FIXTURE = join(HERE, 'fixtures', 'strong-sample.csv');

/**
 * Free accounts only see the last 7 days in History, so the static fixtures
 * are re-dated to recent days at runtime (format and content unchanged).
 */
const datedFixture = (src: string, fromDay: string, daysAgo: number): string => {
    const day = new Date(Date.now() - daysAgo * 86400000).toISOString().slice(0, 10);
    const out = join(tmpdir(), `gainslab-e2e-${Date.now()}-${Math.round(Math.random() * 1e6)}.csv`);
    writeFileSync(out, readFileSync(src, 'utf8').replaceAll(fromDay, day));
    return out;
};

const seedOnboarded = (page: Page) =>
    page.addInitScript(() => {
        localStorage.setItem('il_onboarded_v2', 'true');
        localStorage.setItem('il_tutorial_v2', JSON.stringify({
            home: true, workout: true, history: true, stats: true, mesoSettings: true, nutrition: true,
        }));
    });

const openProfileData = async (page: Page) => {
    await page.getByLabel(/Abrir perfil|Open profile/).click();
    const sheet = page.locator('[role="dialog"]').first();
    await expect(sheet).toBeVisible({ timeout: 10000 });
    const data = sheet.locator('#profile-section-data');
    await data.scrollIntoViewIfNeeded();
    return { sheet, data };
};

test.describe('Q12: training CSV import/export', () => {
    test.use({ viewport: { width: 390, height: 844 }, acceptDownloads: true });

    test('hevy import with mapping, idempotent reimport, strong lb import, csv export', async ({ page }) => {
        const hevyFile = datedFixture(HEVY_FIXTURE, '2026-09-20', 2);
        const strongFile = datedFixture(STRONG_FIXTURE, '2026-09-21', 1);
        await seedOnboarded(page);
        await page.goto('/');
        await expect(page.locator('nav[aria-label="Main navigation"]')).toBeVisible({ timeout: 15000 });

        // ── 1. Hevy import ──────────────────────────────────────────
        const { sheet, data } = await openProfileData(page);
        await data.locator('input[type="file"][accept*="csv"]').setInputFiles(hevyFile);
        const importSheet = page.locator('[role="dialog"]').last();
        await expect(importSheet.getByText('Hevy', { exact: true })).toBeVisible({ timeout: 6000 });
        // Barbell Bench Press exists in the library → auto-matched.
        await expect(importSheet.getByText(/Press Banca Barra/)).toBeVisible();
        // Zercher Squat is new → create it with an explicit muscle.
        const zercherCard = importSheet.getByText('Zercher Squat', { exact: true }).locator('..');
        await zercherCard.getByLabel(/Músculo|Muscle/).selectOption({ value: 'QUADS' });
        const importBtn = importSheet.getByRole('button', { name: /Importar 1 sesi/ });
        await expect(importBtn).toBeEnabled();
        await importBtn.click();
        await expect(page.getByText(/Importar entrenamientos|Import workouts/, { exact: true })).toBeHidden({ timeout: 6000 });
        await expect(data.getByText(/1 sesiones importadas/)).toBeVisible({ timeout: 6000 });
        await page.goBack();
        await expect(sheet).toBeHidden({ timeout: 6000 });

        // ── 2. Imported session lands in History ─────────────────────
        await page.locator('nav[aria-label="Main navigation"]').getByRole('button', { name: /Historial|History/ }).click();
        await expect(page.getByText('Morning Push')).toBeVisible({ timeout: 8000 });

        // ── 3. Reimport is idempotent ─────────────────────────────────
        const reopened = await openProfileData(page);
        await reopened.data.locator('input[type="file"][accept*="csv"]').setInputFiles(hevyFile);
        const reimportSheet = page.locator('[role="dialog"]').last();
        await expect(reimportSheet.getByText(/No hay sesiones nuevas/)).toBeVisible({ timeout: 6000 });
        await expect(reimportSheet.getByRole('button', { name: /Importar \d+ sesi/ })).toHaveCount(0);
        await reimportSheet.getByRole('button', { name: /Cancelar|Cancel/ }).click();
        await expect(page.getByText(/Importar entrenamientos|Import workouts/, { exact: true })).toBeHidden({ timeout: 6000 });

        // ── 4. Strong import with lb weights ──────────────────────────
        await reopened.data.locator('input[type="file"][accept*="csv"]').setInputFiles(strongFile);
        const strongSheet = page.locator('[role="dialog"]').last();
        await expect(strongSheet.getByText('Strong', { exact: true })).toBeVisible({ timeout: 6000 });
        await strongSheet.getByRole('button', { name: 'LBS', exact: true }).click();
        // "Deadlift" has no exact library match → map onto the conventional deadlift.
        const dlCard = strongSheet.getByText('Deadlift', { exact: true }).locator('..');
        await dlCard.getByRole('button', { name: /Mapear a/ }).click();
        await dlCard.getByRole('combobox').selectOption({ value: 'deadlift' });
        await strongSheet.getByRole('button', { name: /Importar 1 sesi/ }).click();
        await expect(page.getByText(/Importar entrenamientos|Import workouts/, { exact: true })).toBeHidden({ timeout: 6000 });
        await expect(reopened.data.getByText(/1 sesiones importadas/)).toBeVisible({ timeout: 6000 });

        // ── 5. CSV export downloads with the unit in the header ───────
        const [download] = await Promise.all([
            page.waitForEvent('download', { timeout: 10000 }),
            reopened.data.getByRole('button', { name: /Exportar CSV/ }).click(),
        ]);
        expect(download.suggestedFilename()).toMatch(/^gainslab_history_\d{4}-\d{2}-\d{2}\.csv$/);
        const content = readFileSync(await download.path(), 'utf8');
        const [header, ...rows] = content.split('\n');
        expect(header).toContain('Weight(kg)');
        expect(content).toContain('Morning Push');
        expect(content).toContain('Evening Pull');
        // 135 lb Strong set stored as canonical kg.
        expect(content).toContain('61.235');
        expect(rows.length).toBeGreaterThan(2);
    });
});
