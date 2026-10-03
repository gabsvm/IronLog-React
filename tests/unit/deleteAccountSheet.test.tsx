import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const { authState } = vi.hoisted(() => ({
    authState: { user: null as null | { email: string; displayName: string } },
}));

vi.mock('../../context/AppContext', () => ({
    useApp: () => ({
        userProfile: {},
        setUserProfile: vi.fn(),
        logs: [],
        config: { showRIR: false, keepScreenOn: false },
        setConfig: vi.fn(),
        theme: 'dark',
        colorTheme: 'emerald',
    }),
    useAppPreferences: () => ({ lang: 'es', setLang: vi.fn() }),
    useSyncStatus: () => ({ isOnline: true, syncStatus: { pending: 0, isSyncing: false, lastSyncedAt: null } }),
}));

vi.mock('../../context/AuthContext', () => ({
    useAuth: () => ({ user: authState.user, logout: vi.fn(), deleteAccount: vi.fn() }),
}));

vi.mock('../../hooks/usePro', () => ({
    usePro: () => ({ isPro: false, tier: null }),
}));

vi.mock('../../lib/store', () => ({
    useStore: (selector: any) => selector({ activeMeso: null }),
}));

import { ProfileSheet } from '../../components/profile/ProfileSheet';

describe('N3: ProfileSheet account section', () => {
    it('guests never see the delete-account row', () => {
        authState.user = null;
        render(<ProfileSheet open={true} onClose={vi.fn()} onOpenSettings={vi.fn()} />);

        expect(screen.queryByText('Eliminar cuenta')).toBeNull();
        expect(screen.queryByText('Cuenta')).toBeNull();
    });

    it('signed-in users see the row and it opens the deletion dialog', () => {
        authState.user = { email: 'a@b.c', displayName: 'Tester' };
        render(<ProfileSheet open={true} onClose={vi.fn()} onOpenSettings={vi.fn()} />);

        fireEvent.click(screen.getByText('Eliminar cuenta'));

        expect(screen.getByRole('alertdialog')).toBeDefined();
        expect(screen.getByLabelText(/contraseña/i)).toBeDefined();
        expect(screen.getByLabelText(/escribí eliminar/i)).toBeDefined();
        authState.user = null;
    });
});
