import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const { authState } = vi.hoisted(() => ({
    authState: { user: null as null | { email: string; displayName: string } },
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
        userProfile: {},
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
    useAuth: () => ({ user: authState.user, logout: vi.fn(), deleteAccount: vi.fn() }),
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
    useStore: (selector: any) => selector({ activeMeso: null }),
}));

import { ProfileSheet } from '../../components/profile/ProfileSheet';

const sheetActions = {
    onOpenProgram: vi.fn(),
    onOpenExercises: vi.fn(),
    onReset: vi.fn(),
    onExport: vi.fn(),
    onForceSync: vi.fn(),
    onImportFile: vi.fn(),
    onLogin: vi.fn(),
    isSyncing: false,
};

describe('N3: ProfileSheet account section', () => {
    it('guests never see the delete-account row', () => {
        authState.user = null;
        render(<ProfileSheet open={true} onClose={vi.fn()} {...sheetActions} />);

        expect(screen.queryByText('Eliminar cuenta')).toBeNull();
        expect(screen.getByText('Iniciar sesión / registro')).toBeDefined();
    });

    it('signed-in users see the row and it opens the deletion dialog', () => {
        authState.user = { email: 'a@b.c', displayName: 'Tester' };
        render(<ProfileSheet open={true} onClose={vi.fn()} {...sheetActions} />);

        fireEvent.click(screen.getByText('Eliminar cuenta'));

        expect(screen.getByRole('alertdialog')).toBeDefined();
        expect(screen.getByLabelText(/contraseña/i)).toBeDefined();
        expect(screen.getByLabelText(/escribí eliminar/i)).toBeDefined();
        authState.user = null;
    });
});
