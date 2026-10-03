import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

// N6 test (b): the removed Settings surface must leave no references behind,
// not even in comments (stale pointers confuse the next refactor). Scans the
// shipped source tree; tests and docs may still name it legitimately.
const ROOTS = ['App.tsx', 'components', 'views', 'hooks', 'context', 'lib', 'services', 'utils'];
const PATTERN = /\bSettingsModal\b|\bshowSettings\b|\bsetShowSettings\b|\bonOpenSettings\b/;

const listSourceFiles = (root: string): string[] => {
    const out: string[] = [];
    const walk = (entry: string) => {
        const stat = statSync(entry);
        if (stat.isDirectory()) {
            for (const child of readdirSync(entry)) {
                walk(join(entry, child));
            }
            return;
        }
        if (/\.(ts|tsx|css)$/.test(entry)) out.push(entry);
    };
    walk(root);
    return out;
};

describe('N6: no SettingsModal/showSettings references remain in shipped code', () => {
    it('source tree is free of the removed surface identifiers', () => {
        const offenders: string[] = [];
        for (const root of ROOTS) {
            for (const file of listSourceFiles(root)) {
                if (PATTERN.test(readFileSync(file, 'utf8'))) {
                    offenders.push(file);
                }
            }
        }
        expect(offenders).toEqual([]);
    });
});
