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
                                <h2 className="text-[22px] font-black uppercase tracking-tight text-white">{t.statsTitle}</h2>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                                    {activeMeso
                                        ? `${s.mesoActive} · ${t.week} ${activeMeso.week}`
                                        : s.globalHistory}
                                </p>
                            </div>
                            {activeMeso && (
                                <div className="rounded-[4px] border border-primary-500/40 bg-primary-500/10 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-primary-400">
                                    {activeMeso.isDeload ? 'DELOAD' : activeMeso.mesoType}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {overviewPills.map(pill => (
                            <div key={pill.label} className="rounded-[8px] border border-border-subtle bg-surface-raised px-4 py-3.5">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-muted">{pill.label}</div>
                                <div className="mt-1 font-mono text-2xl font-black tracking-tight text-white">{pill.value}</div>
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
