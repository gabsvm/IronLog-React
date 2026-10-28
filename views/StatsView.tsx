import React, { useEffect, useMemo, useState } from 'react';
import { StatsView as StatsViewImpl } from './StatsViewImpl';
import { useApp, useAppPreferences } from '../context/AppContext';
import { ActivityHeatmap } from '../components/stats/ActivityHeatmap';
import { StatsScopeSelector } from '../components/stats/StatsScopeSelector';
import { Icon } from '../components/ui/Icon';
import { PremiumTrendCard } from '../components/stats/PremiumTrendCard';
import { buildPremiumInsights } from '../utils/premiumInsights';
import { resolveWeightUnit } from '../utils/units';
import { useStore } from '../lib/store';
import { TRANSLATIONS } from '../constants';
import { buildStatsLogsSignature, statsCache } from '../services/statsCache';
import { StatsScope, StatsSection, effectiveScopeFor, scopeMesoId as scopeMesoIdFor, summarizeLogsByScope } from '../utils/statsScope';

/**
 * Product-facing IA over the Stats implementation.
 * Provides semantic, honest mobile tabs (Overview, Progress, Volume)
 * and mounts only the panel needed for the active tab to preserve performance.
 */
export const StatsView: React.FC = () => {
    const { lang } = useAppPreferences();
    const { logs, config } = useApp();
    const activeMeso = useStore(state => state.activeMeso);
    const [section, setSection] = useState<StatsSection>('overview');
    const safeLogs = useMemo(() => Array.isArray(logs) ? logs : [], [logs]);
    const t = TRANSLATIONS[lang];
    const sw = t.statsWrapper;

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

    // Drop cache generations from older log signatures whenever the data
    // fingerprint changes (at most once per signature per session, off the
    // critical path).
    const logsSignature = useMemo(() => buildStatsLogsSignature(safeLogs), [safeLogs]);
    useEffect(() => {
        void statsCache.pruneStaleSignatureKeys(logsSignature);
    }, [logsSignature]);

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
    const premiumInsights = useMemo(
        () => buildPremiumInsights(safeLogs, scopeMesoId),
        [safeLogs, scopeMesoId],
    );

    const publicPlanLabel = useMemo(() => {
        if (!activeMeso?.mesoType) return null;
        const raw = String(activeMeso.mesoType);
        if (/^(tpl_|personal_)/i.test(raw)) {
            return sw.customPlan;
        }
        const translated = (t.phases as any)?.[raw];
        if (typeof translated === 'string' && translated.trim()) return translated;
        return raw.replace(/[_-]+/g, ' ').trim().toUpperCase();
    }, [activeMeso?.mesoType, t.phases, sw.customPlan]);

    const items: Array<{ id: StatsSection; es: string; en: string }> = [
        { id: 'overview', es: 'Resumen', en: 'Overview' },
        { id: 'progress', es: 'Progreso', en: 'Progress' },
        { id: 'volume', es: 'Volumen', en: 'Volume' },
    ];

    const summaryItems = [
        { label: t.statsView.pillSessions, value: scopedSummary.sessions },
        { label: t.statsView.pillExercises, value: scopedSummary.exercises },
        { label: t.statsView.pillSets, value: scopedSummary.sets },
        { label: t.statsView.pillMuscles, value: scopedSummary.muscles },
    ];

    return (
        <div className="product-stats-shell">
            <div className="product-stats-segments" role="tablist" aria-label={sw.sectionsAria}>
                <div className="product-stats-segments-inner flex rounded-[6px] border border-border-subtle bg-surface-raised p-1">
                    {items.map(item => (
                        <button
                            key={item.id}
                            id={`stats-tab-${item.id}`}
                            type="button"
                            role="tab"
                            aria-selected={section === item.id}
                            aria-controls={`stats-panel-${item.id}`}
                            data-active={section === item.id}
                            className={`product-stats-segment flex-1 rounded-[4px] py-2 text-center text-[11px] font-extrabold uppercase tracking-wider transition-all ${section === item.id ? 'bg-primary-500 text-zinc-950 shadow-sm' : 'text-zinc-400 hover:text-white'}`}
                            onClick={() => setSection(item.id)}
                        >
                            {item[lang]}
                        </button>
                    ))}
                </div>
            </div>

            <section className="px-4 pb-3 pt-2">
                <div className="flex items-end justify-between gap-3 px-1">
                    <div className="min-w-0">
                        <h2 className="text-[22px] font-black uppercase tracking-tight text-white">{t.statsTitle}</h2>
                        <p className="text-xs font-semibold tracking-normal text-muted">
                            {scope === 'plan' && activeMeso
                                ? `${t.currentPlan} · ${t.week} ${activeMeso.week}`
                                : t.statsScopeHistory}
                        </p>
                    </div>
                    {publicPlanLabel && (
                        <span className="max-w-[46%] shrink-0 truncate rounded-[4px] border border-primary-500/40 bg-primary-500/10 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-primary-400">
                            {publicPlanLabel}
                        </span>
                    )}
                </div>

                <div className="mt-3 px-1">
                    <StatsScopeSelector scope={scope} onChange={handleScopeChange} lang={lang} />
                </div>

                {section === 'overview' && (
                    <div className="mt-3">
                        <PremiumTrendCard insights={premiumInsights} lang={lang} unit={resolveWeightUnit(config)} scope={scope} />
                    </div>
                )}
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {summaryItems.map((item, itemIdx) => (
                        <div key={item.label} className={`tonal-${(itemIdx % 4) + 1} rounded-[8px] border border-border-subtle bg-surface-raised px-4 py-3.5`}>
                            <div className="text-[10px] font-bold uppercase tracking-wider text-[rgb(var(--text-muted))]">{item.label}</div>
                            <div className="mt-1 font-mono text-2xl font-black tabular-nums tracking-tight text-zinc-950 dark:text-white">{item.value}</div>
                        </div>
                    ))}
                </div>
            </section>

            <div
                id={`stats-panel-${section}`}
                role="tabpanel"
                aria-labelledby={`stats-tab-${section}`}
                className="product-stats-impl"
            >
                {section === 'overview' && safeLogs.length > 0 && (
                    <div className="mx-4 mb-3 rounded-[8px] border border-border-subtle bg-surface-raised p-4">
                        <div className="mb-3 flex items-center gap-2">
                            <Icon name="Activity" size={14} className="text-primary-500" />
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">{sw.consistency}</div>
                                <div className="text-xs text-muted">{sw.last4}</div>
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
