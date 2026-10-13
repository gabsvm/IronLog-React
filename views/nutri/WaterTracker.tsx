import React from 'react';
import { WATER_GOAL_ML, WATER_PRESETS } from './nutritionHelpers';
import { TRANSLATIONS } from '../../constants';

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
    const w = TRANSLATIONS[lang].water;
    return (
        <div className="premium-theme-panel p-4" aria-label={w.trackerLabel}>
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-lg" aria-hidden="true">💧</span>
                    <span className="text-sm font-bold text-[rgb(var(--text-primary))]">{w.title}</span>
                </div>
                <span className="text-xs font-mono text-[rgb(var(--text-secondary))]">
                    {waterMl} <span className="text-muted">/ {WATER_GOAL_ML} ml</span>
                </span>
            </div>

            {/* Progress bar */}
            <div className="h-2 bg-[rgb(var(--surface-elevated))] rounded-full overflow-hidden mb-3">
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
                        className={`w-6 h-6 rounded-lg border transition-colors duration-fast ${i < cups ? 'bg-sky-500/30 border-sky-500/50' : 'bg-[rgb(var(--surface-elevated))] border-[rgb(var(--border-subtle))]'}`}
                    />
                ))}
            </div>

            {/* Quick add buttons */}
            <div className="flex gap-2">
                {WATER_PRESETS.map((ml) => (
                    <button
                        key={ml}
                        onClick={() => onAdd(ml)}
                        aria-label={`${lang === 'es' ? 'Añadir' : 'Add'} ${ml} ml`}
                        className="expressive-press min-h-11 flex-1 rounded-full border border-sky-500/25 bg-sky-500/10 px-2 text-xs font-bold text-sky-600 dark:text-sky-300 hover:bg-sky-500/20"
                    >
                        +{ml}ml
                    </button>
                ))}
            </div>
        </div>
    );
});
WaterTracker.displayName = 'WaterTracker';
