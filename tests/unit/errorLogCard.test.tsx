// Q5: ErrorLogCard — count, copy diagnostics, clear.
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ErrorLogCard } from '../../components/profile/ErrorLogCard';
import { clearErrorLog, logError } from '../../utils/errorLog';

describe('Q5: ErrorLogCard', () => {
    beforeEach(async () => {
        await clearErrorLog();
    });

    it('shows the empty state with zero entries', async () => {
        render(<ErrorLogCard lang="es" syncStatusText="ok" />);
        expect(await screen.findByText('Sin errores registrados')).toBeDefined();
        expect(screen.getByText('Copiar diagnóstico')).toBeDefined();
    });

    it('shows the stored count, copies diagnostics and clears', async () => {
        await logError({ message: 'one', source: 'boundary' });
        await logError({ message: 'two', source: 'chunk' });
        const writeText = vi.fn(async (_text: string) => {});
        Object.defineProperty(navigator, 'clipboard', {
            value: { writeText },
            configurable: true,
        });

        render(<ErrorLogCard lang="es" syncStatusText="Nube al día" />);
        expect(await screen.findByText('2 registrados')).toBeDefined();

        fireEvent.click(screen.getByText('Copiar diagnóstico'));
        await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
        const copied = String(writeText.mock.calls[0][0]);
        expect(copied).toContain('GainsLab diagnostics');
        expect(copied).toContain('Nube al día');
        expect(copied).toContain('one');
        expect(await screen.findByText('¡Copiado!')).toBeDefined();

        fireEvent.click(screen.getByText('Borrar'));
        expect(await screen.findByText('Sin errores registrados')).toBeDefined();
    });
});
