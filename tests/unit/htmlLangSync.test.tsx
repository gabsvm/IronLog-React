import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import fs from 'fs';
import path from 'path';
import { TRANSLATIONS } from '../../constants/translations';

vi.mock('../../context/AuthContext', () => ({
    AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useAuth: () => ({
        user: null,
        subscription: { isPro: false },
        logout: vi.fn(),
    }),
}));

vi.mock('../../context/TimerContext', () => ({
    TimerProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useTimerActions: () => ({ setRestTimer: vi.fn() }),
    useTimerState: () => ({ active: false, timeLeft: 0 }),
}));

vi.mock('../../services/syncService', () => ({
    syncService: {
        flushQueue: vi.fn(),
        downloadState: vi.fn(),
        uploadState: vi.fn(),
        uploadSessionOnly: vi.fn(),
        uploadUserIdentity: vi.fn(),
    },
}));

vi.mock('../../services/dirtySyncState', () => ({
    dirtySyncState: {
        list: vi.fn().mockResolvedValue([]),
        mark: vi.fn().mockResolvedValue(undefined),
        clear: vi.fn().mockResolvedValue(undefined),
    },
}));

vi.mock('../../services/offlineSyncQueue', () => ({
    offlineSyncQueue: {
        count: vi.fn().mockResolvedValue(0),
    },
}));

vi.mock('../../lib/store', () => ({
    useStore: (selector: any) => selector({
        isStoreLoading: false,
        activeSession: null,
        activeMeso: null,
        setActiveSession: vi.fn(),
        setActiveMeso: vi.fn(),
    }),
}));

vi.mock('../../lib/idle', () => ({
    scheduleWhenIdle: (cb: () => void) => {
        cb();
        return () => {};
    },
}));

vi.mock('../../data/defaultLibrary', () => ({
    DEFAULT_LIBRARY: [],
    DEFAULT_TEMPLATE: [],
    INITIAL_TEMPLATES: [],
}));

vi.mock('../../hooks/usePersistedState', () => ({
    usePersistedState: (key: string, initialValue: any) => {
        const [state, setState] = React.useState(initialValue);
        return [state, setState, false];
    },
}));

import { AppProvider, useAppPreferences } from '../../context/AppContext';

describe('A5: Idioma & document.documentElement.lang synchronization', () => {
    const originalLang = document.documentElement.lang;

    afterEach(() => {
        document.documentElement.lang = originalLang;
        window.localStorage.removeItem('il_lang_v1');
    });

    it('syncs document.documentElement.lang through the real AppProvider when setLang changes', async () => {
        window.localStorage.removeItem('il_lang_v1');
        let setLangFn: ((lang: 'es' | 'en') => void) | null = null;

        const Probe: React.FC = () => {
            const { lang, setLang } = useAppPreferences();
            setLangFn = setLang;
            return <div data-testid="lang-probe">{lang}</div>;
        };

        const { findByTestId } = render(
            <AppProvider>
                <Probe />
            </AppProvider>
        );
        await findByTestId('lang-probe');
        expect(setLangFn).not.toBeNull();

        // Default language is Spanish.
        expect(document.documentElement.lang).toBe('es');

        // Switching to English updates both the DOM and the persisted preference.
        act(() => {
            setLangFn!('en');
        });
        expect(document.documentElement.lang).toBe('en');
        expect(window.localStorage.getItem('il_lang_v1')).toBe('"en"');

        // And back to Spanish.
        act(() => {
            setLangFn!('es');
        });
        expect(document.documentElement.lang).toBe('es');
        expect(window.localStorage.getItem('il_lang_v1')).toBe('"es"');
    });

    it('verifies index.html and public/manifest.json have consistent language settings', () => {
        const rootDir = path.resolve(__dirname, '../../');
        const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf-8');
        const manifestJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'public/manifest.json'), 'utf-8'));

        expect(indexHtml).toContain('<html lang="es">');
        expect(manifestJson.lang).toBe('es');
        expect(manifestJson.description).toContain('Seguimiento profesional de hipertrofia');
        expect(indexHtml).toContain('Seguimiento profesional de hipertrofia');
    });

    it('keeps TRANSLATIONS key sets exactly symmetrical between en and es', () => {
        const enKeys = Object.keys(TRANSLATIONS.en).sort();
        const esKeys = Object.keys(TRANSLATIONS.es).sort();

        expect(esKeys).toEqual(enKeys);

        // Spot-check critical keys and values on both sides.
        expect(TRANSLATIONS.es.train).toBe('Entreno');
        expect(TRANSLATIONS.en.train).toBe('Train');
        expect(TRANSLATIONS.es.finishSession).toBe('Terminar sesión');
        expect(TRANSLATIONS.en.finishSession).toBe('Finish session');
    });
});
