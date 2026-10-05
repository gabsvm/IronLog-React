// S6: "overview" tab, moved verbatim from views/StatsViewImpl.tsx.
import React from 'react';
import { SymmetryRadar } from '../../components/stats/SymmetryRadar';
import { MuscleHeatmapGrid } from '../../components/stats/MuscleHeatmapGrid';
import { WeeklyReportCard } from '../../components/stats/WeeklyReportCard';
import { AiAnalysisSection } from '../../components/stats/AiAnalysisCard';
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
                    <AiAnalysisSection />
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div id="tut-radar-chart" className="glass-card flex min-h-[320px] h-full flex-col overflow-hidden rounded-[1.7rem] border border-white/6 p-5 shadow-md">
                            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-zinc-500">
                                <Icon name="Activity" size={14} /> {t.statsBalance}
                            </h3>
                            <div className="relative flex flex-1 items-center justify-center">
                                <ProLock featureName="Radar Analysis">
                                    <div className="h-64 w-full">
                                        <SymmetryRadar volumeData={rawMuscleCounts} />
                                    </div>
                                </ProLock>
                            </div>
                        </div>

                        <div className="glass-card flex min-h-[320px] h-full flex-col rounded-[1.7rem] border border-white/6 p-5 shadow-md">
                            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-zinc-500">
                                <Icon name="Layers" size={14} /> {t.statsIntensity}
                            </h3>
                            <div className="relative flex flex-1 flex-col items-center justify-center">
                                <ProLock featureName="Intensity Dist.">
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
                                                    <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">{t.statsSets}</span>
                                                </div>
                                            </div>
                                            <div className="mt-4 grid w-full grid-cols-2 gap-x-3 gap-y-1.5">
                                                {Object.entries(setTypeDist).map(([type, count], i) => (
                                                    <div key={type} className="flex items-center gap-1.5">
                                                        <span
                                                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                                                            style={{ backgroundColor: intensityPalette[i % intensityPalette.length] }}
                                                        />
                                                        <span className="truncate text-[11px] font-bold text-zinc-300">
                                                            {(t.types as Record<string, string>)[type] || type}
                                                        </span>
                                                        <span className="ml-auto shrink-0 text-[11px] font-black tabular-nums text-white">
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
                                            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">{t.statsNoData}</span>
                                        </div>
                                    )}
                                </ProLock>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card relative overflow-hidden rounded-[1.7rem] border border-white/6 p-5 shadow-md">
                        <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full bg-primary-500/5 blur-[80px]"></div>
                        <div className="relative z-10 mb-5 flex items-center justify-between">
                            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-zinc-500">
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
