// Q5: boundaries feed the local error log with the right source.
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LazyViewBoundary } from '../../components/ui/LazyViewBoundary';
import { clearErrorLog, readErrorLog } from '../../utils/errorLog';

const ChunkBoom = () => {
    throw new Error('Failed to fetch dynamically imported module: view.js');
};

describe('Q5: LazyViewBoundary logs chunk failures', () => {
    beforeEach(async () => {
        await clearErrorLog();
    });

    it('stores chunk errors with source=chunk while showing retry', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        try {
            render(
                <LazyViewBoundary lang="es">
                    <ChunkBoom />
                </LazyViewBoundary>,
            );
        } finally {
            consoleSpy.mockRestore();
        }
        expect(screen.getByText('Reintentar')).toBeDefined();
        await vi.waitFor(async () => {
            expect(await readErrorLog()).toHaveLength(1);
        });
        const [entry] = await readErrorLog();
        expect(entry.source).toBe('chunk');
        expect(entry.message).toContain('Failed to fetch');
    });
});
