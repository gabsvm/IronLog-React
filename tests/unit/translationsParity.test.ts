import { describe, it, expect } from 'vitest';
import { TRANSLATIONS } from '../../constants/translations';

// Q19: es and en must carry exactly the same keys, recursively. A key present
// in only one language renders as `undefined` for half the users.
type Diff = string;

const diffKeys = (a: unknown, b: unknown, path: string, out: Diff[]): void => {
    if (Array.isArray(a) || Array.isArray(b)) {
        if (!Array.isArray(a) || !Array.isArray(b)) {
            out.push(`${path}: array vs non-array`);
            return;
        }
        if (a.length !== b.length) {
            out.push(`${path}: length ${a.length} vs ${b.length}`);
        }
        for (let i = 0; i < Math.min(a.length, b.length); i++) {
            diffKeys(a[i], b[i], `${path}[${i}]`, out);
        }
        return;
    }
    const aObj = a !== null && typeof a === 'object';
    const bObj = b !== null && typeof b === 'object';
    if (aObj !== bObj) {
        out.push(`${path}: object vs leaf`);
        return;
    }
    if (!aObj || !bObj) return; // both leaves: values legitimately differ
    const aKeys = Object.keys(a as Record<string, unknown>);
    const bKeys = new Set(Object.keys(b as Record<string, unknown>));
    for (const key of aKeys) {
        if (!bKeys.has(key)) {
            out.push(`${path}.${key}: missing in en`);
            continue;
        }
        bKeys.delete(key);
        diffKeys(
            (a as Record<string, unknown>)[key],
            (b as Record<string, unknown>)[key],
            path ? `${path}.${key}` : key,
            out,
        );
    }
    for (const key of bKeys) {
        out.push(`${path}.${key}: missing in es`);
    }
};

describe('Q19: TRANSLATIONS es/en key parity', () => {
    it('es and en have exactly the same keys (recursive)', () => {
        const diffs: Diff[] = [];
        diffKeys(TRANSLATIONS.es, TRANSLATIONS.en, '', diffs);
        expect(diffs).toEqual([]);
    });
});
