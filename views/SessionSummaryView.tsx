import React, { useMemo } from 'react';
import { Log, MuscleGroup } from '../types';
import { Icon } from '../components/ui/Icon';
import { Button } from '../components/ui/Button';
import { useApp } from '../context/AppContext';
import { TRANSLATIONS } from '../constants';
import { getTranslated } from '../utils';
import { getLogBodyWeight, getSetLoadVolume } from '../utils/trainingMetrics';

interface SessionSummaryViewProps {
    log: Log;
    onClose: () => void;
}

type Improvement = {
    exercise: string;
    detail: string;
};

const formatDuration = (sec: number) => {
    const safe = Math.max(0, Number(sec) || 0);
    const h = Math.floor(safe / 3600);
    const m = Math.floor((safe % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const workingSets = (exercise: any) => (exercise.sets || []).filter((set: any) => (
    set.completed && !set.skipped && set.type !== 'warmup' && set.type !== 'avt_hop'
));

const bestWeightedSet = (exercise: any) => {
    const sets = workingSets(exercise);
    if (!sets.length) return null;
    return sets.reduce((best: any, set: any) => {
        const weight = Number(set.weight || 0);
        const reps = Number(set.reps || 0);
        const score = weight > 0 && reps > 0 ? weight * (1 + reps / 30) : 0;
        const bestWeight = Number(best.weight || 0);
        const bestReps = Number(best.reps || 0);
        const bestScore = bestWeight > 0 && bestReps > 0 ? bestWeight * (1 + bestReps / 30) : 0;
        return score > bestScore ? set : best;
    }, sets[0]);
};

const formatNumber = (value: number) => Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, '');

export const SessionSummaryView: React.FC<SessionSummaryViewProps> = ({ log, onClose }) => {
    const { lang, userProfile, logs } = useApp();
    const safeLogs = Array.isArray(logs) ? logs : [];
    const t = TRANSLATIONS[lang];

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

    const improvements = useMemo<Improvement[]>(() => {
        if (!previous) return [];
        const previousById = new Map((previous.exercises || []).filter(exercise => exercise.id != null).map(exercise => [String(exercise.id), exercise]));
        const found: Improvement[] = [];

        (log.exercises || []).forEach(exercise => {
            if (exercise.id == null) return;
            const prior = previousById.get(String(exercise.id));
            if (!prior) return;
            const name = String(getTranslated(exercise.name, lang) || exercise.id);
            const currentSets = workingSets(exercise);
            const priorSets = workingSets(prior);
            if (!currentSets.length || !priorSets.length) return;

            if (exercise.muscle === 'CARDIO') {
                const currentDistance = Math.max(...currentSets.map((set: any) => Number(set.distance || 0)), 0);
                const priorDistance = Math.max(...priorSets.map((set: any) => Number(set.distance || 0)), 0);
                if (currentDistance > priorDistance + 0.01) {
                    found.push({ exercise: name, detail: lang === 'es' ? `+${formatNumber(currentDistance - priorDistance)} km de distancia` : `+${formatNumber(currentDistance - priorDistance)} km distance` });
                    return;
                }
                const currentDuration = Math.max(...currentSets.map((set: any) => Number(set.duration || 0)), 0);
                const priorDuration = Math.max(...priorSets.map((set: any) => Number(set.duration || 0)), 0);
                if (currentDuration > priorDuration) {
                    found.push({ exercise: name, detail: lang === 'es' ? `+${formatNumber(currentDuration - priorDuration)} min de duración` : `+${formatNumber(currentDuration - priorDuration)} min duration` });
                }
                return;
            }

            if (exercise.isIsometric) {
                const currentHold = Math.max(...currentSets.map((set: any) => Number(set.duration || 0)), 0);
                const priorHold = Math.max(...priorSets.map((set: any) => Number(set.duration || 0)), 0);
                if (currentHold > priorHold) {
                    found.push({ exercise: name, detail: lang === 'es' ? `+${formatNumber(currentHold - priorHold)}s de hold` : `+${formatNumber(currentHold - priorHold)}s hold` });
                }
                return;
            }

            if (exercise.isBodyweight) {
                const currentLoad = Math.max(...currentSets.map((set: any) => Number(set.weight || 0)), 0);
                const priorLoad = Math.max(...priorSets.map((set: any) => Number(set.weight || 0)), 0);
                if (currentLoad > priorLoad + 0.01) {
                    found.push({ exercise: name, detail: lang === 'es' ? `+${formatNumber(currentLoad - priorLoad)} kg de lastre` : `+${formatNumber(currentLoad - priorLoad)} kg added load` });
                    return;
                }
                const currentReps = Math.max(...currentSets.map((set: any) => Number(set.reps || 0)), 0);
                const priorReps = Math.max(...priorSets.map((set: any) => Number(set.reps || 0)), 0);
                if (currentReps > priorReps) {
                    const delta = currentReps - priorReps;
                    found.push({ exercise: name, detail: lang === 'es' ? `+${delta} rep${delta === 1 ? '' : 's'}` : `+${delta} rep${delta === 1 ? '' : 's'}` });
                }
                return;
            }

            const currentBest = bestWeightedSet(exercise);
            const priorBest = bestWeightedSet(prior);
            if (!currentBest || !priorBest) return;
            const currentWeight = Number(currentBest.weight || 0);
            const currentReps = Number(currentBest.reps || 0);
            const priorWeight = Number(priorBest.weight || 0);
            const priorReps = Number(priorBest.reps || 0);
            const currentE1rm = currentWeight > 0 && currentReps > 0 ? currentWeight * (1 + currentReps / 30) : 0;
            const priorE1rm = priorWeight > 0 && priorReps > 0 ? priorWeight * (1 + priorReps / 30) : 0;
            if (currentE1rm <= priorE1rm * 1.005) return;

            if (currentWeight > priorWeight + 0.01) {
                found.push({ exercise: name, detail: `+${formatNumber(currentWeight - priorWeight)} kg · ${formatNumber(currentWeight)} × ${currentReps}` });
            } else if (Math.abs(currentWeight - priorWeight) < 0.01 && currentReps > priorReps) {
                const delta = currentReps - priorReps;
                found.push({ exercise: name, detail: lang === 'es' ? `+${delta} rep${delta === 1 ? '' : 's'} con ${formatNumber(currentWeight)} kg` : `+${delta} rep${delta === 1 ? '' : 's'} at ${formatNumber(currentWeight)} kg` });
            } else {
                found.push({ exercise: name, detail: `e1RM +${formatNumber(currentE1rm - priorE1rm)} kg` });
            }
        });

        return found;
    }, [lang, log.exercises, previous]);

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

                    {improvements.length > 0 && (
                        <section className="rounded-2xl border border-primary-500/20 bg-primary-500/[0.055] p-4">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2"><Icon name="TrendingUp" size={16} className="text-primary-500" /><h2 className="text-sm font-black">{lang === 'es' ? 'Mejoras de hoy' : 'Today’s improvements'}</h2></div>
                                <span className="rounded-lg bg-primary-500/10 px-2 py-1 text-[10px] font-black tabular-nums text-primary-500">{improvements.length}</span>
                            </div>
                            <div className="mt-3 divide-y divide-[rgb(var(--border-subtle))]">
                                {improvements.slice(0, 4).map((item, index) => (
                                    <div key={`${item.exercise}-${index}`} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-500/10 text-primary-500"><Icon name="TrendingUp" size={14} /></span>
                                        <span className="min-w-0 flex-1"><span className="block truncate text-xs font-black">{item.exercise}</span><span className="mt-0.5 block text-[11px] font-bold text-[rgb(var(--text-secondary))]">{item.detail}</span></span>
                                    </div>
                                ))}
                            </div>
                            {improvements.length > 4 && <p className="mt-3 text-[10px] font-bold text-[rgb(var(--text-muted))]">{lang === 'es' ? `+${improvements.length - 4} mejora(s) más en el detalle de ejercicios.` : `+${improvements.length - 4} more improvement(s) in exercise details.`}</p>}
                        </section>
                    )}

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
                            <div className="mt-2 flex flex-wrap gap-1.5">{stats.muscles.map(muscle => <span key={muscle} className="rounded-lg border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised)/0.55)] px-2.5 py-1.5 text-[10px] font-bold text-[rgb(var(--text-secondary))]">{t.muscle[muscle as MuscleGroup] || muscle}</span>)}</div>
                        </section>
                    )}

                    <div className="rounded-2xl border border-primary-500/15 bg-primary-500/[0.055] p-4 text-xs leading-relaxed text-[rgb(var(--text-secondary))]">
                        <div className="flex gap-2"><Icon name="Info" size={15} className="mt-0.5 shrink-0 text-primary-500" /><span>{lang === 'es' ? 'Historial, gráficas, récords y notas viven ahora en el detalle de cada ejercicio dentro de Progreso → Ejercicios.' : 'History, charts, records, and notes now live in each exercise detail under Progress → Exercises.'}</span></div>
                    </div>
                </div>
            </div>

            <div className="shrink-0 border-t border-[rgb(var(--border-subtle)/0.7)] bg-[rgb(var(--surface-base)/0.96)] p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
                <div className="mx-auto max-w-md"><Button fullWidth onClick={onClose} className="h-12">{lang === 'es' ? 'Volver a Hoy' : 'Back to Today'}</Button></div>
            </div>
        </div>
    );
};
