import { describe, it, expect } from 'vitest';
import { isServiceWorkerAllowed } from '../../utils/serviceWorker';

describe('isServiceWorkerAllowed', () => {
    it('returns false when on native shell', () => {
        expect(isServiceWorkerAllowed({ isNative: true, hasSW: true, webdriver: false })).toBe(false);
    });

    it('returns false when serviceWorker is not supported in navigator', () => {
        expect(isServiceWorkerAllowed({ isNative: false, hasSW: false, webdriver: false })).toBe(false);
    });

    it('returns true in standard browser without webdriver', () => {
        expect(isServiceWorkerAllowed({ isNative: false, hasSW: true, webdriver: false })).toBe(true);
    });

    it('returns false under webdriver if no e2e override is present', () => {
        expect(isServiceWorkerAllowed({ isNative: false, hasSW: true, webdriver: true, e2eFlag: false, search: '' })).toBe(false);
    });

    it('returns true under webdriver when window.__E2E_ENABLE_SW__ is true', () => {
        expect(isServiceWorkerAllowed({ isNative: false, hasSW: true, webdriver: true, e2eFlag: true, search: '' })).toBe(true);
    });

    it('returns true under webdriver when ?sw=1 query param is set', () => {
        expect(isServiceWorkerAllowed({ isNative: false, hasSW: true, webdriver: true, e2eFlag: false, search: '?sw=1' })).toBe(true);
    });
});
