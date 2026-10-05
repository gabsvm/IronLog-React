// S6: Stats header (title, pills, scope), moved verbatim from views/StatsViewImpl.tsx.
import React from 'react';
import type { StatsData } from './useStatsData';

export const StatsHeader: React.FC<{ stats: StatsData }> = ({ stats }) => {
    const { statsScope, activeMeso, t, s, overviewPills } = stats;
    return (
        <>
                <>
                    <div className="px-1">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h2 className="text-[1.7rem] font-black tracking-[-0.05em] text-white">{t.statsTitle}</h2>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                                    {activeMeso
                                        ? `${s.mesoActive} · ${t.week} ${activeMeso.week}`
                                        : s.globalHistory}
                                </p>
                            </div>
                            {activeMeso && (
                                <div className="rounded-full border border-primary-500/15 bg-primary-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-primary-300">
                                    {activeMeso.isDeload ? 'DELOAD' : activeMeso.mesoType}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {overviewPills.map(pill => (
                            <div key={pill.label} className="rounded-2xl border border-white/6 bg-white/[0.03] px-3 py-3">
                                <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">{pill.label}</div>
                                <div className="mt-1 text-xl font-black tracking-[-0.04em] text-white">{pill.value}</div>
                            </div>
                        ))}
                    </div>
                    <p className="mt-2 text-center text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-600">
                        {statsScope === 'plan' ? t.statsScopePlan : t.statsScopeHistory}
                    </p>
                </>
        </>
    );
};
