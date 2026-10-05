// S4: web timer reliability caveat (mocks copied from unifiedSheet.test.tsx).
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Capacitor } from '@capacitor/core';
import { TRANSLATIONS } from '../../constants/translations';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const { sheetState } = vi.hoisted(() => ({
    sheetState: {
        user: null as null | { email: string; displayName: string },
        pro: false,
        isAdmin: false,
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
    useAuth: () => ({ user: sheetState.user, logout: vi.fn(), deleteAccount: vi.fn(), isAdmin: sheetState.isAdmin }),
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

// S4: the PWA tells the truth about rest alerts with the screen off.
describe('S4: web timer caveat in Perfil → Entrenamiento', () => {
    const original = (globalThis as any).Notification;
    beforeEach(() => {
        (globalThis as any).Notification = { permission: 'default', requestPermission: vi.fn() };
    });
    afterEach(() => {
        vi.restoreAllMocks();
        if (original === undefined) delete (globalThis as any).Notification;
        else (globalThis as any).Notification = original;
    });

    it('shows the caveat on web next to the rest-notification toggle', async () => {
        renderSheet();
        expect(await screen.findByTestId('web-timer-caveat')).toHaveTextContent(TRANSLATIONS.es.notifWebCaveat);
    });

    it('hides it in the native app (AlarmManager owns the alert)', async () => {
        vi.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(true);
        vi.spyOn(Capacitor, 'getPlatform').mockReturnValue('ios');
        renderSheet();
        await screen.findByText(TRANSLATIONS.es.restNotifications);
        expect(screen.queryByTestId('web-timer-caveat')).toBeNull();
    });
});
