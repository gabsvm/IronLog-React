import React, { useEffect, useMemo, useState } from 'react';
import { StatsView as StatsViewImpl } from './StatsViewImpl';
import { useApp, useAppPreferences, useAppConfig } from '../context/AppContext';
import { ActivityHeatmap } from '../components/stats/ActivityHeatmap';
import { StatsScopeSelector } from '../components/stats/StatsScopeSelector';
import { StatsPeriodSelector } from '../components/stats/StatsPeriodSelector';
import { PremiumTrendCard } from '../components/stats/PremiumTrendCard';
import { buildPremiumInsights } from '../utils/premiumInsights';
import { resolveWeightUnit } from '../utils/units';
import { useStore } from '../lib/store';
import { TRANSLATIONS } from '../constants';
import { Icon } from '../components/ui/Icon';
import { pickLang } from '../utils/i18n';
import { buildStatsLogsSignature, statsCache } from '../services/statsCache';
import { StatsScope, StatsSection, StatsPeriod, effectiveScopeFor, scopeMesoId as scopeMesoIdFor, summarizeLogsByScope, filterLogsByScopeAndPeriod } from '../utils/statsScope';

/**
 * Product-facing IA over the Stats implementation.
 * Provides semantic, honest mobile tabs (Overview, Progress, Volume)
 * and mounts only the panel needed for the active tab to preserve performance.
 */
export const StatsView: React.FC = () => {
    const { lang } = useAppPreferences();
    const { logs } = useApp();
    const { config } = useAppConfig();
    const activeMeso = useStore(state => state.activeMeso);
    const [section, setSection] = useState<StatsSection>('overview');
    const safeLogs = useMemo(() => Array.isArray(logs) ? logs : [], [logs]);
    const t = TRANSLATIONS[lang];
    const sw = t.statsWrapper;

    // Explicit user choice (persisted, v2 key); null when the user never chose.
    // The visible tab resolves it to an effective scope: without a choice,
    // progress defaults to history while overview/volume default to the plan.
    const [userScope, setUserScope] = useState<StatsScope | null>(null);

    // Explicit period choice (persisted, v1 key); 'all' when never chosen.
    // Independent from scope: scope answers "which plan", period "which weeks".
    const [userPeriod, setUserPeriod] = useState<StatsPeriod>('all');

    useEffect(() => {
        let cancelled = false;
        void statsCache.pruneLegacyStatsKeys();
        void statsCache.readSelectedScopeV2().then((cachedScope) => {
            if (!cancelled && (cachedScope === 'plan' || cachedScope === 'history')) {
                setUserScope(cachedScope);
            }
        });
        void statsCache.readSelectedPeriod().then((cachedPeriod) => {
            if (!cancelled && (cachedPeriod === '4w' || cachedPeriod === '8w' || cachedPeriod === 'all')) {
                setUserPeriod(cachedPeriod);
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

    const handlePeriodChange = (next: StatsPeriod) => {
        setUserPeriod(next);
        void statsCache.writeSelectedPeriod(next);
    };

    const scope = effectiveScopeFor(section, userScope, activeMeso != null);
    const scopeMesoId = scopeMesoIdFor(scope, activeMeso?.id);
    // Scope + period apply exactly once here; cards and insights share the entry.
    const filteredLogs = useMemo(
        () => filterLogsByScopeAndPeriod(safeLogs, scopeMesoId, userPeriod),
        [safeLogs, scopeMesoId, userPeriod],
    );
    const scopedSummary = useMemo(
        () => summarizeLogsByScope(filteredLogs, scopeMesoId),
        [filteredLogs, scopeMesoId],
    );
    const premiumInsights = useMemo(
        () => buildPremiumInsights(filteredLogs, scopeMesoId),
        [filteredLogs, scopeMesoId],
    );

    const items: Array<{ id: StatsSection; es: string; en: string }> = [
        { id: 'overview', es: 'Resumen', en: 'Overview' },
        { id: 'progress', es: 'Fuerza', en: 'Strength' },
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
                            {item[lang]}
                        </button>
                    ))}
                </div>
            </div>

            <section className="px-4 pb-3 pt-2">
                {/* The nav and the scope control already say where you are; the title stays for assistive tech. */}
                <h2 className="sr-only">{t.statsTitle}</h2>

                <div className="px-1">
                    <StatsScopeSelector scope={scope} onChange={handleScopeChange} lang={lang} />
                </div>

                <div className="mt-2 px-1">
                    <StatsPeriodSelector period={userPeriod} onChange={handlePeriodChange} lang={lang} />
                </div>

                {section === 'overview' && (
                    <div className="mt-3">
                        <PremiumTrendCard insights={premiumInsights} lang={lang} unit={resolveWeightUnit(config)} scope={scope} />
                    </div>
                )}
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {summaryItems.map((item, itemIdx) => (
                        <div key={item.label} className={`tonal-${(itemIdx % 4) + 1} rounded-[var(--shape-card-radius)] border border-[rgb(var(--border-subtle)/0.65)] px-4 py-4`}>
                            <div className="text-xs font-semibold tracking-normal text-[rgb(var(--text-muted))]">{item.label}</div>
                            <div className="mt-1 text-3xl font-black tabular-nums tracking-[-0.04em] text-zinc-950 dark:text-white">{item.value}</div>
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
                    <div className="gl-panel mx-4 mb-3 p-4">
                        <div className="mb-3 flex items-baseline justify-between gap-2">
                            <h3 className="text-sm font-semibold text-[rgb(var(--text-primary))]">{sw.consistency}</h3>
                            <span className="text-xs text-muted">{sw.last4}</span>
                        </div>
                        <ActivityHeatmap logs={safeLogs} />
                    </div>
                )}

                <StatsViewImpl activeTab={section} hideHeader={true} scope={scope} onScopeChange={handleScopeChange} period={userPeriod} />
            </div>
        </div>
    );
};
