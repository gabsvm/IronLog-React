import React from 'react';
import { TRANSLATIONS } from '../../constants';
import { StatsScope } from '../../utils/statsScope';

interface StatsScopeSelectorProps {
    scope: StatsScope;
    onChange: (scope: StatsScope) => void;
    lang: 'es' | 'en';
}

/**
 * Single "This plan / Full history" segmented control, owned by the Stats
 * wrapper so all three sections share one scope. Same segmented style as the
 * other Stats tabs (lime fill for the selected option).
 */
export const StatsScopeSelector: React.FC<StatsScopeSelectorProps> = ({ scope, onChange, lang }) => {
    const t = TRANSLATIONS[lang];
    return (
        <div className="flex rounded-[6px] border border-border-subtle bg-surface-raised p-1" role="tablist" aria-label={t.statsScopeLabel}>
            {(['plan', 'history'] as StatsScope[]).map(option => (
                <button
                    key={option}
                    role="tab"
                    aria-selected={scope === option}
                    onClick={() => onChange(option)}
                    className={`flex-1 rounded-[4px] px-3 py-2 text-[11px] font-extrabold uppercase tracking-wider transition-all ${
                        scope === option
                            ? 'bg-primary-500 text-zinc-950 shadow-sm'
                            : 'text-zinc-400 hover:text-white'
                    }`}
                >
                    {option === 'plan' ? t.statsScopePlan : t.statsScopeHistory}
                </button>
            ))}
        </div>
    );
};
