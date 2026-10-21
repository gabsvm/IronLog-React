import { test, expect, type Page } from '@playwright/test';

// U2: pixel-exact visual regression over the preview build (fixed clock,
// seeded data, 7 screens x dark/light). Run: npm run test:visual
// Accept intended changes: npm run test:visual:update (review the diffs first).
// Baselines are rendered on the owner's Windows machine; fonts differ across
// OSes, so regenerate them when switching machines.

// Fixed clock so dates/streaks render identically across runs.
const FIXED_NOW = new Date('2026-10-01T15:00:00Z').getTime();

const seed = (page: Page, theme: 'dark' | 'light') =>
  page.addInitScript(({ theme, now }) => {
    const day = 86400000;
    localStorage.setItem('il_onboarded_v2', 'true');
    localStorage.setItem('il_last_backup_at', String(now));
    localStorage.setItem('il_theme_v1', JSON.stringify(theme));
    localStorage.setItem('il_tutorial_v2', JSON.stringify({ home: true, workout: true, history: true, stats: true, mesoSettings: true, nutrition: true }));
    localStorage.setItem('il_meso_v16', JSON.stringify({ id: 7, name: 'Hipertrofia', mesoType: 'hyp_1', week: 3, duration: 5, plan: [[null], [null], [null], [null]] }));
    localStorage.setItem('il_prog_v16', JSON.stringify(['Torso A', 'Pierna A', 'Torso B', 'Pierna B'].map((n, i) => ({
      id: 'd' + i, dayName: { es: n, en: n },
      slots: i % 2 === 0
        ? [{ muscle: 'CHEST', setTarget: 3, exerciseId: 'bp_bar' }, { muscle: 'BACK', setTarget: 3, exerciseId: 'row_cable' }, { muscle: 'SHOULDERS', setTarget: 3, exerciseId: 'lat_raise' }]
        : [{ muscle: 'QUADS', setTarget: 3, exerciseId: 'sq_bar' }, { muscle: 'HAMSTRINGS', setTarget: 3, exerciseId: 'rdl' }],
    }))));
    const set = (id: number, w: number, r: number) => ({ id, weight: String(w), reps: String(r), completed: true, type: 'regular' });
    const ex = (id: string, name: string, muscle: string, w: number) => ({ id, name, muscle, sets: [set(1, w, 10), set(2, w, 9), set(3, w, 8)] });
    const logs: unknown[] = [];
    let id = 1;
    for (let wk = 1; wk <= 3; wk++) for (let d = 0; d < (wk === 3 ? 2 : 4); d++) {
      const t = now - ((3 - wk) * 7 + (4 - d)) * day;
      logs.push({ id: id++, dayIdx: d, name: ['Torso A', 'Pierna A', 'Torso B', 'Pierna B'][d], startTime: t, endTime: t + 3600000, duration: 3600, skipped: false, mesoId: 7, week: wk,
        exercises: d % 2 === 0 ? [ex('bp_bar', 'Press Banca Barra', 'CHEST', 70 + wk * 2.5), ex('row_cable', 'Remo en Polea', 'BACK', 60 + wk * 2.5)] : [ex('sq_bar', 'Sentadilla con Barra', 'QUADS', 90 + wk * 5), ex('rdl', 'Peso Muerto Rumano', 'HAMSTRINGS', 80 + wk * 5)] });
    }
    localStorage.setItem('il_logs_v16', JSON.stringify(logs));
  }, { theme, now: FIXED_NOW });

const nav = (page: Page) => page.locator('nav[aria-label="Main navigation"]');

for (const theme of ['dark', 'light'] as const) {
  test.describe(`visual ${theme}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.clock.install({ time: FIXED_NOW });
      await seed(page, theme);
      await page.goto('/');
      await expect(nav(page)).toBeVisible({ timeout: 20000 });
      await page.waitForTimeout(800);
    });


    test(`expressive: navegación y selector utilizables a 320 px (${theme})`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 720 });
      await expect(nav(page)).toBeVisible();
      const buttons = nav(page).locator('button');
      await expect(buttons).toHaveCount(5);
      const bounds = await buttons.evaluateAll(items =>
        items.map(item => {
          const box = item.getBoundingClientRect();
          return { x: box.x, right: box.right, height: box.height };
        }),
      );
      expect(bounds.every(box => box.x >= -1 && box.right <= 321 && box.height >= 44)).toBe(true);
      const selectedDay = page.locator('button[aria-pressed="true"]').first();
      await expect(selectedDay).toBeVisible();
      const dayBox = await selectedDay.boundingBox();
      expect(dayBox?.height ?? 0).toBeGreaterThanOrEqual(44);
      const hero = page.locator('#tut-up-next');
      await expect(hero).toBeVisible();
      const heroBox = await hero.boundingBox();
      expect((heroBox?.x ?? -999) >= -1 && (heroBox?.x ?? 999) + (heroBox?.width ?? 999) <= 321).toBe(true);
    });

    if (theme === 'light') {
      test('expressive: textos de Stats superan contraste WCAG AA', async ({ page }) => {
        await nav(page).getByRole('button', { name: /M[ée]tricas|Stats/i }).click();
        const cards = page.locator('.tonal-1, .tonal-2, .tonal-3, .tonal-4');
        await expect(cards.first()).toBeVisible();
        const ratios = await cards.evaluateAll(items => {
          const ctx = document.createElement('canvas').getContext('2d');
          if (!ctx) throw new Error('Canvas 2D unavailable');
          const luminance = (css: string) => {
            ctx.canvas.width = ctx.canvas.height = 1;
            ctx.clearRect(0, 0, 1, 1);
            ctx.fillStyle = css;
            ctx.fillRect(0, 0, 1, 1);
            const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
            const linear = [r, g, b].map(channel => {
              const v = channel / 255;
              return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
            });
            return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
          };
          return items.slice(0, 4).map(card => {
            const label = card.firstElementChild;
            if (!label) throw new Error('Missing Stats card label');
            const bg = luminance(getComputedStyle(card).backgroundColor);
            const fg = luminance(getComputedStyle(label).color);
            return (Math.max(bg, fg) + 0.05) / (Math.min(bg, fg) + 0.05);
          });
        });
        expect(ratios).toHaveLength(4);
        for (const ratio of ratios) expect(ratio).toBeGreaterThanOrEqual(4.5);
      });
    }


    test(`premium: Home and Stats remain grounded in saved data (${theme})`, async ({ page }) => {
      const hero = page.locator('#tut-up-next');
      await expect(hero).toBeVisible();
      await expect(hero.locator('svg.premium-hero__art')).toBeVisible();
      await expect(hero.getByRole('button', { name: /Empezar|Start/i })).toBeVisible();

      await nav(page).getByRole('button', { name: /M[ée]tricas|Stats/i }).click();
      const trend = page.getByRole('region', { name: /Tendencia reciente|Recent training trend/i });
      await expect(trend).toBeVisible();
      await expect(trend.locator('svg[role="img"]')).toBeVisible();
      await expect(trend.getByText(/Mejor serie de fuerza|Best recorded strength set|Best strength set/i)).toBeVisible();
    });

    test(`home desktop ${theme}`, async ({ page }) => {
      // U4: wide screens get a centered column instead of edge-to-edge cards.
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.waitForTimeout(500);
      await expect(page).toHaveScreenshot(`home-desktop-${theme}.png`);
    });

    test(`home ${theme}`, async ({ page }) => {
      await expect(page).toHaveScreenshot(`home-${theme}.png`, { fullPage: true });
    });

    test(`history ${theme}`, async ({ page }) => {
      await nav(page).getByRole('button', { name: /^Diario$|^Diary$/ }).click();
      await page.waitForTimeout(800);
      await expect(page).toHaveScreenshot(`history-${theme}.png`, { fullPage: true });
    });

    test(`stats ${theme}`, async ({ page }) => {
      await nav(page).getByRole('button', { name: /^Progreso$|^Progress$/ }).click();
      await page.waitForTimeout(1500);
      await expect(page).toHaveScreenshot(`stats-${theme}.png`, { fullPage: true });
    });

    test(`expressive: Dieta mantiene superficies y pestañas accesibles (${theme})`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 720 });
      await nav(page).getByRole('button', { name: /^Diario$|^Diary$/ }).click();
      await page.getByRole('tab', { name: /Nutrición|Nutrition/ }).click();
      const tabs = page.locator('.seg-reference').filter({ has: page.locator('button[aria-pressed]') }).first();
      const buttons = tabs.locator('button[aria-pressed]');
      await expect(buttons).toHaveCount(3);
      await buttons.nth(1).click();
      await expect(buttons.nth(1)).toHaveAttribute('aria-pressed', 'true');
      await expect(page.locator('.premium-theme-panel').first()).toBeVisible();
      await buttons.nth(2).click();
      await expect(buttons.nth(2)).toHaveAttribute('aria-pressed', 'true');
      await expect(page.locator('.premium-theme-panel').first()).toBeVisible();
      const scroll = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(scroll.scrollWidth).toBeLessThanOrEqual(scroll.clientWidth + 1);
    });

    test(`nutrition ${theme}`, async ({ page }) => {
      await nav(page).getByRole('button', { name: /^Diario$|^Diary$/ }).click();
      await page.getByRole('tab', { name: /Nutrición|Nutrition/ }).click();
      await page.waitForTimeout(800);
      await expect(page).toHaveScreenshot(`nutrition-${theme}.png`, { fullPage: true });
    });

    test(`workout ${theme}`, async ({ page }) => {
      await page.getByRole('button', { name: /Empezar|Start/ }).first().click();
      await expect(page.locator('#tut-finish-btn')).toBeVisible({ timeout: 15000 });
      await page.waitForTimeout(800);
      await expect(page).toHaveScreenshot(`workout-${theme}.png`);
    });

    test(`workout menu ${theme}`, async ({ page }) => {
      await page.getByRole('button', { name: /Empezar|Start/ }).first().click();
      await expect(page.locator('#tut-finish-btn')).toBeVisible({ timeout: 15000 });
      await page.getByRole('button', { name: /M[aá]s opciones|More options/ }).first().click();
      await expect(page.getByRole('menu').first()).toBeVisible();
      await page.waitForTimeout(500);
      await expect(page).toHaveScreenshot(`workout-menu-${theme}.png`);
    });

    test(`profile ${theme}`, async ({ page }) => {
      await page.getByLabel(/Abrir perfil|Open profile/).click();
      await expect(page.locator('[role="dialog"]').first()).toBeVisible({ timeout: 10000 });
      await page.waitForTimeout(800);
      await expect(page).toHaveScreenshot(`profile-${theme}.png`);
    });
  });
}
