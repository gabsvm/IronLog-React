import React, { useMemo } from 'react';
import { Icon } from '../../components/ui/Icon';

interface Props {
    logs: any[];
    lang: string;
    t: any;
}

/**
 * "Last 7 Days" stat card for Home. Computes sessions / total volume /
 * recently trained muscles / PR count from the raw log feed.
 * Skips render if no recent activity.
 */
export const WeeklyRecapCard: React.FC<Props> = React.memo(({ logs, lang, t }) => {
    const stats = useMemo(() => {
        const now = Date.now();
        const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
        const recentLogs = logs.filter(
            (l: any) => !l.skipped && l.endTime && l.endTime >= sevenDaysAgo,
        );
        if (recentLogs.length === 0) return null;

        let totalVolume = 0;
        const musclesSet = new Set<string>();
        let prCount = 0;

        // Build old bests for PR detection
        const olderLogs = logs.filter(
            (l: any) => !l.skipped && l.endTime && l.endTime < sevenDaysAgo,
        );
        const oldBests: Record<string, number> = {};
        olderLogs.forEach((log: any) => {
            (log.exercises || []).forEach((ex: any) => {
                if (!ex.id) return;
                (ex.sets || []).forEach((set: any) => {
                    if (set.completed && set.weight && set.reps) {
                        const e1rm = Number(set.weight) * (1 + Number(set.reps) / 30);
                        if (!oldBests[ex.id] || e1rm > oldBests[ex.id]) oldBests[ex.id] = e1rm;
                    }
                });
            });
        });

        const prCounted = new Set<string>();
        recentLogs.forEach((log: any) => {
            (log.exercises || []).forEach((ex: any) => {
                if (ex.muscle) musclesSet.add(ex.muscle);
                (ex.sets || []).forEach((set: any) => {
                    if (set.completed && set.weight && set.reps) {
                        totalVolume += Number(set.weight) * Number(set.reps);
                        if (ex.id && oldBests[ex.id] && !prCounted.has(ex.id)) {
                            const e1rm = Number(set.weight) * (1 + Number(set.reps) / 30);
                            if (e1rm > oldBests[ex.id] * 1.01) {
                                prCount++;
                                prCounted.add(ex.id);
                            }
                        }
                    }
                });
            });
        });

        return {
            sessions: recentLogs.length,
            totalVolume: Math.round(totalVolume),
            muscles: Array.from(musclesSet),
            prCount,
        };
    }, [logs]);

    if (!stats) return null;

    const volStr =
        stats.totalVolume >= 1000 ? `${(stats.totalVolume / 1000).toFixed(1)}k` : `${stats.totalVolume}`;

    return (
        <div className="glass-card rounded-3xl p-5 space-y-4 animate-in fade-in">
            <div className="flex items-center gap-2">
                <Icon name="TrendingUp" size={13} className="text-primary-400" />
                <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                    {lang === 'es' ? 'Resumen 7 Días' : 'Last 7 Days'}
                </h4>
            </div>

            <div className="grid grid-cols-3 gap-3">
                <div className="bg-zinc-950/40 border border-white/5 rounded-2xl p-3 text-center">
                    <div className="text-2xl font-black text-white tabular-nums">{stats.sessions}</div>
                    <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mt-0.5">
                        {lang === 'es' ? 'Sesiones' : 'Sessions'}
                    </div>
                </div>
                <div className="bg-zinc-950/40 border border-white/5 rounded-2xl p-3 text-center">
                    <div className="text-2xl font-black text-white tabular-nums">{volStr}</div>
                    <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mt-0.5">
                        {lang === 'es' ? 'Vol. kg' : 'Vol. kg'}
                    </div>
                </div>
                <div
                    className={`rounded-2xl p-3 text-center ${stats.prCount > 0 ? 'bg-yellow-500/10 border border-yellow-500/20' : 'bg-zinc-950/40 border border-white/5'}`}
                >
                    <div
                        className={`text-2xl font-black tabular-nums ${stats.prCount > 0 ? 'text-yellow-400' : 'text-zinc-600'}`}
                    >
                        {stats.prCount > 0 ? `×${stats.prCount}` : '—'}
                    </div>
                    <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mt-0.5">PRs</div>
                </div>
            </div>

            {stats.muscles.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {stats.muscles.map((m: string) => (
                        <span
                            key={m}
                            className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-400 border border-primary-500/20"
                        >
                            {(t.muscle as any)[m] || m}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
});
WeeklyRecapCard.displayName = 'WeeklyRecapCard';
