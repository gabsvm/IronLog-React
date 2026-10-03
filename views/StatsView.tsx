import React, { useEffect, useMemo, useState } from 'react';
import { StatsView as StatsViewImpl } from './StatsViewImpl';
import { useApp, useAppPreferences } from '../context/AppContext';
import { ActivityHeatmap } from '../components/stats/ActivityHeatmap';
import { StatsScopeSelector } from '../components/stats/StatsScopeSelector';
import { Icon } from '../components/ui/Icon';
import { useStore } from '../lib/store';
import { TRANSLATIONS } from '../constants';
import { statsCache } from '../services/statsCache';
import { StatsScope, StatsSection, effectiveScopeFor, scopeMesoId as scopeMesoIdFor, summarizeLogsByScope } from '../utils/statsScope';
import './product-polish.css';

/**
 * Product-facing IA over the Stats implementation.
 * Provides semantic, honest mobile tabs (Overview, Progress, Volume)
 * and mounts only the panel needed for the active tab to preserve performance.
 */
export const StatsView: React.FC = () => {
    const { lang } = useAppPreferences();
    const { logs } = useApp();
    const activeMeso = useStore(state => state.activeMeso);
    const [section, setSection] = useState<StatsSection>('overview');
    const safeLogs = useMemo(() => Array.isArray(logs) ? logs : [], [logs]);
    const t = TRANSLATIONS[lang];

    // Explicit user choice (persisted, v2 key); null when the user never chose.
    // The visible tab resolves it to an effective scope: without a choice,
    // progress defaults to history while overview/volume default to the plan.
    const [userScope, setUserScope] = useState<StatsScope | null>(null);

    useEffect(() => {
        let cancelled = false;
        void statsCache.pruneLegacyStatsKeys();
        void statsCache.readSelectedScopeV2().then((cachedScope) => {
            if (!cancelled && (cachedScope === 'plan' || cachedScope === 'history')) {
                setUserScope(cachedScope);
            }
        });
        return () => {
            cancelled = true;
        };
    }, []);

    const handleScopeChange = (next: StatsScope) => {
        setUserScope(next);
        void statsCache.writeSelectedScopeV2(next);
    };

    const scope = effectiveScopeFor(section, userScope, activeMeso != null);
    const scopeMesoId = scopeMesoIdFor(scope, activeMeso?.id);
    const scopedSummary = useMemo(
        () => summarizeLogsByScope(safeLogs, scopeMesoId),
        [safeLogs, scopeMesoId],
    );

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
        <div className="product-stats-shell">
            <div className="product-stats-segments" role="tablist" aria-label={lang === 'es' ? 'Secciones de estadísticas' : 'Stats sections'}>
                <div className="product-stats-segments-inner">
                    {items.map(item => (
                        <button
                            key={item.id}
                            id={`stats-tab-${item.id}`}
                            type="button"
                            role="tab"
                            aria-selected={section === item.id}
                            aria-controls={`stats-panel-${item.id}`}
                            data-active={section === item.id}
                            className="product-stats-segment"
                            onClick={() => setSection(item.id)}
                        >
                            {lang === 'es' ? item.es : item.en}
                        </button>
                    ))}
                </div>
            </div>

            <section className="px-4 pb-3 pt-2">
                <div className="flex items-end justify-between gap-3 px-1">
                    <div className="min-w-0">
                        <h2 className="text-[1.7rem] font-black tracking-[-0.05em] text-zinc-950 dark:text-white">{t.statsTitle}</h2>
                        <p className="whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500">
                            {scope === 'plan' && activeMeso
                                ? `${t.currentPlan} · ${t.week} ${activeMeso.week}`
                                : t.statsScopeHistory}
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

                <div className="mt-3 px-1">
                    <StatsScopeSelector scope={scope} onChange={handleScopeChange} lang={lang} />
                </div>
            </section>

            <div
                id={`stats-panel-${section}`}
                role="tabpanel"
                aria-labelledby={`stats-tab-${section}`}
                className="product-stats-impl"
            >
                {section === 'overview' && safeLogs.length > 0 && (
                    <div className="mx-4 mb-3 rounded-[1.35rem] border border-[rgb(var(--border-subtle)/0.7)] bg-[rgb(var(--surface-raised)/0.65)] p-4">
                        <div className="mb-3 flex items-center gap-2">
                            <Icon name="Activity" size={14} className="text-primary-500" />
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">{lang === 'es' ? 'Consistencia' : 'Consistency'}</div>
                                <div className="text-xs text-muted">{lang === 'es' ? 'Últimos 4 meses' : 'Last 4 months'}</div>
                            </div>
                        </div>
                        <ActivityHeatmap logs={safeLogs} />
                    </div>
                )}

                <StatsViewImpl activeTab={section} hideHeader={true} scope={scope} onScopeChange={handleScopeChange} />
            </div>
        </div>
    );
};
