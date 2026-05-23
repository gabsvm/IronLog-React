import React from 'react';

/**
 * Simple sparkline — pure SVG, no deps. Used to render small trend lines
 * inside ExerciseCard headers (1RM history, etc).
 */
export const SparkLine = React.memo(({ values }: { values: number[] }) => {
    if (values.length < 2) return null;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const W = 56;
    const H = 18;
    const pts = values
        .map((v, i) => {
            const x = (i / (values.length - 1)) * W;
            const y = H - ((v - min) / range) * (H - 2) - 1;
            return `${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(' ');
    const isUp = values[values.length - 1] >= values[0];
    const pct = ((values[values.length - 1] - values[0]) / values[0]) * 100;
    return (
        <div className="flex items-center gap-1.5">
            <svg width={W} height={H} className="overflow-visible shrink-0" aria-hidden="true">
                <polyline
                    points={pts}
                    fill="none"
                    stroke={isUp ? '#22c55e' : '#ef4444'}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
            <span className={`text-[9px] font-black tabular-nums ${isUp ? 'text-green-500' : 'text-red-400'}`}>
                {isUp ? '+' : ''}{pct.toFixed(1)}%
            </span>
        </div>
    );
});
SparkLine.displayName = 'SparkLine';
