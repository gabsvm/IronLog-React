import React, { useMemo, useState } from 'react';
import { Icon } from '../ui/Icon';

interface Props {
    logs: any[];
    activeMesoId?: number | null;
    lang: 'en' | 'es';
}

type WidgetId = 'sessions' | 'week' | 'sets' | 'adherence' | 'duration' | 'exercises' | 'muscles' | 'consistency';

const DEFAULT_WIDGETS: WidgetId[] = ['week', 'adherence', 'consistency', 'sets'];
const STORAGE_KEY = 'gainslab.stats.dashboard.widgets';
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const startOfLocalWeek = (timestamp: number) => {
    const date = new Date(timestamp);
    const day = date.getDay();
    // Monday-based week: training apps should reward weekly consistency rather
    // than dangerous day-by-day streak pressure that can encourage overtraining.
    const diff = (day + 6) % 7;
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - diff);
    return date.getTime();
};

const getWeeklyConsistency = (completed: any[]) => {
    if (!completed.length) return 0;
    const activeWeeks = new Set<number>();
    completed.forEach(log => activeWeeks.add(startOfLocalWeek(Number(log.endTime || log.startTime || 0))));
    const currentWeek = startOfLocalWeek(Date.now());
    let cursor = activeWeeks.has(currentWeek) ? currentWeek : currentWeek - WEEK_MS;
    let streak = 0;
    while (activeWeeks.has(cursor)) {
        streak += 1;
        cursor -= WEEK_MS;
    }
    return streak;
};

export const StatsDashboardWidgets: React.FC<Props> = ({ logs, activeMesoId, lang }) => {
    const [editing, setEditing] = useState(false);
    const [selected, setSelected] = useState<WidgetId[]>(() => {
        try {
            const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
            if (Array.isArray(parsed) && parsed.length) return parsed.slice(0, 4) as WidgetId[];
        } catch { }
        return DEFAULT_WIDGETS;
    });

    const metrics = useMemo(() => {
        const scoped = activeMesoId != null ? logs.filter(log => log.mesoId === activeMesoId) : logs;
        const completed = scoped.filter(log => !log.skipped);
        const now = Date.now();
        const weekSessions = completed.filter(log => now - Number(log.endTime || log.startTime || 0) <= WEEK_MS).length;
        const resolved = scoped.filter(log => log.skipped || (log.exercises || []).some((ex: any) => (ex.sets || []).some((set: any) => set.completed)));
        const adherence = resolved.length ? Math.round((completed.length / resolved.length) * 100) : 0;
        const avgDuration = completed.length ? Math.round(completed.reduce((sum, log) => sum + Number(log.duration || 0), 0) / completed.length / 60) : 0;
        const exercises = new Set<string>();
        const muscles = new Set<string>();
        let sets = 0;
        completed.forEach(log => (log.exercises || []).forEach((exercise: any) => {
            const done = (exercise.sets || []).filter((set: any) => set.completed && !set.skipped);
            if (!done.length) return;
            sets += done.length;
            if (exercise.id != null) exercises.add(String(exercise.id));
            if (exercise.muscle) muscles.add(String(exercise.muscle));
        }));

        return {
            sessions: completed.length,
            week: weekSessions,
            sets,
            adherence,
            duration: avgDuration,
            exercises: exercises.size,
            muscles: muscles.size,
            consistency: getWeeklyConsistency(completed),
        };
    }, [activeMesoId, logs]);

    const definitions: Array<{ id: WidgetId; label: string; value: string; hint: string; icon: string }> = [
        { id: 'week', label: lang === 'es' ? 'Últimos 7 días' : 'Last 7 days', value: String(metrics.week), hint: lang === 'es' ? 'sesiones' : 'sessions', icon: 'Calendar' },
        { id: 'adherence', label: lang === 'es' ? 'Adherencia' : 'Adherence', value: `${metrics.adherence}%`, hint: lang === 'es' ? 'sesiones resueltas' : 'resolved sessions', icon: 'Target' },
        { id: 'consistency', label: lang === 'es' ? 'Constancia' : 'Consistency', value: String(metrics.consistency), hint: lang === 'es' ? 'semanas consecutivas' : 'consecutive weeks', icon: 'Flame' },
        { id: 'sessions', label: lang === 'es' ? 'Sesiones' : 'Sessions', value: String(metrics.sessions), hint: activeMesoId != null ? (lang === 'es' ? 'plan actual' : 'current plan') : (lang === 'es' ? 'historial' : 'history'), icon: 'Dumbbell' },
        { id: 'sets', label: lang === 'es' ? 'Series' : 'Sets', value: String(metrics.sets), hint: lang === 'es' ? 'completadas' : 'completed', icon: 'Layers' },
        { id: 'duration', label: lang === 'es' ? 'Duración media' : 'Avg duration', value: `${metrics.duration}m`, hint: lang === 'es' ? 'por sesión' : 'per session', icon: 'Clock' },
        { id: 'exercises', label: lang === 'es' ? 'Ejercicios' : 'Exercises', value: String(metrics.exercises), hint: lang === 'es' ? 'registrados' : 'tracked', icon: 'Activity' },
        { id: 'muscles', label: lang === 'es' ? 'Músculos' : 'Muscles', value: String(metrics.muscles), hint: lang === 'es' ? 'entrenados' : 'trained', icon: 'Grid3x3' },
    ];

    const visible = selected.map(id => definitions.find(item => item.id === id)).filter(Boolean) as typeof definitions;

    const toggle = (id: WidgetId) => {
        setSelected(prev => {
            let next: WidgetId[];
            if (prev.includes(id)) {
                next = prev.length <= 1 ? prev : prev.filter(item => item !== id);
            } else {
                next = prev.length >= 4 ? [...prev.slice(1), id] : [...prev, id];
            }
            try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { }
            return next;
        });
    };

    return (
        <section className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
                <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-[rgb(var(--text-muted))]">{lang === 'es' ? 'Tu resumen' : 'Your summary'}</div>
                    <div className="mt-0.5 text-xs text-[rgb(var(--text-secondary))]">{lang === 'es' ? 'Lo importante, de un vistazo.' : 'What matters, at a glance.'}</div>
                </div>
                <button type="button" onClick={() => setEditing(value => !value)} className="flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-bold text-[rgb(var(--text-muted))] active:bg-[rgb(var(--surface-raised))]">
                    <Icon name={editing ? 'Check' : 'Sliders'} size={14} /> {editing ? (lang === 'es' ? 'Listo' : 'Done') : (lang === 'es' ? 'Editar' : 'Edit')}
                </button>
            </div>

            {editing && (
                <div className="flex gap-2 overflow-x-auto pb-1 scroll-container">
                    {definitions.map(item => {
                        const active = selected.includes(item.id);
                        return <button key={item.id} type="button" onClick={() => toggle(item.id)} className={`min-h-9 shrink-0 rounded-lg border px-3 text-[11px] font-bold ${active ? 'border-primary-500/30 bg-primary-500/10 text-primary-500' : 'border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] text-[rgb(var(--text-muted))]'}`}>{item.label}</button>;
                    })}
                </div>
            )}

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {visible.map(item => (
                    <div key={item.id} className="rounded-2xl border border-[rgb(var(--border-subtle)/0.8)] bg-[rgb(var(--surface-raised)/0.58)] p-3.5">
                        <div className="flex items-center justify-between gap-2">
                            <div className="text-[9px] font-bold uppercase tracking-[0.09em] text-[rgb(var(--text-muted))]">{item.label}</div>
                            <Icon name={item.icon as any} size={13} className="text-primary-500/70" />
                        </div>
                        <div className="mt-1.5 text-2xl font-black tabular-nums tracking-[-0.04em] text-[rgb(var(--text-primary))]">{item.value}</div>
                        <div className="mt-0.5 text-[10px] text-[rgb(var(--text-muted))]">{item.hint}</div>
                    </div>
                ))}
            </div>
        </section>
    );
};
