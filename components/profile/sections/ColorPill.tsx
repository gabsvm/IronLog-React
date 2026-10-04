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
        className="flex flex-col items-center gap-1.5 transition-transform active:scale-95 group"
    >
        <div
            className={`w-9 h-9 rounded-full ${color} flex items-center justify-center transition-all ${
                active
                    ? 'ring-2 ring-offset-2 ring-offset-zinc-900 ring-white dark:ring-white scale-105 shadow-md'
                    : 'opacity-85 hover:opacity-100 hover:scale-105'
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
        <span className={`text-xs transition-colors ${active ? 'font-medium text-white' : 'text-muted group-hover:text-white'}`}>
            {label}
        </span>
    </button>
);
