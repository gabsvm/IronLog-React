import React, { useMemo } from 'react';
import { Log } from '../types';
import { Icon } from '../components/ui/Icon';
import { Button } from '../components/ui/Button';
import { useApp } from '../context/AppContext';
import { getLogBodyWeight, getSetLoadVolume } from '../utils/trainingMetrics';

interface SessionSummaryViewProps {
    log: Log;
    onClose: () => void;
}

const formatDuration = (sec: number) => {
    const safe = Math.max(0, Number(sec) || 0);
    const h = Math.floor(safe / 3600);
    const m = Math.floor((safe % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

export const SessionSummaryView: React.FC<SessionSummaryViewProps> = ({ log, onClose }) => {
    const { lang, userProfile, logs } = useApp();
    const safeLogs = Array.isArray(logs) ? logs : [];

    const summarize = (entry: Log) => {
        let volume = 0;
        let sets = 0;
        const muscles = new Set<string>();
        const bodyWeight = getLogBodyWeight(entry, userProfile?.bodyWeight);
        (entry.exercises || []).forEach(exercise => {
            if (exercise.muscle && exercise.muscle !== 'CARDIO') muscles.add(exercise.muscle);
            (exercise.sets || []).forEach(set => {
                if (!set.completed || set.skipped || set.type === 'avt_hop') return;
                sets += 1;
                volume += getSetLoadVolume(set, exercise, bodyWeight);
            });
        });
        return { volume, sets, muscles: Array.from(muscles), duration: Number(entry.duration || 0) };
    };

    const stats = useMemo(() => summarize(log), [log, userProfile?.bodyWeight]);

    const previous = useMemo(() => {
        return safeLogs
            .filter(item => item.id !== log.id && !item.skipped)
            .filter(item => item.name === log.name || (item.dayIdx === log.dayIdx && item.mesoId === log.mesoId))
            .sort((a, b) => Number(b.endTime || b.startTime || 0) - Number(a.endTime || a.startTime || 0))[0] || null;
    }, [log.dayIdx, log.id, log.mesoId, log.name, safeLogs]);

    const previousStats = useMemo(() => previous ? summarize(previous) : null, [previous, userProfile?.bodyWeight]);
    const volumeDelta = previousStats?.volume ? Math.round(((stats.volume - previousStats.volume) / previousStats.volume) * 100) : null;
    const setDelta = previousStats ? stats.sets - previousStats.sets : null;

    const summaryCards = [
        { icon: 'Clock', label: lang === 'es' ? 'Duración' : 'Duration', value: formatDuration(stats.duration) },
        { icon: 'CheckCircle', label: lang === 'es' ? 'Series' : 'Sets', value: String(stats.sets) },
        { icon: 'Dumbbell', label: lang === 'es' ? 'Volumen' : 'Volume', value: `${Math.round(stats.volume).toLocaleString()} kg` },
    ];

    return (
        <div className="flex h-full flex-col bg-[rgb(var(--surface-app))] text-[rgb(var(--text-primary))]">
            <div className="flex-1 overflow-y-auto p-5 scroll-container">
                <div className="mx-auto w-full max-w-md space-y-5 pt-safe">
                    <header className="pt-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-500/10 text-primary-500"><Icon name="CheckCircle" size={22} /></div>
                        <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.1em] text-primary-500">{lang === 'es' ? 'Entrenamiento completado' : 'Workout complete'}</p>
                        <h1 className="mt-1 text-2xl font-black tracking-[-0.04em]">{log.name}</h1>
                        <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">{lang === 'es' ? 'Esto es lo que hiciste hoy.' : 'Here is what you did today.'}</p>
                    </header>

                    <div className="grid grid-cols-3 gap-2">
                        {summaryCards.map(card => (
                            <div key={card.label} className="rounded-2xl border border-[rgb(var(--border-subtle)/0.8)] bg-[rgb(var(--surface-raised)/0.58)] p-3">
                                <Icon name={card.icon} size={14} className="text-primary-500/75" />
                                <div className="mt-2 text-lg font-black tabular-nums tracking-tight">{card.value}</div>
                                <div className="mt-0.5 text-[9px] font-bold text-[rgb(var(--text-muted))]">{card.label}</div>
                            </div>
                        ))}
                    </div>

                    {previousStats && (
                        <section className="rounded-2xl border border-[rgb(var(--border-subtle)/0.8)] bg-[rgb(var(--surface-raised)/0.58)] p-4">
                            <div className="flex items-center gap-2"><Icon name="TrendingUp" size={15} className="text-primary-500" /><h2 className="text-sm font-black">{lang === 'es' ? 'Vs. sesión anterior' : 'Vs. previous session'}</h2></div>
                            <div className="mt-3 grid grid-cols-2 gap-2">
                                <div className="rounded-xl bg-[rgb(var(--surface-base))] p-3"><div className="text-[9px] font-bold text-[rgb(var(--text-muted))]">{lang === 'es' ? 'Volumen' : 'Volume'}</div><div className={`mt-1 text-base font-black tabular-nums ${volumeDelta == null || volumeDelta === 0 ? '' : volumeDelta > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>{volumeDelta == null ? '—' : `${volumeDelta > 0 ? '+' : ''}${volumeDelta}%`}</div></div>
                                <div className="rounded-xl bg-[rgb(var(--surface-base))] p-3"><div className="text-[9px] font-bold text-[rgb(var(--text-muted))]">{lang === 'es' ? 'Series' : 'Sets'}</div><div className={`mt-1 text-base font-black tabular-nums ${setDelta === 0 ? '' : (setDelta || 0) > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>{setDelta == null ? '—' : `${setDelta > 0 ? '+' : ''}${setDelta}`}</div></div>
                            </div>
                        </section>
                    )}

                    {stats.muscles.length > 0 && (
                        <section>
                            <h2 className="px-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[rgb(var(--text-muted))]">{lang === 'es' ? 'Músculos trabajados' : 'Muscles trained'}</h2>
                            <div className="mt-2 flex flex-wrap gap-1.5">{stats.muscles.map(muscle => <span key={muscle} className="rounded-lg border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised)/0.55)] px-2.5 py-1.5 text-[10px] font-bold text-[rgb(var(--text-secondary))]">{muscle}</span>)}</div>
                        </section>
                    )}

                    <div className="rounded-2xl border border-primary-500/15 bg-primary-500/[0.055] p-4 text-xs leading-relaxed text-[rgb(var(--text-secondary))]">
                        <div className="flex gap-2"><Icon name="Info" size={15} className="mt-0.5 shrink-0 text-primary-500" /><span>{lang === 'es' ? 'Los récords y tendencias quedan disponibles en Progreso y en el detalle de cada ejercicio.' : 'Records and trends are available under Progress and each exercise detail.'}</span></div>
                    </div>
                </div>
            </div>

            <div className="shrink-0 border-t border-[rgb(var(--border-subtle)/0.7)] bg-[rgb(var(--surface-base)/0.96)] p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
                <div className="mx-auto max-w-md"><Button fullWidth onClick={onClose} className="h-12">{lang === 'es' ? 'Volver a Hoy' : 'Back to Today'}</Button></div>
            </div>
        </div>
    );
};
