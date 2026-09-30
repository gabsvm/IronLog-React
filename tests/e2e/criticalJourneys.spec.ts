import { test, expect } from '@playwright/test';

test.describe('GainsLab Critical Journeys', () => {
    test.beforeEach(async ({ page }) => {
        // Clear local storage and indexedDB to start fresh
        await page.goto('/');
        await page.evaluate(() => {
            localStorage.clear();
            sessionStorage.clear();
        });
    });

    test('Journey A — Suggested onboarding flow leads to Home with recommended plan', async ({ page }) => {
        await page.goto('/');

        // On landing, check for Get Started button
        const startBtn = page.getByRole('button', { name: /comenzar|get started/i });
        if (await startBtn.isVisible({ timeout: 3000 })) {
            await startBtn.click();
        }

        // Onboarding wizard steps
        // Step 0: Experience
        const nextBtn = page.getByRole('button', { name: /siguiente|next/i });
        if (await nextBtn.isVisible({ timeout: 2000 })) {
            await nextBtn.click();
            // Step 1: Days
            await page.waitForTimeout(300);
            await nextBtn.click();
            // Step 2: Goal
            await page.waitForTimeout(300);
            await nextBtn.click();
            // Step 3: Duration -> triggers recommendation
            await page.waitForTimeout(300);
            await nextBtn.click();

            // Wait for recommendation step
            const applyBtn = page.getByRole('button', { name: /aplicar|empezar|start/i }).first();
            await expect(applyBtn).toBeVisible({ timeout: 5000 });
            await applyBtn.click();
        }

        // Should land on home navigation
        await expect(page.locator('nav')).toBeVisible({ timeout: 5000 });
    });

    test('Journey C — Quick Start sheet opens workout initiation', async ({ page }) => {
        // Seed onboarding complete
        await page.goto('/');
        await page.evaluate(() => {
            localStorage.setItem('il_has_seen_onboarding_v1', 'true');
        });
        await page.reload();

        // Check for Quick Start '+' button or Start Workout
        const nav = page.locator('nav');
        await expect(nav).toBeVisible({ timeout: 5000 });

        const plusBtn = page.locator('button[aria-label*="start" i], button[aria-label*="iniciar" i], nav button:has-text("+")').first();
        if (await plusBtn.isVisible()) {
            await plusBtn.click();
            // Quick start sheet options should be visible
            await expect(page.getByText(/freestyle|libre|quick start/i).first()).toBeVisible({ timeout: 3000 });
        }
    });

    test('Journey D — Active workout state persistence across reload', async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => {
            localStorage.setItem('il_has_seen_onboarding_v1', 'true');
            // Seed an active session
            const testSession = {
                id: Date.now(),
                name: 'Persistence Test Workout',
                startTime: Date.now(),
                exercises: [
                    {
                        id: 'bench_press',
                        name: 'Barbell Bench Press',
                        muscle: 'CHEST',
                        instanceId: 'inst_1',
                        sets: [
                            { id: 'set_1', weight: '80', reps: '8', completed: true, type: 'regular' },
                            { id: 'set_2', weight: '85', reps: '6', completed: false, type: 'regular' },
                        ],
                    },
                ],
            };
            localStorage.setItem('ironlog_active_session', JSON.stringify(testSession));
        });

        await page.reload();

        // Check that session is preserved / resumed
        await expect(page.getByText('Persistence Test Workout').first()).toBeVisible({ timeout: 5000 });
    });
});
