import React, { useMemo } from 'react';
import type { ExerciseDef, Lang, Log, WeightUnit } from '../../../types';
import { formatDate } from '../../../utils';
import { formatWeight, unitLabel } from '../../../utils/units';
import { Icon, type IconName } from '../../ui/Icon';
import { RepMaxTable } from '../../../views/stats/RepMaxTable';
import { computeRepMaxTable } from '../../../utils/repMaxTable';
import type { ExerciseDetailStrings } from './exerciseDetailStrings';
import type { ExerciseRecords } from './exerciseDetailData';
import type { OneRmFormula } from '../../../utils/strongTraining';

interface RepMaxLabels {
    repMaxTitle: string;
    repMaxReps: string;
    repMaxBest: string;
    repMaxPredicted: string;
}

interface ExerciseRecordsTabProps {
    exercise: ExerciseDef;
    safeLogs: Log[];
    groupIds: string[];
    records: ExerciseRecords;
    unit: WeightUnit;
    lang: Lang;
    labels: ExerciseDetailStrings;
    repLabels: RepMaxLabels;
    formula: OneRmFormula;
}

// Records: personal bests plus the actual-vs-estimated rep table. Estimated
// figures always name the active formula; logged loads stand alone.
export const ExerciseRecordsTab: React.FC<ExerciseRecordsTabProps> = ({
    exercise,
    safeLogs,
    groupIds,
    records,
    unit,
    lang,
    labels,
    repLabels,
    formula,
}) => {
    const suffix = unitLabel(unit).toLowerCase();
    const isCardio = exercise.muscle === 'CARDIO';
    const isIsometric = !!exercise.isIsometric;
    const showRepTable = !isCardio && !isIsometric && !exercise.isBodyweight;

    const repMaxRows = useMemo(() => {
        if (!showRepTable) return [];
        return computeRepMaxTable(safeLogs, new Set(groupIds.map(String)), formula);
    }, [showRepTable, safeLogs, groupIds, formula]);

    const hasRecords = records.sessions > 0 && (
        records.best1RM > 0 || records.maxWeight > 0 || records.maxReps > 0 ||
        records.bestHoldSec > 0 || records.totalDurationMin > 0 || records.totalDistanceKm > 0
    );

    if (!hasRecords) {
        return (
            <div className="p-5">
                <div className="flex min-h-[15rem] flex-col items-center justify-center rounded-[1.4rem] border border-dashed border-[rgb(var(--border-subtle))] bg-white/[0.02] px-6 py-8 text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.04] text-zinc-500">
                        <Icon name="Trophy" size={20} />
                    </div>
                    <p className="text-sm font-bold text-[rgb(var(--text-primary))]">{labels.recordsEmptyTitle}</p>
                    <p className="mt-1 text-xs text-muted">{labels.recordsEmptyBody}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 p-5">
            <div className="grid grid-cols-2 gap-3">
                {!isCardio && !isIsometric && records.best1RM > 0 && (
                    <RecordCard
                        icon="TrendingUp"
                        title={labels.recordsBest1RM}
                        value={`${formatWeight(records.best1RM, unit, lang)} ${suffix}`}
                        detail={`${formatWeight(records.best1RMWeight, unit, lang)} ${suffix} × ${records.best1RMReps} · ${labels.recordsEstimatedTag}`}
                        date={records.best1RMDate != null ? formatDate(records.best1RMDate, lang) : null}
                    />
                )}
                {!isCardio && !isIsometric && records.maxWeight > 0 && (
                    <RecordCard
                        icon="Dumbbell"
                        title={labels.recordsMaxWeight}
                        value={`${formatWeight(records.maxWeight, unit, lang)} ${suffix}`}
                        detail={records.maxWeightReps > 0 ? `× ${records.maxWeightReps}` : null}
                        date={records.maxWeightDate != null ? formatDate(records.maxWeightDate, lang) : null}
                    />
                )}
                {!isCardio && !isIsometric && records.maxSessionVolume > 0 && (
                    <RecordCard
                        icon="Layers"
                        title={labels.recordsMaxVolume}
                        value={`${formatWeight(records.maxSessionVolume, unit, lang)} ${suffix}`}
                        detail={null}
                        date={records.maxSessionVolumeDate != null ? formatDate(records.maxSessionVolumeDate, lang) : null}
                    />
                )}
                {!isIsometric && records.maxReps > 0 && (
                    <RecordCard
                        icon="Repeat"
                        title={labels.recordsMaxReps}
                        value={`${records.maxReps} ${labels.historyReps}`}
                        detail={!isCardio && records.maxRepsWeight > 0 ? `${formatWeight(records.maxRepsWeight, unit, lang)} ${suffix}` : null}
                        date={records.maxRepsDate != null ? formatDate(records.maxRepsDate, lang) : null}
                    />
                )}
                {isIsometric && records.bestHoldSec > 0 && (
                    <RecordCard
                        icon="Timer"
                        title={labels.recordsBestHold}
                        value={`${records.bestHoldSec} s`}
                        detail={null}
                        date={records.bestHoldDate != null ? formatDate(records.bestHoldDate, lang) : null}
                    />
                )}
                {isCardio && records.totalDistanceKm > 0 && (
                    <RecordCard
                        icon="Activity"
                        title={labels.historyDistance}
                        value={`${records.totalDistanceKm.toFixed(1)} km`}
                        detail={null}
                        date={null}
                    />
                )}
                {isCardio && records.totalDurationMin > 0 && (
                    <RecordCard
                        icon="Timer"
                        title={labels.historyTime}
                        value={`${records.totalDurationMin.toFixed(1)} min`}
                        detail={null}
                        date={null}
                    />
                )}
                {!isCardio && !isIsometric && records.totalVolume > 0 && (
                    <RecordCard
                        icon="BarChart3"
                        title={labels.recordsTotalVolume}
                        value={`${formatWeight(records.totalVolume, unit, lang)} ${suffix}`}
                        detail={null}
                        date={null}
                    />
                )}
                <RecordCard
                    icon="Calendar"
                    title={labels.recordsSessions}
                    value={String(records.sessions)}
                    detail={null}
                    date={records.lastDate != null ? `${labels.recordsLastDate}: ${formatDate(records.lastDate, lang)}` : null}
                />
            </div>

            {showRepTable && repMaxRows.length > 0 && (
                <RepMaxTable rows={repMaxRows} unit={unit} lang={lang} labels={repLabels} />
            )}
        </div>
    );
};

const RecordCard: React.FC<{ icon: IconName; title: string; value: string; detail: string | null; date: string | null }> = ({
    icon,
    title,
    value,
    detail,
    date,
}) => (
    <div className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-elevated)/0.5)] p-4">
        <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-muted">
            <Icon name={icon} size={12} />
            <span className="truncate">{title}</span>
        </div>
        <div className="mt-2 truncate text-xl font-black tabular-nums text-[rgb(var(--text-primary))]">
            {value}
        </div>
        {detail && <div className="mt-0.5 truncate text-[11px] font-semibold text-muted">{detail}</div>}
        {date && <div className="mt-0.5 truncate text-[11px] font-semibold text-muted">{date}</div>}
    </div>
);
