import React from 'react';
import { Icon } from '../../components/ui/Icon';
import { formatDate } from '../../utils';
import { formatWeight, unitLabel } from '../../utils/units';
import type { WeightUnit } from '../../types';
import type { RepMaxRow } from '../../utils/repMaxTable';

interface Props {
    rows: RepMaxRow[];
    unit: WeightUnit;
    lang: 'es' | 'en';
    labels: { repMaxTitle: string; repMaxReps: string; repMaxBest: string; repMaxPredicted: string };
}

export const RepMaxTable: React.FC<Props> = ({ rows, unit, lang, labels }) => {
    const suffix = unitLabel(unit).toLowerCase();
    return (
        <div className="glass-card rounded-[1.7rem] border border-white/6 p-5 shadow-md" data-testid="rep-max-table">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-zinc-500">
                <Icon name="Trophy" size={14} />
                {labels.repMaxTitle}
            </h3>
            <div className="grid grid-cols-[3rem_1fr_1fr] gap-x-3 gap-y-1.5 text-sm tabular-nums">
                <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">{labels.repMaxReps}</div>
                <div className="text-right text-[11px] font-bold uppercase tracking-wider text-zinc-500">{labels.repMaxBest}</div>
                <div className="text-right text-[11px] font-bold uppercase tracking-wider text-zinc-500">{labels.repMaxPredicted}</div>
                {rows.map((row) => (
                    <React.Fragment key={row.reps}>
                        <div className="font-bold text-zinc-300">{row.reps}</div>
                        <div className="text-right text-white" data-testid={`rep-max-best-${row.reps}`}>
                            {row.actualWeight != null ? (
                                <>
                                    <span className="font-black">{formatWeight(row.actualWeight, unit, lang)} {suffix}</span>
                                    {row.actualDate ? <span className="ml-1.5 text-[11px] text-zinc-500">{formatDate(row.actualDate, lang)}</span> : null}
                                </>
                            ) : <span className="text-zinc-600">—</span>}
                        </div>
                        <div className="text-right text-zinc-400">
                            {row.predictedWeight != null ? `${formatWeight(row.predictedWeight, unit, lang)} ${suffix}` : '—'}
                        </div>
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};
