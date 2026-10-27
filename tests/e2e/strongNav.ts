import { expect, type Page } from '@playwright/test';

// Strong v6.2.4 parity navigation (5 destinations):
// Perfil (panel) · Historial · Entreno (FAB) · Ejercicios · Medidas.
// Home/Rutina/Progreso/Diario roots are gone from the bottom bar; Routine and
// Progress live as tiles inside the Profile panel, the sheet opens from the
// panel's Ajustes gear, and freestyle starts from the Entreno FAB.

export const bottomNav = (page: Page) => page.locator('nav[aria-label="Main navigation"]');

export const expectBottomNav = async (page: Page) =>
    expect(bottomNav(page)).toBeVisible({ timeout: 15000 });

/** Historial tab: the diary (sessions + nutrition sections). */
export const goHistory = async (page: Page) => {
    await bottomNav(page).getByRole('button', { name: /^Historial$|^History$/ }).click();
};

/** Entreno FAB tab. */
export const goWorkoutTab = async (page: Page) => {
    await bottomNav(page).getByRole('button', { name: /^Entreno$|^Workout$/ }).click();
};

/** Opens the Strong Profile panel; resolves when the dashboard renders. */
export const openStrongPanel = async (page: Page) => {
    // Either shell must be up first: mobile bottom bar or desktop sidebar.
    await expect(page.locator('nav[aria-label="Main navigation"], nav[aria-label="Strong navigation"]')).toBeVisible({ timeout: 15000 });
    // Mobile topbar avatar... or the desktop sidebar's Perfil item.
    const avatar = page.getByRole('button', { name: /Abrir perfil|Open profile/ });
    if (await avatar.count() > 0) {
        await avatar.first().click();
    } else {
        await page.locator('nav[aria-label="Strong navigation"]').getByRole('button', { name: /^Perfil$|^Profile$/ }).click();
    }
    const dashboard = page.getByTestId('profile-dashboard');
    await expect(dashboard).toBeVisible({ timeout: 10000 });
    return dashboard;
};

/** Progress view via the Profile panel's Progreso tile. */
export const goProgress = async (page: Page) => {
    const dashboard = await openStrongPanel(page);
    await dashboard.getByRole('button', { name: /^Progreso$|^Progress$/ }).click();
};

/** Routine view via the Profile panel's Rutina tile. */
export const goRoutine = async (page: Page) => {
    const dashboard = await openStrongPanel(page);
    await dashboard.getByRole('button', { name: /^Rutina$|^Routine$/ }).click();
};

/** Legacy unified Profile sheet via the panel's Ajustes gear. */
export const openProfileSheet = async (page: Page) => {
    const dashboard = await openStrongPanel(page);
    await dashboard.getByRole('button', { name: /^Ajustes$|^Settings$/ }).click();
    const sheet = page.locator('[role="dialog"]').first();
    await expect(sheet).toBeVisible({ timeout: 10000 });
    return sheet;
};

/** Freestyle workout via the Entreno FAB + QuickStart sheet. */
export const startFreestyleWorkout = async (page: Page) => {
    await goWorkoutTab(page);
    const quickSheet = page.getByRole('dialog', { name: /Iniciar entrenamiento|Start training/ });
    await expect(quickSheet).toBeVisible({ timeout: 8000 });
    await quickSheet.getByRole('button', { name: /Sesión libre \/ WOD \/ skill|Freestyle \/ WOD \/ Skill/i }).click();
    const startFreeBtn = page
        .getByRole('dialog', { name: /Nueva Sesi.n|New Session/i })
        .getByRole('button', { name: /Iniciar Sesi.n Libre|Start Free Session/i });
    await expect(startFreeBtn).toBeVisible({ timeout: 8000 });
    await startFreeBtn.scrollIntoViewIfNeeded();
    await startFreeBtn.click();
    await expect(page.locator('#tut-finish-btn')).toBeVisible({ timeout: 10000 });
};
