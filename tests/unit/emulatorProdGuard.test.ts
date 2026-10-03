// Q1: the emulator branch must be unreachable in production builds, and no
// emulator host may leak into dist/.
import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { shouldUseFirebaseEmulator } from '../../lib/firebaseLoader';

describe('Q1: emulator gating logic', () => {
    it('is active with the flag in DEV', () => {
        expect(shouldUseFirebaseEmulator({ VITE_FIREBASE_EMULATOR: '1' }, { isDev: true, mode: 'development' })).toBe(true);
    });

    it('is active with the flag in vitest (test mode)', () => {
        expect(shouldUseFirebaseEmulator({ VITE_FIREBASE_EMULATOR: '1' }, { isDev: true, mode: 'test' })).toBe(true);
    });

    it('is inactive with the flag in a production build', () => {
        expect(shouldUseFirebaseEmulator({ VITE_FIREBASE_EMULATOR: '1' }, { isDev: false, mode: 'production' })).toBe(false);
    });

    it('is inactive without the flag even in DEV', () => {
        expect(shouldUseFirebaseEmulator({}, { isDev: true, mode: 'development' })).toBe(false);
        expect(shouldUseFirebaseEmulator({ VITE_FIREBASE_EMULATOR: '0' }, { isDev: true, mode: 'test' })).toBe(false);
    });
});

describe.skipIf(!existsSync('dist'))('Q1: dist/ contains no emulator hosts', () => {
    it('no bundled asset references the emulator endpoints', () => {
        const dir = join('dist', 'assets');
        const files = readdirSync(dir).filter((f) => f.endsWith('.js'));
        expect(files.length).toBeGreaterThan(0);
        const banned = ['127.0.0.1:9099', '127.0.0.1:8085', 'localhost:9099', 'localhost:8085'];
        for (const file of files) {
            const content = readFileSync(join(dir, file), 'utf8');
            for (const host of banned) {
                expect(content.includes(host), `${file} leaks ${host}`).toBe(false);
            }
        }
    });
});
