// U5: SetRow bodyweight mode, moved verbatim from components/workout/SetRow.tsx.
import React from 'react';
import { Icon } from '../../ui/Icon';
import { SetKeypad } from '../SetKeypad';
import type { SetRowState } from './useSetRowState';

export const SetRowBodyweight: React.FC<{ state: SetRowState }> = ({ state }) => {
    const { set, showRIR, t, isDone, effectiveBadgeLabel, storedWeight, localWeight, setLocalWeight, localReps, setLocalReps, localRpe, setLocalRpe, repsRef, extraWeightRef, scheduleCommit, handleToggleComplete, handleWeightKeyDown, handleRepsKeyDown, handleWeightFocus, handleRepsFocus, handleKeypadChange, handleKeypadNext, handleKeypadDone, keypadOpen, keypadValue, handleWeightBlur, handleBlur, onSwipeTouchStart, onSwipeTouchMove, onSwipeTouchEnd, handleRowClick, currentInputClass, rowClass, checkBtnClass, weightPlaceholder, repsPlaceholder, prescriptionHint, prevText, BadgeEl, badgeProps, completeSetAriaLabel, badgeClass, SwipeOverlay } = state;
    return (
            <div id={`set-row-${set.id}`}
                onTouchStart={onSwipeTouchStart} onTouchMove={onSwipeTouchMove} onTouchEnd={onSwipeTouchEnd}
                onClick={handleRowClick}
                className={rowClass}>
                {SwipeOverlay}
                <div className={`grid ${showRIR ? 'grid-cols-[28px_38px_1fr_1fr_38px_36px]' : 'grid-cols-[28px_44px_1fr_1fr_36px]'} items-center gap-2 px-2 py-1.5`}>
                    <div className="flex justify-center">
                        <BadgeEl {...badgeProps as any} className={badgeClass}>
                            {effectiveBadgeLabel}
                        </BadgeEl>
                    </div>
                    <div className="min-w-0 whitespace-normal break-words text-center text-xs leading-tight text-muted tabular-nums font-medium">
                        {prevText}
                    </div>
                    <div>
                        <input
                            ref={extraWeightRef}
                            type="number" inputMode="decimal"
                            className={currentInputClass}
                            placeholder={weightPlaceholder}
                            aria-label={t.weight}
                            value={localWeight}
                            readOnly={keypadOpen}
                            onChange={e => {
                                setLocalWeight(e.target.value);
                                scheduleCommit('weight', storedWeight(e.target.value), 180);
                            }}
                            onKeyDown={handleWeightKeyDown}
                            onBlur={() => handleWeightBlur(localWeight)}
                            onFocus={handleWeightFocus}
                            enterKeyHint="next"
                        />
                    </div>
                    <div>
                        <input
                            ref={repsRef}
                            type="number" inputMode="numeric"
                            className={currentInputClass}
                            placeholder={repsPlaceholder}
                            aria-label={t.reps}
                            value={localReps}
                            readOnly={keypadOpen}
                            onChange={e => {
                                setLocalReps(e.target.value);
                                scheduleCommit('reps', e.target.value, 180);
                            }}
                            onBlur={() => handleBlur('reps', localReps)}
                            onKeyDown={handleRepsKeyDown}
                            onFocus={handleRepsFocus}
                            enterKeyHint="done"
                        />
                    </div>
                    {showRIR && (
                        <div>
                            <input
                                type="number" inputMode="decimal"
                                className={currentInputClass}
                                placeholder="RIR"
                                aria-label="RIR"
                                value={localRpe}
                                onChange={e => {
                                    setLocalRpe(e.target.value);
                                    scheduleCommit('rpe', e.target.value, 180);
                                }}
                                onBlur={() => handleBlur('rpe', localRpe)}
                                enterKeyHint="done"
                            />
                        </div>
                    )}
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
            <SetKeypad value={keypadValue} onChange={handleKeypadChange} onNext={handleKeypadNext} onDone={handleKeypadDone} visible={keypadOpen} />
            </div>
    );
};
