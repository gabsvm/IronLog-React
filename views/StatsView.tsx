import React, { useMemo, useState } from 'react';
import { useApp, useAppPreferences } from '../context/AppContext';
import { ActivityHeatmap } from '../components/stats/ActivityHeatmap';
import { StatsDashboardWidgets } from '../components/stats/StatsDashboardWidgets';
import { BodyProgressCard } from '../components/stats/BodyProgressCard';
import { ProgressVolumeSection } from '../components/stats/ProgressVolumeSection';
import { ExerciseDetailModal } from '../components/ui/ExerciseDetailModal';
import { Icon } from '../components/ui/Icon';
import { useStore } from '../lib/store';
import { TRANSLATIONS } from '../constants';
import type { ExerciseDef } from '../types';
import { getTranslated } from '../utils';
import './product-polish.css';

type StatsSection = 'overview' | 'exercises' | 'volume';

type ExerciseEntry = {
    exercise: ExerciseDef;
    sessions: number;
    sets: number;
    lastSeen: number;
    lastValue: string;
};

const formatLastValue = (exercise: any) => {
    const completed = (exercise.sets || []).filter((set: any) => set.completed && !set.skipped && set.type !== 'warmup' && set.type !== 'avt_hop');
    if (!completed.length) return '—';
    if (exercise.muscle === 'CARDIO') {
        const distance = Math.max(...completed.map((set: any) => Number(set.distance || 0)), 0);
        const duration = Math.max(...completed.map((set: any) => Number(set.duration || 0)), 0);
        return distance > 0 ? `${distance.toFixed(1)} km` : `${Math.round(duration)} min`;
    }
    if (exercise.isIsometric) {
        return `${Math.max(...completed.map((set: any) => Number(set.duration || 0)), 0)}s`;
    }
    const best = completed.reduce((current: any, candidate: any) => {
        const currentWeight = Number(current.weight || 0);
        const currentReps = Number(current.reps || 0);
        const nextWeight = Number(candidate.weight || 0);
        const nextReps = Number(candidate.reps || 0);
        const currentScore = exercise.isBodyweight ? currentWeight * 1000 + currentReps : currentWeight * (1 + currentReps / 30);
        const nextScore = exercise.isBodyweight ? nextWeight * 1000 + nextReps : nextWeight * (1 + nextReps / 30);
        return nextScore > currentScore ? candidate : current;
    }, completed[0]);
    const weight = Number(best.weight || 0);
    const reps = Number(best.reps || 0);
    if (exercise.isBodyweight) return weight > 0 ? `+${weight} kg × ${reps}` : `${reps} reps`;
    return `${weight} kg × ${reps}`;
};

export const StatsView: React.FC = () => {
    const { lang } = useAppPreferences();
    const { logs, exercises } = useApp();
    const activeMeso = useStore(state => state.activeMeso);
    const [section, setSection] = useState<StatsSection>('overview');
    const [exerciseSearch, setExerciseSearch] = useState('');
    const [selectedExercise, setSelectedExercise] = useState<ExerciseDef | null>(null);
    const safeLogs = useMemo(() => Array.isArray(logs) ? logs : [], [logs]);
    const safeExercises = useMemo(() => Array.isArray(exercises) ? exercises : [], [exercises]);
    const t = TRANSLATIONS[lang];

    const publicPlanLabel = useMemo(() => {
        if (!activeMeso?.mesoType) return null;
        const raw = String(activeMeso.mesoType);
        if (/^(tpl_|personal_)/i.test(raw)) return lang === 'es' ? 'PERSONALIZADO' : 'CUSTOM';
        const translated = (t.phases as any)?.[raw];
        if (typeof translated === 'string' && translated.trim()) return translated;
        return raw.replace(/[_-]+/g, ' ').trim().toUpperCase();
    }, [activeMeso?.mesoType, lang, t.phases]);

    const exerciseEntries = useMemo<ExerciseEntry[]>(() => {
        const library = new Map(safeExercises.map(exercise => [String(exercise.id), exercise]));
        const entries = new Map<string, ExerciseEntry>();
        const orderedLogs = safeLogs
            .filter(log => !log.skipped)
            .slice()
            .sort((a, b) => Number(b.endTime || b.startTime || 0) - Number(a.endTime || a.startTime || 0));

        orderedLogs.forEach(log => {
            const seenInSession = new Set<string>();
            (log.exercises || []).forEach(snapshot => {
                if (snapshot.id == null) return;
                const id = String(snapshot.id);
                const completedSets = (snapshot.sets || []).filter(set => set.completed && !set.skipped && set.type !== 'warmup' && set.type !== 'avt_hop').length;
                if (!completedSets) return;

                const existing = entries.get(id);
                const definition = (library.get(id) || snapshot) as ExerciseDef;
                const timestamp = Number(log.endTime || log.startTime || 0);
                if (!existing) {
                    entries.set(id, {
                        exercise: definition,
                        sessions: 1,
                        sets: completedSets,
                        lastSeen: timestamp,
                        lastValue: formatLastValue(snapshot),
                    });
                    seenInSession.add(id);
                    return;
                }

                existing.sets += completedSets;
                if (!seenInSession.has(id)) existing.sessions += 1;
                if (timestamp > existing.lastSeen) {
                    existing.lastSeen = timestamp;
                    existing.lastValue = formatLastValue(snapshot);
                    existing.exercise = definition;
                }
                seenInSession.add(id);
            });
        });

        return Array.from(entries.values()).sort((a, b) => b.lastSeen - a.lastSeen);
    }, [safeExercises, safeLogs]);

    const filteredExercises = useMemo(() => {
        const query = exerciseSearch.trim().toLowerCase();
        if (!query) return exerciseEntries;
        return exerciseEntries.filter(entry => {
            const name = String(getTranslated(entry.exercise.name, lang) || '').toLowerCase();
            const muscle = String((t.muscle as any)?.[entry.exercise.muscle] || entry.exercise.muscle || '').toLowerCase();
            return name.includes(query) || muscle.includes(query);
        });
    }, [exerciseEntries, exerciseSearch, lang, t.muscle]);

    const items: Array<{ id: StatsSection; es: string; en: string }> = [
        { id: 'overview', es: 'Resumen', en: 'Overview' },
        { id: 'exercises', es: 'Ejercicios', en: 'Exercises' },
        { id: 'volume', es: 'Volumen', en: 'Volume' },
    ];

    return (
        <div className="product-stats-shell">
            <div className="product-stats-segments" role="tablist" aria-label={lang === 'es' ? 'Secciones de progreso' : 'Progress sections'}>
                <div className="product-stats-segments-inner">
                    {items.map(item => (
                        <button
                            key={item.id}
                            type="button"
                            role="tab"
                            aria-selected={section === item.id}
                            data-active={section === item.id}
                            className="product-stats-segment"
                            onClick={() => setSection(item.id)}
                        >
                            {lang === 'es' ? item.es : item.en}
                        </button>
                    ))}
                </div>
            </div>

            <section className="px-4 pb-2 pt-2">
                <div className="flex items-end justify-between gap-3 px-1">
                    <div className="min-w-0">
                        <h2 className="text-[1.7rem] font-black tracking-[-0.05em] text-[rgb(var(--text-primary))]">{lang === 'es' ? 'Progreso' : 'Progress'}</h2>
                        <p className="whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.11em] text-[rgb(var(--text-muted))]">
                            {activeMeso ? `${lang === 'es' ? 'Plan actual' : 'Current plan'} · ${t.week} ${activeMeso.week}` : (lang === 'es' ? 'Historial global' : 'All-time history')}
                        </p>
                    </div>
                    {publicPlanLabel && <span className="max-w-[46%] shrink-0 truncate rounded-lg border border-primary-500/15 bg-primary-500/10 px-2.5 py-1 text-[9px] font-black text-primary-500">{publicPlanLabel}</span>}
                </div>
            </section>

            {section === 'overview' && (
                <div className="space-y-4 pb-28">
                    <section className="px-4 pt-2">
                        <StatsDashboardWidgets logs={safeLogs} activeMesoId={activeMeso?.id ?? null} lang={lang} />
                    </section>

                    {safeLogs.length > 0 && (
                        <div className="mx-4 rounded-2xl border border-[rgb(var(--border-subtle)/0.7)] bg-[rgb(var(--surface-raised)/0.58)] p-4">
                            <div className="mb-3 flex items-center gap-2">
                                <Icon name="Activity" size={14} className="text-primary-500" />
                                <div><div className="text-[10px] font-bold uppercase tracking-[0.1em] text-[rgb(var(--text-muted))]">{lang === 'es' ? 'Consistencia' : 'Consistency'}</div><div className="text-[10px] text-[rgb(var(--text-muted))]">{lang === 'es' ? 'Últimos 4 meses' : 'Last 4 months'}</div></div>
                            </div>
                            <ActivityHeatmap logs={safeLogs} />
                        </div>
                    )}

                    <BodyProgressCard />
                </div>
            )}

            {section === 'exercises' && (
                <section className="space-y-3 px-4 pb-28 pt-2">
                    <div className="rounded-2xl border border-primary-500/15 bg-primary-500/[0.045] p-4">
                        <div className="flex items-start gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-500/10 text-primary-500"><Icon name="Dumbbell" size={17} /></div>
                            <div>
                                <h3 className="text-sm font-black">{lang === 'es' ? 'Tus ejercicios' : 'Your exercises'}</h3>
                                <p className="mt-1 text-xs leading-relaxed text-[rgb(var(--text-muted))]">{lang === 'es' ? 'Toca un ejercicio para ver su historial, gráfica, récords, técnica y notas. Esa ficha es la fuente única de analítica del ejercicio.' : 'Tap an exercise for history, charts, records, technique, and notes. That detail is the single source of exercise analytics.'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="relative">
                        <Icon name="Search" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[rgb(var(--text-muted))]" />
                        <input
                            type="search"
                            value={exerciseSearch}
                            onChange={event => setExerciseSearch(event.target.value)}
                            placeholder={lang === 'es' ? 'Buscar ejercicio o músculo…' : 'Search exercise or muscle…'}
                            className="h-11 w-full rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] pl-10 pr-4 text-sm font-semibold outline-none placeholder:text-[rgb(var(--text-muted))] focus:border-primary-500/45 focus:ring-2 focus:ring-primary-500/10"
                        />
                    </div>

                    <div className="flex items-center justify-between px-1 text-[10px] font-bold text-[rgb(var(--text-muted))]">
                        <span>{filteredExercises.length} {lang === 'es' ? 'ejercicios con historial' : 'exercises with history'}</span>
                        <span>{lang === 'es' ? 'Más recientes primero' : 'Most recent first'}</span>
                    </div>

                    <div className="space-y-2">
                        {filteredExercises.map(entry => {
                            const name = String(getTranslated(entry.exercise.name, lang) || entry.exercise.id);
                            const muscle = String((t.muscle as any)?.[entry.exercise.muscle] || entry.exercise.muscle || '');
                            return (
                                <button
                                    key={String(entry.exercise.id)}
                                    type="button"
                                    onClick={() => setSelectedExercise(entry.exercise)}
                                    className="flex min-h-[68px] w-full items-center gap-3 rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised)/0.58)] px-3.5 py-3 text-left transition-colors active:bg-[rgb(var(--surface-elevated))]"
                                >
                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-500/10 text-primary-500"><Icon name="Dumbbell" size={18} /></span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-sm font-black">{name}</span>
                                        <span className="mt-1 block truncate text-[10px] font-bold text-[rgb(var(--text-muted))]">{muscle} · {entry.sessions} {lang === 'es' ? 'sesiones' : 'sessions'} · {entry.sets} {lang === 'es' ? 'series' : 'sets'}</span>
                                    </span>
                                    <span className="shrink-0 text-right">
                                        <span className="block text-[11px] font-black tabular-nums text-[rgb(var(--text-secondary))]">{entry.lastValue}</span>
                                        <span className="mt-0.5 flex items-center justify-end gap-1 text-[9px] font-bold text-[rgb(var(--text-muted))]">{lang === 'es' ? 'Abrir detalle' : 'Open detail'} <Icon name="ChevronRight" size={12} /></span>
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {filteredExercises.length === 0 && (
                        <div className="rounded-2xl border border-dashed border-[rgb(var(--border-strong))] px-5 py-10 text-center">
                            <Icon name="Search" size={22} className="mx-auto text-[rgb(var(--text-muted))]" />
                            <p className="mt-3 text-sm font-black">{exerciseEntries.length ? (lang === 'es' ? 'No encontramos coincidencias' : 'No matches found') : (lang === 'es' ? 'Aún no hay ejercicios con historial' : 'No exercise history yet')}</p>
                            <p className="mx-auto mt-1 max-w-xs text-xs text-[rgb(var(--text-muted))]">{exerciseEntries.length ? (lang === 'es' ? 'Prueba con otro nombre o grupo muscular.' : 'Try another name or muscle group.') : (lang === 'es' ? 'Completa una sesión y tus ejercicios aparecerán aquí automáticamente.' : 'Complete a workout and your exercises will appear here automatically.')}</p>
                        </div>
                    )}
                </section>
            )}

            {section === 'volume' && (
                <ProgressVolumeSection
                    logs={safeLogs}
                    activeMesoId={activeMeso?.id ?? null}
                    activeWeek={activeMeso?.week ?? null}
                    lang={lang}
                />
            )}

            {selectedExercise && <ExerciseDetailModal exercise={selectedExercise} onClose={() => setSelectedExercise(null)} />}
        </div>
    );
};
