
import React from 'react';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../constants';
import { Icon } from '../ui/Icon';
import { Logo } from '../ui/Logo';

interface LayoutProps {
    children: React.ReactNode;
    view: 'home' | 'workout' | 'history' | 'stats';
    setView: (v: 'home' | 'workout' | 'history' | 'stats') => void;
    onOpenSettings: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, view, setView, onOpenSettings }) => {
    const { lang } = useApp();
    const t = TRANSLATIONS[lang];

    const NavBtn = ({ id, label, icon }: { id: typeof view, label: string, icon: any }) => {
        const isActive = view === id;
        return (
            <button 
                onClick={() => setView(id)} 
                className={`flex-1 relative h-full flex flex-col items-center justify-center gap-1 transition-all duration-300 group`}
            >
                {/* Icon Container */}
                <div className={`
                    p-2 rounded-2xl transition-all duration-300 relative
                    ${isActive ? 'text-white translate-y-[-4px]' : 'text-zinc-500 hover:text-zinc-300'}
                `}>
                    <Icon name={icon} size={24} strokeWidth={isActive ? 2.5 : 2} fill={isActive ? "currentColor" : "none"} />
                    
                    {/* Active Glow Dot */}
                    {isActive && (
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-red-500 rounded-full shadow-[0_0_8px_2px_rgba(239,68,68,0.6)]"></div>
                    )}
                </div>
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
                            <div className="w-8 h-8 bg-zinc-900 rounded-xl flex items-center justify-center border border-zinc-800">
                                <Logo className="w-5 h-5 text-white" />
                            </div>
                            <h1 className="text-xl font-black tracking-tighter text-white">
                                IronLog
                            </h1>
                        </div>
                        <button 
                            id="tut-settings-btn"
                            onClick={onOpenSettings} 
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors active:scale-95"
                        >
                            <Icon name="Menu" size={20} />
                        </button>
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <div className={`flex-1 relative z-0 ${isVirtualized ? 'overflow-hidden' : 'overflow-y-auto scroll-container'} ${view !== 'workout' ? 'pt-[calc(env(safe-area-inset-top)+60px)] pb-32' : 'pt-safe pb-0'}`}>
                {children}
            </div>

            {/* Floating Island Navigation */}
            {view !== 'workout' && (
                <div className="fixed bottom-0 left-0 right-0 z-30 flex justify-center pb-safe pointer-events-none">
                    <div id="tut-nav-bar" className="pointer-events-auto mb-6 mx-6 w-full max-w-sm h-16 glass-island rounded-full flex items-center px-6 justify-between">
                        <NavBtn id="home" label={t.active} icon="Layout" />
                        <NavBtn id="history" label={t.history} icon="Calendar" />
                        <NavBtn id="stats" label="Stats" icon="BarChart2" />
                    </div>
                </div>
            )}
        </div>
    );
};
