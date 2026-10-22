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
        <div className="flex rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-base))] p-1" role="tablist" aria-label={t.statsScopeLabel}>
            {(['plan', 'history'] as StatsScope[]).map(option => (
                <button
                    key={option}
                    role="tab"
                    aria-selected={scope === option}
                    onClick={() => onChange(option)}
                    className={`min-h-11 flex-1 rounded-lg px-3 text-sm font-semibold transition-colors ${
                        scope === option
                            ? 'bg-primary-500 text-[rgb(var(--accent-ink))]'
                            : 'text-muted hover:text-[rgb(var(--text-primary))]'
                    }`}
                >
                    {option === 'plan' ? t.statsScopePlan : t.statsScopeHistory}
                </button>
            ))}
        </div>
    );
};
