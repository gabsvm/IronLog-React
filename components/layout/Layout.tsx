import React from 'react';
import { useApp, useAppPreferences } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { usePro } from '../../hooks/usePro';
import { useStore } from '../../lib/store';
import { TRANSLATIONS } from '../../constants';
import { KONG_4DAY_V1 } from '../../programs/kong/kong4Day';
import { getProgramBlockForWeek, resolveProgramWeek } from '../../programs/engine/ProgramResolver';
import { toEditableProgram } from '../../programs/engine/ProgramConversion';
import { getKongDayDisplay } from '../../programs/kong/kongDisplay';
import { Icon } from '../ui/Icon';
import { Logo } from '../ui/Logo';
import { Avatar } from '../ui/Avatar';
import { ProfileSheet } from '../profile/ProfileSheet';
import { PlanActionsSheet } from '../home/PlanActionsSheet';
import { QuickStartSheet } from '../home/QuickStartSheet';
import './ux-navigation.css';

const FreestyleSessionModal = React.lazy(() => import('../workout/FreestyleSessionModal').then(m => ({ default: m.FreestyleSessionModal })));
const TwoBlockMassModal = React.lazy(() => import('../workout/TwoBlockMassModal').then(m => ({ default: m.TwoBlockMassModal })));

interface LayoutProps {
    children: React.ReactNode;
    view: 'home' | 'workout' | 'history' | 'stats' | 'nutrition';
    setView: (v: 'home' | 'workout' | 'history' | 'stats' | 'nutrition' | 'program') => void;
    onOpenSettings: () => void;
    onOpenCommandPalette?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, view, setView, onOpenSettings, onOpenCommandPalette }) => {
    const { lang } = useAppPreferences();
    const { isOnline, syncStatus, setProgram } = useApp();
    const { user } = useAuth();
    const { isPro } = usePro();
    const activeMeso = useStore(state => state.activeMeso);
    const activeSession = useStore(state => state.activeSession);
    const setActiveMeso = useStore(state => state.setActiveMeso);
    const setActiveSession = useStore(state => state.setActiveSession);
    const t = TRANSLATIONS[lang];
    const [showProfile, setShowProfile] = React.useState(false);
    const [showPlanActions, setShowPlanActions] = React.useState(false);
    const [showQuickStart, setShowQuickStart] = React.useState(false);
    const [showFreestyle, setShowFreestyle] = React.useState(false);
    const [showTwoBlock, setShowTwoBlock] = React.useState(false);
    const bypassPlanCapture = React.useRef(false);
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

    const NavBtn = ({ id, label, icon }: { id: typeof view, label: string, icon: any }) => {
        const isActive = view === id;
        return (
            <button
                onClick={() => setView(id)}
                aria-current={isActive ? 'page' : undefined}
                className="group relative flex h-full flex-1 flex-col items-center justify-center gap-1 transition-transform active:scale-95"
            >
                <Icon
                    name={icon}
                    size={21}
                    strokeWidth={isActive ? 2.5 : 2}
                    className={`transition-colors ${isActive ? 'text-primary-500' : 'text-[rgb(var(--text-muted))] group-hover:text-[rgb(var(--text-secondary))]'}`}
                />
                <span className={`text-[11px] font-semibold leading-none transition-colors ${isActive ? 'text-primary-500' : 'text-[rgb(var(--text-muted))]'}`}>
                    {label}
                </span>
            </button>
        );
    };

    const isVirtualized = view === 'history';

    const handleShellClickCapture = (event: React.MouseEvent<HTMLDivElement>) => {
        if (view !== 'home' || !activeMeso) return;
        const target = event.target as Element | null;
        const planButton = target?.closest?.('.scroll-container #tut-plan-actions-btn, .scroll-container #tut-settings-btn');
        if (!planButton) return;
        if (bypassPlanCapture.current) {
            bypassPlanCapture.current = false;
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        setShowPlanActions(true);
    };

    const openExistingPlanSettings = () => {
        setShowPlanActions(false);
        window.setTimeout(() => {
            const button = document.querySelector('.scroll-container #tut-plan-actions-btn, .scroll-container #tut-settings-btn') as HTMLElement | null;
            if (!button) return;
            bypassPlanCapture.current = true;
            button.click();
        }, 120);
    };

    const editProgram = () => {
        setShowPlanActions(false);
        setShowQuickStart(false);

        if (activeSession) {
            window.alert(lang === 'es'
                ? 'Finaliza o descarta la sesión activa antes de editar o convertir la rutina.'
                : 'Finish or discard the active session before editing or converting the routine.');
            return;
        }

        if (isKong && activeMeso) {
            const convert = window.confirm(lang === 'es'
                ? 'KONG es un programa estructurado de 12 semanas. Para editar libremente la semana actual debes convertirla en una rutina personal. KONG finalizará y la copia quedará editable. ¿Continuar?'
                : 'KONG is a structured 12-week program. To freely edit the current week, convert it to a personal routine. KONG will end and the copy will become editable. Continue?');
            if (!convert) return;

            const { block } = getProgramBlockForWeek(KONG_4DAY_V1, activeMeso.week);
            const editableProgram = toEditableProgram(resolveProgramWeek(
                KONG_4DAY_V1,
                activeMeso.week,
                activeMeso.programSystem?.substitutions || {},
            ).map((day, dayIndex) => ({
                ...day,
                dayName: getKongDayDisplay(block.number, dayIndex),
            })));
            const editablePlan = editableProgram.map((day) => (day.slots || []).map((slot) => slot.exerciseId || null));

            setProgram(editableProgram);
            setActiveMeso(prev => prev ? {
                ...prev,
                id: Date.now(),
                name: lang === 'es' ? 'KONG · Rutina personal' : 'KONG · Personal routine',
                mesoType: 'personal',
                targetWeeks: 4,
                duration: 4,
                week: 1,
                plan: editablePlan,
                isDeload: false,
                programSystem: undefined,
            } : prev);
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
        <div className="flex h-full w-full flex-col overflow-hidden bg-[rgb(var(--surface-app))] font-sans text-[rgb(var(--text-primary))]" onClickCapture={handleShellClickCapture}>
            {view !== 'workout' && (
                <div className="pointer-events-none absolute left-0 right-0 top-0 z-20 bg-gradient-to-b from-[rgb(var(--surface-app))] via-[rgb(var(--surface-app)/0.9)] to-transparent px-5 pb-2 pt-safe">
                    <div className="pointer-events-auto flex h-14 items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Logo className="h-9 w-9" showText />
                            {(!isOnline || syncStatus.pending > 0 || syncStatus.isSyncing) && (
                                <div className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[9px] font-bold ${!isOnline ? 'border-amber-500/25 bg-amber-500/10 text-amber-500' : syncStatus.isSyncing ? 'border-cyan-500/25 bg-cyan-500/10 text-cyan-500' : 'border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] text-[rgb(var(--text-muted))]'}`}>
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

            <div className={`relative z-0 flex-1 ${isVirtualized ? 'overflow-hidden' : 'overflow-y-auto scroll-container'} ${view !== 'workout' ? 'pt-[calc(env(safe-area-inset-top)+60px)] pb-28' : 'pt-safe pb-0'}`}>{children}</div>

            {view !== 'workout' && (
                <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-[rgb(var(--border-subtle)/0.72)] bg-[rgb(var(--surface-base)/0.96)] pb-safe backdrop-blur-xl">
                    <div className="mx-auto flex h-[66px] w-full max-w-lg items-center justify-between px-2">
                        <NavBtn id="home" label={lang === 'es' ? 'Hoy' : 'Today'} icon="Layout" />
                        <NavBtn id="history" label={t.history} icon="Calendar" />
                        <button
                            onClick={openPrimaryAction}
                            aria-label={lang === 'es' ? 'Inicio rápido' : 'Quick start'}
                            className="mx-2 flex h-12 w-12 shrink-0 -translate-y-2 items-center justify-center rounded-2xl bg-primary-500 text-black shadow-[0_8px_24px_-12px_rgb(var(--primary-500)/0.75)] transition-transform active:scale-95"
                        >
                            <Icon name="Plus" size={23} strokeWidth={2.7} />
                        </button>
                        <NavBtn id="nutrition" label={lang === 'es' ? 'Dieta' : 'Diet'} icon="Utensils" />
                        <NavBtn id="stats" label={lang === 'es' ? 'Progreso' : 'Progress'} icon="BarChart2" />
                    </div>
                </div>
            )}

            <ProfileSheet open={showProfile} onClose={closeProfile} onOpenSettings={onOpenSettings} />
            <PlanActionsSheet open={showPlanActions} onClose={() => setShowPlanActions(false)} lang={lang} planName={activeMeso?.name} week={activeMeso?.week} totalWeeks={activeMeso?.targetWeeks || activeMeso?.duration} onConfigure={openExistingPlanSettings} onEditProgram={editProgram} />
            <QuickStartSheet open={showQuickStart} onClose={() => setShowQuickStart(false)} lang={lang} onResume={() => setView('workout')} onToday={() => setView('home')} onFreestyle={() => setShowFreestyle(true)} onTwoBlock={() => setShowTwoBlock(true)} onEditProgram={editProgram} />

            {showFreestyle && (
                <React.Suspense fallback={<div className="fixed inset-0 z-modal bg-[rgb(var(--surface-app))]" />}>
                    <FreestyleSessionModal isOpen={showFreestyle} onClose={() => setShowFreestyle(false)} onStart={startDetached} />
                </React.Suspense>
            )}
            {showTwoBlock && (
                <React.Suspense fallback={<div className="fixed inset-0 z-modal bg-[rgb(var(--surface-app))]" />}>
                    <TwoBlockMassModal isOpen={showTwoBlock} onClose={() => setShowTwoBlock(false)} onStart={startDetached} />
                </React.Suspense>
            )}
        </div>
    );
};
