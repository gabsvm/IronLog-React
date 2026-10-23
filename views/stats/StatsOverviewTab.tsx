// S6: "overview" tab, moved verbatim from views/StatsViewImpl.tsx.
import React from 'react';
import { SymmetryRadar } from '../../components/stats/SymmetryRadar';
import { MuscleHeatmapGrid } from '../../components/stats/MuscleHeatmapGrid';
import { WeeklyReportCard } from '../../components/stats/WeeklyReportCard';
import { Icon } from '../../components/ui/Icon';
import { ProLock } from '../../components/pro/ProLock';
import { Doughnut } from 'react-chartjs-2';
import type { StatsData } from './useStatsData';

export const StatsOverviewTab: React.FC<{ stats: StatsData }> = ({ stats }) => {
    const { lang, t, s, volumeData, rawMuscleCounts, setTypeDist, loadingOverview, totalSets, hasData, doughnutData, intensityPalette, weeklyReport, weekPRs } = stats;
    return (
        <>
                <>
                    {weeklyReport && (
                        <WeeklyReportCard
                            report={weeklyReport}
                            weekPRs={weekPRs}
                            weekLabel={`${t.week} ${weeklyReport.week}`}
                            lang={lang}
                        />
                    )}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div id="tut-radar-chart" className="premium-theme-panel flex h-full flex-col overflow-hidden p-5 shadow-md">
                            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold tracking-tight text-[rgb(var(--text-primary))]">
                                <Icon name="Activity" size={14} /> {t.statsBalance}
                            </h3>
                            <div className="relative flex flex-1 items-center justify-center">
                                <ProLock featureName={t.statsBalance}>
                                    <div className="h-64 w-full">
                                        <SymmetryRadar volumeData={rawMuscleCounts} />
                                    </div>
                                </ProLock>
                            </div>
                        </div>

                        <div className="premium-theme-panel flex h-full flex-col p-5 shadow-md">
                            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold tracking-tight text-[rgb(var(--text-primary))]">
                                <Icon name="Layers" size={14} /> {t.statsIntensity}
                            </h3>
                            <div className="relative flex flex-1 flex-col items-center justify-center">
                                <ProLock featureName={t.statsIntensity}>
                                    {hasData ? (
                                        <div className="flex w-full flex-col items-center">
                                            <div className="relative h-48 w-48">
                                                <Doughnut
                                                    data={doughnutData}
                                                    options={{
                                                        responsive: true,
                                                        maintainAspectRatio: false,
                                                        cutout: '75%',
                                                        plugins: { legend: { display: false } },
                                                        elements: { arc: { borderWidth: 0 } }
                                                    }}
                                                />
                                                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                                                    <span className="text-3xl font-black tracking-[-0.05em] text-white">{totalSets}</span>
                                                    <span className="text-xs font-medium text-muted">{t.statsSets}</span>
                                                </div>
                                            </div>
                                            <div className="mt-4 grid w-full grid-cols-2 gap-x-3 gap-y-1.5">
                                                {Object.entries(setTypeDist).map(([type, count], i) => (
                                                    <div key={type} className="flex items-center gap-1.5">
                                                        <span
                                                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                                                            style={{ backgroundColor: intensityPalette[i % intensityPalette.length] }}
                                                        />
                                                        <span className="truncate text-xs font-semibold text-[rgb(var(--text-secondary))]">
                                                            {(t.types as Record<string, string>)[type] || type}
                                                        </span>
                                                        <span className="ml-auto shrink-0 text-xs font-bold tabular-nums text-[rgb(var(--text-primary))]">
                                                            {count}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-3 opacity-60 flex flex-col items-center justify-center">
                                            <div className="flex h-32 w-32 items-center justify-center rounded-full border-[12px] border-zinc-800">
                                                <Icon name="CloudOff" size={24} className="text-zinc-600" />
                                            </div>
                                            <span className="text-xs font-medium text-muted">{t.statsNoData}</span>
                                        </div>
                                    )}
                                </ProLock>
                            </div>
                        </div>
                    </div>

                    <div className="premium-theme-panel relative overflow-hidden p-5 shadow-md">
                        <div className="relative z-10 mb-5 flex items-center justify-between">
                            <h3 className="flex items-center gap-2 text-sm font-bold tracking-tight text-[rgb(var(--text-primary))]">
                                <Icon name="Grid3x3" size={14} />
                                {s.heatmapTitle}
                            </h3>
                        </div>

                        {loadingOverview ? (
                            <div className="h-48 animate-pulse rounded-2xl bg-zinc-800/50"></div>
                        ) : (
                            <div className="relative z-10">
                                <MuscleHeatmapGrid volumeData={volumeData} lang={lang} />
                            </div>
                        )}
                    </div>
                </>
        </>
    );
};
