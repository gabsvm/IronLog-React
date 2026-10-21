// S6: "volume" tab, moved verbatim from views/StatsViewImpl.tsx.
import React from 'react';
import { Icon } from '../../components/ui/Icon';
import type { StatsData } from './useStatsData';
import { VolumeAverageCaption, VolumeMuscleList } from './StatsWidgets';

export const StatsVolumeTab: React.FC<{ stats: StatsData }> = ({ stats }) => {
    const { statsScope, statsPeriod, lang, t, volumeData, overviewWeeks, loadingOverview, maxVal } = stats;
    return (
        <>
                <div id="tut-vol-bar" className="premium-theme-panel p-5 shadow-md">
                    <div className="mb-5 flex items-center justify-between gap-3">
                        <div>
                            <h3 className="flex items-center gap-2 text-sm font-bold tracking-tight text-[rgb(var(--text-primary))]">
                                <Icon name="BarChart2" size={14} />
                                {t.volPerCycle}
                            </h3>
                            {!loadingOverview && (
                                <VolumeAverageCaption weeks={overviewWeeks} scope={statsScope} lang={lang} period={statsPeriod} />
                            )}
                        </div>
                        <div className="flex gap-2">
                            {['MV', 'MEV', 'MAV'].map(label => (
                                <div key={label} className="flex items-center gap-1.5">
                                    <div className={`h-2.5 w-2.5 rounded-full ${label === 'MV' ? 'bg-yellow-500' : label === 'MEV' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                                    <span className="text-xs font-semibold text-muted">{label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {loadingOverview ? (
                        <div className="space-y-4 animate-pulse">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="h-4 w-24 rounded bg-[rgb(var(--surface-elevated))]"></div>
                                    <div className="h-4 flex-1 rounded-full bg-[rgb(var(--surface-elevated))]"></div>
                                    <div className="h-4 w-6 rounded bg-[rgb(var(--surface-elevated))]"></div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <VolumeMuscleList volumeData={volumeData} maxVal={maxVal} lang={lang} />
                    )}
                </div>
        </>
    );
};
