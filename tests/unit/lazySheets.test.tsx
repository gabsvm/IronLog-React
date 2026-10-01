import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, act, screen } from '@testing-library/react';

vi.mock('../../context/AppContext', () => ({
    useApp: () => ({
        setProgram: vi.fn(),
        config: { showRIR: false, keepScreenOn: false },
        setConfig: vi.fn(),
        userProfile: {},
        setUserProfile: vi.fn(),
        logs: [],
        theme: 'dark',
        colorTheme: 'iron',
        syncStatus: { pending: 0, isSyncing: false, lastSyncedAt: null },
        isOnline: true,
    }),
    useAppPreferences: () => ({ lang: 'es', setLang: vi.fn() }),
    useSyncStatus: () => ({ isOnline: true, syncStatus: { pending: 0, isSyncing: false, lastSyncedAt: null } }),
}));

vi.mock('../../context/AuthContext', () => ({
    useAuth: () => ({ user: { email: 'test@gainslab.app' }, isPro: false }),
}));

vi.mock('../../hooks/usePro', () => ({
    usePro: () => ({ isPro: false }),
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
            <Layout view="home" setView={vi.fn()} onOpenSettings={vi.fn()}>
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

        // Profile sheet should now mount in Suspense into portal in document.body
        const profileEl = await screen.findByText(/Cuenta gratuita/);
        expect(profileEl).toBeDefined();
    });
});
