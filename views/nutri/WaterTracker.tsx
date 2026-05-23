import React from 'react';
import { WATER_GOAL_ML, WATER_PRESETS } from './nutritionHelpers';

interface Props {
    waterMl: number;
    onAdd: (ml: number) => void;
    lang: 'en' | 'es';
}

/**
 * Daily water intake widget: progress bar + 10-cup visualization + 3 quick-add buttons.
 */
export const WaterTracker: React.FC<Props> = React.memo(({ waterMl, onAdd, lang }) => {
    const pct = Math.min(100, (waterMl / WATER_GOAL_ML) * 100);
    const cups = Math.round(waterMl / 250);
    return (
        <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-4" aria-label={lang === 'es' ? 'Registro de agua' : 'Water tracker'}>
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-lg" aria-hidden="true">💧</span>
                    <span className="text-sm font-bold text-white">{lang === 'en' ? 'Water' : 'Agua'}</span>
                </div>
                <span className="text-xs font-mono text-zinc-400">
                    {waterMl} <span className="text-zinc-600">/ {WATER_GOAL_ML} ml</span>
                </span>
            </div>

            {/* Progress bar */}
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden mb-3">
                <div
                    className="h-full rounded-full bg-sky-500 transition-all duration-slow ease-natural"
                    style={{ width: `${pct}%` }}
                />
            </div>

            {/* Cup visualization */}
            <div className="flex gap-1 mb-3 flex-wrap" aria-hidden="true">
                {Array.from({ length: 10 }).map((_, i) => (
                    <div
                        key={i}
                        className={`w-6 h-6 rounded-md border transition-all duration-fast ${i < cups ? 'bg-sky-500/30 border-sky-500/50' : 'bg-zinc-800 border-zinc-700'}`}
                    />
                ))}
            </div>

            {/* Quick add buttons */}
            <div className="flex gap-2">
                {WATER_PRESETS.map((ml) => (
                    <button
                        key={ml}
                        onClick={() => onAdd(ml)}
                        aria-label={`Add ${ml} ml`}
                        className="flex-1 py-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-bold active:scale-95 transition-all duration-fast ease-natural hover:bg-sky-500/20"
                    >
                        +{ml}ml
                    </button>
                ))}
            </div>
        </div>
    );
});
WaterTracker.displayName = 'WaterTracker';
