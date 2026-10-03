import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, act, screen } from '@testing-library/react';

vi.mock('../../context/AppContext', () => ({
    useApp: () => ({
        lang: 'es',
        setLang: vi.fn(),
        setProgram: vi.fn(),
        config: { showRIR: false, keepScreenOn: false },
        setConfig: vi.fn(),
        userProfile: {},
        setUserProfile: vi.fn(),
        logs: [],
        theme: 'dark',
        setTheme: vi.fn(),
        colorTheme: 'iron',
        setColorTheme: vi.fn(),
        effectsMode: 'system',
        setEffectsMode: vi.fn(),
        resolvedEffects: 'balanced',
        deferredPrompt: null,
        installApp: vi.fn(),
        isStandalone: true,
        pendingCloudSections: [],
        program: [],
        personalTemplates: [],
        setPersonalTemplates: vi.fn(),
        syncStatus: { pending: 0, isSyncing: false, lastSyncedAt: null },
        isOnline: true,
    }),
    useAppPreferences: () => ({ lang: 'es', setLang: vi.fn() }),
    useSyncMeta: () => ({ localLastUpdated: null, localSectionSyncMeta: {} }),
    useSyncStatus: () => ({ isOnline: true, syncStatus: { pending: 0, isSyncing: false, lastSyncedAt: null } }),
}));

vi.mock('../../context/AuthContext', () => ({
    useAuth: () => ({ user: { email: 'test@gainslab.app' }, isPro: false, logout: vi.fn(), deleteAccount: vi.fn() }),
}));

vi.mock('../../hooks/usePro', () => ({
    usePro: () => ({
        isPro: false,
        tier: null,
        expiryDate: null,
        checkPro: () => true,
        showPaywall: false,
        setShowPaywall: vi.fn(),
        featureAttempted: '',
    }),
}));

vi.mock('../../lib/store', () => ({
    useStore: (selector: any) => selector({
        activeSession: null,
        activeMeso: null,
        setActiveMeso: vi.fn(),
        setActiveSession: vi.fn(),
    }),
}));

vi.mock('../../lib/idle', () => ({
    scheduleWhenIdle: (cb: () => void) => {
        // Run idle preload
        cb();
        return () => {};
    },
}));

import { Layout } from '../../components/layout/Layout';

describe('L2: Lazy loaded ProfileSheet and QuickStartSheet', () => {
    it('does not mount ProfileSheet initially, but mounts it lazily on user interaction', async () => {
        const { getByLabelText } = render(
            <Layout
                view="home"
                setView={vi.fn()}
                onOpenProgram={vi.fn()}
                onOpenExercises={vi.fn()}
                onReset={vi.fn()}
                onExport={vi.fn()}
                onForceSync={vi.fn()}
                onImportFile={vi.fn()}
                onLogin={vi.fn()}
                isSyncing={false}
            >
                <div>Main Content</div>
            </Layout>
        );

        // ProfileSheet should not be mounted initially in DOM
        expect(document.body.textContent).not.toContain('Cuenta gratuita');

        // Open profile via avatar click
        const avatarBtn = getByLabelText('Abrir perfil');
        act(() => {
            fireEvent.click(avatarBtn);
        });

        // Profile sheet should now mount in Suspense into portal in document.body.
        // The lazy chunk transform shares CPU with every parallel worker, so
        // keep the condition wait but give it a load-tolerant budget.
        const profileEl = await screen.findByText(/Cuenta gratuita/, {}, { timeout: 15000 });
        expect(profileEl).toBeDefined();
    });
});
