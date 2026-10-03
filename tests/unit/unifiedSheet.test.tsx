import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const { sheetState } = vi.hoisted(() => ({
    sheetState: {
        user: null as null | { email: string; displayName: string },
        pro: false,
    },
}));

vi.mock('../../context/AppContext', () => ({
    useApp: () => ({
        lang: 'es',
        setLang: vi.fn(),
        theme: 'dark',
        setTheme: vi.fn(),
        colorTheme: 'iron',
        setColorTheme: vi.fn(),
        effectsMode: 'system',
        setEffectsMode: vi.fn(),
        resolvedEffects: 'balanced',
        userProfile: { bodyWeight: 80, height: 180 },
        setUserProfile: vi.fn(),
        logs: [],
        config: { showRIR: false, keepScreenOn: false },
        setConfig: vi.fn(),
        deferredPrompt: null,
        installApp: vi.fn(),
        isStandalone: true,
        pendingCloudSections: [],
        program: [],
        personalTemplates: [],
        setPersonalTemplates: vi.fn(),
    }),
    useAppPreferences: () => ({ lang: 'es', setLang: vi.fn() }),
    useSyncMeta: () => ({ localLastUpdated: null, localSectionSyncMeta: {} }),
    useSyncStatus: () => ({ isOnline: true, syncStatus: { pending: 0, isSyncing: false, lastSyncedAt: null } }),
}));

vi.mock('../../context/AuthContext', () => ({
    useAuth: () => ({ user: sheetState.user, logout: vi.fn(), deleteAccount: vi.fn() }),
}));

vi.mock('../../hooks/usePro', () => ({
    usePro: () => ({
        isPro: sheetState.pro,
        tier: sheetState.pro ? 'lifetime' : null,
        expiryDate: null,
        checkPro: () => true,
        showPaywall: false,
        setShowPaywall: vi.fn(),
        featureAttempted: '',
    }),
}));

vi.mock('../../lib/store', () => ({
    useStore: (selector: any) => selector({ activeMeso: null }),
}));

import { ProfileSheet } from '../../components/profile/ProfileSheet';

const renderSheet = (props: Partial<React.ComponentProps<typeof ProfileSheet>> = {}) =>
    render(
        <ProfileSheet
            open={true}
            onClose={vi.fn()}
            onOpenProgram={vi.fn()}
            onOpenExercises={vi.fn()}
            onReset={vi.fn()}
            onExport={vi.fn()}
            onForceSync={vi.fn()}
            onImportFile={vi.fn()}
            onLogin={vi.fn()}
            isSyncing={false}
            {...props}
        />
    );

describe('N6: unified sheet signed-in coverage (labels the guest e2e cannot see)', () => {
    it('shows each signed-in control exactly once and hides admin items from non-admins', () => {
        sheetState.user = { email: 'a@b.c', displayName: 'Tester' };
        sheetState.pro = false;
        renderSheet();

        expect(screen.getAllByText('Sincronizar ahora')).toHaveLength(1);
        expect(screen.getAllByText('Cerrar sesión')).toHaveLength(1);
        expect(screen.getAllByText('Eliminar cuenta')).toHaveLength(1);
        expect(screen.getAllByText(/Cuenta gratuita/)).toHaveLength(1);
        expect(screen.queryByText('Gestionar plantillas')).toBeNull();
        expect(screen.queryByText('Panel de administración')).toBeNull();
        // Advanced content (diagnostics + credits) renders for everyone.
        expect(screen.getAllByText('Diagnóstico sync')).toHaveLength(1);
        expect(screen.getAllByText('Hipertrofia Natural (NH) Regla 85%')).toHaveLength(1);
        sheetState.user = null;
    });

    it('shows the Pro plan label and admin items for the admin user', () => {
        sheetState.user = { email: 'gabsvm@gmail.com', displayName: 'Owner' };
        sheetState.pro = true;
        renderSheet();

        expect(screen.getAllByText(/Vitalicio/)).toHaveLength(1);
        expect(screen.getAllByText('Panel Admin')).toHaveLength(1);
        expect(screen.getAllByText('Gestionar plantillas')).toHaveLength(1);
        sheetState.user = null;
        sheetState.pro = false;
    });

    it('each former settings entry opens its target: program/exercises rows navigate, danger calls reset', () => {
        sheetState.user = { email: 'a@b.c', displayName: 'Tester' };
        const onOpenProgram = vi.fn();
        const onOpenExercises = vi.fn();
        const onReset = vi.fn();
        const onClose = vi.fn();
        renderSheet({ onOpenProgram, onOpenExercises, onReset, onClose });

        fireEvent.click(screen.getByText('Editor de programa'));
        expect(onOpenProgram).toHaveBeenCalledTimes(1);
        expect(onClose).toHaveBeenCalledTimes(1);

        fireEvent.click(screen.getByText('Ejercicios y plantillas'));
        expect(onOpenExercises).toHaveBeenCalledTimes(1);

        fireEvent.click(screen.getByText('Restablecer fábrica'));
        expect(onReset).toHaveBeenCalledTimes(1);
        sheetState.user = null;
    });

    it('scrolls to the requested section when opened with initialSection', async () => {
        const scrollIntoView = vi.fn();
        (window.HTMLElement.prototype as any).scrollIntoView = scrollIntoView;
        try {
            sheetState.user = { email: 'a@b.c', displayName: 'Tester' };
            renderSheet({ initialSection: 'danger' });

            await waitFor(() => expect(scrollIntoView).toHaveBeenCalled());
            const danger = document.querySelector('#profile-section-danger');
            expect(danger).not.toBeNull();
            expect(scrollIntoView.mock.instances[0]).toBe(danger);
        } finally {
            delete (window.HTMLElement.prototype as any).scrollIntoView;
            sheetState.user = null;
        }
    });
});
