import React, { useMemo, useState } from 'react';
import { Icon } from '../ui/Icon';

interface Props {
    logs: any[];
    selectedDate: string | null;
    onSelectDate: (date: string | null) => void;
    lang: 'en' | 'es';
}

const dateKey = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export const HistoryCalendar: React.FC<Props> = ({ logs, selectedDate, onSelectDate, lang }) => {
    const latest = logs.find(log => !log.skipped);
    const [cursor, setCursor] = useState(() => {
        const source = latest ? new Date(latest.endTime || latest.startTime) : new Date();
        return new Date(source.getFullYear(), source.getMonth(), 1);
    });

    const counts = useMemo(() => {
        const map = new Map<string, number>();
        logs.filter(log => !log.skipped).forEach(log => {
            const key = dateKey(Number(log.endTime || log.startTime));
            map.set(key, (map.get(key) || 0) + 1);
        });
        return map;
    }, [logs]);

    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthLabel = cursor.toLocaleDateString(lang === 'es' ? 'es-AR' : 'en-US', { month: 'long', year: 'numeric' });
    const weekdays = lang === 'es' ? ['D', 'L', 'M', 'X', 'J', 'V', 'S'] : ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    const cells: Array<number | null> = [
        ...Array.from({ length: firstWeekday }, () => null),
        ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
    ];
    while (cells.length % 7 !== 0) cells.push(null);

    return (
        <section className="mx-4 mb-3 rounded-2xl border border-[rgb(var(--border-subtle)/0.78)] bg-[rgb(var(--surface-raised)/0.58)] p-3.5">
            <div className="mb-3 flex items-center justify-between gap-3">
                <button type="button" onClick={() => setCursor(new Date(year, month - 1, 1))} className="flex h-9 w-9 items-center justify-center rounded-lg text-[rgb(var(--text-muted))] active:bg-[rgb(var(--surface-base))]" aria-label={lang === 'es' ? 'Mes anterior' : 'Previous month'}><Icon name="ChevronLeft" size={17} /></button>
                <div className="text-sm font-black capitalize tracking-tight">{monthLabel}</div>
                <button type="button" onClick={() => setCursor(new Date(year, month + 1, 1))} className="flex h-9 w-9 items-center justify-center rounded-lg text-[rgb(var(--text-muted))] active:bg-[rgb(var(--surface-base))]" aria-label={lang === 'es' ? 'Mes siguiente' : 'Next month'}><Icon name="ChevronRight" size={17} /></button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center">
                {weekdays.map((day, index) => <div key={`${day}-${index}`} className="py-1 text-[9px] font-bold uppercase text-[rgb(var(--text-muted))]">{day}</div>)}
                {cells.map((day, index) => {
                    if (!day) return <div key={`blank-${index}`} className="h-9" />;
                    const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const count = counts.get(key) || 0;
                    const active = selectedDate === key;
                    const today = key === dateKey(Date.now());
                    return (
                        <button
                            key={key}
                            type="button"
                            onClick={() => onSelectDate(active ? null : key)}
                            className={`relative flex h-9 items-center justify-center rounded-lg text-xs font-bold transition-colors ${active ? 'bg-primary-500 text-black' : count > 0 ? 'bg-primary-500/10 text-[rgb(var(--text-primary))]' : 'text-[rgb(var(--text-muted))]'} ${today && !active ? 'ring-1 ring-primary-500/35' : ''}`}
                            aria-label={`${key}${count ? ` · ${count}` : ''}`}
                        >
                            {day}
                            {count > 0 && !active && <span className="absolute bottom-1 h-1 w-1 rounded-full bg-primary-500" />}
                        </button>
                    );
                })}
            </div>

            {selectedDate && (
                <button type="button" onClick={() => onSelectDate(null)} className="mt-3 flex min-h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-[rgb(var(--surface-base))] text-[11px] font-bold text-[rgb(var(--text-muted))] active:text-primary-500">
                    <Icon name="X" size={13} /> {lang === 'es' ? 'Ver todo el historial' : 'Show all history'}
                </button>
            )}
        </section>
    );
};
