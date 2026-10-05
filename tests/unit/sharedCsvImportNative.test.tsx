import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen } from '@testing-library/react';
import { TRANSLATIONS } from '../../constants/translations';

// T3: a CSV received by the native app opens the same import flow.
vi.mock('../../context/AppContext', () => ({
    useApp: () => ({
        lang: 'es',
        config: {},
        logs: [],
        setLogs: vi.fn(),
        exercises: [{ id: 'bp_bar', name: { en: 'Barbell Bench Press', es: 'Press Banca Barra' }, muscle: 'CHEST' }],
        setExercises: vi.fn(),
    }),
    useAppPreferences: () => ({ lang: 'es' }),
}));

import { SharedCsvImport } from '../../components/app/SharedCsvImport';

const hevy = readFileSync(resolve(process.cwd(), 'tests/e2e/fixtures/hevy-sample.csv'), 'utf8');

describe('T3: SharedCsvImport with a native launch', () => {
    it('opens the importer with the shared Hevy file', async () => {
        render(<SharedCsvImport ready onImported={vi.fn()} nativeLaunch={{ kind: 'file', payload: { name: 'hevy.csv', text: hevy } }} />);
        expect(await screen.findByText('Hevy', { exact: true })).toBeTruthy();
        expect(screen.getByText(TRANSLATIONS.es.csv.importTitle)).toBeTruthy();
    });

    it('shows the shared-file error when the native side could not read it', async () => {
        render(<SharedCsvImport ready onImported={vi.fn()} nativeLaunch={{ kind: 'error' }} />);
        expect((await screen.findByRole('alert')).textContent).toContain(TRANSLATIONS.es.csv.sharedError);
    });

    it('waits for local data before importing', () => {
        render(<SharedCsvImport ready={false} onImported={vi.fn()} nativeLaunch={{ kind: 'file', payload: { name: 'x.csv', text: hevy } }} />);
        expect(screen.queryByText('Hevy', { exact: true })).toBeNull();
    });
});
