import React from 'react';

interface Props {
    value: number;
    goal: number;
    tone: 'protein' | 'carbs' | 'fat';
    label: string;
}

const macroColors = {
    protein: { text: 'text-blue-700 dark:text-blue-400', bar: 'bg-blue-600 dark:bg-blue-400' },
    carbs: { text: 'text-amber-800 dark:text-amber-400', bar: 'bg-amber-700 dark:bg-amber-400' },
    fat: { text: 'text-pink-700 dark:text-pink-400', bar: 'bg-pink-600 dark:bg-pink-400' },
};

/**
 * Slim macro progress bar with value/goal label. Used inline within
 * macro summary panels in NutriView. Turns orange when over goal.
 */
export const MacroBar: React.FC<Props> = React.memo(({ value, goal, tone, label }) => {
    const pct = Math.min(100, goal > 0 ? (value / goal) * 100 : 0);
    const over = goal > 0 && value > goal;
    return (
        <div className="flex-1">
            <div className="flex flex-wrap justify-between gap-x-1 text-xs mb-1">
                <span className={`font-semibold ${macroColors[tone].text}`}>{label}</span>
                <span className="text-muted">
                    {Math.round(value)}
                    <span className="text-muted">/{goal}g</span>
                </span>
            </div>
            <div className="h-2.5 bg-surface-elevated rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-slow ease-natural ${over ? 'bg-orange-600 dark:bg-orange-400' : macroColors[tone].bar}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
});
MacroBar.displayName = 'MacroBar';
