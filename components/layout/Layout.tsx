import React from 'react';
import { useApp, useAppPreferences, useSyncStatus } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { usePro } from '../../hooks/usePro';
import { useStore } from '../../lib/store';
import { TRANSLATIONS } from '../../constants';
import { KONG_4DAY_V1 } from '../../programs/kong/kong4Day';
import { convertKongToPersonalRoutine } from '../../programs/engine/ProgramConversion';
import { Icon } from '../ui/Icon';
import { Logo } from '../ui/Logo';
import { Avatar } from '../ui/Avatar';
import { scheduleWhenIdle } from '../../lib/idle';
import './ux-navigation.css';

const ProfileSheet = React.lazy(() => import('../profile/ProfileSheet').then(m => ({ default: m.ProfileSheet })));
const QuickStartSheet = React.lazy(() => import('../home/QuickStartSheet').then(m => ({ default: m.QuickStartSheet })));
const FreestyleSessionModal = React.lazy(() => import('../workout/FreestyleSessionModal').then(m => ({ default: m.FreestyleSessionModal })));
const TwoBlockMassModal = React.lazy(() => import('../workout/TwoBlockMassModal').then(m => ({ default: m.TwoBlockMassModal })));
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
                title={lang === 'es' ? 'Convertir KONG en Rutina Personal' : 'Convert KONG to Personal Routine'}
                description={lang === 'es'
                    ? 'KONG es un programa estructurado de 12 semanas. Para editar libremente la semana actual debes convertirla en una rutina personal. KONG finalizará y la copia quedará editable. ¿Continuar?'
                    : 'KONG is a structured 12-week program. To freely edit the current week, convert it to a personal routine. KONG will end and the copy will become editable. Continue?'}
                confirmText={lang === 'es' ? 'Convertir y Editar' : 'Convert & Edit'}
                cancelText={cancelText}
                onConfirm={handleConfirm}
                onCancel={onClose}
            />
        </React.Suspense>
    );
};

export interface NavBtnProps {
    id: 'home' | 'workout' | 'history' | 'stats' | 'nutrition' | 'program';
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
            className="group relative flex h-full flex-1 flex-col items-center justify-center gap-0.5 transition-all duration-200 active:scale-90"
        >
            <div className={`relative flex items-center justify-center transition-all duration-200 ${isActive ? '-translate-y-1' : 'translate-y-0'}`}>
                <Icon name={icon} size={22} strokeWidth={isActive ? 2.5 : 2} fill={isActive ? 'currentColor' : 'none'} className={`transition-colors duration-200 ${isActive ? 'text-primary-500' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
            </div>
            <span className={`text-[9px] font-bold uppercase tracking-wider transition-all duration-200 leading-none ${isActive ? 'text-primary-500 opacity-100' : 'text-zinc-600 group-hover:text-zinc-400 opacity-80'}`}>{label}</span>
            {isActive && <div className="absolute bottom-2 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-primary-500 shadow-[0_0_9px_1px] shadow-primary-500/40" />}
        </button>
    );
});
NavBtn.displayName = 'NavBtn';

interface LayoutProps {
    children: React.ReactNode;
    view: 'home' | 'workout' | 'history' | 'stats' | 'nutrition';
    setView: (v: 'home' | 'workout' | 'history' | 'stats' | 'nutrition' | 'program') => void;
    onOpenSettings: () => void;
    onOpenCommandPalette?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, view, setView, onOpenSettings, onOpenCommandPalette }) => {
    const { lang } = useAppPreferences();
    const { isOnline, syncStatus } = useSyncStatus();
    const { user } = useAuth();
    const { isPro } = usePro();
    const activeMeso = useStore(state => state.activeMeso);
    const activeSession = useStore(state => state.activeSession);
    const setActiveMeso = useStore(state => state.setActiveMeso);
    const setActiveSession = useStore(state => state.setActiveSession);
    const t = TRANSLATIONS[lang];
    const [showProfile, setShowProfile] = React.useState(false);
    const [showQuickStart, setShowQuickStart] = React.useState(false);
    const [showFreestyle, setShowFreestyle] = React.useState(false);
    const [showTwoBlock, setShowTwoBlock] = React.useState(false);
    const [showActiveSessionAlert, setShowActiveSessionAlert] = React.useState(false);
    const [showKongConvertConfirm, setShowKongConvertConfirm] = React.useState(false);
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

    const isKong = activeMeso?.programSystem?.systemId === KONG_4DAY_V1.id;

    React.useEffect(() => {
        document.documentElement.classList.toggle('kong-program-active', !!isKong);
        return () => document.documentElement.classList.remove('kong-program-active');
    }, [isKong]);

    React.useEffect(() => {
        const handlePop = (event: PopStateEvent) => {
            if (!event.state?.profile) setShowProfile(false);
        };
        window.addEventListener('popstate', handlePop);
        return () => window.removeEventListener('popstate', handlePop);
    }, []);

    React.useEffect(() => {
        const handleNavigate = (event: Event) => {
            const target = (event as CustomEvent<{ view?: string }>).detail?.view;
            if (target === 'home' || target === 'workout' || target === 'history' || target === 'stats' || target === 'nutrition' || target === 'program') {
                setView(target);
            }
        };
        window.addEventListener('gainslab:navigate', handleNavigate);
        return () => window.removeEventListener('gainslab:navigate', handleNavigate);
    }, [setView]);

    const openProfile = () => {
        if (showProfile) return;
        try {
            window.history.pushState({ ...(window.history.state || {}), view, settings: false, profile: true }, '', '#profile');
        } catch { }
        setShowProfile(true);
    };

    const closeProfile = () => {
        try {
            if (window.history.state?.profile) {
                window.history.back();
                return;
            }
        } catch { }
        setShowProfile(false);
    };

    const isVirtualized = view === 'history';

    const editProgram = () => {
        setShowQuickStart(false);

        if (activeSession) {
            setShowActiveSessionAlert(true);
            return;
        }

        if (isKong && activeMeso) {
            setShowKongConvertConfirm(true);
            return;
        }

        setView('program');
    };

    const openPrimaryAction = () => {
        if (typeof window !== 'undefined' && window.matchMedia('(min-width: 640px)').matches && onOpenCommandPalette) {
            onOpenCommandPalette();
            return;
        }
        setShowQuickStart(true);
    };

    const startDetached = (session: any) => {
        setActiveSession(session);
        setShowFreestyle(false);
        setShowTwoBlock(false);
        setView('workout');
    };

    return (
        <div className="flex h-full w-full flex-col overflow-hidden bg-[rgb(var(--surface-app))] font-sans text-[rgb(var(--text-primary))]">
            {view !== 'workout' && (
                <div className="pointer-events-none absolute left-0 right-0 top-0 z-20 bg-gradient-to-b from-[rgb(var(--surface-app))] via-[rgb(var(--surface-app)/0.9)] to-transparent px-6 pb-2 pt-safe">
                    <div className="pointer-events-auto flex h-14 items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Logo className="h-10 w-10" showText />
                            {(!isOnline || syncStatus.pending > 0 || syncStatus.isSyncing) && (
                                <div className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${!isOnline ? 'border-amber-500/25 bg-amber-500/10 text-amber-500' : syncStatus.isSyncing ? 'border-cyan-500/25 bg-cyan-500/10 text-cyan-500' : 'border-zinc-700/40 bg-zinc-900/10 text-zinc-500 dark:bg-zinc-900/85 dark:text-zinc-300'}`}>
                                    <span className={`h-1.5 w-1.5 rounded-full ${!isOnline ? 'bg-amber-400' : syncStatus.isSyncing ? 'bg-cyan-400' : 'bg-zinc-400'}`} />
                                    <span>{!isOnline ? 'offline' : syncStatus.isSyncing ? 'sync' : `${lang === 'es' ? 'cola' : 'queue'} ${syncStatus.pending}`}</span>
                                </div>
                            )}
                        </div>
                        <div id="tut-profile-btn">
                            <Avatar email={user?.email} photoURL={(user as any)?.photoURL} isPro={isPro} onClick={openProfile} ariaLabel={lang === 'es' ? 'Abrir perfil' : 'Open profile'} />
                        </div>
                    </div>
                </div>
            )}

            <div className={`relative z-0 flex-1 ${isVirtualized ? 'overflow-hidden' : 'overflow-y-auto scroll-container'} ${view !== 'workout' ? 'pt-[calc(env(safe-area-inset-top)+60px)] pb-32' : 'pt-safe pb-0'}`}>{children}</div>

            {view !== 'workout' && (
                <nav aria-label="Main navigation" className="fixed bottom-0 left-0 right-0 z-30 border-t border-[rgb(var(--border-subtle)/0.7)] bg-[rgb(var(--surface-base)/0.96)] pb-safe backdrop-blur-xl">
                    <div className="mx-auto flex h-16 w-full max-w-lg items-center justify-between px-2">
                        <NavBtn id="home" label={lang === 'es' ? 'Entreno' : 'Train'} icon="Layout" isActive={view === 'home'} onSelect={setView} />
                        <NavBtn id="history" label={t.history} icon="Calendar" isActive={view === 'history'} onSelect={setView} />
                        <button onClick={openPrimaryAction} aria-label={lang === 'es' ? 'Iniciar entreno' : 'Start workout'} className="mx-2 flex h-12 w-12 shrink-0 -translate-y-3 items-center justify-center rounded-full border border-primary-400/20 bg-primary-500 text-black shadow-lg shadow-primary-500/20 transition-transform duration-200 active:scale-95">
                            <Icon name="Plus" size={24} strokeWidth={2.5} />
                        </button>
                        <NavBtn id="nutrition" label={lang === 'es' ? 'Dieta' : 'Diet'} icon="Utensils" isActive={view === 'nutrition'} onSelect={setView} />
                        <NavBtn id="stats" label="Stats" icon="BarChart2" isActive={view === 'stats'} onSelect={setView} />
                    </div>
                </nav>
            )}

            {(showProfile || hasOpenedProfileRef.current) && (
                <React.Suspense fallback={null}>
                    <ProfileSheet open={showProfile} onClose={closeProfile} onOpenSettings={onOpenSettings} />
                </React.Suspense>
            )}
            {(showQuickStart || hasOpenedQuickStartRef.current) && (
                <React.Suspense fallback={null}>
                    <QuickStartSheet open={showQuickStart} onClose={() => setShowQuickStart(false)} lang={lang} onResume={() => setView('workout')} onToday={() => setView('home')} onFreestyle={() => setShowFreestyle(true)} onTwoBlock={() => setShowTwoBlock(true)} onEditProgram={editProgram} />
                </React.Suspense>
            )}

            {showFreestyle && (
                <React.Suspense fallback={null}>
                    <FreestyleSessionModal isOpen={showFreestyle} onClose={() => setShowFreestyle(false)} onStart={startDetached} />
                </React.Suspense>
            )}
            {showTwoBlock && (
                <React.Suspense fallback={null}>
                    <TwoBlockMassModal isOpen={showTwoBlock} onClose={() => setShowTwoBlock(false)} onStart={startDetached} />
                </React.Suspense>
            )}

            {/* Active Session Warning Modal */}
            {showActiveSessionAlert && (
                <React.Suspense fallback={null}>
                    <ConfirmModal
                        isOpen={true}
                        title={lang === 'es' ? 'Sesión en curso' : 'Session in progress'}
                        description={lang === 'es'
                            ? 'Tienes una sesión de entrenamiento activa. Finaliza o descarta la sesión antes de editar o convertir la rutina.'
                            : 'You have an active workout in progress. Finish or discard it before editing or converting routines.'}
                        confirmText={lang === 'es' ? 'Entendido' : 'Understood'}
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