import React from 'react';
import type { VolumeComparison } from '../../utils/volumeComparison';
import type { WeightUnit } from '../../types';
import { formatWeight } from '../../utils/units';

interface Props {
    comparison: VolumeComparison;
    unit: WeightUnit;
    unitLabel: string;
    lang: 'en' | 'es';
    labels: {
        volume: string;
        reps: string;
        repsUnit: string;
        vsPrevious: string;
        previous: string;
    };
}

export const ExerciseVolumeLine: React.FC<Props> = ({ comparison, unit, unitLabel, lang, labels }) => {
    const { kind, current, previous, delta } = comparison;
    const fmt = (value: number) => kind === 'reps'
        ? `${Math.round(value)} ${labels.repsUnit}`
        : `${formatWeight(value, unit, lang)} ${unitLabel.toLowerCase()}`;

    const started = delta !== null;
    const sign = delta === null || delta === 0 ? '' : delta > 0 ? '+' : '−';
    const right = started
        ? labels.vsPrevious.replace('{delta}', `${sign}${fmt(Math.abs(delta))}`)
        : labels.previous.replace('{value}', fmt(previous));

    return (
        <div className="flex items-center justify-between gap-2 px-0.5 text-xs tabular-nums" data-testid="exercise-volume-line">
            <span className="text-muted">
                {kind === 'reps' ? labels.reps : labels.volume}:{' '}
                <span className="font-bold text-white">{started ? fmt(current) : '—'}</span>
            </span>
            <span className={started && delta >= 0 ? 'font-bold text-green-500' : 'text-muted'}>{right}</span>
        </div>
    );
};
