import React from 'react';

export interface MuscleTagProps {
    label: string;
    muscle?: string;
    className?: string;
}

function getMuscleTint(key?: string): string {
    if (!key) return 'border-rose-500/40 bg-rose-500/15 text-rose-300';
    const norm = key.toUpperCase();
    if (/BACK|LAT|TRAP|PULL|ESPALDA|TRAPECIO|TIR/i.test(norm)) {
        return 'border-amber-500/40 bg-amber-500/15 text-amber-300';
    }
    if (/SHOULDER|DELT|HOMBRO/i.test(norm)) {
        return 'border-violet-500/40 bg-violet-500/15 text-violet-300';
    }
    if (/QUAD|HAMSTRING|GLUTE|CALF|CALVES|LEG|LOWER|PIERNA|CUÁDRICEP|CUADRICEP|ISQUIO|GLÚTEO|GLUTEO|GEMELO/i.test(norm)) {
        return 'border-blue-500/40 bg-blue-500/15 text-blue-300';
    }
    if (/BICEP|TRICEP|FOREARM|ARM|BÍCEP|TRÍCEP|ANTEBRAZO|BRAZO/i.test(norm)) {
        return 'border-cyan-500/40 bg-cyan-500/15 text-cyan-300';
    }
    if (/AB|TRUNK|CORE|OBLIQ/i.test(norm)) {
        return 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300';
    }
    // Default Chest / Push / Upper (RP crimson/rose badge)
    return 'border-rose-500/40 bg-rose-500/15 text-rose-300';
}

export const MuscleTag: React.FC<MuscleTagProps> = React.memo(({ label, muscle, className = '' }) => {
    const tint = getMuscleTint(muscle || label);
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-[4px] border px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${tint} ${className}`}
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
    );
});
