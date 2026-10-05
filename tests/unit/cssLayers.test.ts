import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// S9: global CSS is imported in exactly one place (index.tsx), in cascade
// order. Scattered `import './x.css'` in components re-created ad-hoc polish
// layers whose order depended on module evaluation.
describe('S9: CSS layers', () => {
    it('only index.tsx imports stylesheets, in the documented order', () => {
        const hits = execSync('git grep -nE "^import \'[^\']+\.css\';" -- "*.ts" "*.tsx" ":!tests"', { encoding: 'utf8' })
            .trim()
            .split('\n')
            .map((line) => line.replace(/\r$/, ''));
        expect(hits.every((line) => line.startsWith('index.tsx:'))).toBe(true);
        const order = hits.map((line) => line.split(':').slice(2).join(':'));
        expect(order).toEqual([
            "import './index.css';",
            "import './native-performance.css';",
            "import './styles/app-polish.css';",
        ]);
    });

    it('the consolidated polish file keeps every former layer', () => {
        const css = readFileSync(resolve(process.cwd(), 'styles/app-polish.css'), 'utf8');
        for (const marker of ['data-install-banner', '.product-home-polish', '.product-workout-polish .cursor-grab', '.kong-active', 'workout-density-pass']) {
            expect(css).toContain(marker);
        }
    });
});
