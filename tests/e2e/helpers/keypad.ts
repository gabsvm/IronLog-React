import { expect, type Locator, type Page } from '@playwright/test';

// Shared keypad-driven entry (Strong parity T5): on coarse pointers the set
// inputs are readOnly and entry goes through the in-app keypad (physical
// fill() no longer sticks). Clears first because keypad digits append to
// the current text. Extracted from weightUnits.spec.ts so coarse-pointer
// specs share one copy.
export const enterViaKeypad = async (page: Page, input: Locator, digits: string) => {
    await input.click();
    const keypad = page.getByTestId('set-keypad');
    await expect(keypad).toBeVisible({ timeout: 6000 });
    // Number inputs sanitize trailing-dot intermediates ('132.' reads as ''),
    // so a read-until-empty loop exits early and later digits append to the
    // hidden remainder. Tap a fixed over-count instead: backspace on '' is a
    // no-op, and spec values stay well under 10 chars.
    for (let i = 0; i < 10; i++) {
        await keypad.getByTestId('set-keypad-back').click();
    }
    for (const d of digits) {
        await keypad.getByRole('button', { name: d, exact: true }).click();
    }
    await keypad.getByTestId('set-keypad-done').click();
    await expect(page.getByTestId('set-keypad')).toHaveCount(0);
};
