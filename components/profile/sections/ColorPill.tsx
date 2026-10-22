import React from 'react';
import { Icon } from '../../ui/Icon';

interface ColorPillProps {
    color: string;
    active: boolean;
    onClick: () => void;
    label: string;
    checkDark?: boolean;
}

/**
 * Q18: accent-color pill, hoisted from inside ProfileSheet (a component
 * defined during render remounts on every parent render).
 */
export const ColorPill: React.FC<ColorPillProps> = ({ color, active, onClick, label, checkDark }) => (
    <button
        type="button"
        onClick={onClick}
        className="flex min-h-11 min-w-11 flex-col items-center gap-1.5 rounded-xl group focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-500"
    >
        <div
            className={`w-11 h-11 rounded-full ${color} flex items-center justify-center transition-all ${
                active
                    ? 'ring-2 ring-offset-2 ring-offset-[rgb(var(--surface-base))] ring-[rgb(var(--text-primary))]'
                    : 'hover:ring-2 hover:ring-border-strong'
            }`}
        >
            {active && (
                <Icon
                    name="Check"
                    size={16}
                    strokeWidth={3}
                    className={checkDark ? 'text-zinc-950' : 'text-white'}
                />
            )}
        </div>
        <span className={`text-xs transition-colors ${active ? 'font-medium text-[rgb(var(--text-primary))]' : 'text-muted group-hover:text-[rgb(var(--text-primary))]'}`}>
            {label}
        </span>
    </button>
);
