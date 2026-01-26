
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
                className={`flex-1 relative py-2 flex flex-col items-center justify-center gap-1 transition-all duration-300 group`}
            >
                {/* Active Indicator Background */}
                <div className={`absolute top-1 inset-x-0 mx-auto w-12 h-8 rounded-full transition-all duration-300 ease-out ${isActive ? 'bg-red-50 dark:bg-red-500/20 scale-100 opacity-100' : 'bg-transparent scale-50 opacity-0'}`}></div>
                
                {/* Icon */}
                <div className={`relative z-10 transition-transform duration-300 ${isActive ? 'text-red-600 dark:text-red-400 -translate-y-1' : 'text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300'}`}>
                    <Icon name={icon} size={22} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                
                {/* Label */}
                <span className={`relative z-10 text-[9px] font-bold uppercase tracking-wider transition-all duration-300 ${isActive ? 'text-red-600 dark:text-red-400 translate-y-0 opacity-100' : 'text-zinc-400 translate-y-1 opacity-0'}`}>
                    {label}
                </span>
            </button>
        );
    };

    // Optimization: When using Virtualization (History view), we disable the Layout's scroll container
    // and let the view manage the scrolling context. This prevents double scrollbars and ensures Virtuoso works correctly.
    const isVirtualized = view === 'history';

    return (
        <div className="w-full h-full flex flex-col bg-gray-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-300 font-sans">
            {/* Header with Safe Area Top padding */}
            {view !== 'workout' && (
                <div className="glass sticky top-0 z-20 shrink-0 pt-safe">
                    <div className="px-4 h-14 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Logo className="w-8 h-8 rounded-lg shadow-md" />
                            <h1 className="text-zinc-900 dark:text-white font-bold tracking-tight text-lg">IronLog <span className="text-red-500 text-xs align-top font-black">PRO</span></h1>
                        </div>
                        <button onClick={onOpenSettings} className="p-2 -mr-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
                            <Icon name="Menu" size={24} />
                        </button>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className={`flex-1 relative ${isVirtualized ? 'overflow-hidden' : 'overflow-y-auto scroll-container'} pb-24 ${view === 'workout' ? 'pt-safe' : ''}`}>
                {children}
            </div>

            {/* Bottom Nav with Safe Area Bottom padding handled by pb-safe in styles */}
            {view !== 'workout' && (
                <div id="tut-nav-bar" className="nav-bar fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-200/50 dark:border-white/5 flex z-30 pb-safe pt-1 shadow-[0_-5px_20px_rgba(0,0,0,0.03)]">
                    <NavBtn id="home" label={t.active} icon="Layout" />
                    <NavBtn id="history" label={t.history} icon="FileText" />
                    <NavBtn id="stats" label={t.stats} icon="BarChart2" />
                </div>
            )}
        </div>
    );
};
