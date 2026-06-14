
import React from 'react';

// Neutral muscle pill — used in cards/listings where the slot's muscle group
// is shown as metadata. Previously hardcoded to red, which clashed with the
// primary RP accent. A subtle white/glass treatment reads as data-label, not
// destructive/alert.
export const MuscleTag = React.memo(({ label }: { label: string }) => (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300">
        {label}
    </span>
));
