import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ErrorBoundary } from '../../index';
import { generateEmergencyBackup, getPreferredLanguage } from '../../utils/emergencyBackup';
import * as idbKeyval from 'idb-keyval';

vi.mock('idb-keyval', async (importOriginal) => {
    const actual = await importOriginal<typeof import('idb-keyval')>();
    return {
        ...actual,
        entries: vi.fn(),
    };
});

describe('U6: ErrorBoundary and Emergency Backup', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        window.localStorage.clear();
    });

    it('getPreferredLanguage returns stored language or defaults based on navigator', () => {
        window.localStorage.setItem('il_lang_v1', 'es');
        expect(getPreferredLanguage()).toBe('es');

        window.localStorage.setItem('il_lang_v1', 'en');
        expect(getPreferredLanguage()).toBe('en');

        // S7: the app persists it JSON-encoded through useLocalStorage.
        window.localStorage.setItem('il_lang_v1', JSON.stringify('es'));
        expect(getPreferredLanguage()).toBe('es');
        window.localStorage.setItem('il_lang_v1', JSON.stringify('en'));
        expect(getPreferredLanguage()).toBe('en');
    });

    it('generateEmergencyBackup dumps localStorage and IndexedDB il_* keys into backup payload', async () => {
        window.localStorage.setItem('il_theme_v1', 'dark');
        window.localStorage.setItem('il_cfg_rir', 'true');
        window.localStorage.setItem('other_unrelated_key', 'ignore_me');

        const mockPrograms = [{ id: 'p1', dayName: 'Day A' }];
        const mockLogs = [{ id: 101, name: 'Chest Day' }];

        vi.mocked(idbKeyval.entries).mockResolvedValue([
            ['il_prog_v16', mockPrograms],
            ['il_logs_v16', mockLogs],
            ['unrelated_idb', 'ignore_this'],
        ] as any);

        const { filename, payload } = await generateEmergencyBackup();

        expect(filename).toMatch(/^gainslab-emergency-backup-\d{4}-\d{2}-\d{2}\.json$/);
        expect(payload.schema).toBe('gainslab-backup');
        expect(payload.version).toBe(1);
        expect(payload.state.program).toEqual(mockPrograms);
        expect(payload.state.logs).toEqual(mockLogs);
        expect(payload.rawStorage.localStorage['il_theme_v1']).toBe('dark');
        expect(payload.rawStorage.localStorage['other_unrelated_key']).toBeUndefined();
        expect(payload.rawStorage.indexedDB['il_prog_v16']).toEqual(mockPrograms);
        expect(payload.rawStorage.indexedDB['unrelated_idb']).toBeUndefined();
    });

    it('renders ErrorBoundary with 100dvh, single language, emergency backup button and collapsed details', () => {
        window.localStorage.setItem('il_lang_v1', 'es');

        const ProblemChild = () => {
            throw new Error('Explosion during render');
        };

        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        render(
            <ErrorBoundary>
                <ProblemChild />
            </ErrorBoundary>
        );

        // Header and subtitle in Spanish
        expect(screen.getByText('ERROR CRÍTICO')).toBeInTheDocument();
        expect(screen.getByText('La aplicación no pudo inicializarse correctamente.')).toBeInTheDocument();

        // Check 100dvh container
        const container = screen.getByText('ERROR CRÍTICO').closest('div');
        expect(container?.style.minHeight).toBe('100dvh');

        // Check buttons
        expect(screen.getByText('Recargar aplicación')).toBeInTheDocument();
        expect(screen.getByText('Exportar copia de seguridad')).toBeInTheDocument();
        expect(screen.getByText('Reiniciar datos locales')).toBeInTheDocument();

        // Technical details inside <details>
        expect(screen.getByText('Ver detalles técnicos del error')).toBeInTheDocument();
        const detailsEl = screen.getByText('Ver detalles técnicos del error').closest('details');
        expect(detailsEl).toBeInTheDocument();
        expect(detailsEl?.open).toBe(false);

        consoleErrorSpy.mockRestore();
    });
});
