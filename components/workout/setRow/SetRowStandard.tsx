// U5: SetRow standard gym / cardio mode, moved verbatim from components/workout/SetRow.tsx.
import React, { useState, useRef } from 'react';
import { Icon } from '../../ui/Icon';
import { pickLang } from '../../../utils/i18n';
import { SetRowActionMenu } from './SetRowActionMenu';
import type { SetRowState } from './useSetRowState';

export const SetRowStandard: React.FC<{ state: SetRowState }> = ({ state }) => {
    const {
        set,
        exInstanceId,
        onUpdate,
        onChangeType,
        lang,
        showRIR,
        t,
        isDone,
        setType,
        effectiveBadgeLabel,
        storedWeight,
        localWeight,
        setLocalWeight,
        localReps,
        setLocalReps,
        localRpe,
        setLocalRpe,
        activeFieldRef,
        weightRef,
        repsRef,
        scheduleCommit,
        handleToggleComplete,
        handleWeightKeyDown,
        handleWeightBlur,
        handleBlur,
        onSwipeTouchStart,
        onSwipeTouchMove,
        onSwipeTouchEnd,
        handleRowClick,
        weightPlaceholder,
        repsPlaceholder,
        predictiveTarget,
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
    const buttonRef = useRef<HTMLButtonElement>(null);

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
            {/* Target text rendered before weight input for accessibility & unit tests */}
            {prescriptionHint && (
                <span data-testid="set-target" className="sr-only text-[11px]">
                    {prescriptionHint}
                </span>
            )}
            {prevText && prevText !== '—' && (
                <span className="sr-only">{prevText}</span>
            )}
            <div
                className={`grid ${
                    showRIR
                        ? 'grid-cols-[32px_1fr_1fr_44px_44px]'
                        : 'grid-cols-[32px_1fr_1fr_44px]'
                } items-center gap-3 px-3 py-2.5 transition-colors`}
            >
                {/* Left cell (32px): Per-Set ⋮ Menu Button + Set Type Indicator */}
                <div className="relative flex justify-center">
                    <button
                        ref={buttonRef}
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
                            <span
                                className={`flex items-center gap-0.5 text-[11px] font-bold ${
                                    setType === 'myorep'
                                        ? 'text-purple-300'
                                        : setType === 'myorep_match' || setType === 'cluster'
                                            ? 'text-emerald-300'
                                            : setType === 'drop'
                                                ? 'text-amber-300'
                                                : setType === 'lengthened_partials'
                                                    ? 'text-sky-300'
                                                    : 'text-primary-400'
                                }`}
                            >
                                <span>{effectiveBadgeLabel}</span>
                                <span className="text-[9px] text-zinc-500 leading-none">⋮</span>
                            </span>
                        )}
                    </button>

                    <SetRowActionMenu
                        isOpen={menuOpen}
                        onClose={() => setMenuOpen(false)}
                        anchorRef={buttonRef}
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

                {/* Weight Input Box */}
                <div>
                    <input
                        ref={weightRef}
                        type="number"
                        inputMode="decimal"
                        className={`h-9 w-full rounded-[4px] border text-center text-[15px] font-semibold outline-none tabular-nums transition-colors ${
                            isDone
                                ? 'border-transparent bg-transparent text-zinc-400'
                                : 'bg-surface-app border-border-subtle/80 text-white placeholder:text-zinc-500 focus:border-primary-500'
                        }`}
                        placeholder={weightPlaceholder}
                        aria-label={t.weight}
                        value={localWeight}
                        onChange={(e) => {
                            setLocalWeight(e.target.value);
                            scheduleCommit('weight', storedWeight(e.target.value), 180);
                        }}
                        onKeyDown={handleWeightKeyDown}
                        onBlur={() => handleWeightBlur(localWeight)}
                        onFocus={() => {
                            activeFieldRef.current = 'weight';
                        }}
                        enterKeyHint="next"
                    />
                </div>

                {/* Reps Input Box */}
                <div>
                    <input
                        ref={repsRef}
                        type="number"
                        inputMode="numeric"
                        className={`h-9 w-full rounded-[4px] border text-center text-[15px] font-semibold outline-none tabular-nums transition-colors ${
                            isDone
                                ? 'border-transparent bg-transparent text-zinc-400'
                                : 'bg-surface-app border-border-subtle/80 text-white placeholder:text-zinc-500 focus:border-primary-500'
                        }`}
                        placeholder={repsPlaceholder}
                        aria-label={t.reps}
                        value={localReps}
                        onChange={(e) => {
                            setLocalReps(e.target.value);
                            scheduleCommit('reps', e.target.value, 180);
                        }}
                        onBlur={() => handleBlur('reps', localReps)}
                        onFocus={() => {
                            activeFieldRef.current = 'reps';
                        }}
                        enterKeyHint="done"
                    />
                </div>

                {/* Optional RIR Input Box */}
                {showRIR && (
                    <div>
                        <input
                            type="number"
                            inputMode="decimal"
                            className={`h-9 w-full rounded-[4px] border text-center text-[15px] font-semibold outline-none tabular-nums transition-colors ${
                                isDone
                                    ? 'border-transparent bg-transparent text-zinc-400'
                                    : 'bg-surface-app border-border-subtle/80 text-white placeholder:text-zinc-500 focus:border-primary-500'
                            }`}
                            placeholder="RIR"
                            aria-label="RIR"
                            value={localRpe}
                            onChange={(e) => {
                                setLocalRpe(e.target.value);
                                scheduleCommit('rpe', e.target.value, 180);
                            }}
                            onBlur={() => handleBlur('rpe', localRpe)}
                            enterKeyHint="done"
                        />
                    </div>
                )}

                {/* Right cell (44px): Checkbox for LOG */}
                <div className="flex justify-center">
                    <button
                        type="button"
                        onClick={handleToggleComplete}
                        className={`relative flex h-[22px] w-[22px] items-center justify-center rounded-[3px] border-2 transition-colors active:scale-95 after:absolute after:-inset-2 after:content-[''] ${
                            isDone
                                ? 'bg-emerald-500 border-emerald-500 text-zinc-950 font-black shadow-sm'
                                : 'border-zinc-500 bg-transparent hover:border-zinc-300'
                        }`}
                        aria-pressed={Boolean(isDone)}
                        aria-label={completeSetAriaLabel}
                    >
                        {isDone && <Icon name="Check" size={14} strokeWidth={3.5} />}
                    </button>
                </div>
            </div>
            {(predictiveTarget || set.limitingSide) && !isDone && (
                <div className="px-3 pb-2 -mt-1 flex items-center justify-end gap-1.5 flex-wrap">
                    {set.limitingSide && (
                        <button
                            type="button"
                            data-testid="unilateral-side-toggle"
                            onClick={(e) => {
                                e.stopPropagation();
                                const nextSide = set.limitingSide === 'L' ? 'R' : undefined;
                                onUpdate(exInstanceId, set.id, 'limitingSide', nextSide);
                            }}
                            className="inline-flex items-center gap-1 rounded-[4px] border border-border-subtle bg-surface-elevated px-2 py-0.5 text-[11px] font-bold text-zinc-200 hover:text-white"
                        >
                            {pickLang(lang, { es: `Lado: ${set.limitingSide}`, en: `Side: ${set.limitingSide}` })}
                        </button>
                    )}
                    {predictiveTarget && (
                        <div data-testid="predictive-match-pill" className="inline-flex items-center gap-1">
                            <span className="inline-flex items-center gap-1 rounded-[4px] border border-primary-500/35 bg-primary-500/12 px-2 py-0.5 text-[11px] font-bold text-primary-300 tabular-nums">
                                {predictiveTarget.mode === 'rir'
                                    ? pickLang(lang, { es: `Objetivo ajustado: ${predictiveTarget.targetRir} RIR`, en: `Matched target: ${predictiveTarget.targetRir} RIR` })
                                    : pickLang(lang, { es: `Objetivo recalculado: ${predictiveTarget.targetReps} reps`, en: `Predictive target: ${predictiveTarget.targetReps} reps` })}
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
