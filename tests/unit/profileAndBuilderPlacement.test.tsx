import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgramEditView } from '../../views/ProgramEditView';
import { ProgramEditDays } from '../../views/programEdit/ProgramEditDays';
import { AccountSection } from '../../components/profile/sections/AccountSection';
import { TrainingSection } from '../../components/profile/sections/TrainingSection';
import { AppearanceSection } from '../../components/profile/sections/AppearanceSection';
import { DataSection } from '../../components/profile/sections/DataSection';
import { AdvancedSection } from '../../components/profile/sections/AdvancedSection';

// Mock audio
vi.mock('../../utils/audio', () => ({
    triggerHaptic: vi.fn(),
    getExactAlarmState: vi.fn().mockResolvedValue('granted'),
}));

// Mock Capacitor
vi.mock('@capacitor/core', () => ({
    Capacitor: {
        isNativePlatform: () => false,
        getPlatform: () => 'web',
    },
    registerPlugin: vi.fn(),
}));

// Mock timers / reminders
vi.mock('../../hooks/useTimer', () => ({
    requestTimerNotificationPermission: vi.fn(),
}));

vi.mock('../../utils/reminders', () => ({
    loadReminderConfig: () => ({ enabled: false, days: [1, 2, 3, 4, 5], hour: 18, minute: 0 }),
    saveReminderConfig: vi.fn(),
    syncReminderSchedule: vi.fn(),
}));

// Mock sub-dialogs/cards to keep tests focused on layout & placement
vi.mock('../../components/profile/DriveBackupCard', () => ({
    DriveBackupCard: () => <div data-testid="mock-drive-backup-card" />,
}));
vi.mock('../../components/profile/AutoBackupList', () => ({
    AutoBackupList: () => <div data-testid="mock-auto-backup-list" />,
}));
vi.mock('../../components/profile/CsvImportSheet', () => ({
    CsvImportSheet: () => <div data-testid="mock-csv-import-sheet" />,
}));
vi.mock('../../components/profile/DeleteAccountDialog', () => ({
    DeleteAccountDialog: () => <div data-testid="mock-delete-account-dialog" />,
}));
vi.mock('../../components/ui/PhilosophyModal', () => ({
    PhilosophyModal: () => <div data-testid="mock-philosophy-modal" />,
}));
vi.mock('../../components/profile/ErrorLogCard', () => ({
    ErrorLogCard: () => <div data-testid="mock-error-log-card" />,
}));
vi.mock('../../components/settings/AdminControlPanel', () => ({
    AdminControlPanel: () => <div data-testid="mock-admin-control-panel" />,
}));
vi.mock('../../components/admin/AdminTemplateManager', () => ({
    AdminTemplateManager: () => <div data-testid="mock-admin-template-manager" />,
}));
vi.mock('../../components/profile/StoragePersistRow', () => ({
    StoragePersistRow: () => <div data-testid="mock-storage-persist-row" />,
}));
vi.mock('../../components/profile/ExactAlarmRow', () => ({
    ExactAlarmRow: () => <div data-testid="mock-exact-alarm-row" />,
}));

const mockAppState = {
    lang: 'es' as 'es' | 'en',
    setLang: vi.fn(),
    theme: 'dark' as 'dark' | 'light' | 'system',
    setTheme: vi.fn(),
    colorTheme: 'iron',
    setColorTheme: vi.fn(),
    effectsMode: 'system',
    setEffectsMode: vi.fn(),
    resolvedEffects: 'balanced',
    exercises: [
        { id: 'bench-press', name: { es: 'Press de Banca', en: 'Bench Press' }, muscle: 'CHEST' },
        { id: 'pull-up', name: { es: 'Dominadas', en: 'Pull-up' }, muscle: 'BACK' },
    ],
    program: [
        {
            id: 'day-1',
            dayName: { es: 'Día 1: Empuje', en: 'Day 1: Push' },
            slots: [
                { id: 's1', muscle: 'CHEST', exerciseId: 'bench-press', setTarget: 3, reps: '8-12' },
                { id: 's2', muscle: 'BACK', exerciseId: 'pull-up', setTarget: 4, reps: '10' },
            ],
        },
    ],
    setProgram: vi.fn(),
    logs: [
        { id: 'log-1', startTime: Date.now() - 1000 * 60 * 60, endTime: Date.now() },
        { id: 'log-2', startTime: Date.now() - 1000 * 60 * 60 * 48, endTime: Date.now() - 1000 * 60 * 60 * 47 },
    ],
    config: { showRIR: false, keepScreenOn: false },
    setConfig: vi.fn(),
    deferredPrompt: null,
    installApp: vi.fn(),
    isStandalone: true,
    personalTemplates: [],
    setPersonalTemplates: vi.fn(),
    pendingCloudSections: [],
    userProfile: {},
    nutritionLogs: [],
    cardioSessions: [],
    bodyLogs: [],
    macroGoals: null,
    nutritionGoal: null,
    customFoods: [],
    rpFeedback: null,
};

vi.mock('../../context/AppContext', () => ({
    useApp: () => mockAppState,
    useAppPreferences: () => ({ lang: mockAppState.lang, setLang: mockAppState.setLang }),
    useSyncMeta: () => ({ localLastUpdated: null, localSectionSyncMeta: {} }),
    useSyncStatus: () => ({ isOnline: true, syncStatus: { pending: 0, isSyncing: false, lastSyncedAt: null } }),
}));

let mockUser: any = {
    uid: 'user-123',
    email: 'lifter@example.com',
    displayName: 'Iron Lifter',
};

vi.mock('../../context/AuthContext', () => ({
    useAuth: () => ({
        user: mockUser,
        logout: vi.fn(),
        deleteAccount: vi.fn(),
        isAdmin: false,
    }),
}));

vi.mock('../../hooks/usePro', () => ({
    usePro: () => ({
        isPro: true,
        tier: 'annual',
        expiryDate: Date.now() + 1000 * 60 * 60 * 24 * 30,
        checkPro: () => true,
        showPaywall: false,
        setShowPaywall: vi.fn(),
        featureAttempted: '',
    }),
}));

let mockActiveMeso: any = {
    id: 'meso-1',
    name: 'Mesociclo 1',
    week: 2,
    targetWeeks: 6,
    duration: 6,
    mesoType: 'hyp_1',
};

vi.mock('../../lib/store', () => ({
    useStore: (selector: any) => selector({
        activeMeso: mockActiveMeso,
        setActiveMeso: vi.fn(),
    }),
}));

describe('UI Placement and Spatial Hierarchy Verification', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockAppState.lang = 'es';
        mockAppState.theme = 'dark';
        mockUser = {
            uid: 'user-123',
            email: 'lifter@example.com',
            displayName: 'Iron Lifter',
        };
        mockActiveMeso = {
            id: 'meso-1',
            name: 'Mesociclo 1',
            week: 2,
            targetWeeks: 6,
            duration: 6,
            mesoType: 'hyp_1',
        };
    });

    describe('1. ProgramEditView & ProgramEditDays', () => {
        it('renders summary badge instead of duplicate top Start button or duplicate close button in new routine mode', () => {
            // When activeMeso is null -> new routine mode
            mockActiveMeso = null;

            render(<ProgramEditView onBack={vi.fn()} />);

            // Check contextual summary badge
            const badge = screen.getByTestId('program-edit-summary-badge');
            expect(badge).toBeInTheDocument();
            // 1 day · 7 sets (3 + 4)
            expect(badge.textContent).toMatch(/1 día · 7 series/);

            // Redundant top start button should NOT be in the header
            expect(screen.queryByRole('button', { name: /empezar/i })).toBeNull();

            // Redundant close [X] button should NOT exist (only Back chevron on left)
            expect(screen.queryByRole('button', { name: /close|cerrar/i })).toBeNull();
        });

        it('renders slot indices, inline dashed add button, and no floating FAB', () => {
            mockActiveMeso = null;

            const { container } = render(<ProgramEditView onBack={vi.fn()} />);

            // Numeric slot index badges
            const slotIndex0 = screen.getByTestId('slot-index-0');
            const slotIndex1 = screen.getByTestId('slot-index-1');
            expect(slotIndex0.textContent).toBe('1');
            expect(slotIndex1.textContent).toBe('2');

            // Inline dashed Add Exercise button
            const inlineAddBtn = screen.getByTestId('add-slot-inline-btn');
            expect(inlineAddBtn).toBeInTheDocument();
            expect(inlineAddBtn.className).toContain('border-dashed');

            // Ensure no floating FAB button exists
            const floatingBtn = container.querySelector('.fixed.right-5.bottom-24');
            expect(floatingBtn).toBeNull();
        });
    });

    describe('2. AccountSection (Unified cohesive card)', () => {
        it('renders user info, action button, and stats inside a single cohesive card', () => {
            render(<AccountSection onClose={vi.fn()} onLogin={vi.fn()} />);

            const unifiedCard = screen.getByTestId('account-unified-card');
            expect(unifiedCard).toBeInTheDocument();

            // Inside the unified card: user info
            expect(unifiedCard.textContent).toContain('Iron Lifter');
            expect(unifiedCard.textContent).toContain('lifter@example.com');

            // Action button (logout)
            expect(screen.getByRole('button', { name: /cerrar sesión/i })).toBeInTheDocument();

            // 2 session stats
            expect(unifiedCard.textContent).toContain('2'); // Total sessions
        });
    });

    describe('3. TrainingSection (Integrated Save Template row)', () => {
        it('renders save template row inside the main training card instead of a detached card', () => {
            const { container } = render(
                <TrainingSection
                    onClose={vi.fn()}
                    onOpenProgram={vi.fn()}
                    onOpenExercises={vi.fn()}
                />
            );

            const saveTemplateRow = screen.getByTestId('training-save-template-row');
            expect(saveTemplateRow).toBeInTheDocument();

            // The row should be inside a .card-reference element
            const parentCard = saveTemplateRow.closest('.card-reference');
            expect(parentCard).not.toBeNull();

            // No detached .premium-theme-panel button
            const detachedBtn = container.querySelector('button.premium-theme-panel');
            expect(detachedBtn).toBeNull();
        });
    });

    describe('4. AppearanceSection (No stacked headers, unified card & aria-pressed language)', () => {
        it('renders a single label-reference at the top and sets aria-pressed on the active language', () => {
            mockAppState.lang = 'es';
            const { container } = render(<AppearanceSection />);

            // Check that profile-section-appearance does not have consecutive .label-reference headers
            const section = container.querySelector('#profile-section-appearance');
            expect(section).not.toBeNull();

            const labels = section!.querySelectorAll(':scope > .label-reference');
            expect(labels.length).toBe(1);
            expect(labels[0].textContent).toBe('Apariencia');

            // Language segmented buttons
            const esBtn = screen.getByRole('button', { name: 'Español' });
            const enBtn = screen.getByRole('button', { name: 'English' });

            expect(esBtn).toHaveAttribute('aria-pressed', 'true');
            expect(enBtn).toHaveAttribute('aria-pressed', 'false');
        });
    });

    describe('5. DataSection & AdvancedSection', () => {
        it('DataSection export/import buttons have border-border-subtle', () => {
            const { container } = render(
                <DataSection
                    onExport={vi.fn()}
                    onImportFile={vi.fn()}
                    onForceSync={vi.fn()}
                    isSyncing={false}
                    syncStatusText="synced"
                />
            );

            const exportBtn = screen.getByRole('button', { name: /exportar datos/i });
            expect(exportBtn.className).toContain('border');
            expect(exportBtn.className).toContain('border-border-subtle');
        });

        it('AdvancedSection philosophy button uses bg-surface-raised and not bg-zinc-100', () => {
            const { container } = render(<AdvancedSection syncStatusText="synced" />);

            // Check diagnostics label does not have .label-reference inside card
            const diagLabel = container.querySelector('.card-reference .label-reference');
            expect(diagLabel).toBeNull();

            // Find philosophy button
            const philosophyBtn = container.querySelector('#profile-section-advanced button:has(svg)');
            expect(philosophyBtn).not.toBeNull();
            expect(philosophyBtn!.className).toContain('bg-surface-raised');
            expect(philosophyBtn!.className).not.toContain('bg-zinc-100');
        });
    });
});
