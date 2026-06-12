
import React from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { usePro } from '../../hooks/usePro';
import { TRANSLATIONS } from '../../constants';
import { Icon } from '../ui/Icon';
import { Logo } from '../ui/Logo';
import { Avatar } from '../ui/Avatar';

interface LayoutProps {
    children: React.ReactNode;
    view: 'home' | 'workout' | 'history' | 'stats' | 'nutrition';
    setView: (v: 'home' | 'workout' | 'history' | 'stats' | 'nutrition') => void;
    onOpenSettings: () => void;
    onOpenCommandPalette?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, view, setView, onOpenSettings, onOpenCommandPalette }) => {
    const { lang } = useApp();
    const { user } = useAuth();
    const { isPro } = usePro();
    const t = TRANSLATIONS[lang];

    const NavBtn = ({ id, label, icon }: { id: typeof view, label: string, icon: any }) => {
        const isActive = view === id;
        return (
            <button
                onClick={() => setView(id)}
                className={`flex-1 relative h-full flex flex-col items-center justify-center gap-0.5 transition-all duration-200 active:scale-90 group`}
            >
                {/* Icon */}
                <div className={`
                    relative flex items-center justify-center transition-all duration-200
                    ${isActive ? '-translate-y-1' : 'translate-y-0'}
                `}>
                    <Icon
                        name={icon}
                        size={22}
                        strokeWidth={isActive ? 2.5 : 2}
                        fill={isActive ? "currentColor" : "none"}
                        className={`transition-colors duration-200 ${isActive ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'}`}
                    />
                </div>

                {/* Label */}
                <span className={`text-[9px] font-bold uppercase tracking-wider transition-all duration-200 leading-none
                    ${isActive ? 'text-white opacity-100' : 'text-zinc-600 group-hover:text-zinc-400 opacity-80'}
                `}>
                    {label}
                </span>

                {/* Active pill indicator */}
                {isActive && (
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-primary-500 rounded-full shadow-[0_0_9px_1px] shadow-primary-500/40" />
                )}
            </button>
        );
    };

    const isVirtualized = view === 'history';

    return (
        <div className="w-full h-full flex flex-col bg-black text-white font-sans overflow-hidden">

            {/* Header - Transparent & Cleaner */}
            {view !== 'workout' && (
                <div className="absolute top-0 left-0 right-0 z-20 pt-safe px-6 pb-2 bg-gradient-to-b from-black via-black/80 to-transparent pointer-events-none">
                    <div className="h-14 flex items-center justify-between pointer-events-auto">
                        <div className="flex items-center gap-3">
                            <Logo className="w-10 h-10" showText />
                        </div>
                        <div id="tut-settings-btn">
                            <Avatar
                                email={user?.email}
                                photoURL={(user as any)?.photoURL}
                                isPro={isPro}
                                onClick={onOpenSettings}
                                ariaLabel={lang === 'es' ? 'Abrir cuenta y ajustes' : 'Open account and settings'}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <div className={`flex-1 relative z-0 ${isVirtualized ? 'overflow-hidden' : 'overflow-y-auto scroll-container'} ${view !== 'workout' ? 'pt-[calc(env(safe-area-inset-top)+60px)] pb-32' : 'pt-safe pb-0'}`}>
                {children}
            </div>

            {/* Edge-to-Edge Bottom Navigation */}
            {view !== 'workout' && (
                <div className="fixed bottom-0 left-0 right-0 z-30 bg-[#0A0A0A]/95 backdrop-blur-xl border-t border-white/5 pb-safe">
                    <div className="flex items-center justify-between px-2 h-16 w-full max-w-lg mx-auto">
                        <NavBtn id="home" label={t.active} icon="Layout" />
                        <NavBtn id="history" label={t.history} icon="Calendar" />
                        
                        {/* FAB — Integrado en la barra */}
                        {onOpenCommandPalette && (
                            <button
                                onClick={onOpenCommandPalette}
                                aria-label={lang === 'es' ? 'Iniciar sesión' : 'Start session'}
                                className="shrink-0 w-12 h-12 rounded-full bg-primary-600 text-white flex items-center justify-center -translate-y-2 shadow-lg shadow-primary-900/20 active:scale-95 transition-transform duration-200 border border-white/10 mx-2"
                            >
                                <Icon name="Plus" size={24} strokeWidth={2.5} />
                            </button>
                        )}
                        
                        <NavBtn id="nutrition" label={lang === 'es' ? 'Dieta' : 'Diet'} icon="Utensils" />
                        <NavBtn id="stats" label="Stats" icon="BarChart2" />
                    </div>
                </div>
            )}
        </div>
    );
};
