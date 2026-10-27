import React, { useMemo, useState } from 'react';
import type { Log } from '../../types';
import { pickLang } from '../../utils/i18n';

interface Props {
    logs: Log[];
    lang: 'es' | 'en';
    initialDay: string | null;
    onApply: (dayKey: string | null) => void;
    onClose: () => void;
}

const dayKeyOf = (ts: number): string => {
    const d = new Date(ts);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Strong parity history calendar: month grid with workout dots; tapping a day filters the list. */
export const HistoryCalendar: React.FC<Props> = ({ logs, lang, initialDay, onApply, onClose }) => {
    const today = new Date();
    const [cursor, setCursor] = useState(() => {
        if (initialDay) {
            const [y, m] = initialDay.split('-').map(Number);
            if (y && m) return new Date(y, m - 1, 1);
        }
        return new Date(today.getFullYear(), today.getMonth(), 1);
    });
    const [selected, setSelected] = useState<string | null>(initialDay);

    const daysWithLogs = useMemo(() => {
        const set = new Set<string>();
        for (const log of logs || []) {
            const ts = Number(log.endTime) || Number(log.startTime) || 0;
            if (ts > 0) set.add(dayKeyOf(ts));
        }
        return set;
    }, [logs]);

    const cells = useMemo(() => {
        const year = cursor.getFullYear();
        const month = cursor.getMonth();
        const first = new Date(year, month, 1);
        // Monday-first columns like Strong.
        const lead = (first.getDay() + 6) % 7;
        const out: Array<{ key: string; day: number | null; inMonth: boolean }> = [];
        for (let i = 0; i < lead; i++) out.push({ key: `pad-${i}`, day: null, inMonth: false });
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        for (let d = 1; d <= daysInMonth; d++) {
            const dt = new Date(year, month, d);
            out.push({ key: dayKeyOf(dt.getTime()), day: d, inMonth: true });
        }
        return out;
    }, [cursor]);

    const title = cursor.toLocaleDateString(pickLang(lang, { es: 'es-ES', en: 'en-US' }), { month: 'long', year: 'numeric' });
    const go = (delta: number) => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + delta, 1));

    return (
        <div className="fixed inset-0 z-modal flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-label={pickLang(lang, { es: 'Calendario', en: 'Calendar' })}>
            <div className="w-full max-w-sm rounded-3xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-base))] p-4">
                <div className="mb-2 flex items-center justify-between">
                    <h2 className="text-lg font-black capitalize text-[rgb(var(--text-primary))]">{title}</h2>
                    <div className="flex gap-1">
                        <button type="button" onClick={() => go(-1)} aria-label="‹" className="flex h-10 w-10 items-center justify-center rounded-full text-[rgb(var(--text-secondary))] active:bg-white/5">‹</button>
                        <button type="button" onClick={() => go(1)} aria-label="›" className="flex h-10 w-10 items-center justify-center rounded-full text-[rgb(var(--text-secondary))] active:bg-white/5">›</button>
                        <button type="button" onClick={onClose} aria-label={pickLang(lang, { es: 'Cerrar', en: 'Close' })} className="flex h-10 w-10 items-center justify-center rounded-full text-[rgb(var(--text-secondary))] active:bg-white/5">✕</button>
                    </div>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase text-muted">
                    {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d, i) => <span key={i} className="py-1">{d}</span>)}
                </div>
                <div className="grid grid-cols-7 gap-1">
                    {cells.map((c) => c.day === null ? <span key={c.key} /> : (
                        <button
                            key={c.key}
                            type="button"
                            onClick={() => setSelected((prev) => (prev === c.key ? null : c.key))}
                            aria-pressed={selected === c.key}
                            className={`flex min-h-[44px] flex-col items-center justify-center rounded-xl text-sm font-semibold ${selected === c.key ? 'bg-primary-500 text-zinc-950' : 'text-[rgb(var(--text-primary))] active:bg-white/5'}`}
                        >
                            <span>{c.day}</span>
                            {daysWithLogs.has(c.key) && <span className={`mt-0.5 h-1 w-1 rounded-full ${selected === c.key ? 'bg-zinc-950' : 'bg-emerald-400'}`} />}
                        </button>
                    ))}
                </div>
                <div className="mt-3 flex gap-2">
                    {selected && (
                        <button type="button" onClick={() => setSelected(null)} className="min-h-[44px] flex-1 rounded-full border border-[rgb(var(--border-subtle))] text-sm font-semibold text-[rgb(var(--text-secondary))]">
                            {pickLang(lang, { es: 'Limpiar', en: 'Clear' })}
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => { onApply(selected); onClose(); }}
                        className="min-h-[44px] flex-1 rounded-full bg-primary-500 text-sm font-bold text-zinc-950"
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
};
