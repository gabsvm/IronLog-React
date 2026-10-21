// Phase 4 (focused workout): exercise selector rail. Horizontal scroll on
// mobile, lateral column on desktop. Governed by the existing
// `activeExerciseId` — selection only, no business-logic changes.
import React from 'react';
import { Icon } from '../ui/Icon';

export interface WorkoutRailItem {
    instanceId: number;
    label: string;
    done: number;
    total: number;
    superset: boolean;
    complete: boolean;
}

interface WorkoutExerciseRailProps {
    items: WorkoutRailItem[];
    activeId: number | null;
    onSelect: (instanceId: number) => void;
    navLabel: string;
    setsOfWord: string;
}

export const WorkoutExerciseRail: React.FC<WorkoutExerciseRailProps> = React.memo(({
    items,
    activeId,
    onSelect,
    navLabel,
    setsOfWord,
}) => {
    if (items.length === 0) return null;
    return (
        <div className="sticky top-0 z-10 -mx-3 bg-surface-app/95 px-3 py-2 backdrop-blur-md lg:static lg:z-auto lg:mx-0 lg:self-start lg:bg-transparent lg:px-0 lg:py-0">
            <nav
                aria-label={navLabel}
                className="scroll-container flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:items-stretch lg:overflow-visible lg:pb-0"
            >
                {items.map((item, index) => {
                    const isActive = item.instanceId === activeId;
                    return (
                        <button
                            key={item.instanceId}
                            type="button"
                            onClick={() => onSelect(item.instanceId)}
                            aria-current={isActive ? 'true' : undefined}
                            className={`flex min-h-[44px] shrink-0 snap-start items-center gap-2.5 rounded-2xl border px-3 py-2 text-left transition-colors active:scale-[0.98] lg:w-full ${
                                isActive
                                    ? 'border-primary-500/50 bg-primary-500/10'
                                    : 'border-border-subtle bg-surface-raised/40 hover:border-zinc-500/60'
                            }`}
                        >
                            <span
                                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black tabular-nums ${
                                    item.complete
                                        ? 'bg-green-500/20 text-green-400'
                                        : isActive
                                            ? 'bg-primary-500 text-zinc-950'
                                            : 'bg-surface-elevated text-muted'
                                }`}
                            >
                                {item.complete ? <Icon name="Check" size={14} strokeWidth={3} /> : index + 1}
                            </span>
                            <span className="min-w-0 max-w-[160px] lg:max-w-none lg:flex-1">
                                <span className="flex items-center gap-1.5">
                                    <span className="truncate text-xs font-bold text-white">
                                        {item.label}
                                    </span>
                                    {item.superset && (
                                        <span className="shrink-0 rounded-full border border-violet-500/30 bg-violet-500/15 px-1.5 py-px text-[9px] font-black tracking-widest text-violet-200">
                                            SS
                                        </span>
                                    )}
                                </span>
                                <span className="block text-[11px] tabular-nums text-muted">
                                    {item.done} {setsOfWord} {item.total}
                                </span>
                            </span>
                        </button>
                    );
                })}
            </nav>
        </div>
    );
});
