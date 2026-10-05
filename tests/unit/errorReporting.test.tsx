import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen, fireEvent } from '@testing-library/react';
import {
    ERROR_REPORTS_OPT_IN_KEY,
    REPORTS_PER_SESSION,
    createReporter,
    isErrorReportingEnabled,
    setErrorReportingEnabled,
    toReportDoc,
} from '../../utils/errorReporting';
import type { ErrorEntry } from '../../utils/errorLog';
import { ErrorLogCard } from '../../components/profile/ErrorLogCard';
import { TRANSLATIONS } from '../../constants/translations';

// U7: opt-in anonymous error reports.
const entry = (message: string, over: Partial<ErrorEntry> = {}): ErrorEntry => ({
    ts: 1_700_000_000_000, message, source: 'window.onerror', view: 'workout', appVersion: '4.0.3', platform: 'native', ...over,
});

describe('U7: reporter', () => {
    beforeEach(() => window.localStorage.removeItem(ERROR_REPORTS_OPT_IN_KEY));

    it('is off by default and the preference persists', () => {
        expect(isErrorReportingEnabled()).toBe(false);
        setErrorReportingEnabled(true);
        expect(window.localStorage.getItem(ERROR_REPORTS_OPT_IN_KEY)).toBe('1');
        expect(isErrorReportingEnabled()).toBe(true);
        setErrorReportingEnabled(false);
        expect(isErrorReportingEnabled()).toBe(false);
    });

    it('sends nothing while opted out', async () => {
        const send = vi.fn(async () => true);
        const report = createReporter({ send }, () => false);
        expect(await report(entry('boom'))).toBe('skipped');
        expect(send).not.toHaveBeenCalled();
    });

    it('sends each distinct message once, up to the per-session cap', async () => {
        const send = vi.fn(async () => true);
        const report = createReporter({ send }, () => true);
        expect(await report(entry('boom'))).toBe('sent');
        expect(await report(entry('boom'))).toBe('skipped');
        for (let i = 0; i < REPORTS_PER_SESSION + 5; i++) await report(entry(`err ${i}`));
        expect(send).toHaveBeenCalledTimes(REPORTS_PER_SESSION);
    });

    it('signed out: nothing is sent and the same error may be retried later', async () => {
        const send = vi.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true);
        const report = createReporter({ send }, () => true);
        expect(await report(entry('x'))).toBe('skipped');
        expect(await report(entry('x'))).toBe('sent');
    });

    it('a failing sink never throws', async () => {
        const report = createReporter({ send: async () => { throw new Error('offline'); } }, () => true);
        await expect(report(entry('x'))).resolves.toBe('skipped');
    });

    it('the document has no identity fields and bounded sizes', () => {
        const doc = toReportDoc(entry('m'.repeat(5000), { stack: 's'.repeat(9000) }));
        expect(Object.keys(doc).sort()).toEqual(['appVersion', 'createdAt', 'message', 'platform', 'source', 'stack', 'view']);
        expect((doc.message as string).length).toBe(1024);
        expect((doc.stack as string).length).toBe(2048);
    });

    it('document keys are exactly the rules allowlist', () => {
        const rules = readFileSync(resolve(process.cwd(), 'firestore.rules'), 'utf8');
        const m = rules.match(/match \/errorReports\/\{id\}[\s\S]*?hasOnly\(\[([^\]]+)\]\)/);
        expect(m).not.toBeNull();
        const allowed = [...m![1].matchAll(/'([^']+)'/g)].map((x) => x[1]).sort();
        expect(allowed).toEqual(Object.keys(toReportDoc(entry('m', { stack: 's' }))).sort());
    });
});

describe('U7: opt-in switch in Perfil → Avanzado', () => {
    beforeEach(() => window.localStorage.removeItem(ERROR_REPORTS_OPT_IN_KEY));

    it('starts off and toggling it stores the choice', () => {
        render(<ErrorLogCard lang="es" syncStatusText="ok" />);
        const toggle = screen.getByRole('switch', { name: TRANSLATIONS.es.you.errorReportsTitle }) as HTMLInputElement;
        expect(toggle.checked).toBe(false);
        fireEvent.click(toggle);
        expect(toggle.checked).toBe(true);
        expect(isErrorReportingEnabled()).toBe(true);
        fireEvent.click(toggle);
        expect(isErrorReportingEnabled()).toBe(false);
    });
});
