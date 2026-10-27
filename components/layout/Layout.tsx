import React from 'react';
import { useApp, useAppPreferences, useSyncStatus } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../lib/store';
import { TRANSLATIONS } from '../../constants';
import { KONG_4DAY_ID } from '../../programs/kong/constants';
import { convertKongToPersonalRoutine } from '../../programs/engine/ProgramConversion';
import { Icon } from '../ui/Icon';
import { Logo } from '../ui/Logo';
import { Avatar } from '../ui/Avatar';
import { pickLang } from '../../utils/i18n';
import { scheduleWhenIdle } from '../../lib/idle';
import { runAfterProfileClosed } from '../../utils/profileNav';
import {
    resolveAppView,
    isValidDiarySection,
    QUICK_START_EVENT,
    STRONG_NAV_ITEMS,
    STRONG_MEASURE_EVENT,
    STRONG_PROFILE_EVENT,
    strongActiveId,
    strongLabel,
    setPendingMeasureDetail,
    type AppView,
    type DiarySection,
    type StrongRootId,
    type OpenMeasureDetail,
} from './navigation';

const ProfileSheet = React.lazy(() => import('../profile/ProfileSheet').then(m => ({ default: m.ProfileSheet })));
import type { ProfileSection } from '../profile/ProfileSheet';
const ProfileDashboard = React.lazy(() => import('../profile/ProfileDashboard').then(m => ({ default: m.ProfileDashboard })));
const QuickStartSheet = React.lazy(() => import('../home/QuickStartSheet').then(m => ({ default: m.QuickStartSheet })));
const FreestyleSessionModal = React.lazy(() => import('../workout/FreestyleSessionModal').then(m => ({ default: m.FreestyleSessionModal })));
const ConfirmModal = React.lazy(() => import('../ui/ConfirmModal').then(m => ({ default: m.ConfirmModal })));
const Sidebar = React.lazy(() => import('./Sidebar').then(m => ({ default: m.Sidebar })));


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
    icon: string;
    isActive: boolean;
    onSelect: (id: string) => void;
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
    const activeMeso = useStore(state => state.activeMeso);
    const hasActiveSession = useStore(state => Boolean(state.activeSession));
    const activeSessionDayIdx = useStore(state => state.activeSession?.dayIdx);
    const setActiveSession = useStore(state => state.setActiveSession);
    const t = TRANSLATIONS[lang];
    const [showProfile, setShowProfile] = React.useState(() => Boolean(window.history.state?.profile));
    const [profileSection, setProfileSection] = React.useState<ProfileSection | null>(() => window.history.state?.profileSection ?? null);
    const ly = t.layoutKeys;
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
    /** Strong Profile destination renders as a Layout overlay (no AppView change). */
    const [showStrongProfile, setShowStrongProfile] = React.useState(() => Boolean(window.history.state?.strongProfile));
    const hasOpenedProfileRef = React.useRef(false);
    const hasOpenedQuickStartRef = React.useRef(false);
    const panelFocusRef = React.useRef<HTMLDivElement>(null);
    /** Control that opened the panel (avatar or Profile tab): focus returns here on close. */
    const openerRef = React.useRef<HTMLElement | null>(null);

    if (showProfile) hasOpenedProfileRef.current = true;
    if (showQuickStart) hasOpenedQuickStartRef.current = true;

    React.useEffect(() => {
        const cancel = scheduleWhenIdle(() => {
            void import('../profile/ProfileSheet');
            void import('../profile/ProfileDashboard');
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
            // The Strong panel owns its own entry (strongProfile): Back
            // closes it via this sync without touching the underlying view.
            setShowStrongProfile(Boolean(detail?.strongProfile));
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

    /** Drops a stale strongProfile flag from the current entry (sync path
     * for programmatic closes: a setView follows and rewrites history). */
    const stripStrongEntry = React.useCallback(() => {
        try {
            const state = window.history.state;
            if (state?.strongProfile) {
                window.history.replaceState({ ...state, strongProfile: false }, '');
            }
        } catch { }
    }, []);

    const openStrongProfile = React.useCallback(() => {
        openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        if (!showStrongProfile) {
            try {
                // Exactly ONE entry per panel open: Back closes the panel
                // without changing the underlying view.
                window.history.pushState({ ...(window.history.state || {}), view, strongProfile: true }, '', '#strong-profile');
            } catch { }
            setShowStrongProfile(true);
        }
    }, [showStrongProfile, view]);

    /** User-initiated close (X): history owns the panel, go back to it. */
    const closeStrongProfile = React.useCallback(() => {
        try {
            if (window.history.state?.strongProfile) {
                window.history.back();
                return;
            }
        } catch { }
        setShowStrongProfile(false);
    }, []);

    /** Programmatic close (a setView follows): strip the flag synchronously. */
    const dismissStrongProfile = React.useCallback(() => {
        stripStrongEntry();
        setShowStrongProfile(false);
    }, [stripStrongEntry]);

    // Strong Measure destination is a real route ('measure' AppView, owned by
    // MeasurementsParity). The event detail travels via the shared
    // pending-detail store; MeasureView consumes it on mount. A mounted
    // MeasurementsSection may preventDefault to handle the event itself
    // (open the form in place); the microtask keeps listener order
    // irrelevant.
    const routeToMeasure = React.useCallback((detail: OpenMeasureDetail | null) => {
        setPendingMeasureDetail(detail);
        dismissStrongProfile();
        setView('measure');
    }, [setView, dismissStrongProfile]);

    React.useEffect(() => {
        const handleMeasure = (event: Event) => {
            const ev = event as CustomEvent<OpenMeasureDetail | null>;
            queueMicrotask(() => {
                if (ev.defaultPrevented) return;
                routeToMeasure(ev.detail ?? null);
            });
        };
        window.addEventListener(STRONG_MEASURE_EVENT, handleMeasure);
        return () => window.removeEventListener(STRONG_MEASURE_EVENT, handleMeasure);
    }, [routeToMeasure]);

    React.useEffect(() => {
        window.addEventListener(STRONG_PROFILE_EVENT, openStrongProfile);
        return () => window.removeEventListener(STRONG_PROFILE_EVENT, openStrongProfile);
    }, [openStrongProfile]);

    // The workout renderer owns the screen: the Strong profile panel never covers it.
    React.useEffect(() => {
        if (view === 'workout') {
            dismissStrongProfile();
        }
    }, [view, dismissStrongProfile]);

    // Move focus into the panel on open; restore it to the opener on close.
    // The opener (avatar/tab) stays mounted, so Tab resumes where it left.
    React.useEffect(() => {
        if (showStrongProfile) {
            panelFocusRef.current?.focus({ preventScroll: true });
            return;
        }
        const opener = openerRef.current;
        openerRef.current = null;
        if (opener && document.contains(opener)) {
            opener.focus({ preventScroll: true });
        }
    }, [showStrongProfile]);

    const handleStrongSelect = React.useCallback((id: StrongRootId) => {
        switch (id) {
            case 'profile':
                openStrongProfile();
                return;
            // The Measure TAB always takes the real route: no event is
            // dispatched, so a mounted MeasurementsSection (BodyTab) can
            // never intercept it. Detail-carrying CTAs still go through
            // STRONG_MEASURE_EVENT and its preventDefault protocol.
            case 'measure':
                routeToMeasure(null);
                return;
            case 'history':
                dismissStrongProfile();
                if (view !== 'diary' || diarySection !== 'sessions') {
                    onDiarySection?.('sessions');
                    setView('diary');
                }
                return;
            case 'workout':
                dismissStrongProfile();
                if (hasActiveSession) {
                    setView('workout');
                } else {
                    setShowQuickStart(true);
                }
                return;
            case 'exercises':
                dismissStrongProfile();
                setView('exercises');
                return;
        }
    }, [view, diarySection, hasActiveSession, onDiarySection, setView, routeToMeasure, openStrongProfile, dismissStrongProfile]);

    const handleLegacyNavigate = React.useCallback((target: AppView, section?: DiarySection) => {
        dismissStrongProfile();
        if (target === 'diary' && section) {
            onDiarySection?.(section);
        }
        setView(target);
    }, [onDiarySection, setView, dismissStrongProfile]);

    React.useEffect(() => {
        const handleNavigate = (event: Event) => {
            const detail = (event as CustomEvent<{ view?: string; section?: string }>).detail;
            const resolved = resolveAppView(detail?.view);
            if (!resolved) return;
            if (resolved === 'diary' && isValidDiarySection(detail?.section)) {
                onDiarySection?.(detail.section as DiarySection);
            }
            dismissStrongProfile();
            setView(resolved);
        };
        window.addEventListener('gainslab:navigate', handleNavigate);
        return () => window.removeEventListener('gainslab:navigate', handleNavigate);
    }, [setView, onDiarySection, dismissStrongProfile]);

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

    const strongActive = strongActiveId({
        view,
        diarySection,
        strongProfileOpen: showStrongProfile,
        measureOpen: false,
    });
    const isVirtualized = !showStrongProfile && view === 'diary' && diarySection === 'sessions';
    const showStrongChrome = view !== 'workout';

    const editProgram = () => {
        setShowQuickStart(false);
        onOpenProgram();
    };

    const startDetached = (session: Parameters<typeof setActiveSession>[0]) => {
        setActiveSession(session);
        setShowFreestyle(false);
        setView('workout');
    };

    const strongPanelTitle = pickLang(lang, { es: 'Perfil', en: 'Profile' });


    return (
        <div className="strong-shell flex h-full w-full overflow-hidden bg-[rgb(var(--surface-app))] font-sans text-[rgb(var(--text-primary))]" data-strong-nav="true">
            {/* Desktop sidebar (own lazy chunk) XOR mobile chrome: a single nav landmark in the DOM. */}
            {showStrongChrome && isDesktop && (
                <React.Suspense fallback={null}>
                    <Sidebar
                        view={view}
                        diarySection={diarySection}
                        strongActive={strongActive}
                        onSelectStrong={handleStrongSelect}
                        onNavigateLegacy={handleLegacyNavigate}
                        onOpenCommandPalette={onOpenCommandPalette}
                    />
                </React.Suspense>
            )}

            <div className="flex min-w-0 flex-1 flex-col">
            {showStrongChrome && !isDesktop && (
                <div className="app-topbar strong-topbar pointer-events-none absolute left-0 right-0 top-0 z-20 px-6 pb-2 pt-safe">
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
                            <Avatar email={user?.email} photoURL={(user as { photoURL?: string | null } | null | undefined)?.photoURL} onClick={() => handleStrongSelect('profile')} ariaLabel={t.openProfile} />
                        </div>
                    </div>
                </div>
            )}

            <div className={`relative flex-1 ${isVirtualized ? 'overflow-hidden' : 'overflow-y-auto scroll-container'} ${showStrongChrome ? 'pt-[calc(var(--safe-area-top)+60px)] pb-36 lg:pt-[calc(var(--safe-area-top)+24px)] lg:pb-10' : 'pt-safe pb-0'}`}>
                {/* U4: centered column on wide screens (phones are narrower than max-w-2xl). */}
                {/* The Strong panel superimposes instead of replacing children:
                    the underlying view (and its scroll/state) stays mounted. */}
                <div className={`mx-auto w-full max-w-2xl lg:max-w-5xl ${isVirtualized ? 'h-full' : ''}`}>{children}</div>
                {showStrongProfile && (
                    <div
                        ref={panelFocusRef}
                        tabIndex={-1}
                        role="region"
                        aria-label={strongPanelTitle}
                        className="absolute inset-0 z-10 overflow-y-auto scroll-container bg-[rgb(var(--surface-app))] pt-[calc(var(--safe-area-top)+60px)] outline-none lg:pt-[calc(var(--safe-area-top)+24px)]"
                    data-testid="strong-profile-panel"
                    >
                        <React.Suspense fallback={<SheetFallback />}>
                            <ProfileDashboard
                                onClose={closeStrongProfile}
                                onOpenProfileSection={(section) => openProfile(section ?? null)}
                                onOpenMeasure={() => handleStrongSelect('measure')}
                            />
                        </React.Suspense>
                    </div>
                )}
            </div>

            {showStrongChrome && !isDesktop && (
                <nav aria-label="Main navigation" className="strong-tabbar fixed bottom-0 left-0 right-0 z-30 pb-safe">
                    <div className="mx-auto grid h-[68px] w-full max-w-lg grid-cols-5 items-stretch px-2">
                        {STRONG_NAV_ITEMS.map((item) => {
                            const isActive = strongActive === item.id;
                            if (item.isFab) {
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => handleStrongSelect(item.id)}
                                        aria-current={isActive ? 'page' : undefined}
                                        aria-label={strongLabel(item, lang)}
                                        className="flex min-w-0 flex-col items-center justify-start gap-1 pt-1"
                                    >
                                        <span className={`strong-fab ${hasActiveSession ? 'is-live' : ''}`}>
                                            <Icon name={hasActiveSession ? 'Play' : item.icon} size={24} strokeWidth={2.5} />
                                        </span>
                                        <span className={`strong-tab-label text-[11px] font-bold leading-none ${isActive ? 'text-[rgb(var(--strong-action-soft))]' : 'text-muted'}`}>
                                            {strongLabel(item, lang)}
                                        </span>
                                    </button>
                                );
                            }
                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => handleStrongSelect(item.id)}
                                    aria-current={isActive ? 'page' : undefined}
                                    className="strong-tab min-w-0"
                                >
                                    <span className="strong-tab-pill">
                                        <Icon name={item.icon} size={21} strokeWidth={isActive ? 2.5 : 2} />
                                    </span>
                                    <span className="strong-tab-label">{strongLabel(item, lang)}</span>
                                </button>
                            );
                        })}
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
        </div>
    );
};
