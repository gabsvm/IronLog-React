import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../constants';
import { ExerciseDef, SessionExercise, VolumeCountingMode } from '../../types';
import { Icon } from './Icon';
import { getTranslated } from '../../utils';
import { MuscleTag } from '../workout/MuscleTag';
import { Button } from './Button';
import { ProgressChart } from '../stats/ProgressChart';
import { Sheet } from './Sheet';
import { useStatsWorker, ChartMetric } from '../../hooks/useStatsWorker';
import { useStore } from '../../lib/store';

interface ExerciseDetailModalProps {
    exercise: ExerciseDef;
    onClose: () => void;
}

type DetailTab = 'overview' | 'history' | 'charts' | 'records' | 'notes';

const tabItems: Array<{ id: DetailTab; es: string; en: string }> = [
    { id: 'overview', es: 'Resumen', en: 'Overview' },
    { id: 'history', es: 'Historial', en: 'History' },
    { id: 'charts', es: 'Gráfica', en: 'Charts' },
    { id: 'records', es: 'Récords', en: 'Records' },
    { id: 'notes', es: 'Notas', en: 'Notes' },
];

const metricForExercise = (exercise: ExerciseDef): ChartMetric => {
    if (exercise.isIsometric) return 'hold_time';
    if (exercise.muscle === 'CARDIO') return 'duration';
    if (exercise.isBodyweight) return 'max_reps';
    return '1rm';
};

const YouTubePreview: React.FC<{ videoId: string; title: string }> = ({ videoId, title }) => {
    const [thumbError, setThumbError] = useState(false);
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const thumb = `https://img.youtube.com/vi/${videoId}/${thumbError ? 'hqdefault' : 'maxresdefault'}.jpg`;
    return (
        <a href={url} target="_blank" rel="noopener noreferrer" className="group relative block aspect-video overflow-hidden rounded-2xl bg-black">
            <img src={thumb} alt={title} onError={() => setThumbError(true)} className="h-full w-full object-cover transition-transform duration-200 group-active:scale-[0.99]" />
            <div className="absolute inset-0 bg-black/25" />
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-white shadow-xl"><Icon name="Play" size={22} fill="currentColor" /></span>
            </div>
            <span className="absolute bottom-2 right-2 rounded-lg bg-black/70 px-2 py-1 text-[9px] font-bold text-white">YouTube</span>
        </a>
    );
};

export const ExerciseDetailModal: React.FC<ExerciseDetailModalProps> = ({ exercise, onClose }) => {
    const { lang, logs, setExercises, setLogs } = useApp();
    const t = TRANSLATIONS[lang];
    const setActiveSession = useStore(state => state.setActiveSession);
    const [activeTab, setActiveTab] = useState<DetailTab>('overview');
    const [volumeCountingMode, setVolumeCountingMode] = useState<VolumeCountingMode>(exercise.volumeCountingMode || 'total');
    const [userNote, setUserNote] = useState(String((exercise as any).userNote || ''));
    const { isWorkerReady, calculateChartData } = useStatsWorker();
    const [chartData, setChartData] = useState<any[]>([]);
    const [chartLoading, setChartLoading] = useState(false);

    const safeLogs = useMemo(() => Array.isArray(logs) ? logs : [], [logs]);
    const translatedName = String(getTranslated(exercise.name, lang));
    const translatedInstructions = getTranslated(exercise.instructions, lang);
    const chartMetric = metricForExercise(exercise);

    useEffect(() => {
        setVolumeCountingMode(exercise.volumeCountingMode || 'total');
        setUserNote(String((exercise as any).userNote || ''));
    }, [exercise]);

    const exerciseHistory = useMemo(() => safeLogs
        .filter(log => !log.skipped)
        .map(log => {
            const snapshot = (log.exercises || []).find(item => item.id === exercise.id);
            if (!snapshot) return null;
            const completed = (snapshot.sets || []).filter(set => set.completed && !set.skipped);
            return completed.length ? { log, snapshot, completed } : null;
        })
        .filter(Boolean) as Array<{ log: any; snapshot: any; completed: any[] }>, [exercise.id, safeLogs]);

    const records = useMemo(() => {
        let bestWeight = 0;
        let bestReps = 0;
        let bestE1rm = 0;
        let bestHold = 0;
        let bestDistance = 0;
        let longestCardio = 0;
        let totalSets = 0;
        let totalVolume = 0;
        exerciseHistory.forEach(({ completed }) => completed.forEach(set => {
            totalSets += 1;
            const weight = Number(set.weight || 0);
            const reps = Number(set.reps || 0);
            const duration = Number(set.duration || 0);
            const distance = Number(set.distance || 0);
            bestWeight = Math.max(bestWeight, weight);
            bestReps = Math.max(bestReps, reps);
            bestHold = Math.max(bestHold, duration);
            bestDistance = Math.max(bestDistance, distance);
            longestCardio = Math.max(longestCardio, duration);
            totalVolume += weight * reps;
            if (!exercise.isIsometric && exercise.muscle !== 'CARDIO' && weight > 0 && reps > 0) bestE1rm = Math.max(bestE1rm, weight * (1 + reps / 30));
        }));
        return { bestWeight, bestReps, bestE1rm, bestHold, bestDistance, longestCardio, totalSets, totalVolume };
    }, [exercise.isIsometric, exercise.muscle, exerciseHistory]);

    useEffect(() => {
        if (activeTab !== 'charts' || !isWorkerReady || !exerciseHistory.length) return;
        let cancelled = false;
        setChartLoading(true);
        void calculateChartData(safeLogs, exercise.id, chartMetric).then(points => {
            if (!cancelled) {
                setChartData(points);
                setChartLoading(false);
            }
        });
        return () => { cancelled = true; };
    }, [activeTab, calculateChartData, chartMetric, exercise.id, exerciseHistory.length, isWorkerReady, safeLogs]);

    const saveChanges = () => {
        const updateLibrary = <T extends ExerciseDef>(item: T): T => (item.id === exercise.id ? { ...item, volumeCountingMode, userNote } : item) as T;
        const updateLogSnapshot = <T extends ExerciseDef>(item: T): T => (item.id === exercise.id ? { ...item, volumeCountingMode } : item) as T;
        setExercises(prev => prev.map(updateLibrary));
        setLogs(prev => prev.map(log => ({ ...log, exercises: (log.exercises || []).map(updateLogSnapshot) })));
        setActiveSession(session => session ? {
            ...session,
            exercises: session.exercises.map(item => item.id === exercise.id ? { ...item, volumeCountingMode, userNote } as SessionExercise : item),
        } : session);
        onClose();
    };

    const formatHistoryValue = (completed: any[]) => {
        if (exercise.muscle === 'CARDIO') {
            const duration = Math.max(...completed.map(set => Number(set.duration || 0)), 0);
            const distance = Math.max(...completed.map(set => Number(set.distance || 0)), 0);
            return distance > 0 ? `${distance.toFixed(1)} km` : `${Math.round(duration)} min`;
        }
        if (exercise.isIsometric) return `${Math.max(...completed.map(set => Number(set.duration || 0)), 0)}s`;
        const best = completed.reduce((current, set) => {
            const currentScore = Number(current.weight || 0) * Math.max(1, Number(current.reps || 0));
            const nextScore = Number(set.weight || 0) * Math.max(1, Number(set.reps || 0));
            return nextScore > currentScore ? set : current;
        }, completed[0]);
        return exercise.isBodyweight
            ? `${best.reps || 0} reps${Number(best.weight || 0) > 0 ? ` +${best.weight}kg` : ''}`
            : `${best.weight || 0} kg × ${best.reps || 0}`;
    };

    const recordCards = exercise.muscle === 'CARDIO'
        ? [
            { label: lang === 'es' ? 'Distancia máxima' : 'Max distance', value: records.bestDistance ? `${records.bestDistance.toFixed(1)} km` : '—' },
            { label: lang === 'es' ? 'Duración máxima' : 'Max duration', value: records.longestCardio ? `${Math.round(records.longestCardio)} min` : '—' },
            { label: lang === 'es' ? 'Series registradas' : 'Logged sets', value: String(records.totalSets) },
        ]
        : exercise.isIsometric
            ? [
                { label: lang === 'es' ? 'Mejor hold' : 'Best hold', value: records.bestHold ? `${records.bestHold}s` : '—' },
                { label: lang === 'es' ? 'Series registradas' : 'Logged sets', value: String(records.totalSets) },
            ]
            : exercise.isBodyweight
                ? [
                    { label: lang === 'es' ? 'Máximas reps' : 'Max reps', value: records.bestReps ? String(records.bestReps) : '—' },
                    { label: lang === 'es' ? 'Máximo lastre' : 'Max added load', value: records.bestWeight ? `${records.bestWeight} kg` : '—' },
                    { label: lang === 'es' ? 'Series registradas' : 'Logged sets', value: String(records.totalSets) },
                ]
                : [
                    { label: lang === 'es' ? 'Mejor e1RM' : 'Best e1RM', value: records.bestE1rm ? `${Math.round(records.bestE1rm)} kg` : '—' },
                    { label: lang === 'es' ? 'Mayor carga' : 'Heaviest load', value: records.bestWeight ? `${records.bestWeight} kg` : '—' },
                    { label: lang === 'es' ? 'Máximas reps' : 'Max reps', value: records.bestReps ? String(records.bestReps) : '—' },
                    { label: lang === 'es' ? 'Volumen acumulado' : 'Accumulated volume', value: records.totalVolume ? `${Math.round(records.totalVolume).toLocaleString()} kg` : '—' },
                ];

    return (
        <Sheet
            open={true}
            onOpenChange={(open) => { if (!open) onClose(); }}
            title={translatedName}
            description={lang === 'es' ? 'Detalle del ejercicio' : 'Exercise detail'}
            accent="primary"
            footer={<div className="grid grid-cols-2 gap-3"><Button variant="secondary" onClick={onClose}>{t.close || (lang === 'es' ? 'Cerrar' : 'Close')}</Button><Button onClick={saveChanges}>{lang === 'es' ? 'Guardar' : 'Save'}</Button></div>}
        >
            <div className="px-4 pt-1"><MuscleTag label={exercise.muscle} /></div>
            <div className="mx-4 mt-3 overflow-x-auto scroll-container">
                <div role="tablist" className="flex min-w-max gap-1 rounded-xl bg-[rgb(var(--surface-raised))] p-1">
                    {tabItems.map(item => (
                        <button key={item.id} type="button" role="tab" aria-selected={activeTab === item.id} onClick={() => setActiveTab(item.id)} className={`min-h-9 rounded-lg px-3 text-[11px] font-bold transition-colors ${activeTab === item.id ? 'bg-primary-500 text-black' : 'text-[rgb(var(--text-muted))]'}`}>
                            {lang === 'es' ? item.es : item.en}
                        </button>
                    ))}
                </div>
            </div>

            <div className="max-h-[66vh] overflow-y-auto scroll-container">
                {activeTab === 'overview' && (
                    <div className="space-y-4 p-4">
                        {exercise.videoId ? <YouTubePreview videoId={exercise.videoId} title={translatedName} /> : (
                            <div className="flex min-h-28 items-center gap-4 rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised)/0.65)] p-4">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-500/10 text-primary-500"><Icon name="Dumbbell" size={24} /></div>
                                <div className="min-w-0"><div className="text-sm font-black">{translatedName}</div><div className="mt-1 text-xs text-[rgb(var(--text-muted))]">{lang === 'es' ? 'Sin video asignado. Busca una demostración si necesitas revisar la técnica.' : 'No video assigned. Search a demo if you need a technique refresher.'}</div><a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(translatedName + ' technique tutorial')}`} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-primary-500"><Icon name="ExternalLink" size={12} /> YouTube</a></div>
                            </div>
                        )}
                        <section className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised)/0.62)] p-4">
                            <h4 className="text-[10px] font-bold uppercase tracking-[0.1em] text-[rgb(var(--text-muted))]">{t.instructions || (lang === 'es' ? 'Instrucciones' : 'Instructions')}</h4>
                            <p className="mt-2 text-sm leading-relaxed text-[rgb(var(--text-secondary))]">{translatedInstructions && translatedInstructions !== 'Unknown' ? String(translatedInstructions) : (lang === 'es' ? 'Sin instrucciones específicas.' : 'No specific instructions yet.')}</p>
                        </section>
                        {exercise.muscle !== 'CARDIO' && (
                            <section><h4 className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[rgb(var(--text-muted))]">{lang === 'es' ? 'Cálculo de volumen' : 'Volume calculation'}</h4><div className="grid grid-cols-2 gap-2">
                                <button type="button" onClick={() => setVolumeCountingMode('total')} className={`min-h-20 rounded-xl border p-3 text-left ${volumeCountingMode === 'total' ? 'border-primary-500/35 bg-primary-500/8' : 'border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised)/0.6)]'}`}><span className="block text-sm font-black">×1 Total</span><span className="mt-1 block text-[10px] leading-relaxed text-[rgb(var(--text-muted))]">{lang === 'es' ? 'Barra, máquina bilateral o total ya registrado.' : 'Bar, bilateral machine, or total already logged.'}</span></button>
                                <button type="button" onClick={() => setVolumeCountingMode('per_side')} className={`min-h-20 rounded-xl border p-3 text-left ${volumeCountingMode === 'per_side' ? 'border-primary-500/35 bg-primary-500/8' : 'border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised)/0.6)]'}`}><span className="block text-sm font-black">×2 Por lado</span><span className="mt-1 block text-[10px] leading-relaxed text-[rgb(var(--text-muted))]">{lang === 'es' ? 'Carga introducida por brazo o pierna.' : 'Load entered per arm or leg.'}</span></button>
                            </div></section>
                        )}
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="p-4">{exerciseHistory.length ? <div className="divide-y divide-[rgb(var(--border-subtle)/0.7)] overflow-hidden rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised)/0.55)]">{exerciseHistory.slice(0, 30).map(({ log, completed }) => <div key={log.id} className="flex items-center justify-between gap-4 px-4 py-3"><div className="min-w-0"><div className="truncate text-sm font-bold">{log.name}</div><div className="mt-0.5 text-[10px] text-[rgb(var(--text-muted))]">{new Date(log.endTime || log.startTime).toLocaleDateString(lang === 'es' ? 'es-AR' : 'en-US')}</div></div><div className="text-right"><div className="text-sm font-black tabular-nums">{formatHistoryValue(completed)}</div><div className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-[rgb(var(--text-muted))]">{completed.length} {lang === 'es' ? 'series' : 'sets'}</div></div></div>)}</div> : <div className="rounded-2xl border border-dashed border-[rgb(var(--border-subtle))] p-8 text-center text-sm text-[rgb(var(--text-muted))]">{lang === 'es' ? 'Todavía no hay historial para este ejercicio.' : 'No history for this exercise yet.'}</div>}</div>
                )}

                {activeTab === 'charts' && (
                    <div className="p-4"><div className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised)/0.58)] p-4"><div className="mb-4 flex items-center justify-between gap-3"><div><div className="text-sm font-black">{lang === 'es' ? 'Tendencia' : 'Trend'}</div><div className="mt-0.5 text-[10px] uppercase tracking-[0.08em] text-[rgb(var(--text-muted))]">{chartMetric === '1rm' ? 'e1RM' : chartMetric === 'max_reps' ? (lang === 'es' ? 'Reps máximas' : 'Max reps') : chartMetric === 'hold_time' ? (lang === 'es' ? 'Tiempo de hold' : 'Hold time') : (lang === 'es' ? 'Duración' : 'Duration')}</div></div><span className="rounded-lg bg-primary-500/10 px-2 py-1 text-[9px] font-black text-primary-500">{exerciseHistory.length} {lang === 'es' ? 'sesiones' : 'sessions'}</span></div>{exerciseHistory.length ? <ProgressChart dataPoints={chartData} metric={chartMetric as any} loading={chartLoading} /> : <div className="flex h-52 items-center justify-center text-sm text-[rgb(var(--text-muted))]">{lang === 'es' ? 'Completa más sesiones para generar la gráfica.' : 'Complete more sessions to build the chart.'}</div>}</div></div>
                )}

                {activeTab === 'records' && <div className="grid grid-cols-2 gap-2 p-4">{recordCards.map(card => <div key={card.label} className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised)/0.58)] p-4"><div className="text-[9px] font-bold uppercase tracking-[0.1em] text-[rgb(var(--text-muted))]">{card.label}</div><div className="mt-2 text-xl font-black tabular-nums tracking-tight">{card.value}</div></div>)}</div>}

                {activeTab === 'notes' && <div className="space-y-3 p-4"><div className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised)/0.55)] p-4"><label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[rgb(var(--text-muted))]">{lang === 'es' ? 'Nota fija del ejercicio' : 'Pinned exercise note'}</label><textarea value={userNote} onChange={e => setUserNote(e.target.value)} rows={5} placeholder={lang === 'es' ? 'Ej.: asiento 6, agarre neutro, banco agujero 4…' : 'e.g. seat 6, neutral grip, bench hole 4…'} className="mt-3 w-full resize-none rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-base))] p-3 text-sm leading-relaxed outline-none placeholder:text-[rgb(var(--text-muted))] focus:border-primary-500/45 focus:ring-2 focus:ring-primary-500/10" /><p className="mt-2 text-[10px] leading-relaxed text-[rgb(var(--text-muted))]">{lang === 'es' ? 'Se guarda con el ejercicio para consultarla desde cualquier entrenamiento.' : 'Saved with the exercise so it is available from any workout.'}</p></div></div>}
            </div>
        </Sheet>
    );
};
