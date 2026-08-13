import React, { useMemo, useRef, useState } from 'react';
import { StatsView as StatsViewImpl } from './StatsViewImpl';
import { useApp, useAppPreferences } from '../context/AppContext';
import { ActivityHeatmap } from '../components/stats/ActivityHeatmap';
import { Icon } from '../components/ui/Icon';
import { useStore } from '../lib/store';
import { TRANSLATIONS } from '../constants';
import './product-polish.css';

type StatsSection = 'overview' | 'progress' | 'volume';

/**
 * Product-facing IA over the existing Stats implementation.
 * The worker/charts stay inside StatsViewImpl; this shell owns navigation,
 * consistency and a single-scope summary so global/current-meso numbers are
 * never mixed in the same row.
 */
export const StatsView: React.FC = () => {
    const { lang } = useAppPreferences();
    const { logs } = useApp();
    const activeMeso = useStore(state => state.activeMeso);
    const rootRef = useRef<HTMLDivElement>(null);
    const [section, setSection] = useState<StatsSection>('overview');
    const safeLogs = Array.isArray(logs) ? logs : [];
    const t = TRANSLATIONS[lang];

    const scopedSummary = useMemo(() => {
        const scopedLogs = activeMeso
            ? safeLogs.filter(log => log.mesoId === activeMeso.id)
            : safeLogs;
        const completedLogs = scopedLogs.filter(log => !log.skipped);
        const exerciseIds = new Set<string>();
        const muscles = new Set<string>();
        let sets = 0;

        completedLogs.forEach(log => {
            (log.exercises || []).forEach((exercise, exerciseIndex) => {
                const completedSets = (exercise.sets || []).filter(set => set.completed && !set.skipped);
                if (!completedSets.length) return;
                exerciseIds.add(String(exercise.id ?? exercise.instanceId ?? `${log.id}-${exerciseIndex}`));
                if (exercise.muscle) muscles.add(String(exercise.muscle));
                sets += completedSets.length;
            });
        });

        return {
            sessions: completedLogs.length,
            exercises: exerciseIds.size,
            sets,
            muscles: muscles.size,
        };
    }, [activeMeso, safeLogs]);

    const publicPlanLabel = useMemo(() => {
        if (!activeMeso?.mesoType) return null;
        const raw = String(activeMeso.mesoType);
        if (/^(tpl_|personal_)/i.test(raw)) {
            return lang === 'es' ? 'PERSONALIZADO' : 'CUSTOM';
        }
        const translated = (t.phases as any)?.[raw];
        if (typeof translated === 'string' && translated.trim()) return translated;
        return raw.replace(/[_-]+/g, ' ').trim().toUpperCase();
    }, [activeMeso?.mesoType, lang, t.phases]);

    const goTo = (next: StatsSection) => {
        setSection(next);
        const root = rootRef.current;
        if (!root) return;
        const target = next === 'overview'
            ? root
            : root.querySelector<HTMLElement>(next === 'progress' ? '#tut-progress-chart' : '#tut-vol-bar');
        target?.scrollIntoView({ behavior: 'smooth', block: next === 'overview' ? 'start' : 'center' });
    };

    const items: Array<{ id: StatsSection; es: string; en: string }> = [
        { id: 'overview', es: 'Resumen', en: 'Overview' },
        { id: 'progress', es: 'Progreso', en: 'Progress' },
        { id: 'volume', es: 'Volumen', en: 'Volume' },
    ];

    const summaryItems = [
        { label: lang === 'es' ? 'Sesiones' : 'Sessions', value: scopedSummary.sessions },
        { label: lang === 'es' ? 'Ejercicios' : 'Exercises', value: scopedSummary.exercises },
        { label: lang === 'es' ? 'Series' : 'Sets', value: scopedSummary.sets },
        { label: lang === 'es' ? 'Músculos' : 'Muscles', value: scopedSummary.muscles },
    ];

    return (
        <div ref={rootRef} className="product-stats-shell">
            <div className="product-stats-segments" role="tablist" aria-label={lang === 'es' ? 'Secciones de estadísticas' : 'Stats sections'}>
                <div className="product-stats-segments-inner">
                    {items.map(item => (
                        <button
                            key={item.id}
                            type="button"
                            role="tab"
                            aria-selected={section === item.id}
                            data-active={section === item.id}
                            className="product-stats-segment"
                            onClick={() => goTo(item.id)}
                        >
                            {lang === 'es' ? item.es : item.en}
                        </button>
                    ))}
                </div>
            </div>

            <section className="px-4 pb-3 pt-2">
                <div className="flex items-end justify-between gap-3 px-1">
                    <div className="min-w-0">
                        <h2 className="text-[1.7rem] font-black tracking-[-0.05em] text-zinc-950 dark:text-white">Stats</h2>
                        <p className="whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500">
                            {activeMeso
                                ? `${lang === 'es' ? 'Plan actual' : 'Current plan'} · ${t.week} ${activeMeso.week}`
                                : (lang === 'es' ? 'Historial global' : 'All-time history')}
                        </p>
                    </div>
                    {publicPlanLabel && (
                        <span className="max-w-[46%] shrink-0 truncate rounded-full border border-primary-500/15 bg-primary-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-primary-700 dark:text-primary-300">
                            {publicPlanLabel}
                        </span>
                    )}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {summaryItems.map(item => (
                        <div key={item.label} className="rounded-2xl border border-[rgb(var(--border-subtle)/0.85)] bg-[rgb(var(--surface-raised)/0.62)] px-4 py-4">
                            <div className="text-[9px] font-black uppercase tracking-[0.16em] text-zinc-500">{item.label}</div>
                            <div className="mt-1 text-2xl font-black tabular-nums tracking-[-0.04em] text-zinc-950 dark:text-white">{item.value}</div>
                        </div>
                    ))}
                </div>
            </section>

            {safeLogs.length > 0 && (
                <div className="mx-4 mb-3 rounded-[1.35rem] border border-[rgb(var(--border-subtle)/0.7)] bg-[rgb(var(--surface-raised)/0.65)] p-4">
                    <div className="mb-3 flex items-center gap-2">
                        <Icon name="Activity" size={14} className="text-primary-500" />
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">{lang === 'es' ? 'Consistencia' : 'Consistency'}</div>
                            <div className="text-[10px] text-zinc-500">{lang === 'es' ? 'Últimos 4 meses' : 'Last 4 months'}</div>
                        </div>
                    </div>
                    <ActivityHeatmap logs={safeLogs} />
                </div>
            )}

            <div className="product-stats-impl">
                <StatsViewImpl />
            </div>
        </div>
    );
};
