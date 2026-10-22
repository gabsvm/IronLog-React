import { test, expect } from '@playwright/test';

// Imports (CSV appends oldest-first) and cloud restores don't guarantee array
// order; the Diary must still list sessions newest first.
test('Diario lista las sesiones de la más reciente a la más antigua aunque estén desordenadas', async ({ page }) => {
    await page.addInitScript(() => {
        const now = Date.now();
        const hour = 3600000;
        localStorage.setItem('il_onboarded_v2', 'true');
        localStorage.setItem('il_tutorial_v2', JSON.stringify({ home: true, workout: true, history: true, stats: true, mesoSettings: true, nutrition: true }));
        const log = (id: number, name: string, hoursAgo: number) => ({
            id, dayIdx: 0, name, startTime: now - hoursAgo * hour - hour, endTime: now - hoursAgo * hour, duration: 3600, skipped: false,
            exercises: [{ id: 'bp_bar', name: 'Press Banca Barra', muscle: 'CHEST', sets: [{ id: 1, weight: '60', reps: '8', completed: true, type: 'regular' }] }],
        });
        // Oldest first, newest in the middle: the stored order is deliberately wrong.
        localStorage.setItem('il_logs_v16', JSON.stringify([log(1, 'Sesión antigua', 72), log(3, 'Sesión reciente', 2), log(2, 'Sesión media', 30)]));
    });
    await page.goto('/');
    const nav = page.locator('nav[aria-label="Main navigation"]');
    await expect(nav).toBeVisible({ timeout: 15000 });
    await nav.locator('button', { hasText: /^Diario$|^Diary$/ }).click();

    const names = page.getByText(/^Sesión (antigua|reciente|media)$/);
    await expect(names).toHaveCount(3, { timeout: 10000 });
    await expect(names).toHaveText(['Sesión reciente', 'Sesión media', 'Sesión antigua']);
});
