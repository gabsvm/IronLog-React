import React, { useState, useEffect, useMemo } from 'react';
import { useAppPreferences } from '../../context/AppContext';
import { useStore } from '../../lib/store';
import { KONG_4DAY_ID } from '../../programs/kong/constants';
import { Icon } from './Icon';
import { TRANSLATIONS } from '../../constants/translations';

export interface CommandAction {
    id: string;
    label: { en: string; es: string };
    description?: { en: string; es: string };
    icon: string;
    accent?: 'primary' | 'amber' | 'violet' | 'emerald' | 'zinc';
    onSelect: () => void;
    keywords?: string[];
    badge?: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    actions: CommandAction[];
    title?: string;
}

const ACCENT: Record<string, string> = {
    primary: 'from-primary-500 to-primary-700 text-black',
    amber: 'from-primary-500 to-primary-700 text-black',
    violet: 'from-primary-500 to-primary-700 text-black',
    emerald: 'from-primary-500 to-primary-700 text-black',
    zinc: 'from-zinc-500 to-zinc-700 text-white',
};

/**
 * Mobile: native-feeling action sheet launched from the central (+) button.
 * Desktop: keeps the searchable command-palette behavior.
 */
export const CommandPalette: React.FC<Props> = ({ isOpen, onClose, actions, title }) => {
    const { lang } = useAppPreferences();
    const activeMeso = useStore(state => state.activeMeso);
    const [query, setQuery] = useState('');
    const [activeIdx, setActiveIdx] = useState(0);
    const isStructuredKong = activeMeso?.programSystem?.systemId === KONG_4DAY_ID || activeMeso?.programSystem?.systemId === 'kong_4day';

    // The generic editor mutates the projected `program` array. While KONG is
    // active that array is only a resolved view of an immutable Program System,
    // so exposing "Edit my program" here would silently bypass KONG safeguards.
    // Also replace the internal mesoType id with product-facing KONG copy.
    const visibleActions = useMemo(() => {
        const filtered = isStructuredKong ? actions.filter(action => action.id !== 'program') : actions;
        if (!isStructuredKong || !activeMeso) return filtered;
        return filtered.map(action => action.id === 'meso_today'
            ? {
                ...action,
                description: {
                    en: `KONG · Week ${activeMeso.week}`,
                    es: `KONG · Semana ${activeMeso.week}`,
                },
            }
            : action);
    }, [actions, activeMeso, isStructuredKong]);

    useEffect(() => {
        if (!isOpen) {
            setQuery('');
            setActiveIdx(0);
        }
    }, [isOpen]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return visibleActions;
        return visibleActions.filter(a => {
            const label = a.label[lang].toLowerCase();
            const desc = a.description?.[lang].toLowerCase() || '';
            const kws = (a.keywords || []).join(' ').toLowerCase();
            return label.includes(q) || desc.includes(q) || kws.includes(q);
        });
    }, [visibleActions, query, lang]);

    useEffect(() => {
        if (activeIdx >= filtered.length) setActiveIdx(Math.max(0, filtered.length - 1));
    }, [filtered.length, activeIdx]);

    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') { e.preventDefault(); onClose(); }
            if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(filtered.length - 1, i + 1)); }
            if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(0, i - 1)); }
            if (e.key === 'Enter') {
                e.preventDefault();
                const a = filtered[activeIdx];
                if (a) { a.onSelect(); onClose(); }
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, filtered, activeIdx, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-sheet flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-start sm:pt-[18vh] animate-in fade-in duration-150 pointer-events-auto"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label={title || (TRANSLATIONS[lang].copy.commandPalette.quickActions)}
        >
            <div
                className="modal-surface mb-[calc(var(--safe-area-bottom)+72px)] w-full overflow-hidden rounded-t-[32px] border shadow-2xl sm:mb-0 sm:mx-4 sm:max-w-lg sm:rounded-3xl animate-in fade-in zoom-in-95 duration-150"
                onClick={e => e.stopPropagation()}
            >
                <div className="hidden items-center gap-3 border-b border-[rgb(var(--border-subtle))] px-4 pb-2 pt-3 dark:border-white/5 sm:flex">
                    <Icon name="Search" size={18} className="shrink-0 text-muted" />
                    <input
                        type="text"
                        value={query}
                        onChange={e => { setQuery(e.target.value); setActiveIdx(0); }}
                        placeholder={TRANSLATIONS[lang].copy.commandPalette.searchAction}
                        className="flex-1 bg-transparent py-2 text-sm font-medium text-zinc-950 outline-none placeholder-zinc-500 dark:text-white"
                    />
                    <kbd className="inline-flex items-center gap-1 rounded border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-elevated))] px-1.5 py-0.5 text-xs font-bold text-muted  ">ESC</kbd>
                </div>

                <div className="max-h-[62vh] overflow-y-auto px-3 pb-4 pt-1 scroll-container sm:px-0 sm:py-2">
                    {filtered.length === 0 ? (
                        <div className="py-12 text-center text-sm text-muted">
                            {TRANSLATIONS[lang].copy.commandPalette.noResults}
                        </div>
                    ) : (
                        filtered.map((a, i) => {
                            const emphasized = !!a.badge || i === 0;
                            return (
                                <button
                                    key={a.id}
                                    onClick={() => { a.onSelect(); onClose(); }}
                                    onMouseEnter={() => setActiveIdx(i)}
                                    className={`mb-2 flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3.5 text-left transition-all active:scale-[0.985] sm:mb-0 sm:rounded-none sm:border-0 sm:px-4 sm:py-3 ${
                                        emphasized
                                            ? 'border-primary-500/20 bg-primary-500/[0.06]'
                                            : 'border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))]'
                                    } ${i === activeIdx ? 'sm:bg-[rgb(var(--surface-elevated))]' : ''}`}
                                >
                                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br shadow-md ${ACCENT[a.accent || 'zinc']}`}>
                                        <Icon name={a.icon} size={19} />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 truncate text-sm font-black text-[rgb(var(--text-primary))]">
                                            <span className="truncate">{a.label[lang]}</span>
                                            {a.badge && (
                                                <span className="shrink-0 rounded-full border border-primary-500/25 bg-primary-500/10 px-1.5 py-0.5 text-xs font-black uppercase tracking-wider text-primary-600 dark:text-primary-400">
                                                    {a.badge}
                                                </span>
                                            )}
                                        </div>
                                        {a.description && (
                                            <div className="mt-0.5 truncate text-xs leading-snug text-muted">{a.description[lang]}</div>
                                        )}
                                    </div>
                                    <Icon name="ChevronRight" size={17} className="shrink-0 text-zinc-400" />
                                </button>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};