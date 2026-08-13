import React from 'react';
import { useApp, useAppPreferences } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { usePro } from '../../hooks/usePro';
import { useStore } from '../../lib/store';
import { TRANSLATIONS } from '../../constants';
import { Icon } from '../ui/Icon';
import { Logo } from '../ui/Logo';
import { Avatar } from '../ui/Avatar';
import { ProfileSheet } from '../profile/ProfileSheet';
import { PlanActionsSheet } from '../home/PlanActionsSheet';
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
    const { isOnline, syncStatus } = useApp();
    const { user } = useAuth();
    const { isPro } = usePro();
    const activeMeso = useStore(state => state.activeMeso);
    const setActiveSession = useStore(state => state.setActiveSession);
    const t = TRANSLATIONS[lang];
    const [showProfile, setShowProfile] = React.useState(false);
    const [showPlanActions, setShowPlanActions] = React.useState(false);
    const [showFreestyle, setShowFreestyle] = React.useState(false);
    const [showTwoBlock, setShowTwoBlock] = React.useState(false);
    const bypassPlanCapture = React.useRef(false);

    React.useEffect(() => {
        const openFreestyle = () => setShowFreestyle(true);
        const openTwoBlock = () => setShowTwoBlock(true);
        window.addEventListener('gainslab:open-freestyle', openFreestyle);
        window.addEventListener('gainslab:open-two-block', openTwoBlock);
        return () => {
            window.removeEventListener('gainslab:open-freestyle', openFreestyle);
            window.removeEventListener('gainslab:open-two-block', openTwoBlock);
        };
    }, []);

    const NavBtn = ({ id, label, icon }: { id: typeof view, label: string, icon: any }) => {
        const isActive = view === id;
        return (
            <button
                onClick={() => setView(id)}
                className="group relative flex h-full flex-1 flex-col items-center justify-center gap-0.5 transition-all duration-200 active:scale-90"
            >
                <div className={`relative flex items-center justify-center transition-all duration-200 ${isActive ? '-translate-y-1' : 'translate-y-0'}`}>
                    <Icon
                        name={icon}
                        size={22}
                        strokeWidth={isActive ? 2.5 : 2}
                        fill={isActive ? 'currentColor' : 'none'}
                        className={`transition-colors duration-200 ${isActive ? 'text-primary-500' : 'text-zinc-500 group-hover:text-zinc-300'}`}
                    />
                </div>

                <span className={`text-[9px] font-bold uppercase tracking-wider transition-all duration-200 leading-none ${isActive ? 'text-primary-500 opacity-100' : 'text-zinc-600 group-hover:text-zinc-400 opacity-80'}`}>
                    {label}
                </span>

                {isActive && (
                    <div className="absolute bottom-2 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-primary-500 shadow-[0_0_9px_1px] shadow-primary-500/40" />
                )}
            </button>
        );
    };

    const isVirtualized = view === 'history';

    const handleShellClickCapture = (event: React.MouseEvent<HTMLDivElement>) => {
        if (view !== 'home' || !activeMeso) return;
        const target = event.target as Element | null;
        const planButton = target?.closest?.('.scroll-container #tut-settings-btn');
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
            const button = document.querySelector('.scroll-container #tut-settings-btn') as HTMLElement | null;
            if (!button) return;
            bypassPlanCapture.current = true;
            button.click();
        }, 120);
    };

    const editProgram = () => {
        setShowPlanActions(false);
        setView('program');
    };

    const startDetachedSession = (session: any) => {
        setActiveSession(session);
        setShowFreestyle(false);
        setShowTwoBlock(false);
        setView('workout');
    };

    return (
        <div
            className="flex h-full w-full flex-col overflow-hidden bg-[rgb(var(--surface-app))] font-sans text-[rgb(var(--text-primary))]"
            onClickCapture={handleShellClickCapture}
        >
            {view !== 'workout' && (
                <div className="pointer-events-none absolute left-0 right-0 top-0 z-20 bg-gradient-to-b from-[rgb(var(--surface-app))] via-[rgb(var(--surface-app)/0.9)] to-transparent px-6 pb-2 pt-safe">
                    <div className="pointer-events-auto flex h-14 items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Logo className="h-10 w-10" showText />
                            {(!isOnline || syncStatus.pending > 0 || syncStatus.isSyncing) && (
                                <div className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${
                                    !isOnline
                                        ? 'border-amber-500/25 bg-amber-500/10 text-amber-500'
                                        : syncStatus.isSyncing
                                            ? 'border-cyan-500/25 bg-cyan-500/10 text-cyan-500'
                                            : 'border-zinc-700/40 bg-zinc-900/10 text-zinc-500 dark:bg-zinc-900/85 dark:text-zinc-300'
                                }`}>
                                    <span className={`h-1.5 w-1.5 rounded-full ${
                                        !isOnline
                                            ? 'bg-amber-400'
                                            : syncStatus.isSyncing
                                                ? 'bg-cyan-400'
                                                : 'bg-zinc-400'
                                    }`} />
                                    <span>
                                        {!isOnline
                                            ? 'offline'
                                            : syncStatus.isSyncing
                                                ? 'sync'
                                                : `${lang === 'es' ? 'cola' : 'queue'} ${syncStatus.pending}`}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div id="tut-settings-btn">
                            <Avatar
                                email={user?.email}
                                photoURL={(user as any)?.photoURL}
                                isPro={isPro}
                                onClick={() => setShowProfile(true)}
                                ariaLabel={lang === 'es' ? 'Abrir perfil' : 'Open profile'}
                            />
                        </div>
                    </div>
                </div>
            )}

            <div className={`relative z-0 flex-1 ${isVirtualized ? 'overflow-hidden' : 'overflow-y-auto scroll-container'} ${view !== 'workout' ? 'pt-[calc(env(safe-area-inset-top)+60px)] pb-32' : 'pt-safe pb-0'}`}>
                {children}
            </div>

            {view !== 'workout' && (
                <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-[rgb(var(--border-subtle)/0.7)] bg-[rgb(var(--surface-base)/0.96)] pb-safe backdrop-blur-xl">
                    <div className="mx-auto flex h-16 w-full max-w-lg items-center justify-between px-2">
                        <NavBtn id="home" label={lang === 'es' ? 'Entreno' : 'Train'} icon="Layout" />
                        <NavBtn id="history" label={t.history} icon="Calendar" />

                        {onOpenCommandPalette && (
                            <button
                                onClick={onOpenCommandPalette}
                                aria-label={lang === 'es' ? 'Iniciar entreno' : 'Start workout'}
                                className="mx-2 flex h-12 w-12 shrink-0 -translate-y-3 items-center justify-center rounded-full border border-primary-400/20 bg-primary-500 text-black shadow-lg shadow-primary-500/20 transition-transform duration-200 active:scale-95 animate-pulse-glow-green"
                            >
                                <Icon name="Plus" size={24} strokeWidth={2.5} />
                            </button>
                        )}

                        <NavBtn id="nutrition" label={lang === 'es' ? 'Dieta' : 'Diet'} icon="Utensils" />
                        <NavBtn id="stats" label="Stats" icon="BarChart2" />
                    </div>
                </div>
            )}

            <ProfileSheet
                open={showProfile}
                onClose={() => setShowProfile(false)}
                onOpenSettings={onOpenSettings}
            />

            <PlanActionsSheet
                open={showPlanActions}
                onClose={() => setShowPlanActions(false)}
                lang={lang}
                planName={activeMeso?.name}
                week={activeMeso?.week}
                totalWeeks={activeMeso?.targetWeeks || activeMeso?.duration}
                onConfigure={openExistingPlanSettings}
                onEditProgram={editProgram}
            />

            <React.Suspense fallback={null}>
                <FreestyleSessionModal
                    isOpen={showFreestyle}
                    onClose={() => setShowFreestyle(false)}
                    onStart={startDetachedSession}
                />
                <TwoBlockMassModal
                    isOpen={showTwoBlock}
                    onClose={() => setShowTwoBlock(false)}
                    onStart={startDetachedSession}
                />
            </React.Suspense>
        </div>
    );
};