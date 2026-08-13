import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { Icon } from './Icon';

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
    const { lang } = useApp();
    const [query, setQuery] = useState('');
    const [activeIdx, setActiveIdx] = useState(0);

    useEffect(() => {
        if (!isOpen) {
            setQuery('');
            setActiveIdx(0);
        }
    }, [isOpen]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return actions;
        return actions.filter(a => {
            const label = a.label[lang].toLowerCase();
            const desc = a.description?.[lang].toLowerCase() || '';
            const kws = (a.keywords || []).join(' ').toLowerCase();
            return label.includes(q) || desc.includes(q) || kws.includes(q);
        });
    }, [actions, query, lang]);

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

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    className="fixed inset-0 z-sheet flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-start sm:pt-[18vh]"
                    onClick={onClose}
                    role="dialog"
                    aria-modal="true"
                    aria-label={title || (lang === 'es' ? 'Acciones rápidas' : 'Quick actions')}
                >
                    <motion.div
                        initial={{ y: 42, opacity: 0, scale: 0.985 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 20, opacity: 0, scale: 0.985 }}
                        transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
                        className="modal-surface mb-[calc(env(safe-area-inset-bottom)+72px)] w-full overflow-hidden rounded-t-[1.75rem] border shadow-2xl sm:mb-0 sm:mx-4 sm:max-w-lg sm:rounded-3xl"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-center pb-1 pt-3 sm:hidden">
                            <div className="h-1.5 w-10 rounded-full bg-zinc-300 dark:bg-white/20" />
                        </div>

                        <div className="px-5 pb-3 pt-2 sm:hidden">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h2 className="text-xl font-black tracking-tight text-zinc-950 dark:text-white">
                                        {lang === 'es' ? '¿Qué quieres hacer?' : 'What do you want to do?'}
                                    </h2>
                                    <p className="mt-1 text-xs font-medium text-zinc-500">
                                        {lang === 'es' ? 'Inicia, continúa o gestiona tu entrenamiento.' : 'Start, resume or manage your training.'}
                                    </p>
                                </div>
                                <button
                                    onClick={onClose}
                                    aria-label={lang === 'es' ? 'Cerrar' : 'Close'}
                                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-white/5"
                                >
                                    <Icon name="X" size={17} />
                                </button>
                            </div>
                        </div>

                        <div className="hidden items-center gap-3 border-b border-zinc-200 px-4 pb-2 pt-3 dark:border-white/5 sm:flex">
                            <Icon name="Search" size={18} className="shrink-0 text-zinc-500" />
                            <input
                                type="text"
                                value={query}
                                onChange={e => { setQuery(e.target.value); setActiveIdx(0); }}
                                placeholder={lang === 'es' ? 'Buscar acción…' : 'Search action…'}
                                className="flex-1 bg-transparent py-2 text-sm font-medium text-zinc-950 outline-none placeholder-zinc-500 dark:text-white"
                            />
                            <kbd className="inline-flex items-center gap-1 rounded border border-zinc-200 bg-zinc-100 px-1.5 py-0.5 text-[10px] font-bold text-zinc-500 dark:border-white/10 dark:bg-white/5">ESC</kbd>
                        </div>

                        <div className="max-h-[62vh] overflow-y-auto px-3 pb-4 pt-1 scroll-container sm:px-0 sm:py-2">
                            {filtered.length === 0 ? (
                                <div className="py-12 text-center text-sm text-zinc-500">
                                    {lang === 'es' ? 'Sin resultados' : 'No results'}
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
                                                    : 'border-zinc-200/70 bg-zinc-50 dark:border-white/5 dark:bg-white/[0.025]'
                                            } ${i === activeIdx ? 'sm:bg-white/5' : ''}`}
                                        >
                                            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br shadow-md ${ACCENT[a.accent || 'zinc']}`}>
                                                <Icon name={a.icon} size={19} />
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 truncate text-sm font-black text-zinc-950 dark:text-white">
                                                    <span className="truncate">{a.label[lang]}</span>
                                                    {a.badge && (
                                                        <span className="shrink-0 rounded-full border border-primary-500/25 bg-primary-500/10 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-primary-600 dark:text-primary-400">
                                                            {a.badge}
                                                        </span>
                                                    )}
                                                </div>
                                                {a.description && (
                                                    <div className="mt-0.5 truncate text-[11px] leading-snug text-zinc-500">{a.description[lang]}</div>
                                                )}
                                            </div>
                                            <Icon name="ChevronRight" size={17} className="shrink-0 text-zinc-400" />
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};