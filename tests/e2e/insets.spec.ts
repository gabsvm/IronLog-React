import { test, expect } from '@playwright/test';

// Simulated SystemBars insets (Capacitor 8 'css' mode injects these vars).
const INSET_TOP = 40;
const INSET_BOTTOM = 24;

test.use({ viewport: { width: 390, height: 844 } });

test.describe('P7-4: edge-to-edge insets', () => {
    test('header, bottom nav and rest pill respect injected safe-area insets', async ({ page }) => {
        await page.addInitScript(() => {
            localStorage.setItem('il_onboarded_v2', 'true');
            localStorage.setItem('il_tutorial_v2', JSON.stringify({
                home: true, workout: true, history: true, stats: true, mesoSettings: true, nutrition: true,
            }));
        });
        await page.goto('/');
        // Mirror the SystemBars plugin: it injects the CSS vars on
        // documentElement at runtime (post-load), on every inset change.
        await page.evaluate(
            ({ top, bottom }) => {
                const root = document.documentElement;
                root.style.setProperty('--safe-area-inset-top', `${top}px`);
                root.style.setProperty('--safe-area-inset-right', '0px');
                root.style.setProperty('--safe-area-inset-bottom', `${bottom}px`);
                root.style.setProperty('--safe-area-inset-left', '0px');
            },
            { top: INSET_TOP, bottom: INSET_BOTTOM }
        );

        const viewport = page.viewportSize();
        expect(viewport).not.toBeNull();
        const height = viewport!.height;

        // --- Home: bottom nav clears the simulated navigation bar zone. ---
        const nav = page.locator('nav[aria-label="Main navigation"]');
        await expect(nav).toBeVisible({ timeout: 15000 });
        // The nav chrome itself extends to the screen edge (correct edge-to-edge
        // behavior); what matters is that every interactive control clears the
        // simulated system-bar zone.
        const navButtons = nav.locator('button');
        for (let i = 0; i < (await navButtons.count()); i++) {
            const box = await navButtons.nth(i).boundingBox();
            expect(box, `nav button ${i} box`).not.toBeNull();
            expect(box!.y + box!.height, `nav button ${i} bottom`).toBeLessThanOrEqual(height - INSET_BOTTOM + 1);
        }

        // --- Workout: header controls clear the simulated status bar zone. ---
        await page.getByRole('button', { name: /^(Sesión libre|Freestyle session) ·/ }).click();
        const freestyleOption = page.getByRole('dialog', { name: /Iniciar entrenamiento|Start training/ })
            .getByRole('button', { name: /Sesión libre|Freestyle/ });
        await expect(freestyleOption).toBeVisible({ timeout: 6000 });
        await freestyleOption.click();
        const startFreeBtn = page.getByRole('dialog', { name: /Nueva Sesión|New Session/i })
            .getByRole('button', { name: /Iniciar Sesión Libre|Start Free Session/i });
        await expect(startFreeBtn).toBeVisible({ timeout: 8000 });
        await startFreeBtn.scrollIntoViewIfNeeded();
        await startFreeBtn.click();

        const backBtn = page.locator('button[aria-label*="trás" i], button[aria-label*="Back" i]').first();
        await expect(backBtn).toBeVisible({ timeout: 8000 });
        const backBox = await backBtn.boundingBox();
        expect(backBox).not.toBeNull();
        expect(backBox!.y, 'workout back button top').toBeGreaterThanOrEqual(INSET_TOP - 1);

        const finishBtn = page.locator('#tut-finish-btn');
        await expect(finishBtn).toBeVisible({ timeout: 8000 });
        const finishBox = await finishBtn.boundingBox();
        expect(finishBox).not.toBeNull();
        expect(finishBox!.y, 'workout finish button top').toBeGreaterThanOrEqual(INSET_TOP - 1);

        // --- Rest pill: floats above the inset + the 80px float gap. ---
        const addExHeaderBtn = page.getByRole('button', { name: /Añadir ejercicio|Add exercise/ }).last();
        await expect(addExHeaderBtn).toBeVisible({ timeout: 6000 });
        await addExHeaderBtn.click();
        const option = page.locator('[role="dialog"] button, .modal button')
            .filter({ hasText: /press|squat|curl|banca|remo|row|peso muerto|deadlift/i })
            .first();
        await expect(option).toBeVisible({ timeout: 6000 });
        await option.click();
        await expect(page.locator('[role="dialog"], .modal')).toHaveCount(0, { timeout: 6000 });

        const completeSetBtn = page.locator('button[aria-label*="Completar serie" i], button[aria-label*="Complete set" i]').first();
        await expect(completeSetBtn).toBeVisible({ timeout: 6000 });
        await completeSetBtn.click();
        await page.getByLabel(/Atrás|Back/, { exact: true }).first().click();
        await expect(page.locator('nav[aria-label="Main navigation"]')).toBeVisible();

        const pill = page.locator('aside');
        await expect(pill.getByRole('button', { name: '-15s' })).toBeVisible({ timeout: 8000 });
        const pillBox = await pill.boundingBox();
        expect(pillBox).not.toBeNull();
        // Above the nav-bar zone AND above the 80px float gap on top of it.
        expect(pillBox!.y + pillBox!.height, 'pill bottom').toBeLessThanOrEqual(height - INSET_BOTTOM - 80 + 2);

        const pillButtons = pill.locator('button');
        for (let i = 0; i < (await pillButtons.count()); i++) {
            const box = await pillButtons.nth(i).boundingBox();
            if (!box) continue;
            expect(box.y + box.height, `pill button ${i} bottom`).toBeLessThanOrEqual(height - INSET_BOTTOM + 1);
        }

        await expect(page.getByText(/ERROR CR.TICO|CRITICAL ERROR/)).toHaveCount(0);
    });
});
