import React from 'react';
import { useAppPreferences } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { usePro } from '../../hooks/usePro';
import { useStore } from '../../lib/store';
import { TRANSLATIONS } from '../../constants';
import { Icon } from '../ui/Icon';
import { Logo } from '../ui/Logo';
import { Avatar } from '../ui/Avatar';
import { requestQuickStart, ROOT_NAV_ITEMS } from './navigation';
import type { AppView } from './navigation';

interface SidebarProps {
    view: AppView;
    onNavigate: (view: AppView) => void;
    onOpenProfile: () => void;
    onOpenCommandPalette?: () => void;
}

/**
 * Desktop sidebar (lg+). Split into its own chunk: phones never render it,
 * so it must not weigh on mobile startup.
 */
export const Sidebar: React.FC<SidebarProps> = ({ view, onNavigate, onOpenProfile, onOpenCommandPalette }) => {
    const { lang } = useAppPreferences();
    const { user } = useAuth();
    const { isPro } = usePro();
    const hasActiveSession = useStore((state) => Boolean(state.activeSession));
    const t = TRANSLATIONS[lang];
    return (
        <aside className="z-20 hidden w-60 shrink-0 flex-col border-r border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-base))] px-4 py-6 lg:flex" aria-label={t.navToday}>
            <div className="flex items-center gap-2 px-2">
                <Logo className="h-9 w-9" showText />
            </div>
            <p className="gl-eyebrow px-2 pt-8">{t.navToday}</p>
            <nav aria-label="Main navigation" className="mt-2 flex flex-col gap-1">
                {ROOT_NAV_ITEMS.map((item) => {
                    const isActive = view === item.id;
                    return (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => onNavigate(item.id)}
                            aria-current={isActive ? 'page' : undefined}
                            className={`flex min-h-[44px] items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors ${isActive ? 'bg-primary-500/15 text-[rgb(var(--accent-text))]' : 'text-muted hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--surface-raised))]'}`}
                        >
                            <Icon name={item.icon as any} size={19} strokeWidth={isActive ? 2.5 : 2} />
                            <span>{t[item.labelKey]}</span>
                        </button>
                    );
                })}
            </nav>
            <div className="mt-6 border-t border-[rgb(var(--border-subtle))] pt-4">
                <button
                    type="button"
                    onClick={() => requestQuickStart()}
                    className="gl-quiet w-full"
                >
                    <Icon name="Plus" size={18} strokeWidth={2.5} />
                    <span>{t.startWorkout}</span>
                </button>
                {onOpenCommandPalette && (
                    <button
                        type="button"
                        onClick={onOpenCommandPalette}
                        className="mt-1 flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-muted transition-colors hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--surface-raised))]"
                    >
                        <Icon name="Search" size={19} />
                        <span>{TRANSLATIONS[lang].copy.commandPalette.quickActions}</span>
                    </button>
                )}
                {hasActiveSession && (
                    <button
                        type="button"
                        onClick={() => onNavigate('workout')}
                        className="gl-textbtn mt-2 w-full justify-center"
                    >
                        <Icon name="Play" size={16} />
                        <span>{t.resume ?? 'Retomar'}</span>
                    </button>
                )}
            </div>
            <div className="mt-auto pt-4">
                <button
                    type="button"
                    onClick={onOpenProfile}
                    aria-label={t.openProfile}
                    className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-[rgb(var(--surface-raised))]"
                >
                    <Avatar email={user?.email} photoURL={(user as any)?.photoURL} isPro={isPro} onClick={onOpenProfile} ariaLabel={t.openProfile} />
                    <span className="min-w-0 flex-1 truncate text-xs font-semibold text-muted">
                        {user?.email ?? t.openProfile}
                    </span>
                </button>
            </div>
        </aside>
    );
};
