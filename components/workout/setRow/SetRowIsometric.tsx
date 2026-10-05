// U5: SetRow isometric mode, moved verbatim from components/workout/SetRow.tsx.
import React from 'react';
import { Icon } from '../../ui/Icon';
import { HoldTimer } from './HoldTimer';
import type { SetRowState } from './useSetRowState';

export const SetRowIsometric: React.FC<{ state: SetRowState }> = ({ state }) => {
    const { set, lang, isometricTargetSecs, isDone, effectiveBadgeLabel, handleToggleComplete, onSwipeTouchStart, onSwipeTouchMove, onSwipeTouchEnd, handleHoldSave, rowClass, checkBtnClass, prescriptionHint, prevText, BadgeEl, badgeProps, completeSetAriaLabel, badgeClass, SwipeOverlay } = state;
    return (
            <div id={`set-row-${set.id}`}
                onTouchStart={onSwipeTouchStart} onTouchMove={onSwipeTouchMove} onTouchEnd={onSwipeTouchEnd}
                className={rowClass}>
                {SwipeOverlay}
                <div className="grid grid-cols-[28px_44px_1fr_36px] gap-2 items-center px-2.5 py-1.5">
                    <div className="flex justify-center">
                        <BadgeEl {...badgeProps as any} className={badgeClass}>
                            {effectiveBadgeLabel}
                        </BadgeEl>
                    </div>
                    <div className="text-center text-[12px] text-muted tabular-nums truncate font-medium">
                        {prevText}
                    </div>
                    <div className="flex items-center justify-center">
                        <HoldTimer
                            initialSeconds={Number(set.duration) || 0}
                            targetSeconds={isometricTargetSecs}
                            onSave={handleHoldSave}
                            lang={lang}
                            isDone={isDone}
                        />
                    </div>
                    <div className="flex justify-center">
                        <button
                            onClick={handleToggleComplete}
                            className={checkBtnClass}
                            aria-pressed={Boolean(isDone)}
                            aria-label={completeSetAriaLabel}
                        >
                            <Icon name="Check" size={17} strokeWidth={isDone ? 3 : 2.5} />
                        </button>
                    </div>
                </div>
                {prescriptionHint && !isDone && (
                    <div className="flex justify-center pb-1 -mt-0.5">
                        <span className="text-[11px] font-bold tracking-wide text-primary-400">{prescriptionHint}</span>
                    </div>
                )}
            </div>
    );
};
