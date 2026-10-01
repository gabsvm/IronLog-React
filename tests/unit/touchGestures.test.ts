import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('U7: Browser gestures and touch configuration', () => {
    const cssPath = path.resolve(__dirname, '../../index.css');
    const cssContent = fs.readFileSync(cssPath, 'utf-8');

    it('configures overscroll-behavior: contain on html, body, and #root to prevent pull-to-refresh reload', () => {
        expect(cssContent).toMatch(/html,\s*body,\s*#root[\s\S]*?overscroll-behavior:\s*contain/);
    });

    it('configures global touch-action: manipulation on interactive controls', () => {
        expect(cssContent).toMatch(/button,\s*\[role=['"]button['"]\],\s*a,\s*input,\s*select,\s*textarea[\s\S]*?touch-action:\s*manipulation/);
    });

    it('configures overscroll-behavior: contain on .scroll-container', () => {
        expect(cssContent).toMatch(/\.scroll-container[\s\S]*?overscroll-behavior:\s*contain/);
    });
});
