import { test, expect, type Page } from '@playwright/test';

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
    const nav = page.locator('nav[aria-label="Main navigation"]');
    const plusBtn = nav.locator('button[aria-label*="Iniciar" i], button[aria-label*="Start" i]').first();
    await expect(plusBtn).toBeVisible({ timeout: 8000 });
    await plusBtn.click();

    const freestyleOption = page.locator('button:has-text("Sesión libre"), button:has-text("Freestyle")').first();
    await expect(freestyleOption).toBeVisible({ timeout: 6000 });
    await freestyleOption.click();

    const startFreeBtn = page.locator('button:has-text("Iniciar Sesión Libre"), button:has-text("Start Free Session"), button:has-text("Iniciar sesión libre")').first();
    await expect(startFreeBtn).toBeVisible({ timeout: 8000 });
    await startFreeBtn.scrollIntoViewIfNeeded();
    await startFreeBtn.click();

    const addExHeaderBtn = page.locator('button[title*="Añadir ejercicio" i], button[title*="Add exercise" i], button[title*="Añadir Ejercicio" i]').first();
    await expect(addExHeaderBtn).toBeVisible({ timeout: 6000 });
    for (let i = 0; i < count; i++) {
        await addExHeaderBtn.click();
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

            await nav.locator('button', { hasText: /Historial|History/ }).click();
            await expect(page.getByText(/Historial|History|Sin entrenamientos|No workouts/).first()).toBeVisible({ timeout: 10000 });
            await expectNoOverflow(page, 'history');

            await nav.locator('button', { hasText: /^Stats$|^Métricas$/ }).click();
            await expect(page.locator('#root')).toContainText(/Stats|Estadísticas|Progreso|Sin datos|No data/i, { timeout: 10000 });
            await expectNoOverflow(page, 'stats');

            // Unified "You" sheet: scroll through every section, including the
            // collapsible Advanced section.
            await page.getByLabel(/Abrir perfil|Open profile/).click();
            const sheet = page.locator('[role="dialog"]').first();
            await expect(sheet).toBeVisible({ timeout: 10000 });
            await sheet.locator('summary', { hasText: /Avanzado|Advanced/ }).click();
            for (const section of ['account', 'body', 'training', 'appearance', 'data', 'advanced', 'danger']) {
                await sheet.locator(`#profile-section-${section}`).scrollIntoViewIfNeeded();
                await expectNoOverflow(page, `you-${section}`);
            }
            await sheet.getByLabel('Close').click();
            await expect(sheet).toHaveCount(0, { timeout: 8000 });

            // Workout last: the bottom nav and header hide while training.
            await nav.locator('button', { hasText: /Entreno|Train/ }).click();
            await startFreestyleWithExercises(page, 4);

            // Complete a set so the rest pill (with RIR extras) is on screen.
            const completeSetBtn = page.locator('button[aria-label*="Completar serie" i], button[aria-label*="Complete set" i]').first();
            await expect(completeSetBtn).toBeVisible({ timeout: 6000 });
            await completeSetBtn.click();
            await expect(page.locator('aside').getByRole('button', { name: '-10s' })).toBeVisible({ timeout: 8000 });
            await expectNoOverflow(page, 'workout+pill');

            await expect(page.getByText(ERROR_BOUNDARY_TEXT)).toHaveCount(0);
        });
    });
}
