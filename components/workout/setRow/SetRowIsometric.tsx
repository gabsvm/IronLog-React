// U5: SetRow isometric mode, moved verbatim from components/workout/SetRow.tsx.
import React, { useState } from 'react';
import { Icon } from '../../ui/Icon';
import { HoldTimer } from './HoldTimer';
import { SetRowActionMenu } from './SetRowActionMenu';
import type { SetRowState } from './useSetRowState';

export const SetRowIsometric: React.FC<{ state: SetRowState }> = ({ state }) => {
    const {
        set,
        exInstanceId,
        onUpdate,
        onChangeType,
        lang,
        isDone,
        setType,
        effectiveBadgeLabel,
        handleToggleComplete,
        onSwipeTouchStart,
        onSwipeTouchMove,
        onSwipeTouchEnd,
        handleRowClick,
        handleHoldSave,
        isometricTargetSecs,
        prescriptionHint,
        prevText,
        badgeAriaLabel,
        completeSetAriaLabel,
        SwipeOverlay,
        onAddSet,
        onDeleteSet,
        onModifySets,
    } = state;

    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <div
            id={`set-row-${set.id}`}
            onTouchStart={onSwipeTouchStart}
            onTouchMove={onSwipeTouchMove}
            onTouchEnd={onSwipeTouchEnd}
            onClick={handleRowClick}
            className="relative transition-colors"
        >
            {SwipeOverlay}
            {prescriptionHint && (
                <span data-testid="set-target" className="sr-only text-[11px]">
                    {prescriptionHint}
                </span>
            )}
            {prevText && prevText !== '—' && (
                <span className="sr-only">{prevText}</span>
            )}
            <div className="grid grid-cols-[28px_1fr_44px] items-center gap-2.5 px-3 py-2 border-t border-border-subtle/60">
                {/* Left cell (28px): Per-Set ⋮ Menu Button + Set Type Indicator */}
                <div className="relative flex justify-center">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpen((prev) => !prev);
                        }}
                        className="relative flex h-8 w-7 items-center justify-center rounded-[4px] text-zinc-400 hover:bg-surface-elevated hover:text-white transition-colors"
                        aria-label={badgeAriaLabel}
                    >
                        {setType === 'regular' ? (
                            <Icon name="MoreVertical" size={16} />
                        ) : (
                            <span className="flex items-center gap-0.5 text-[11px] font-bold text-primary-400">
                                <span>{effectiveBadgeLabel}</span>
                                <span className="text-[9px] text-zinc-500 leading-none">⋮</span>
                            </span>
                        )}
                    </button>

                    <SetRowActionMenu
                        isOpen={menuOpen}
                        onClose={() => setMenuOpen(false)}
                        set={set}
                        exInstanceId={exInstanceId}
                        lang={lang}
                        onUpdate={onUpdate}
                        onChangeType={onChangeType}
                        onAddSetBelow={
                            onAddSet
                                ? () => onAddSet(exInstanceId)
                                : onModifySets
                                ? () => onModifySets(exInstanceId, 1)
                                : undefined
                        }
                        onDeleteSet={
                            onDeleteSet
                                ? () => onDeleteSet(exInstanceId, set.id)
                                : onModifySets
                                ? () => onModifySets(exInstanceId, -1)
                                : undefined
                        }
                    />
                </div>

                {/* Middle column: HoldTimer */}
                <div className="flex items-center justify-center">
                    <HoldTimer
                        initialSeconds={Number(set.duration) || 0}
                        targetSeconds={isometricTargetSecs}
                        onSave={handleHoldSave}
                        lang={lang}
                        isDone={isDone}
                    />
                </div>

                {/* Right column (44px): Checkbox for LOG */}
                <div className="flex justify-center">
                    <button
                        type="button"
                        onClick={handleToggleComplete}
                        className={`relative flex h-[22px] w-[22px] items-center justify-center rounded-[3px] border-2 transition-colors active:scale-95 ${
                            isDone
                                ? 'bg-primary-500 border-primary-500 text-zinc-950 font-black shadow-sm'
                                : 'border-zinc-500 bg-transparent hover:border-zinc-300'
                        }`}
                        aria-pressed={Boolean(isDone)}
                        aria-label={completeSetAriaLabel}
                    >
                        {isDone && <Icon name="Check" size={14} strokeWidth={3.5} />}
                    </button>
                </div>
            </div>
        </div>
    );
};
