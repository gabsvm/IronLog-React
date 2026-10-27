// SettingsParity owner: small controlled rows matching TrainingSection styling.
import React from 'react';
import { triggerHaptic } from '../../../../utils/audio';

export const PrefToggle: React.FC<{
    label: string;
    pressed: boolean;
    onChange: (next: boolean) => void;
}> = ({ label, pressed, onChange }) => (
    <div className="flex items-center gap-3 p-3">
        <div className="flex-1 text-sm font-medium text-[rgb(var(--text-primary))]">{label}</div>
        <button
            type="button"
            onClick={() => { triggerHaptic('light'); onChange(!pressed); }}
            aria-label={label}
            aria-pressed={pressed}
            className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${pressed ? 'bg-primary-500' : 'bg-surface-elevated border border-border-strong'}`}
        >
            <span className={`absolute top-0.5 w-5 h-5 rounded-full shadow transition-all ${pressed ? 'left-[22px] bg-white' : 'left-0.5 bg-white'}`} />
        </button>
    </div>
);

export const PrefSegmented = <T extends string | number>({
    label,
    ariaLabel,
    options,
    value,
    onChange,
    format,
}: {
    label: string;
    ariaLabel?: string;
    options: readonly T[];
    value: T;
    onChange: (next: T) => void;
    format?: (option: T) => string;
}): React.ReactElement => (
    <div className="flex flex-wrap items-center justify-between gap-2 p-3">
        <span className="text-sm font-medium text-[rgb(var(--text-primary))]">{label}</span>
        <div
            className="gl-connected flex w-full gap-1 rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-elevated))] p-1 sm:w-auto [&>button]:flex-1"
            role="group"
            aria-label={ariaLabel ?? label}
        >
            {options.map((option) => (
                <button
                    key={String(option)}
                    type="button"
                    onClick={() => { triggerHaptic('light'); onChange(option); }}
                    aria-pressed={value === option}
                    className={`min-h-[44px] px-3 text-xs rounded-lg font-semibold transition-all ${
                        value === option
                            ? 'bg-primary-500 text-black shadow-sm'
                            : 'text-muted hover:text-[rgb(var(--text-primary))]'
                    }`}
                >
                    {format ? format(option) : String(option)}
                </button>
            ))}
        </div>
    </div>
);

const clampIntOption = (n: number, options: readonly number[]): number => {
    let best = options[0];
    for (const o of options) {
        if (Math.abs(o - n) < Math.abs(best - n)) best = o;
    }
    return best;
};

export const PrefStepper: React.FC<{
    label: string;
    hint?: string;
    value: number;
    options: readonly number[];
    format: (n: number) => string;
    onChange: (next: number) => void;
}> = ({ label, hint, value, options, format, onChange }) => {
    const idx = options.indexOf(clampIntOption(value, options));
    const step = (dir: 1 | -1) => {
        const next = options[Math.min(options.length - 1, Math.max(0, idx + dir))];
        if (next !== value) {
            triggerHaptic('light');
            onChange(next);
        }
    };
    return (
        <div className="flex items-center justify-between gap-2 p-3">
            <div className="flex flex-col pr-2">
                <span className="text-sm font-medium text-[rgb(var(--text-primary))]">{label}</span>
                {hint && <span className="mt-0.5 text-xs text-muted">{hint}</span>}
            </div>
            <div className="flex items-center gap-1 rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-elevated))] p-1 shrink-0">
                <button
                    type="button"
                    onClick={() => step(-1)}
                    disabled={idx <= 0}
                    aria-label={`${label} −`}
                    className="min-h-[44px] min-w-[44px] rounded-lg text-lg font-bold text-[rgb(var(--text-primary))] disabled:opacity-30"
                >
                    −
                </button>
                <span className="gl-num min-w-[64px] text-center text-sm font-bold text-[rgb(var(--text-primary))]">
                    {format(value)}
                </span>
                <button
                    type="button"
                    onClick={() => step(1)}
                    disabled={idx >= options.length - 1}
                    aria-label={`${label} +`}
                    className="min-h-[44px] min-w-[44px] rounded-lg text-lg font-bold text-[rgb(var(--text-primary))] disabled:opacity-30"
                >
                    +
                </button>
            </div>
        </div>
    );
};
