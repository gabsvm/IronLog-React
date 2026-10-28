import React from 'react';

export interface MuscleTagProps {
    label: string;
    className?: string;
}

export const MuscleTag: React.FC<MuscleTagProps> = React.memo(({ label, className = '' }) => (
    <span
        className={`inline-flex items-center gap-1.5 rounded-[4px] border border-fuchsia-500/40 bg-fuchsia-950/40 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-fuchsia-300 ${className}`}
    >
        <svg
            width="10"
            height="10"
            viewBox="0 0 12 12"
            fill="currentColor"
            className="shrink-0"
            aria-hidden="true"
        >
            <rect x="1" y="2" width="2" height="8" rx="0.5" />
            <rect x="5" y="1" width="2" height="10" rx="0.5" />
            <rect x="9" y="3" width="2" height="7" rx="0.5" />
        </svg>
        <span>{label}</span>
    </span>
));
