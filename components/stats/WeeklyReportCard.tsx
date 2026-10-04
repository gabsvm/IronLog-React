import React from 'react';
import { TRANSLATIONS } from '../../constants';
import { Icon } from '../ui/Icon';
import type { WeeklyReport } from '../../utils/weeklyReport';

interface WeeklyReportCardProps {
    report: WeeklyReport;
    weekPRs: number;
    weekLabel: string;
    lang: 'es' | 'en';
}

const ZONE_STYLES: Record<string, string> = {
    MV: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    MEV: 'bg-green-500/15 text-green-400 border-green-500/30',
    MAV: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    MRV: 'bg-red-500/15 text-red-400 border-red-500/30',
};

/**
 * Q15: plan-scoped weekly report card for Stats → Resumen. Pure rendering:
 * every number comes from `buildWeeklyReport`.
 */
export const WeeklyReportCard: React.FC<WeeklyReportCardProps> = ({ report, weekPRs, weekLabel, lang }) => {
    const t = TRANSLATIONS[lang];
    const w = t.weeklyReport;
    const muscleName = (muscle: string) => (t.muscle as Record<string, string>)[muscle] || muscle;

    const change = report.volumeChangePct;
    const changeText = change == null
        ? w.noBaseline
        : `${change > 0 ? '+' : ''}${change}%`;
    const changeTone = change == null
        ? 'text-zinc-500'
        : change > 0 ? 'text-green-400' : change < 0 ? 'text-red-400' : 'text-zinc-300';

    return (
        <div className="glass-card rounded-[1.7rem] border border-white/6 p-5 shadow-md">
            <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-zinc-500">
                    <Icon name="Calendar" size={14} />
                    {w.title}
                </h3>
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                    {weekLabel}
                </span>
            </div>

            {report.sessionsDone === 0 ? (
                <p className="py-4 text-center text-sm font-medium text-zinc-500">{w.empty}</p>
            ) : (
                <>
                    {/* Flex (not grid-cols-3): the heatmap e2e counts grid-cols-3 cells. */}
                    <div className="flex gap-2">
                        <div className="min-w-0 flex-1 rounded-2xl border border-white/6 bg-white/[0.03] px-3 py-3 text-center">
                            <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">{w.sessions}</div>
                            <div className="mt-1 text-xl font-black tracking-[-0.04em] text-white">
                                {report.sessionsDone}/{report.sessionsPlanned}
                            </div>
                        </div>
                        <div className="min-w-0 flex-1 rounded-2xl border border-white/6 bg-white/[0.03] px-3 py-3 text-center">
                            <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">{w.volume}</div>
                            <div className={`mt-1 text-xl font-black tracking-[-0.04em] ${changeTone}`}>
                                {changeText}
                            </div>
                        </div>
                        <div className="min-w-0 flex-1 rounded-2xl border border-white/6 bg-white/[0.03] px-3 py-3 text-center">
                            <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">{w.prs}</div>
                            <div className={`mt-1 text-xl font-black tracking-[-0.04em] text-white`}>
                                {weekPRs}
                            </div>
                        </div>
                    </div>

                    {report.muscles.length > 0 && (
                        <div className="mt-4 space-y-1.5">
                            {report.muscles.map((row) => (
                                <div key={row.muscle} className="flex items-center gap-2">
                                    {/* Name + sets in a single node: the heatmap
                                        and volume list own the bare-name queries. */}
                                    <span className="min-w-0 flex-1 truncate text-xs font-bold text-zinc-300">
                                        {muscleName(row.muscle)} · <span className="font-black tabular-nums text-white">{row.sets}</span>
                                    </span>
                                    <span className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-black ${ZONE_STYLES[row.zone]}`}>
                                        {row.zone}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {(report.lowMuscles.length > 0 || report.highMuscles.length > 0) && (
                        <div className="mt-4 space-y-1.5">
                            {report.lowMuscles.length > 0 && (
                                <p className="text-xs text-zinc-400">
                                    <span className="font-bold uppercase tracking-wide text-yellow-400">{w.low}: </span>
                                    {report.muscles
                                        .filter((m) => m.sets > 0 && m.zone === 'MV')
                                        .map((m) => `${muscleName(m.muscle)} ${m.sets}`)
                                        .join(', ')}
                                </p>
                            )}
                            {report.highMuscles.length > 0 && (
                                <p className="text-xs text-zinc-400">
                                    <span className="font-bold uppercase tracking-wide text-red-400">{w.high}: </span>
                                    {report.muscles
                                        .filter((m) => m.zone === 'MRV')
                                        .map((m) => `${muscleName(m.muscle)} ${m.sets}`)
                                        .join(', ')}
                                </p>
                            )}
                        </div>
                    )}

                    {report.deloadSuggested && (
                        <div className="mt-4 flex items-start gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5">
                            <Icon name="Info" size={16} className="mt-0.5 shrink-0 text-amber-400" />
                            <p className="text-xs font-medium leading-relaxed text-amber-200">
                                {report.deloadReason === 'final-week' ? w.deloadFinal : w.deloadFeedback}
                            </p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
