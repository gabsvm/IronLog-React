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
import { pickLang } from '../../utils/i18n';

const ProfileSheet = React.lazy(() => import('../profile/ProfileSheet').then(m => ({ default: m.ProfileSheet })));
import type { ProfileSection } from '../profile/ProfileSheet';
const QuickStartSheet = React.lazy(() => import('../home/QuickStartSheet').then(m => ({ default: m.QuickStartSheet })));
const FreestyleSessionModal = React.lazy(() => import('../workout/FreestyleSessionModal').then(m => ({ default: m.FreestyleSessionModal })));
const ConfirmModal = React.lazy(() => import('../ui/ConfirmModal').then(m => ({ default: m.ConfirmModal })));

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
        <React.Suspense fallback={null}>
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

export interface NavBtnProps {
    id: any;
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
    view: string;
    setView: (v: any) => void;
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
    children, view, setView,
    onOpenProgram, onOpenExercises, onReset, onExport, onForceSync, onImportFile, onLogin, isSyncing,
}) => {
    const { lang } = useAppPreferences();
    const { isOnline, syncStatus } = useSyncStatus();
    const { user } = useAuth();
    const { isPro } = usePro();
    const activeMeso = useStore(state => state.activeMeso);
    const hasActiveSession = useStore(state => Boolean(state.activeSession));
    const setActiveSession = useStore(state => state.setActiveSession);
    const t = TRANSLATIONS[lang];
    const ly = t.layoutKeys;
    const [showProfile, setShowProfile] = React.useState(false);
    const [profileSection, setProfileSection] = React.useState<ProfileSection | null>(null);
    const [showQuickStart, setShowQuickStart] = React.useState(false);
    const [showFreestyle, setShowFreestyle] = React.useState(false);
    const [showActiveSessionAlert, setShowActiveSessionAlert] = React.useState(false);
    const [showKongConvertConfirm, setShowKongConvertConfirm] = React.useState(false);
    const [showMoreSheet, setShowMoreSheet] = React.useState(false);
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
            if (!detail?.profile) {
                setProfileSection(null);
                setShowProfile(false);
            }
        };
        window.addEventListener('ironlog:popstate', handlePop);
        return () => window.removeEventListener('ironlog:popstate', handlePop);
    }, []);

    const openProfile = React.useCallback((section?: ProfileSection | null) => {
        if (!showProfile) {
            try {
                window.history.pushState({ ...(window.history.state || {}), view, profile: true }, '', '#profile');
            } catch { }
            setShowProfile(true);
        }
        setProfileSection(section ?? null);
    }, [showProfile, view]);

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
            const target = (event as CustomEvent<{ view?: string }>).detail?.view;
            if (target === 'home' || target === 'workout' || target === 'mesos' || target === 'templates' || target === 'exercises' || target === 'history' || target === 'stats' || target === 'nutrition' || target === 'program') {
                setView(target);
            }
        };
        window.addEventListener('gainslab:navigate', handleNavigate);
        return () => window.removeEventListener('gainslab:navigate', handleNavigate);
    }, [setView]);

    const closeProfile = () => {
        try {
            if (window.history.state?.profile) {
                window.history.back();
                return;
            }
        } catch { }
        setProfileSection(null);
        setShowProfile(false);
    };

    const isVirtualized = view === 'history';

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
        <div className="flex h-full w-full flex-col overflow-hidden bg-[rgb(var(--surface-app))] font-sans text-[rgb(var(--text-primary))]">
            {view !== 'workout' && (
                <div className="app-topbar pointer-events-none absolute left-0 right-0 top-0 z-20 bg-[rgb(var(--surface-app))] px-6 pb-2 pt-safe">
                    <div className="pointer-events-auto mx-auto flex h-14 w-full max-w-2xl items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Logo size={28} showText />
                            {(!isOnline || syncStatus.pending > 0 || syncStatus.isSyncing) && (
                                <div className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${!isOnline ? 'border-amber-500/25 bg-amber-500/10 text-amber-500' : syncStatus.isSyncing ? 'border-cyan-500/25 bg-cyan-500/10 text-cyan-500' : 'border-zinc-700/40 bg-zinc-900/10 text-zinc-500 dark:bg-zinc-900/85 dark:text-zinc-300'}`}>
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

            <div className={`relative flex-1 ${isVirtualized || view === 'workout' ? 'overflow-hidden' : 'overflow-y-auto scroll-container'} ${view !== 'workout' ? 'pt-[calc(var(--safe-area-top)+60px)] pb-32' : 'pt-0 pb-0'}`}>
                {/* U4: centered column on wide screens (phones are narrower than max-w-2xl). */}
                <div className={`mx-auto w-full max-w-2xl ${isVirtualized ? 'h-full' : ''}`}>{children}</div>
            </div>

            <nav aria-label="Main navigation" className="fixed bottom-0 left-0 right-0 z-40 border-t border-border-subtle bg-surface-app/95 pb-safe backdrop-blur-md">
                <div className="mx-auto flex h-16 w-full max-w-lg items-center justify-between px-2">
                    <NavBtn
                        id="workout"
                        label={t.nav?.workout || pickLang(lang, { es: 'Entreno', en: 'Workout' })}
                        icon="Dumbbell"
                        isActive={view === 'workout' || view === 'home'}
                        onSelect={() => {
                            if (hasActiveSession) {
                                setView('workout');
                            } else {
                                setView('home');
                            }
                        }}
                    />
                    <NavBtn
                        id="mesos"
                        label={t.nav?.mesos || 'Mesos'}
                        icon="Calendar"
                        isActive={view === 'mesos'}
                        onSelect={() => setView('mesos')}
                    />
                    <NavBtn
                        id="templates"
                        label={t.nav?.templates || pickLang(lang, { es: 'Plantillas', en: 'Templates' })}
                        icon="Grid3x3"
                        isActive={view === 'templates'}
                        onSelect={() => setView('templates')}
                    />
                    <NavBtn
                        id="exercises"
                        label={t.nav?.exercises || pickLang(lang, { es: 'Ejercicios', en: 'Exercises' })}
                        icon="Activity"
                        isActive={view === 'exercises'}
                        onSelect={() => setView('exercises')}
                    />
                    <NavBtn
                        id="more"
                        label={t.nav?.more || pickLang(lang, { es: 'Más', en: 'More' })}
                        icon="MoreHorizontal"
                        isActive={showMoreSheet || ['history', 'stats', 'nutrition'].includes(view)}
                        onSelect={() => setShowMoreSheet(prev => !prev)}
                    />
                </div>
            </nav>

            {showMoreSheet && (
                <div
                    className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
                    onClick={() => setShowMoreSheet(false)}
                >
                    <div
                        className="w-full max-w-lg rounded-t-[20px] border-t border-border-subtle bg-surface-base p-4 pb-safe animate-in slide-in-from-bottom duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-zinc-700" />
                        <div className="flex items-center justify-between pb-3 mb-2 border-b border-border-subtle">
                            <h3 className="text-base font-bold text-white">{t.nav?.more || pickLang(lang, { es: 'Más', en: 'More' })}</h3>
                            <button
                                type="button"
                                onClick={() => setShowMoreSheet(false)}
                                className="rounded-lg p-1 text-zinc-400 hover:text-white"
                                aria-label={t.cancel}
                            >
                                <Icon name="X" size={18} />
                            </button>
                        </div>
                        <div className="space-y-1">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowMoreSheet(false);
                                    setView('history');
                                }}
                                className="flex w-full items-center gap-3.5 rounded-xl p-3 text-left transition-colors hover:bg-surface-raised active:scale-[0.98]"
                            >
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-raised text-primary-400">
                                    <Icon name="Clock" size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span className="block text-sm font-semibold text-white">{t.nav?.history || t.history}</span>
                                    <span className="block text-xs text-muted">{pickLang(lang, { es: 'Registro y sesiones pasadas', en: 'Workout logs & past sessions' })}</span>
                                </div>
                                <Icon name="ChevronRight" size={16} className="text-muted shrink-0" />
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setShowMoreSheet(false);
                                    setView('stats');
                                }}
                                className="flex w-full items-center gap-3.5 rounded-xl p-3 text-left transition-colors hover:bg-surface-raised active:scale-[0.98]"
                            >
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-raised text-primary-400">
                                    <Icon name="BarChart2" size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span className="block text-sm font-semibold text-white">{t.nav?.stats || t.navStats}</span>
                                    <span className="block text-xs text-muted">{pickLang(lang, { es: 'Volumen, progreso y récords', en: 'Volume, progress & PRs' })}</span>
                                </div>
                                <Icon name="ChevronRight" size={16} className="text-muted shrink-0" />
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setShowMoreSheet(false);
                                    setView('nutrition');
                                }}
                                className="flex w-full items-center gap-3.5 rounded-xl p-3 text-left transition-colors hover:bg-surface-raised active:scale-[0.98]"
                            >
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-raised text-primary-400">
                                    <Icon name="Utensils" size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span className="block text-sm font-semibold text-white">{t.nav?.nutrition || t.diet}</span>
                                    <span className="block text-xs text-muted">{pickLang(lang, { es: 'Macros, calorías y peso', en: 'Macros, calories & weight' })}</span>
                                </div>
                                <Icon name="ChevronRight" size={16} className="text-muted shrink-0" />
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setShowMoreSheet(false);
                                    openProfile();
                                }}
                                className="flex w-full items-center gap-3.5 rounded-xl p-3 text-left transition-colors hover:bg-surface-raised active:scale-[0.98]"
                            >
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-raised text-primary-400">
                                    <Icon name="Settings" size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span className="block text-sm font-semibold text-white">{t.nav?.profile || pickLang(lang, { es: 'Perfil y Ajustes', en: 'Profile & Settings' })}</span>
                                    <span className="block text-xs text-muted">{pickLang(lang, { es: 'Ajustes de app, cuenta y sincronización', en: 'App preferences, account & sync' })}</span>
                                </div>
                                <Icon name="ChevronRight" size={16} className="text-muted shrink-0" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {(showProfile || hasOpenedProfileRef.current) && (
                <React.Suspense fallback={null}>
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
                <React.Suspense fallback={null}>
                    <QuickStartSheet
                        open={showQuickStart}
                        onClose={() => setShowQuickStart(false)}
                        lang={lang}
                        onResume={() => setView('workout')}
                        onToday={() => {
                            setShowQuickStart(false);
                            if (useStore.getState().activeSession) {
                                setView('workout');
                            } else if (view === 'home') {
                                window.dispatchEvent(new CustomEvent('gainslab:start-scheduled'));
                                const heroCta = document.querySelector<HTMLElement>('[data-testid="hero-start-workout"], #hero-start-workout, .hero-cta-btn');
                                if (heroCta) {
                                    heroCta.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    heroCta.click();
                                } else {
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }
                            } else {
                                setView('home');
                            }
                        }}
                        onFreestyle={() => setShowFreestyle(true)}
                        onEditProgram={editProgram}
                    />
                </React.Suspense>
            )}

            {showFreestyle && (
                <React.Suspense fallback={null}>
                    <FreestyleSessionModal isOpen={showFreestyle} onClose={() => setShowFreestyle(false)} onStart={startDetached} />
                </React.Suspense>
            )}

            {showActiveSessionAlert && (
                <React.Suspense fallback={null}>
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
