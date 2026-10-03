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
        <div className="flex rounded-xl border border-white/5 bg-white/5 p-1" role="tablist" aria-label={t.statsScopeLabel}>
            {(['plan', 'history'] as StatsScope[]).map(option => (
                <button
                    key={option}
                    role="tab"
                    aria-selected={scope === option}
                    onClick={() => onChange(option)}
                    className={`flex-1 rounded-md px-3 py-1.5 text-[11px] font-black uppercase tracking-wider transition-all ${
                        scope === option
                            ? 'bg-primary-500 text-white shadow-[0_2px_8px] shadow-primary-500/25'
                            : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                >
                    {option === 'plan' ? t.statsScopePlan : t.statsScopeHistory}
                </button>
            ))}
        </div>
    );
};
