import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor, fireEvent, screen } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    clear: vi.fn(),
}));

vi.mock('idb-keyval', () => mocks);

import { db } from '../../utils/db';
import { usePersistedState } from '../../hooks/usePersistedState';

beforeEach(() => {
    vi.clearAllMocks();
    mocks.get.mockResolvedValue(undefined);
    window.localStorage.clear();
});

describe('P1: failed IndexedDB writes are visible, never silent', () => {
    it('db.set resolves false (not a silent void) when the write throws', async () => {
        mocks.set.mockRejectedValueOnce(new Error('QuotaExceededError: simulated'));
        await expect(db.set('audit_key', { a: 1 })).resolves.toBe(false);
        mocks.set.mockResolvedValueOnce(undefined);
        await expect(db.set('audit_key', { a: 1 })).resolves.toBe(true);
    });

    it('usePersistedState exposes the failure, keeps the value pending, and recovers on retry', async () => {
        mocks.set.mockRejectedValue(new Error('QuotaExceededError: simulated'));
        const seen: string[] = [];
        const onError = (e: Event) => seen.push(`error:${(e as CustomEvent).detail.key}`);
        const onOk = (e: Event) => seen.push(`ok:${(e as CustomEvent).detail.key}`);
        window.addEventListener('ironlog:persist-error', onError);
        window.addEventListener('ironlog:persist-ok', onOk);
        try {
            const Probe: React.FC = () => {
                const [value, setValue, , writeError] = usePersistedState('audit_probe', 'a', 5);
                return (
                    <>
                        <span data-testid="value">{value}</span>
                        <span data-testid="write-error">{writeError === null ? 'none' : 'failed'}</span>
                        <button type="button" onClick={() => setValue('b')}>change</button>
                    </>
                );
            };
            render(<Probe />);
            expect(screen.getByTestId('write-error').textContent).toBe('none');

            fireEvent.click(screen.getByRole('button', { name: 'change' }));
            expect(screen.getByTestId('value').textContent).toBe('b');

            await waitFor(() => expect(screen.getByTestId('write-error').textContent).toBe('failed'));
            expect(seen).toContain('error:audit_probe');

            // Storage recovers: retry flushes the still-pending value and clears the flag.
            mocks.set.mockResolvedValue(undefined);
            window.dispatchEvent(new CustomEvent('ironlog:persist-retry'));
            await waitFor(() => expect(screen.getByTestId('write-error').textContent).toBe('none'));
            expect(seen).toContain('ok:audit_probe');
            expect(mocks.set).toHaveBeenLastCalledWith('audit_probe', 'b');
        } finally {
            window.removeEventListener('ironlog:persist-error', onError);
            window.removeEventListener('ironlog:persist-ok', onOk);
        }
    });
});
