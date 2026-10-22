import React from 'react';
import { useApp, useAppPreferences, useSyncStatus } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { usePro } from '../../hooks/usePro';
import { useStore } from '../../lib/store';
import { TRANSLATIONS } from '../../constants';
import { KONG_4DAY_ID } from '../../programs/kong/constants';
import { convertKongToPersonalRoutine } from '../../programs/engine/ProgramConversion';
import { Icon } from '../ui/Icon';
import { Logo } from '../ui/Logo';
import { Avatar } from '../ui/Avatar';
import { scheduleWhenIdle } from '../../lib/idle';
import { runAfterProfileClosed } from '../../utils/profileNav';
import { resolveAppView, isValidDiarySection, QUICK_START_EVENT, ROOT_NAV_ITEMS, type AppView, type DiarySection } from './navigation';

const ProfileSheet = React.lazy(() => import('../profile/ProfileSheet').then(m => ({ default: m.ProfileSheet })));
import type { ProfileSection } from '../profile/ProfileSheet';
const QuickStartSheet = React.lazy(() => import('../home/QuickStartSheet').then(m => ({ default: m.QuickStartSheet })));
const FreestyleSessionModal = React.lazy(() => import('../workout/FreestyleSessionModal').then(m => ({ default: m.FreestyleSessionModal })));
const ConfirmModal = React.lazy(() => import('../ui/ConfirmModal').then(m => ({ default: m.ConfirmModal })));
const Sidebar = React.lazy(() => import('./Sidebar').then(m => ({ default: m.Sidebar })));

interface KongConvertConfirmModalProps {
    isOpen: boolean;
    lang: 'es' | 'en';
    cancelText: string;
    onClose: () => void;
    onConverted: () => void;
}

const KongConvertConfirmModal: React.FC<KongConvertConfirmModalProps> = ({
    isOpen,
    lang,
    cancelText,
    onClose,
    onConverted,
}) => {
    const { setProgram } = useApp();
    const activeMeso = useStore(state => state.activeMeso);
    const setActiveMeso = useStore(state => state.setActiveMeso);
    const t = TRANSLATIONS[lang];
    const ly = t.layoutKeys;

    const handleConfirm = () => {
        if (!activeMeso) return;
        const { editableProgram, convertedMeso } = convertKongToPersonalRoutine(activeMeso, lang);
        setProgram(editableProgram);
        setActiveMeso(convertedMeso);
        onConverted();
    };

    return (
        <React.Suspense fallback={<SheetFallback />}>
            <ConfirmModal
                isOpen={isOpen}
                title={t.convertKongTitle}
                description={ly.convertDesc}
                confirmText={t.convertKongConfirm}
                cancelText={cancelText}
                onConfirm={handleConfirm}
                onCancel={onClose}
            />
        </React.Suspense>
    );
};

/** Visible while a lazy sheet chunk loads (slow 4G) so the trigger never looks dead. */
const SheetFallback: React.FC = () => (
    <div role="status" aria-live="polite" className="fixed inset-x-0 bottom-0 z-sheet flex justify-center pb-safe pointer-events-none">
        <div className="mb-6 flex items-center gap-2 rounded-full bg-surface-raised px-4 py-2.5 text-xs font-semibold text-muted shadow-xl">
            <Icon name="Loader" size={16} className="animate-spin" />
        </div>
    </div>
);
export interface NavBtnProps {
    id: string;
    label: string;
    icon: any;
    isActive: boolean;
    onSelect: (id: any) => void;
}

export const NavBtn: React.FC<NavBtnProps> = React.memo(({ id, label, icon, isActive, onSelect }) => {
    return (
        <button
            onClick={() => onSelect(id)}
            aria-current={isActive ? 'page' : undefined}
            type="button"
            className="group expressive-press relative flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl py-1"
        >
            <div className={`flex h-8 w-[min(100%,64px)] items-center justify-center rounded-full transition-[background-color,transform] duration-300 ease-natural ${isActive ? 'bg-primary-500/20 scale-[1.03]' : 'bg-transparent'}`}>
                <Icon name={icon} size={21} strokeWidth={isActive ? 2.5 : 2} fill={isActive ? 'currentColor' : 'none'} fillOpacity={isActive ? 0.22 : undefined} className={isActive ? 'text-[rgb(var(--accent-text))]' : 'text-muted group-hover:text-[rgb(var(--text-primary))]'} />
            </div>
            <span className={`min-w-0 max-w-full truncate text-[12px] font-semibold tracking-normal leading-tight transition-colors duration-300 ${isActive ? 'text-[rgb(var(--accent-text))]' : 'text-muted group-hover:text-[rgb(var(--text-primary))]'}`}>{label}</span>
        </button>
    );
});
NavBtn.displayName = 'NavBtn';

interface LayoutProps {
    children: React.ReactNode;
    view: AppView;
    setView: (v: AppView) => void;
    /** Which diary section is visible; drives the virtualized scroll container. */
    diarySection?: DiarySection;
    onDiarySection?: (section: DiarySection) => void;
    onOpenProgram: () => void;
    onOpenExercises: () => void;
    onReset: () => void;
    onExport: () => void;
    onForceSync: () => void;
    onImportFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onLogin: () => void;
    isSyncing: boolean;
    onOpenCommandPalette?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({
    children, view, setView, diarySection = 'sessions', onDiarySection,
    onOpenProgram, onOpenExercises, onReset, onExport, onForceSync, onImportFile, onLogin, isSyncing,
    onOpenCommandPalette,
}) => {
    const { lang } = useAppPreferences();
    const { isOnline, syncStatus } = useSyncStatus();
    const { user } = useAuth();
    const { isPro } = usePro();
    const activeMeso = useStore(state => state.activeMeso);
    const hasActiveSession = useStore(state => Boolean(state.activeSession));
    const activeSessionDayIdx = useStore(state => state.activeSession?.dayIdx);
    const setActiveSession = useStore(state => state.setActiveSession);
    const t = TRANSLATIONS[lang];
    const [showProfile, setShowProfile] = React.useState(() => Boolean(window.history.state?.profile));
    const [profileSection, setProfileSection] = React.useState<ProfileSection | null>(() => window.history.state?.profileSection ?? null);
    const ly = t.layoutKeys;
    const [showActiveSessionAlert, setShowActiveSessionAlert] = React.useState(false);
    const [showKongConvertConfirm, setShowKongConvertConfirm] = React.useState(false);
    // Single nav in the DOM: duplicate landmarks break strict selectors and
    // screen readers. Mobile-first; upgrades to the sidebar at lg.
    const [isDesktop, setIsDesktop] = React.useState(
        () => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(min-width: 1024px)').matches,
    );
    React.useEffect(() => {
        if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
        const query = window.matchMedia('(min-width: 1024px)');
        const onChange = (event: MediaQueryListEvent) => setIsDesktop(event.matches);
        query.addEventListener('change', onChange);
        return () => query.removeEventListener('change', onChange);
    }, []);
    const [showQuickStart, setShowQuickStart] = React.useState(false);
    const [showFreestyle, setShowFreestyle] = React.useState(false);
    const hasOpenedProfileRef = React.useRef(false);
    const hasOpenedQuickStartRef = React.useRef(false);

    if (showProfile) hasOpenedProfileRef.current = true;
    if (showQuickStart) hasOpenedQuickStartRef.current = true;

    React.useEffect(() => {
        const cancel = scheduleWhenIdle(() => {
            void import('../profile/ProfileSheet');
            void import('../home/QuickStartSheet');
        });
        return cancel;
    }, []);

    const isKong = activeMeso?.programSystem?.systemId === KONG_4DAY_ID || activeMeso?.programSystem?.systemId === 'kong_4day';

    React.useEffect(() => {
        document.documentElement.classList.toggle('kong-program-active', !!isKong);
        return () => document.documentElement.classList.remove('kong-program-active');
    }, [isKong]);

    React.useEffect(() => {
        const handlePop = (event: Event) => {
            const detail = (event as CustomEvent).detail;
            setProfileSection(detail?.profile ? (detail.profileSection ?? null) : null);
            setShowProfile(Boolean(detail?.profile));
        };
        window.addEventListener('ironlog:popstate', handlePop);
        return () => window.removeEventListener('ironlog:popstate', handlePop);
    }, []);

    const openProfile = React.useCallback((section?: ProfileSection | null) => {
        if (!showProfile) {
            try {
                // Snapshot current view and push exactly ONE entry per sheet open.
                window.history.pushState({ ...(window.history.state || {}), view, profile: true, profileSection: section ?? null }, '', '#profile');
            } catch { }
            setShowProfile(true);
        }
        setProfileSection(section ?? null);
    }, [showProfile, view]);

    // External entry points (e.g. back from the exercises library) open the
    // unified sheet, optionally scrolled to a section.
    React.useEffect(() => {
        const handleOpenProfile = (event: Event) => {
            const section = (event as CustomEvent<{ section?: ProfileSection }>).detail?.section;
            openProfile(section ?? null);
        };
        window.addEventListener('gainslab:open-profile', handleOpenProfile);
        return () => window.removeEventListener('gainslab:open-profile', handleOpenProfile);
    }, [openProfile]);

    React.useEffect(() => {
        const handleNavigate = (event: Event) => {
            const detail = (event as CustomEvent<{ view?: string; section?: string }>).detail;
            const resolved = resolveAppView(detail?.view);
            if (!resolved) return;
            if (resolved === 'diary' && isValidDiarySection(detail?.section)) {
                onDiarySection?.(detail.section as DiarySection);
            }
            setView(resolved);
        };
        window.addEventListener('gainslab:navigate', handleNavigate);
        return () => window.removeEventListener('gainslab:navigate', handleNavigate);
    }, [setView, onDiarySection]);

    // Freestyle/session entry from anywhere (Hoy/Rutina/sidebar) without a
    // floating action button: emitters dispatch QUICK_START_EVENT.
    React.useEffect(() => {
        const handleQuickStart = () => setShowQuickStart(true);
        window.addEventListener(QUICK_START_EVENT, handleQuickStart);
        return () => window.removeEventListener(QUICK_START_EVENT, handleQuickStart);
    }, []);

    const closeProfile = () => {
        try {
            if (window.history.state?.profile) {
                // History owns this sheet: go back and let the popstate handler
                // below close it, so forward/back stay consistent.
                window.history.back();
                return;
            }
        } catch { }
        setProfileSection(null);
        setShowProfile(false);
    };

    const isVirtualized = view === 'diary' && diarySection === 'sessions';

    const editProgram = () => {
        setShowQuickStart(false);

        if (useStore.getState().activeSession) {
            setShowActiveSessionAlert(true);
            return;
        }

        if (isKong && activeMeso) {
            setShowKongConvertConfirm(true);
            return;
        }

        setView('program');
    };

    const startDetached = (session: any) => {
        setActiveSession(session);
        setShowFreestyle(false);
        setView('workout');
    };



    return (
        <div className="flex h-full w-full overflow-hidden bg-[rgb(var(--surface-app))] font-sans text-[rgb(var(--text-primary))]">
            {/* Desktop sidebar (own lazy chunk) XOR mobile chrome: a single nav landmark in the DOM. */}
            {view !== 'workout' && isDesktop && (
                <React.Suspense fallback={null}>
                    <Sidebar
                        view={view}
                        onNavigate={setView}
                        onOpenProfile={() => openProfile()}
                        onOpenCommandPalette={onOpenCommandPalette}
                    />
                </React.Suspense>
            )}

            <div className="flex min-w-0 flex-1 flex-col">
            {view !== 'workout' && !isDesktop && (
                <div className="app-topbar pointer-events-none absolute left-0 right-0 top-0 z-20 bg-[rgb(var(--surface-app))] px-6 pb-2 pt-safe">
                    <div className="pointer-events-auto mx-auto flex h-14 w-full max-w-2xl items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Logo className="h-10 w-10" showText />
                            {(!isOnline || syncStatus.pending > 0 || syncStatus.isSyncing) && (
                                <div className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${!isOnline ? 'border-amber-500/25 bg-amber-500/10 text-amber-500' : syncStatus.isSyncing ? 'border-cyan-500/25 bg-cyan-500/10 text-cyan-500' : 'border-zinc-700/40 bg-zinc-900/10 text-muted dark:bg-zinc-900/85 dark:text-zinc-300'}`}>
                                    <span className={`h-1.5 w-1.5 rounded-full ${!isOnline ? 'bg-amber-400' : syncStatus.isSyncing ? 'bg-cyan-400' : 'bg-zinc-400'}`} />
                                    <span>{!isOnline ? 'offline' : syncStatus.isSyncing ? 'sync' : `${t.queue} ${syncStatus.pending}`}</span>
                                </div>
                            )}
                        </div>
                        <div id="tut-profile-btn">
                            <Avatar email={user?.email} photoURL={(user as any)?.photoURL} isPro={isPro} onClick={() => openProfile()} ariaLabel={t.openProfile} />
                        </div>
                    </div>
                </div>
            )}

            <div className={`relative flex-1 ${isVirtualized ? 'overflow-hidden' : 'overflow-y-auto scroll-container'} ${view !== 'workout' ? 'pt-[calc(var(--safe-area-top)+60px)] pb-32 lg:pt-[calc(var(--safe-area-top)+24px)] lg:pb-10' : 'pt-safe pb-0'}`}>
                {/* U4: centered column on wide screens (phones are narrower than max-w-2xl). */}
                <div className={`mx-auto w-full max-w-2xl lg:max-w-5xl ${isVirtualized ? 'h-full' : ''}`}>{children}</div>
            </div>

            {view !== 'workout' && !isDesktop && (
                <nav aria-label="Main navigation" className="fixed bottom-0 left-0 right-0 z-30 border-t border-[rgb(var(--border-subtle)/0.7)] bg-[rgb(var(--surface-base)/0.96)] pb-safe backdrop-blur-xl">
                    <div className="mx-auto grid h-16 w-full max-w-lg grid-cols-4 items-stretch px-2">
                        {ROOT_NAV_ITEMS.map((item) => (
                            <NavBtn key={item.id} id={item.id} label={t[item.labelKey]} icon={item.icon} isActive={view === item.id} onSelect={setView} />
                        ))}
                    </div>
                </nav>
            )}
            </div>

            {(showProfile || hasOpenedProfileRef.current) && (
                <React.Suspense fallback={<SheetFallback />}>
                    <ProfileSheet
                    open={showProfile}
                    onClose={closeProfile}
                    initialSection={profileSection}
                    onOpenProgram={() => runAfterProfileClosed(onOpenProgram)}
                    onOpenExercises={() => runAfterProfileClosed(onOpenExercises)}
                    onReset={() => runAfterProfileClosed(onReset)}
                    onExport={onExport}
                    onForceSync={onForceSync}
                    onImportFile={onImportFile}
                    onLogin={() => runAfterProfileClosed(onLogin)}
                    isSyncing={isSyncing}
                />
                </React.Suspense>
            )}
            {(showQuickStart || hasOpenedQuickStartRef.current) && (
                <React.Suspense fallback={<SheetFallback />}>
                    <QuickStartSheet
                        open={showQuickStart}
                        onClose={() => setShowQuickStart(false)}
                        lang={lang}
                        onResume={() => setView('workout')}
                        onToday={() => {
                            setShowQuickStart(false);
                            window.dispatchEvent(new CustomEvent('gainslab:start-scheduled'));
                        }}
                        onFreestyle={() => setShowFreestyle(true)}
                        onEditProgram={editProgram}
                    />
                </React.Suspense>
            )}

            {showFreestyle && (
                <React.Suspense fallback={<SheetFallback />}>
                    <FreestyleSessionModal isOpen={showFreestyle} onClose={() => setShowFreestyle(false)} onStart={startDetached} />
                </React.Suspense>
            )}

            {/* Active Session Warning Modal */}
            {showActiveSessionAlert && (
                <React.Suspense fallback={<SheetFallback />}>
                    <ConfirmModal
                        isOpen={true}
                        title={t.sessionInProgressTitle}
                        description={ly.sessionActiveDesc}
                        confirmText={t.understood}
                        cancelText=""
                        variant="primary"
                        onConfirm={() => setShowActiveSessionAlert(false)}
                        onCancel={() => setShowActiveSessionAlert(false)}
                    />
                </React.Suspense>
            )}

            {/* KONG Convert Confirmation Modal */}
            {showKongConvertConfirm && (
                <KongConvertConfirmModal
                    isOpen={true}
                    lang={lang}
                    cancelText={t.cancel}
                    onClose={() => setShowKongConvertConfirm(false)}
                    onConverted={() => {
                        setShowKongConvertConfirm(false);
                        setView('program');
                    }}
                />
            )}
        </div>
    );
};