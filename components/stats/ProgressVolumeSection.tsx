import React, { useMemo } from 'react';
import { TRANSLATIONS } from '../../constants';
import type { Log, MuscleGroup } from '../../types';
import { Icon } from '../ui/Icon';
import { ProLock } from '../pro/ProLock';
import { MuscleHeatmapGrid } from './MuscleHeatmapGrid';
import { SymmetryRadar } from './SymmetryRadar';

interface Props {
    logs: Log[];
    activeMesoId: number | null;
    activeWeek: number | null;
    lang: 'en' | 'es';
}

const getVolumeZone = (sets: number) => {
    if (sets < 6) return { label: 'MV', tone: 'bg-amber-500', text: 'text-amber-500' };
    if (sets < 12) return { label: 'MEV', tone: 'bg-emerald-500', text: 'text-emerald-500' };
    if (sets <= 22) return { label: 'MAV', tone: 'bg-sky-500', text: 'text-sky-500' };
    return { label: 'MRV+', tone: 'bg-rose-500', text: 'text-rose-500' };
};

export const ProgressVolumeSection: React.FC<Props> = ({ logs, activeMesoId, activeWeek, lang }) => {
    const scopedLogs = useMemo(() => {
        const valid = logs.filter(log => !log.skipped);
        if (activeMesoId != null && activeWeek != null) {
            return valid.filter(log => log.mesoId === activeMesoId && log.week === activeWeek);
        }
        const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000);
        return valid.filter(log => Number(log.endTime || log.startTime || 0) >= cutoff);
    }, [activeMesoId, activeWeek, logs]);

    const { volumeData, volumeMap, totalSets, trackedMuscles } = useMemo(() => {
        const counts: Record<string, number> = {};
        scopedLogs.forEach(log => {
            (log.exercises || []).forEach(exercise => {
                if (!exercise.muscle || exercise.muscle === 'CARDIO') return;
                (exercise.sets || []).forEach(set => {
                    if (!set.completed || set.skipped || set.type === 'warmup' || set.type === 'avt_hop') return;
                    counts[exercise.muscle] = (counts[exercise.muscle] || 0) + 1;
                });
            });
        });
        const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        return {
            volumeData: entries as [string, number][],
            volumeMap: counts,
            totalSets: entries.reduce((sum, [, count]) => sum + count, 0),
            trackedMuscles: entries.filter(([, count]) => count > 0).length,
        };
    }, [scopedLogs]);

    const maxVal = Math.max(...volumeData.map(([, count]) => count), 1);
    const scopeLabel = activeMesoId != null && activeWeek != null
        ? (lang === 'es' ? `Semana ${activeWeek} del programa actual` : `Week ${activeWeek} of current program`)
        : (lang === 'es' ? 'Últimos 7 días' : 'Last 7 days');

    if (totalSets === 0) {
        return (
            <section className="mx-4 rounded-2xl border border-dashed border-[rgb(var(--border-strong))] bg-[rgb(var(--surface-raised)/0.45)] px-5 py-10 text-center">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-primary-500/10 text-primary-500"><Icon name="BarChart2" size={20} /></div>
                <h3 className="mt-3 text-sm font-black">{lang === 'es' ? 'Todavía no hay volumen en este período' : 'No volume in this period yet'}</h3>
                <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-[rgb(var(--text-muted))]">{lang === 'es' ? 'Completa series de trabajo y aquí verás cómo se distribuyen entre grupos musculares.' : 'Complete working sets and their muscle distribution will appear here.'}</p>
            </section>
        );
    }

    return (
        <section className="space-y-4 px-4 pb-28 pt-2">
            <div className="grid grid-cols-2 gap-2">
                <div className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised)/0.58)] p-4">
                    <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[rgb(var(--text-muted))]">{lang === 'es' ? 'Series efectivas' : 'Working sets'}</div>
                    <div className="mt-1 text-2xl font-black tabular-nums">{totalSets}</div>
                </div>
                <div className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised)/0.58)] p-4">
                    <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[rgb(var(--text-muted))]">{lang === 'es' ? 'Músculos' : 'Muscles'}</div>
                    <div className="mt-1 text-2xl font-black tabular-nums">{trackedMuscles}</div>
                </div>
            </div>

            <div className="flex items-center gap-2 px-1 text-[10px] font-bold text-[rgb(var(--text-muted))]">
                <Icon name="Calendar" size={13} className="text-primary-500" />
                <span>{scopeLabel}</span>
            </div>

            <section className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised)/0.58)] p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                        <h3 className="text-sm font-black">{lang === 'es' ? 'Distribución muscular' : 'Muscle distribution'}</h3>
                        <p className="mt-0.5 text-[10px] text-[rgb(var(--text-muted))]">{lang === 'es' ? 'Series efectivas por grupo' : 'Working sets by muscle group'}</p>
                    </div>
                </div>
                <MuscleHeatmapGrid volumeData={volumeData} lang={lang} />
            </section>

            <section className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised)/0.58)] p-4">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h3 className="text-sm font-black">{lang === 'es' ? 'Volumen por músculo' : 'Volume by muscle'}</h3>
                        <p className="mt-0.5 text-[10px] text-[rgb(var(--text-muted))]">{lang === 'es' ? 'Referencia orientativa MV · MEV · MAV · MRV+' : 'Directional MV · MEV · MAV · MRV+ reference'}</p>
                    </div>
                    <div className="flex gap-2 text-[9px] font-bold text-[rgb(var(--text-muted))]">
                        {['MV', 'MEV', 'MAV', 'MRV+'].map(label => <span key={label}>{label}</span>)}
                    </div>
                </div>
                <div className="space-y-3">
                    {volumeData.map(([muscle, count]) => {
                        const zone = getVolumeZone(count);
                        const translated = TRANSLATIONS[lang].muscle[muscle as MuscleGroup] || muscle;
                        return (
                            <div key={muscle} className="grid grid-cols-[5.6rem_1fr_2.8rem] items-center gap-2">
                                <div className="truncate text-right text-[11px] font-bold text-[rgb(var(--text-muted))]">{translated}</div>
                                <div className="h-2 overflow-hidden rounded-full bg-[rgb(var(--surface-elevated))]">
                                    <div className={`h-full rounded-full ${zone.tone}`} style={{ width: `${Math.min(100, (count / maxVal) * 100)}%` }} />
                                </div>
                                <div className={`text-right text-[11px] font-black tabular-nums ${zone.text}`}>{count} · {zone.label}</div>
                            </div>
                        );
                    })}
                </div>
            </section>

            <section className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised)/0.58)] p-4">
                <div className="mb-2 flex items-center gap-2"><Icon name="Activity" size={15} className="text-primary-500" /><h3 className="text-sm font-black">{lang === 'es' ? 'Balance muscular' : 'Muscle balance'}</h3></div>
                <p className="mb-3 text-[10px] leading-relaxed text-[rgb(var(--text-muted))]">{lang === 'es' ? 'Vista relativa del reparto de series. Úsala como tendencia, no como una receta automática.' : 'Relative view of set distribution. Use it as a trend, not an automatic prescription.'}</p>
                <ProLock featureName="Radar Analysis">
                    <div className="h-72 w-full"><SymmetryRadar volumeData={volumeMap} /></div>
                </ProLock>
            </section>
        </section>
    );
};
