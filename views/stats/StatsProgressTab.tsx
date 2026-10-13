// S6: "progress" tab, moved verbatim from views/StatsViewImpl.tsx.
import { pickLang } from '../../utils/i18n';
import React from 'react';
import { TRANSLATIONS } from '../../constants';
import { MuscleGroup } from '../../types';
import { ProgressChart } from '../../components/stats/ProgressChart';
import { getTranslated } from '../../utils';
import { Icon } from '../../components/ui/Icon';
import { formatSets } from '../../utils/statsOverview';
import { toDisplay } from '../../utils/units';
import type { StatsData } from './useStatsData';
import { chartMetricLabel } from './statsHelpers';
import { PersonalRecordRow } from './StatsWidgets';
import { RepMaxTable } from './RepMaxTable';
import { formatInteger } from '../../utils/i18n';

export const StatsProgressTab: React.FC<{ stats: StatsData }> = ({ stats }) => {
    const { lang, t, s, unit, weightSuffix, selectedExId, chartMetric, setChartMetric, setShowPicker, setPickerSearch, availableExercises, chartPoints, loadingOverview, loadingChart, currentEx, hasExerciseHistory, prHistory, showAllPRs, setShowAllPRs, displayedPRs, metricButtons, selectedExerciseInsight, repMaxRows } = stats;
    return (
        <>
                <>
                    <div id="tut-progress-chart" className="premium-theme-panel overflow-hidden p-5 shadow-md">
                <div className="mb-5 flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500/10 text-primary-500">
                                <Icon name="TrendingUp" size={16} />
                            </div>
                            <div>
                                <h3 className="font-bold text-[rgb(var(--text-primary))]">{t.statsProgress}</h3>
                                <p className="text-xs font-medium text-muted">
                                    {hasExerciseHistory
                                        ? `${availableExercises.length} ${s.trackedEx}`
                                        : s.noHistory}
                                </p>
                            </div>
                        </div>

                        <div className="flex rounded-full border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-elevated))] p-1">
                            {metricButtons.map(metric => (
                                <button
                                    key={metric}
                                    onClick={() => setChartMetric(metric)}
                                    className={`rounded-full min-h-9 px-3 text-xs font-bold transition-all ${
                                        chartMetric === metric
                                            ? 'bg-primary-500 text-zinc-950 shadow-sm'
                                            : 'text-zinc-500 hover:text-[rgb(var(--text-secondary))]'
                                    }`}
                                >
                                    {chartMetricLabel(metric)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={() => { setPickerSearch(''); setShowPicker(true); }}
                        className="flex w-full items-center justify-between rounded-[20px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-elevated)/0.66)] px-4 py-3 text-left text-[rgb(var(--text-primary))] outline-none transition-colors active:bg-white/10 focus:ring-2 focus:ring-primary-500"
                    >
                        <span className="truncate text-sm font-bold">
                            {loadingOverview
                                ? t.loading
                                : currentEx ? getTranslated(currentEx.name, lang) : t.selectEx}
                        </span>
                        <Icon name="CornerDownRight" size={16} className="text-zinc-400" />
                    </button>
                </div>

                {selectedExId && hasExerciseHistory ? (
                    <ProgressChart
                        dataPoints={chartPoints}
                        metric={chartMetric as any}
                        loading={loadingChart}
                        unit={unit}
                    />
                ) : (
                    <div className="flex h-60 flex-col items-center justify-center rounded-[1.4rem] border border-dashed border-white/8 bg-white/[0.02] px-6 text-center">
                        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.04] text-zinc-500">
                            <Icon name="BarChart3" size={20} />
                        </div>
                        <p className="text-sm font-bold text-[rgb(var(--text-primary))]">
                            {s.noChartEx}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">
                            {s.noChartHint}
                        </p>
                    </div>
                )}
            </div>

            {selectedExerciseInsight && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="premium-theme-panel p-5 shadow-md">
                        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold tracking-tight text-[rgb(var(--text-primary))]">
                            <Icon name="Scale" size={14} />
                            {s.volumeBasisTitle}
                        </h3>
                        <p className="text-sm leading-relaxed text-[rgb(var(--text-secondary))]">
                            {selectedExerciseInsight.volumeBasis}
                        </p>
                        {selectedExerciseInsight.totalVolume > 0 && (
                            <div className="mt-4 rounded-2xl bg-white/[0.03] px-4 py-3">
                                <div className="text-xs font-semibold text-muted">
                                    {s.totalLoad}
                                </div>
                                <div className="mt-1 text-2xl font-black tracking-[-0.04em] text-[rgb(var(--text-primary))]">
                                    {formatInteger(toDisplay(selectedExerciseInsight.totalVolume, unit), lang)} {weightSuffix}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="premium-theme-panel p-5 shadow-md">
                        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold tracking-tight text-[rgb(var(--text-primary))]">
                            <Icon name="Award" size={14} />
                            {s.currentLevel}
                        </h3>
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <div className="text-2xl font-black capitalize tracking-[-0.04em] text-[rgb(var(--text-primary))]">
                                    {(selectedExerciseInsight.level && (t.statsLevels as Record<string, string>)[selectedExerciseInsight.level]) || s.unrated}
                                </div>
                                <p className="mt-1 text-sm text-zinc-400">
                                    {selectedExerciseInsight.rationale || s.notEnoughHistory}
                                </p>
                            </div>
                            <div className="rounded-2xl bg-white/[0.03] px-4 py-3 text-right">
                                <div className="text-xs font-semibold text-muted">
                                    {s.weeklyMuscleSets}
                                </div>
                                <div className="mt-1 text-xl font-black text-[rgb(var(--text-primary))]">
                                    {formatSets(selectedExerciseInsight.muscleWeeklySets, lang)}
                                </div>
                                <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.16em] text-primary-300">
                                    {selectedExerciseInsight.volumeStatus.label}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {repMaxRows.length > 0 && <RepMaxTable rows={repMaxRows} unit={unit} lang={lang} labels={s} />}

            {prHistory.length > 0 && (
                <div className="premium-theme-panel p-5 shadow-md">
                    <div className="mb-5 flex items-center justify-between">
                        <h3 className="flex items-center gap-2 text-sm font-bold tracking-tight text-[rgb(var(--text-primary))]">
                            <Icon name="Trophy" size={14} />
                            {s.prTitle}
                        </h3>
                        <span className="text-[11px] font-bold uppercase text-zinc-600">{s.prEst}</span>
                    </div>

                    <div className="space-y-2">
                        {displayedPRs.map(([exId, pr]) => {
                            const dateStr = new Date(pr.date).toLocaleDateString(pickLang(lang, { es: 'es-ES', en: 'en-US' }), {
                                month: 'short',
                                day: 'numeric',
                                year: '2-digit'
                            });
                            return (
                                <PersonalRecordRow
                                    key={exId}
                                    name={pr.name}
                                    muscleLabel={TRANSLATIONS[lang].muscle[pr.muscle as MuscleGroup]}
                                    dateStr={dateStr}
                                    weight={pr.weight}
                                    reps={pr.reps}
                                    e1rm={pr.e1rm}
                                    unit={unit}
                                />
                            );
                        })}
                    </div>

                    {prHistory.length > 6 && (
                        <button
                            onClick={() => setShowAllPRs(v => !v)}
                            className="mt-3 w-full py-1 text-center text-xs font-bold text-zinc-500 transition-colors hover:text-[rgb(var(--text-secondary))]"
                        >
                            {showAllPRs
                                ? s.showLess
                                : `↓ ${s.showAll} (${prHistory.length})`}
                        </button>
                    )}
                </div>
            )}
                </>
        </>
    );
};
