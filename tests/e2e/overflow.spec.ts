import { test, expect, type Page } from '@playwright/test';
import { bottomNav, goHistory, goProgress, openProfileSheet, startFreestyleWorkout } from './strongNav';

const ERROR_BOUNDARY_TEXT = /ERROR CRÍTICO|CRITICAL ERROR/;

const seedTrainingProfile = (page: Page) =>
    page.addInitScript(() => {
        localStorage.setItem('il_onboarded_v2', 'true');
        localStorage.setItem('il_tutorial_v2', JSON.stringify({
            home: true, workout: true, history: true, stats: true, mesoSettings: true, nutrition: true,
        }));
        localStorage.setItem('il_cfg_rir', 'true');
    });

interface OverflowReport {
    docOverflow: number;
    containers: Array<{ sel: string; over: number }>;
    offenders: string[];
}

async function collectOverflow(page: Page): Promise<OverflowReport> {
    return page.evaluate(() => {
        const doc = document.documentElement;
        const containers: Array<{ sel: string; over: number }> = [];
        for (const sel of ['#tut-exercise-list', 'main', '#root', '[role="dialog"]']) {
            const el = document.querySelector(sel) as HTMLElement | null;
            if (el) containers.push({ sel, over: el.scrollWidth - el.clientWidth });
        }
        const offenders: string[] = [];
        document.querySelectorAll('button, nav span, a, label').forEach((node) => {
            const el = node as HTMLElement;
            const text = (el.innerText || '').trim();
            if (!text) return;
            const style = getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden') return;
            // Intentional truncation (truncate/ellipsis) is design, not a bug.
            if (style.textOverflow === 'ellipsis') return;
            const rect = el.getBoundingClientRect();
            if (rect.width === 0 && rect.height === 0) return;
            const clipped = ['hidden', 'clip', 'scroll', 'auto'].includes(style.overflowX);
            if (clipped && el.scrollWidth - el.clientWidth > 1) {
                offenders.push(`${el.tagName} :: "${text.slice(0, 70)}" (over ${el.scrollWidth - el.clientWidth}px)`);
            }
        });
        return { docOverflow: doc.scrollWidth - doc.clientWidth, containers, offenders: offenders.slice(0, 12) };
    });
}

async function expectNoOverflow(page: Page, viewName: string) {
    const report = await collectOverflow(page);
    expect(report.docOverflow, `${viewName}: document horizontal overflow (px)`).toBeLessThanOrEqual(1);
    for (const container of report.containers) {
        expect(container.over, `${viewName}: ${container.sel} horizontal overflow (px)`).toBeLessThanOrEqual(1);
    }
    expect(report.offenders, `${viewName}: texts clipped by overflow`).toEqual([]);
}

async function startFreestyleWithExercises(page: Page, count: number) {
    const nav = bottomNav(page);
    await expect(nav).toBeVisible({ timeout: 15000 });
    // Strong shell: freestyle starts from the Entreno FAB + QuickStart sheet.
    await startFreestyleWorkout(page);

    // End-of-list add button (header dup-add removed in Strong parity T1/T2).
    const addExBtn = page.getByRole('button', { name: /Añadir ejercicio|Add exercise/ }).last();
    await expect(addExBtn).toBeVisible({ timeout: 6000 });
    for (let i = 0; i < count; i++) {
        await addExBtn.click();
        const option = page.locator('[role="dialog"] button, .modal button')
            .filter({ hasText: /press|squat|curl|banca|remo|row|peso muerto|deadlift/i })
            .first();
        await expect(option).toBeVisible({ timeout: 6000 });
        await option.click();
        await expect(page.locator('[role="dialog"], .modal')).toHaveCount(0, { timeout: 6000 });
    }
}

for (const viewport of [{ width: 390, height: 844 }, { width: 360, height: 800 }]) {
    test.describe(`No overflow or clipped text at ${viewport.width}x${viewport.height} (G7)`, () => {
        test.use({ viewport });

        test('home, workout, history, stats and settings fit horizontally', async ({ page }) => {
            await seedTrainingProfile(page);
            await page.goto('/');

            const nav = page.locator('nav[aria-label="Main navigation"]');
            await expect(nav).toBeVisible({ timeout: 15000 });
            await expectNoOverflow(page, 'home');

            await goHistory(page);
            await expect(page.getByText(/Historial|History|Sin entrenamientos|No workouts/).first()).toBeVisible({ timeout: 10000 });
            await expectNoOverflow(page, 'diary');

            await goProgress(page);
            await expect(page.locator('#root')).toContainText(/Estadísticas|Progreso|Sin datos|No data/i, { timeout: 10000 });
            await expectNoOverflow(page, 'progress');

            // Unified profile sheet (via the Strong panel's Ajustes gear):
            // scroll through every section, including the collapsible
            // Advanced section.
            const sheet = await openProfileSheet(page);
            await expect(sheet).toBeVisible({ timeout: 10000 });
            await sheet.locator('summary', { hasText: /Avanzado|Advanced/ }).click();
            for (const section of ['account', 'body', 'training', 'appearance', 'data', 'advanced', 'danger']) {
                await sheet.locator(`#profile-section-${section}`).scrollIntoViewIfNeeded();
                await expectNoOverflow(page, `you-${section}`);
            }
            await sheet.getByLabel(/^(Close|Cerrar)$/).click();
            await expect(sheet).toHaveCount(0, { timeout: 8000 });

            // Workout last: the bottom nav and header hide while training.
            // Dismiss the Strong panel left open behind the sheet, then start
            // freestyle from the Entreno FAB (available from any view).
            await page.getByTestId('strong-profile-panel').getByRole('button', { name: /^Cerrar$|^Close$/ }).click();
            await expect(page.getByTestId('strong-profile-panel')).toHaveCount(0);
            await startFreestyleWithExercises(page, 4);

            // Complete a set so the rest controls are on screen (in-flow dock
            // while training; the global pill is suppressed there by design).
            const completeSetBtn = page.locator('button[aria-label*="Completar serie" i], button[aria-label*="Complete set" i]').first();
            await expect(completeSetBtn).toBeVisible({ timeout: 6000 });
            await completeSetBtn.click();
            await expect(page.getByRole('button', { name: '-15s' }).first()).toBeVisible({ timeout: 8000 });
            await expectNoOverflow(page, 'workout+pill');

            await expect(page.getByText(ERROR_BOUNDARY_TEXT)).toHaveCount(0);
        });
    });
}
