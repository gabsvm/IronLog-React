// Q6: StoragePersistRow — status label and one-tap enable.
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StoragePersistRow } from '../../components/profile/StoragePersistRow';

describe('Q6: StoragePersistRow', () => {
    const origStorage = (navigator as { storage?: unknown }).storage;

    afterEach(() => {
        if (origStorage === undefined) {
            delete (navigator as { storage?: unknown }).storage;
        } else {
            Object.defineProperty(navigator, 'storage', { value: origStorage, configurable: true });
        }
    });

    it('shows unsupported without the Storage API', async () => {
        Object.defineProperty(navigator, 'storage', { value: undefined, configurable: true });
        render(<StoragePersistRow lang="es" />);
        expect(await screen.findByText('No soportado')).toBeDefined();
        expect(screen.queryByText('Activar')).toBeNull();
    });

    it('shows on/off and enables on tap', async () => {
        const persisted = vi.fn(async () => false);
        const persist = vi.fn(async () => true);
        Object.defineProperty(navigator, 'storage', {
            value: { persisted, persist },
            configurable: true,
        });
        render(<StoragePersistRow lang="es" />);
        expect(await screen.findByText('Desactivado')).toBeDefined();

        fireEvent.click(screen.getByText('Activar'));
        await waitFor(() => expect(persist).toHaveBeenCalledTimes(1));
        expect(await screen.findByText('Activado')).toBeDefined();
    });
});
