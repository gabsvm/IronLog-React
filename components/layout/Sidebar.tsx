import React from 'react';
import { useAppPreferences } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../lib/store';
import { TRANSLATIONS } from '../../constants';
import { Icon } from '../ui/Icon';
import { Logo } from '../ui/Logo';
import { Avatar } from '../ui/Avatar';
import { STRONG_NAV_ITEMS, strongLabel, type AppView, type DiarySection, type StrongRootId } from './navigation';
import { pickLang } from '../../utils/i18n';

interface SidebarProps {
    view: AppView;
    diarySection?: DiarySection;
    strongActive: StrongRootId;
    onSelectStrong: (id: StrongRootId) => void;
    onNavigateLegacy: (view: AppView, section?: DiarySection) => void;
    onOpenCommandPalette?: () => void;
}

/**
 * Strong parity desktop sidebar (lg+). Primary group: the five Strong
 * destinations (Profile · History · Workout · Exercises · Measure) with
 * blue action styling. Secondary "plan" group preserves every current
 * root (Today · Routine · Progress · Diet) so no feature loses its entry.
 */
export const Sidebar: React.FC<SidebarProps> = ({
    view,
    diarySection = 'sessions',
    strongActive,
    onSelectStrong,
    onNavigateLegacy,
    onOpenCommandPalette,
}) => {
    const { lang } = useAppPreferences();
    const { user } = useAuth();
    const hasActiveSession = useStore((state) => Boolean(state.activeSession));
    const t = TRANSLATIONS[lang];
    const planLabel = pickLang(lang, { es: 'Tu plan', en: 'Your plan' });
    const mainLabel = pickLang(lang, { es: 'Principal', en: 'Main' });

    const legacyItems: Array<{ id: string; label: string; icon: string; active: boolean; run: () => void }> = [
        { id: 'home', label: t.navToday, icon: 'Home', active: view === 'home', run: () => onNavigateLegacy('home') },
        { id: 'routine', label: t.navRoutine, icon: 'Layers', active: view === 'routine' || view === 'program', run: () => onNavigateLegacy('routine') },
        { id: 'progress', label: t.navProgress, icon: 'TrendingUp', active: view === 'progress', run: () => onNavigateLegacy('progress') },
        { id: 'diet', label: t.diet, icon: 'Utensils', active: view === 'diary' && diarySection === 'nutrition', run: () => onNavigateLegacy('diary', 'nutrition') },
    ];

    return (
        <aside className="z-20 hidden w-60 shrink-0 flex-col border-r border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-base))] px-4 py-6 lg:flex" aria-label={t.navToday}>
            <div className="flex items-center gap-2 px-2">
                <Logo className="h-9 w-9" showText />
            </div>
            <p className="gl-eyebrow strong-eyebrow px-2 pt-8">{mainLabel}</p>
            <nav aria-label="Strong navigation" className="mt-2 flex flex-col gap-1">
                {STRONG_NAV_ITEMS.map((item) => {
                    const isActive = strongActive === item.id;
                    const isFab = item.id === 'workout';
                    return (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => onSelectStrong(item.id)}
                            aria-current={isActive ? 'page' : undefined}
                            className={`strong-side-item ${isFab ? 'strong-side-fab' : ''} ${isActive && !isFab ? 'bg-primary-500/15' : ''}`}
                            aria-label={strongLabel(item, lang)}
                        >
                            <Icon name={item.icon} size={19} strokeWidth={isActive ? 2.5 : 2} />
                            <span>{strongLabel(item, lang)}</span>
                        </button>
                    );
                })}
            </nav>
            <p className="gl-eyebrow strong-eyebrow px-2 pt-6">{planLabel}</p>
            <nav aria-label={planLabel} className="mt-2 flex flex-col gap-1">
                {legacyItems.map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        onClick={item.run}
                        aria-current={item.active ? 'page' : undefined}
                        className="strong-side-item"
                    >
                        <Icon name={item.icon} size={18} strokeWidth={item.active ? 2.5 : 2} />
                        <span>{item.label}</span>
                    </button>
                ))}
                {onOpenCommandPalette && (
                    <button
                        type="button"
                        onClick={onOpenCommandPalette}
                        className="strong-side-item"
                    >
                        <Icon name="Search" size={18} />
                        <span>{TRANSLATIONS[lang].copy.commandPalette.quickActions}</span>
                    </button>
                )}
                {hasActiveSession && (
                    <button
                        type="button"
                        onClick={() => onNavigateLegacy('workout')}
                        className="gl-textbtn mt-2 w-full justify-center"
                    >
                        <Icon name="Play" size={16} />
                        <span>{t.resume ?? 'Retomar'}</span>
                    </button>
                )}
            </nav>
            <div className="mt-auto pt-4">
                <button type="button" onClick={() => onSelectStrong('profile')} aria-label={t.openProfile} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-surface-raised">
                    <Avatar email={user?.email} photoURL={(user as { photoURL?: string | null } | null | undefined)?.photoURL} />
                    <span className="min-w-0 flex-1 truncate text-xs font-semibold text-muted">
                        {user?.email ?? t.openProfile}
                    </span>
                </button>
            </div>
        </aside>
    );
};
