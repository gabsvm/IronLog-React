import React from 'react';
import { TRANSLATIONS } from '../../constants';
import { STATS_PERIODS, type StatsPeriod } from '../../utils/statsScope';

interface StatsPeriodSelectorProps {
    period: StatsPeriod;
    onChange: (period: StatsPeriod) => void;
    lang: 'es' | 'en';
}

/**
 * Rolling-window selector for Stats, deliberately distinct from the
 * scope tabs (outline pills + calendar label instead of the lime fill):
 * scope answers "which plan", period answers "which weeks".
 */
export const StatsPeriodSelector: React.FC<StatsPeriodSelectorProps> = ({ period, onChange, lang }) => {
    const t = TRANSLATIONS[lang];
    const s = t.statsView;
    const labelByPeriod: Record<StatsPeriod, string> = {
        '4w': s.period4w,
        '8w': s.period8w,
        all: s.periodAll,
    };
    return (
        <div className="flex items-center gap-2">
            <div className="flex flex-1 gap-1.5" role="radiogroup" aria-label={s.periodLabel}>
                {STATS_PERIODS.map(option => {
                    const selected = period === option;
                    return (
                        <button
                            key={option}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            onClick={() => onChange(option)}
                            className={`min-h-11 flex-1 rounded-full border px-3 text-xs font-bold transition-all sm:text-[13px] ${
                                selected
                                    ? 'border-primary-500/60 bg-primary-500/15 text-primary-700 dark:text-primary-300'
                                    : 'border-[rgb(var(--border-subtle))] bg-transparent text-zinc-500 hover:text-[rgb(var(--text-secondary))]'
                            }`}
                        >
                            {labelByPeriod[option]}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
