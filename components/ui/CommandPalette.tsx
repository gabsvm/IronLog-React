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
    primary: 'from-primary-500 to-primary-700',
    amber: 'from-primary-500 to-primary-700',
    violet: 'from-primary-500 to-primary-700',
    emerald: 'from-primary-500 to-primary-700',
    zinc: 'from-zinc-500 to-zinc-700',
};

/**
 * Linear/Raycast-style command palette.
 * Used as the primary "Start a session" entry point on Home.
 * Filters as you type; arrow keys + Enter to navigate.
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
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-sheet flex items-end sm:items-start sm:pt-[18vh] justify-center bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label={title || 'Command palette'}
        >
            <motion.div
                initial={{ y: 40, opacity: 0, scale: 0.98 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 20, opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="modal-surface w-full sm:max-w-lg sm:mx-4 border rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden mb-[88px] sm:mb-0"
                onClick={e => e.stopPropagation()}
            >
                {/* Drag handle (mobile only) */}
                <div className="sm:hidden flex justify-center pt-3">
                    <div className="w-10 h-1 rounded-full bg-white/20" />
                </div>

                {/* Search input */}
                <div className="px-4 pt-3 pb-2 flex items-center gap-3 border-b border-white/5">
                    <Icon name="Search" size={18} className="text-zinc-500 shrink-0" />
                    <input
                        autoFocus
                        type="text"
                        value={query}
                        onChange={e => { setQuery(e.target.value); setActiveIdx(0); }}
                        placeholder={lang === 'es' ? 'Buscar acción…' : 'Search action…'}
                        className="flex-1 bg-transparent outline-none text-white placeholder-zinc-600 text-sm font-medium py-2"
                    />
                    <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-bold text-zinc-500">ESC</kbd>
                </div>

                {/* Actions list */}
                <div className="max-h-[60vh] overflow-y-auto scroll-container py-2">
                    {filtered.length === 0 ? (
                        <div className="py-12 text-center text-zinc-500 text-sm">
                            {lang === 'es' ? 'Sin resultados' : 'No results'}
                        </div>
                    ) : (
                        filtered.map((a, i) => (
                            <button
                                key={a.id}
                                onClick={() => { a.onSelect(); onClose(); }}
                                onMouseEnter={() => setActiveIdx(i)}
                                className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-colors duration-150 ${i === activeIdx ? 'bg-white/5' : ''}`}
                            >
                                <span className={`shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shadow-md ${ACCENT[a.accent || 'zinc']}`}>
                                    <Icon name={a.icon} size={18} />
                                </span>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-bold text-white truncate flex items-center gap-2">
                                        {a.label[lang]}
                                        {a.badge && (
                                            <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary-500/20 text-primary-400 border border-primary-500/30">
                                                {a.badge}
                                            </span>
                                        )}
                                    </div>
                                    {a.description && (
                                        <div className="text-[11px] text-zinc-500 leading-snug mt-0.5 truncate">{a.description[lang]}</div>
                                    )}
                                </div>
                                {i === activeIdx && (
                                    <Icon name="ArrowRight" size={14} className="text-zinc-500 shrink-0" />
                                )}
                            </button>
                        ))
                    )}
                </div>
            </motion.div>
        </motion.div>
            )}
        </AnimatePresence>
    );
};
