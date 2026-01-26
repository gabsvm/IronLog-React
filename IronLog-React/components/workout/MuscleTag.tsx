
import React from 'react';

export const MuscleTag = React.memo(({ label }: { label: string }) => (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-100 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400">
        {label}
    </span>
));
