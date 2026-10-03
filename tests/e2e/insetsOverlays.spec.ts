import { test, expect, type Page, type Locator } from '@playwright/test';

// Same simulated SystemBars insets as insets.spec.ts.
const INSET_TOP = 40;
const INSET_BOTTOM = 24;
const CONTROLS = 'button, input, select, textarea, a[href], [role="button"], [role="tab"]';

const seedOnboarded = (page: Page) =>
    page.addInitScript(() => {
        localStorage.setItem('il_onboarded_v2', 'true');
        localStorage.setItem('il_tutorial_v2', JSON.stringify({
            home: true, workout: true, history: true, stats: true, mesoSettings: true, nutrition: true,
        }));
    });

// Mirror the SystemBars plugin: it injects the CSS vars on documentElement at
// runtime (post-load), on every inset change.
const injectInsets = (page: Page) =>
    page.evaluate(
        ({ top, bottom }) => {
            const root = document.documentElement;
            root.style.setProperty('--safe-area-inset-top', `${top}px`);
            root.style.setProperty('--safe-area-inset-right', '0px');
            root.style.setProperty('--safe-area-inset-bottom', `${bottom}px`);
            root.style.setProperty('--safe-area-inset-left', '0px');
        },
        { top: INSET_TOP, bottom: INSET_BOTTOM }
    );

// Every interactive control intersecting the viewport must clear the simulated
// status-bar (top) and navigation-bar (bottom) zones. Scrollable content is
// checked in two phases: at scroll-top every reachable control clears the top
// zone; at scroll-end every reachable control clears the bottom zone.
// (Mid-scroll partial rows at a viewport edge are normal scrolling, not a bug.)
const assertControlsClear = async (
    page: Page,
    scope: Locator,
    label: string,
    phases: { top: boolean; bottom: boolean } = { top: true, bottom: true }
) => {
    const height = page.viewportSize()!.height;
    const controls = scope.locator(CONTROLS);
    const count = await controls.count();
    expect(count, `${label}: controls found`).toBeGreaterThan(0);
    // Sheets animate in from the bottom: never measure mid-flight.
    await waitForStableBox(controls.first()).catch(() => {});
    let measured = 0;
    for (let i = 0; i < count; i++) {
        // Short timeout + skip: virtualized rows detach mid-measure on scroll.
        const box = await controls.nth(i).boundingBox({ timeout: 2000 }).catch(() => null);
        if (!box || box.width === 0 || box.height === 0) continue;
        if (box.y + box.height <= 0 || box.y >= height) continue; // fully scrolled out
        measured++;
        const id = `${label} control ${i}`;
        if (phases.top) expect(box.y, `${id} top`).toBeGreaterThanOrEqual(INSET_TOP - 1);
        if (phases.bottom) expect(box.y + box.height, `${id} bottom`).toBeLessThanOrEqual(height - INSET_BOTTOM + 1);
    }
    expect(measured, `${label}: controls measured`).toBeGreaterThan(0);
};

// Sheets animate in from the bottom: wait until the control's box settles.
const waitForStableBox = async (control: Locator) => {
    let prev = -1;
    for (let i = 0; i < 20; i++) {
        const box = await control.boundingBox({ timeout: 2000 }).catch(() => null);
        const y = box ? Math.round(box.y) : -1;
        if (y === prev && y >= 0) return;
        prev = y;
        await new Promise((r) => setTimeout(r, 150));
    }
};

// A single pinned control (close/back button) must clear both zones.
const assertControlClear = async (page: Page, control: Locator, label: string) => {
    const height = page.viewportSize()!.height;
    await expect(control, `${label} visible`).toBeVisible({ timeout: 6000 });
    await waitForStableBox(control);
    const box = await control.boundingBox();
    expect(box, `${label} box`).not.toBeNull();
    expect(box!.y, `${label} top`).toBeGreaterThanOrEqual(INSET_TOP - 1);
    expect(box!.y + box!.height, `${label} bottom`).toBeLessThanOrEqual(height - INSET_BOTTOM + 1);
};

// Scroll the scope's scroll container (or itself for a virtuoso scroller).
const scrollScope = (scope: Locator, toEnd: boolean) =>
    scope.evaluate((root, end) => {
        const target = root.hasAttribute('data-virtuoso-scroller')
            ? root
            : root.querySelector('.overflow-y-auto');
        const el = (target ?? root) as HTMLElement;
        el.scrollTop = end ? el.scrollHeight : 0;
    }, toEnd);

// Scrollable overlay content: at scroll-top every reachable control clears
// the top zone; at scroll-end every reachable control clears the bottom zone.
const assertScrollablePhases = async (page: Page, scope: Locator, label: string) => {
    await scrollScope(scope, false);
    await waitForStableBox(scope.locator(CONTROLS).first()).catch(() => {});
    await assertControlsClear(page, scope, `${label}-top`, { top: true, bottom: false });
    await scrollScope(scope, true);
    await waitForStableBox(scope.locator(CONTROLS).last()).catch(() => {});
    await assertControlsClear(page, scope, `${label}-bottom`, { top: false, bottom: true });
};

const startFreestyleWorkout = async (page: Page) => {
    await page.goto('/');
    const nav = page.locator('nav[aria-label="Main navigation"]');
    await expect(nav).toBeVisible({ timeout: 15000 });

    const plusBtn = page.locator('nav[aria-label="Main navigation"] button[aria-label*="Iniciar" i], nav[aria-label="Main navigation"] button[aria-label*="Start" i]').first();
    await expect(plusBtn).toBeVisible({ timeout: 8000 });
    await plusBtn.click();

    const freestyleOption = page.locator('button:has-text("Sesión libre"), button:has-text("Freestyle")').first();
    await expect(freestyleOption).toBeVisible({ timeout: 6000 });
    await freestyleOption.click();

    const startFreeBtn = page.locator('button:has-text("Iniciar Sesión Libre"), button:has-text("Start Free Session"), button:has-text("Iniciar sesión libre")').first();
    await expect(startFreeBtn).toBeVisible({ timeout: 8000 });
    await startFreeBtn.scrollIntoViewIfNeeded();
    await startFreeBtn.click();

    await expect(page.locator('#tut-finish-btn')).toBeVisible({ timeout: 10000 });
};

test.describe('J1: fullscreen overlays respect safe-area insets', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('exercise selector from a workout', async ({ page }) => {
        await seedOnboarded(page);
        await startFreestyleWorkout(page);
        await injectInsets(page);

        const addExHeaderBtn = page.locator('button[title*="Añadir ejercicio" i], button[title*="Add exercise" i], button[title*="Añadir Ejercicio" i]').first();
        await expect(addExHeaderBtn).toBeVisible({ timeout: 6000 });
        await addExHeaderBtn.click();

        // The selector sheet has no accessible name (custom header): scope by role.
        const dialog = page.locator('[role="dialog"]');
        await expect(dialog).toBeVisible({ timeout: 6000 });
        await expect(dialog.locator('input[type="text"]').first()).toBeVisible({ timeout: 6000 });

        // Static chrome (X, search, +, filter chips) must clear both zones.
        await assertControlsClear(page, dialog.locator('div.h-16'), 'selector-header');
        await assertControlsClear(page, dialog.locator('div.overflow-x-auto').first(), 'selector-chips');
        // Virtualized list: top clears at scroll-top, footer at scroll-end.
        await assertScrollablePhases(page, dialog.locator('[data-virtuoso-scroller]'), 'selector-list');

        await expect(page.getByText(/ERROR CR.TICO|CRITICAL ERROR/)).toHaveCount(0);
    });

    test('profile sheet', async ({ page }) => {
        await seedOnboarded(page);
        await page.goto('/');
        await injectInsets(page);

        const nav = page.locator('nav[aria-label="Main navigation"]');
        await expect(nav).toBeVisible({ timeout: 15000 });
        await page.getByLabel(/Abrir perfil|Open profile/).click();

        const dialog = page.locator('[role="dialog"]').first();
        await expect(dialog).toBeVisible({ timeout: 6000 });
        await assertControlClear(page, dialog.locator('button[aria-label*="Cerrar" i], button[aria-label*="Close" i]').first(), 'profile-close');
        await assertScrollablePhases(page, dialog, 'profile');

        await expect(page.getByText(/ERROR CR.TICO|CRITICAL ERROR/)).toHaveCount(0);
    });

    test('settings modal with all tabs', async ({ page }) => {
        await seedOnboarded(page);
        await page.goto('/');
        await injectInsets(page);

        const nav = page.locator('nav[aria-label="Main navigation"]');
        await expect(nav).toBeVisible({ timeout: 15000 });
        await page.getByLabel(/Abrir perfil|Open profile/).click();
        await page.locator('[role="dialog"] button', { hasText: /Editor de programa|Program editor/ }).click();

        const settingsDialog = page.locator('[role="dialog"]', { has: page.locator('#settings-modal-title') });
        await expect(settingsDialog).toBeVisible({ timeout: 10000 });
        await assertControlClear(page, settingsDialog.locator('button[aria-label="Close settings"]'), 'settings-close');

        const tabs = settingsDialog.getByRole('tab');
        await expect(tabs.first()).toBeVisible({ timeout: 10000 });
        const tabCount = await tabs.count();
        expect(tabCount).toBeGreaterThan(0);
        for (let i = 0; i < tabCount; i++) {
            await tabs.nth(i).click();
            await assertScrollablePhases(page, settingsDialog, `settings-tab-${i}`);
        }

        await expect(page.getByText(/ERROR CR.TICO|CRITICAL ERROR/)).toHaveCount(0);
    });

    test('workout summary', async ({ page }) => {
        await seedOnboarded(page);
        await startFreestyleWorkout(page);
        await injectInsets(page);

        await page.locator('#tut-finish-btn').click();
        const confirmFinishBtn = page.locator('button:has-text("Terminar"), button:has-text("Finish")').last();
        await expect(confirmFinishBtn).toBeVisible({ timeout: 5000 });
        await confirmFinishBtn.click();

        const doneBtn = page.locator('button:has-text("Finalizar y Volver"), button:has-text("Finish & Go Home")').first();
        await expect(doneBtn).toBeVisible({ timeout: 10000 });
        await assertControlsClear(page, page.locator('#root'), 'summary');

        await expect(page.getByText(/ERROR CR.TICO|CRITICAL ERROR/)).toHaveCount(0);
    });
});

test.describe('J1: palette and program editor (wide viewport)', () => {
    // The command palette only opens at >=640px by design.
    test.use({ viewport: { width: 800, height: 600 } });

    test('command palette and program editor', async ({ page }) => {
        await seedOnboarded(page);
        await page.goto('/');
        await injectInsets(page);

        const nav = page.locator('nav[aria-label="Main navigation"]');
        await expect(nav).toBeVisible({ timeout: 15000 });

        const statsNavBtn = page.locator('nav[aria-label="Main navigation"] button', { hasText: /Stats|Métricas/ });
        await statsNavBtn.click();
        await expect(page.getByRole('tablist').first()).toBeVisible({ timeout: 10000 });

        const primaryBtn = page.locator('nav[aria-label="Main navigation"] button[aria-label*="Iniciar" i], nav[aria-label="Main navigation"] button[aria-label*="Start" i]').first();
        await primaryBtn.click();
        const palette = page.getByRole('dialog', { name: /Acciones r.pidas|Quick actions/ });
        await expect(palette).toBeVisible({ timeout: 6000 });
        await assertControlsClear(page, palette, 'palette');

        await palette.getByRole('button', { name: /Editar mi programa|Edit my program/ }).click();
        await expect(page.getByRole('heading', { name: /Nueva Rutina|New Routine|Editar Rutina Activa|Edit Active Routine/ }).first()).toBeVisible({ timeout: 10000 });
        await assertControlClear(page, page.locator('button[aria-label*="trás" i], button[aria-label*="Back" i]').first(), 'program-back');
        await assertScrollablePhases(page, page.locator('#root'), 'program');

        await expect(page.getByText(/ERROR CR.TICO|CRITICAL ERROR/)).toHaveCount(0);
    });
});
