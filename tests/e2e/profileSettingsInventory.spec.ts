import { test, expect, type Page } from '@playwright/test';
import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// N6 test (a): the BEFORE inventory (profile-settings.before.json, captured
// from the old "Tú" sheet + Settings modal) must equal the controls reachable
// in the unified sheet, modulo the documented mapping below:
// - absorbed link rows / renamed duplicates: REMOVED (asserted absent)
// - merged duplicates (toggles, Editar, Editor de programa): exactly once
// - 'auto': twice (theme system + effects system are distinct controls)
// - notifications button: exactly one of its three permission states
// Comparison is case-insensitive (case is stylesheet-driven).
// Guest-only labels (sync-now, logout, delete-account, admin, diagnostics
// values) are covered by unit tests instead.

const HERE = dirname(fileURLToPath(import.meta.url));

const seedOnboarded = (page: Page) =>
    page.addInitScript(() => {
        localStorage.setItem('il_onboarded_v2', 'true');
        localStorage.setItem('il_tutorial_v2', JSON.stringify({
            home: true, workout: true, history: true, stats: true, mesoSettings: true, nutrition: true,
        }));
    });

const collectLabels = (page: Page, scope: string) =>
    page.evaluate((root: string) => {
        const scopeEl = document.querySelector(root) ?? document.body;
        // One entry per control occurrence (no dedupe): duplicates must be
        // measurable for the exactly-once assertions below.
        const labels: string[] = [];
        scopeEl.querySelectorAll('button, a[href], input, select, textarea, [role="button"], [role="tab"]').forEach((el) => {
            const html = el as HTMLElement;
            if (html.offsetParent === null && html.tagName !== 'INPUT') return;
            const text = (html.innerText || '').replace(/\s+/g, ' ').trim();
            if (text) {
                text.split('\n').forEach((t) => {
                    if (t.trim()) labels.push(t.trim());
                });
            }
            const aria = html.getAttribute('aria-label');
            if (aria) labels.push(`[${aria}]`);
            const input = el as HTMLInputElement;
            if (input.placeholder) labels.push(`<${input.placeholder}>`);
            if (!text && !aria && !input.placeholder && html.tagName === 'BUTTON') {
                const rowText = ((html.parentElement?.innerText || '').split('\n')[0] || '').replace(/\s+/g, ' ').trim();
                if (rowText) labels.push(`(row) ${rowText.slice(0, 60)}`);
            }
        });
        return labels.sort();
    }, scope);

const normalize = (label: string) => label.toLowerCase().replace(/\s+/g, ' ').trim();

// Absorbed link rows and renamed duplicates: must NOT appear (exact match).
const REMOVED = [
    'tema y color oscuro · iron', // row absorbed by inline theme + accent controls
    'ver', // row absorbed by inline sync controls
    'exportar y copia de seguridad', // replaced by Exportar/Importar Datos buttons
    'idioma español', // toggle row replaced by the EN/ES segmented control
    'gestionar ejercicios', // renamed to the destination label below
    'iniciar sesión', // exact form; kept form is 'iniciar sesión / registrarse'
];

// Merged duplicates asserted via contains (accessible-name form may vary).
const CONTAINS_ONCE = ['mostrar columna rir', 'mantener pantalla encendida'];
const NOTIF_STATES = ['permitir', 'activadas', 'bloqueadas'];

test.describe('N6: unified sheet control mapping', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('every surviving before-label appears exactly once', async ({ page }) => {
        const before = JSON.parse(
            readFileSync(join(HERE, 'inventory', 'profile-settings.before.json'), 'utf8'),
        ) as { profileLabels: string[]; settingsByTab: Record<string, string[]> };
        const beforeLabels = new Set<string>();
        for (const l of before.profileLabels) beforeLabels.add(normalize(l));
        for (const tab of Object.values(before.settingsByTab)) {
            for (const l of tab) beforeLabels.add(normalize(l));
        }

        await seedOnboarded(page);
        await page.goto('/');
        const nav = page.locator('nav[aria-label="Main navigation"]');
        await expect(nav).toBeVisible({ timeout: 15000 });

        await page.getByLabel(/Abrir perfil|Open profile/).click();
        const sheet = page.locator('[role="dialog"]').first();
        await expect(sheet).toBeVisible({ timeout: 10000 });
        // Open the collapsible Advanced section so its controls are reachable.
        await sheet.locator('summary', { hasText: /Avanzado|Advanced/ }).click();

        for (const section of ['account', 'body', 'training', 'appearance', 'data', 'advanced', 'danger']) {
            await expect(sheet.locator(`#profile-section-${section}`), `section ${section}`).toHaveCount(1);
        }

        const afterLabels = await collectLabels(page, '[role="dialog"]');
        const counts = new Map<string, number>();
        for (const l of afterLabels) {
            const key = normalize(l);
            counts.set(key, (counts.get(key) ?? 0) + 1);
        }
        writeFileSync(join(HERE, 'inventory', 'profile-settings.after.json'), JSON.stringify(afterLabels, null, 2) + '\n');

        for (const removed of REMOVED) {
            expect(counts.get(removed) ?? 0, `removed label "${removed}"`).toBe(0);
        }

        for (const needle of CONTAINS_ONCE) {
            let total = 0;
            for (const [label, count] of counts) {
                if (label.includes(needle)) total += count;
            }
            expect(total, `merged label "${needle}"`).toBe(1);
        }

        let notifTotal = 0;
        for (const state of NOTIF_STATES) {
            notifTotal += counts.get(state) ?? 0;
        }
        expect(notifTotal, 'notification state button').toBe(1);

        const special = new Set([...REMOVED, ...CONTAINS_ONCE.map((n) => `(row) ${n}`), ...NOTIF_STATES]);
        for (const label of beforeLabels) {
            if (special.has(label)) continue;
            // 'auto' is two distinct controls (theme system + effects system).
            const expected = label === 'auto' ? 2 : 1;
            expect(counts.get(label) ?? 0, `kept label "${label}"`).toBe(expected);
        }

        await expect(page.getByText(/ERROR CR.TICO|CRITICAL ERROR/)).toHaveCount(0);
    });
});

test.describe('N6: unified sheet entry points', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('open-profile event opens the sheet scrolled to the requested section', async ({ page }) => {
        await seedOnboarded(page);
        await page.goto('/');
        const nav = page.locator('nav[aria-label="Main navigation"]');
        await expect(nav).toBeVisible({ timeout: 15000 });

        // Former settings entry points (e.g. back from the exercises library)
        // now dispatch this event with a target section.
        await page.evaluate(() => {
            window.dispatchEvent(new CustomEvent('gainslab:open-profile', { detail: { section: 'danger' } }));
        });
        const sheet = page.locator('[role="dialog"]').first();
        await expect(sheet).toBeVisible({ timeout: 10000 });
        await expect(sheet.locator('#profile-section-danger')).toBeInViewport({ timeout: 8000 });

        await expect(page.getByText(/ERROR CR.TICO|CRITICAL ERROR/)).toHaveCount(0);
    });

    test('back from the sheet returns to the previous view inside the app', async ({ page }) => {
        await seedOnboarded(page);
        await page.goto('/');
        const nav = page.locator('nav[aria-label="Main navigation"]');
        await expect(nav).toBeVisible({ timeout: 15000 });

        await page.getByLabel(/Abrir perfil|Open profile/).click();
        const sheet = page.locator('[role="dialog"]').first();
        await expect(sheet).toBeVisible({ timeout: 10000 });

        await page.goBack();
        await expect(sheet).toHaveCount(0, { timeout: 8000 });
        await expect(nav).toBeVisible();
        expect(page.url()).toContain('localhost');

        await expect(page.getByText(/ERROR CR.TICO|CRITICAL ERROR/)).toHaveCount(0);
    });
});
