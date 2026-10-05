// S6: presentational Stats widgets, moved verbatim from views/StatsViewImpl.tsx.
import React from 'react';
import { TRANSLATIONS } from '../../constants';
import { MuscleGroup } from '../../types';
import { Icon } from '../../components/ui/Icon';
import { StatsScope } from '../../utils/statsScope';
import { formatSets } from '../../utils/statsOverview';
import { toDisplay, unitLabel } from '../../utils/units';
import type { WeightUnit } from '../../types';
import { getVolumeZone } from './statsHelpers';

interface VolumeMuscleListProps {
    volumeData: [string, number][];
    maxVal: number;
    lang: 'es' | 'en';
}

interface VolumeAverageCaptionProps {
    weeks: number;
    scope: StatsScope;
    lang: 'es' | 'en';
}

// Small transparency line under the volume title: which weeks the weekly
// average was computed over, and in which scope.
export const VolumeAverageCaption: React.FC<VolumeAverageCaptionProps> = ({ weeks, scope, lang }) => {
    const t = TRANSLATIONS[lang];
    const scopeLabel = scope === 'plan' ? t.statsScopePlan : t.statsScopeHistory;
    const text = weeks <= 1
        ? `${t.volumeAvgThisWeek} · ${scopeLabel}`
        : `${t.volumeAvgWeeks.replace('{weeks}', String(weeks))} · ${scopeLabel}`;
    return (
        <p className="mt-1 text-[11px] font-semibold text-zinc-500">{text}</p>
    );
};

// Cardio is not a muscle: it stays in the cached counts (calcs untouched)
// but is filtered out of the displayed volume list.
export const VolumeMuscleList: React.FC<VolumeMuscleListProps> = ({ volumeData, maxVal, lang }) => (
    <div className="space-y-3.5">
        {volumeData.filter(([muscle]) => muscle !== 'CARDIO').map(([muscle, count]) => {
            const zone = getVolumeZone(count);
            return (
                <div key={muscle} className="group flex items-center gap-3">
                    <div className="w-24 truncate text-right text-xs font-bold text-zinc-500">
                        {TRANSLATIONS[lang].muscle[muscle as MuscleGroup]}
                    </div>
                    <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                        <div
                            className={`h-full rounded-full transition-all duration-1000 ${zone.color}`}
                            style={{ width: `${Math.min(100, (count / maxVal) * 100)}%` }}
                        />
                    </div>
                    <div className={`w-8 text-right text-xs font-mono font-bold ${zone.textColor}`}>{formatSets(count, lang)}</div>
                </div>
            );
        })}
    </div>
);

export interface PersonalRecordRowProps {
    name: string;
    muscleLabel: string;
    dateStr: string;
    weight: number;
    reps: number;
    e1rm: number;
    /** Display unit (stored values are kg). */
    unit?: WeightUnit;
}

export const PersonalRecordRow: React.FC<PersonalRecordRowProps> = ({
    name,
    muscleLabel,
    dateStr,
    weight,
    reps,
    e1rm,
    unit = 'kg',
}) => (
    <div className="flex items-center gap-3 border-b border-zinc-800/60 py-2 last:border-0">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-yellow-500/10 text-yellow-500">
            <Icon name="Trophy" size={16} />
        </div>
        <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-white">{name}</p>
            <p className="text-[11px] font-bold uppercase tracking-wide text-zinc-500">
                {muscleLabel} · {dateStr}
            </p>
        </div>
        <div className="shrink-0 text-right">
            <p className="text-sm font-black text-white">
                {toDisplay(weight, unit)}<span className="ml-0.5 text-[11px] text-zinc-500">{unitLabel(unit).toLowerCase()}</span>
            </p>
            <p className="text-[11px] text-zinc-500">
                x{reps} · <span className="font-bold text-yellow-500">{Math.round(toDisplay(e1rm, unit))}{unitLabel(unit).toLowerCase()}</span>
            </p>
        </div>
    </div>
);
