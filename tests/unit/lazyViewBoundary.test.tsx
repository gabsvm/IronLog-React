import React, { Suspense } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LazyViewBoundary } from '../../components/ui/LazyViewBoundary';
import { ErrorBoundary } from '../../index';
import { TRANSLATIONS } from '../../constants/translations';

describe('G1: LazyViewBoundary only handles chunk-load failures locally', () => {
    beforeEach(() => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        window.localStorage.setItem('il_lang_v1', 'es');
    });

    afterEach(() => {
        vi.restoreAllMocks();
        window.localStorage.removeItem('il_lang_v1');
    });

    it('shows message + retry when a lazy child rejects with a chunk-load error', async () => {
        const ChunkFail = React.lazy(() =>
            Promise.reject(new Error('Failed to fetch dynamically imported module: /assets/WorkoutView-abc.js'))
        );

        render(
            <Suspense fallback={<div>Cargando…</div>}>
                <LazyViewBoundary lang="es">
                    <ChunkFail />
                </LazyViewBoundary>
            </Suspense>
        );

        // Local fallback: message + retry button, not the root boundary.
        expect(await screen.findByText(TRANSLATIONS.es.viewLoadFailed)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: TRANSLATIONS.es.retry })).toBeInTheDocument();
        expect(screen.queryByText('ERROR CRÍTICO')).not.toBeInTheDocument();
    });

    it('lets a plain render error through to the root ErrorBoundary with backup export', async () => {
        const CorruptChild = () => {
            throw new Error('corrupt activeSession state');
        };

        render(
            <ErrorBoundary>
                <LazyViewBoundary lang="es">
                    <CorruptChild />
                </LazyViewBoundary>
            </ErrorBoundary>
        );

        // Root boundary UI: critical header + emergency backup export button.
        expect(await screen.findByText('ERROR CRÍTICO')).toBeInTheDocument();
        expect(screen.getByText('Exportar copia de seguridad')).toBeInTheDocument();
        expect(screen.queryByText(TRANSLATIONS.es.viewLoadFailed)).not.toBeInTheDocument();
    });

    it('resets the local fallback when resetKey changes', async () => {
        const ChunkFail = React.lazy(() =>
            Promise.reject(new Error('Loading chunk 42 failed'))
        );
        const Healthy = () => <div>vista sana</div>;

        const { rerender } = render(
            <Suspense fallback={<div>Cargando…</div>}>
                <LazyViewBoundary lang="es" resetKey="workout">
                    <ChunkFail />
                </LazyViewBoundary>
            </Suspense>
        );
        expect(await screen.findByText(TRANSLATIONS.es.viewLoadFailed)).toBeInTheDocument();

        rerender(
            <Suspense fallback={<div>Cargando…</div>}>
                <LazyViewBoundary lang="es" resetKey="history">
                    <Healthy />
                </LazyViewBoundary>
            </Suspense>
        );
        expect(await screen.findByText('vista sana')).toBeInTheDocument();
    });
});
