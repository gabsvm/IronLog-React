import React from 'react';

interface Props {
    value: number;
    goal: number;
    color: string;
    label: string;
}

/**
 * Slim macro progress bar with value/goal label. Used inline within
 * macro summary panels in NutriView. Turns orange when over goal.
 */
export const MacroBar: React.FC<Props> = React.memo(({ value, goal, color, label }) => {
    const pct = Math.min(100, goal > 0 ? (value / goal) * 100 : 0);
    const over = goal > 0 && value > goal;
    return (
        <div className="flex-1">
            <div className="flex justify-between text-[10px] mb-1">
                <span className={`font-bold ${color}`}>{label}</span>
                <span className="text-zinc-500">
                    {Math.round(value)}
                    <span className="text-zinc-700">/{goal}g</span>
                </span>
            </div>
            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-slow ease-natural ${over ? 'bg-orange-500' : color.replace('text-', 'bg-')}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
});
MacroBar.displayName = 'MacroBar';
