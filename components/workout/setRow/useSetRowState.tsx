// U5: SetRow state and handlers, moved verbatim from components/workout/SetRow.tsx.
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { WorkoutSet, SetType, WeightUnit } from '../../../types';
import { Icon } from '../../ui/Icon';
import { triggerHaptic } from '../../../utils/audio';
import { TRANSLATIONS } from '../../../constants/translations';
import { fromDisplay, toDisplay } from '../../../utils/units';
import { getTypeLabel } from './HoldTimer';

export interface SetRowProps {
    set: WorkoutSet;
    exInstanceId: number;
    onUpdate: (exId: number, setId: number, field: string, value: any) => void;
    onToggleComplete: (exId: number, setId: number) => void;
    onChangeType: (exId: number, setId: number, type: SetType) => void;
    lang: 'en' | 'es';
    isCardio?: boolean;
    isBodyweight?: boolean;
    isIsometric?: boolean;
    isometricTargetSecs?: number;  // countdown mode for isometric
    setIndex?: number;
    badgeLabel?: string;
    tutorialId?: string;
    disableTypeChange?: boolean;
    isActiveProtocolSet?: boolean;
    isNextSet?: boolean;
    showRIR?: boolean;
    unit?: WeightUnit;
}

export const useSetRowState = ({
    set, exInstanceId,
    onUpdate, onToggleComplete, onChangeType,
    lang, isCardio, isBodyweight, isIsometric, isometricTargetSecs,
    setIndex, badgeLabel, tutorialId, disableTypeChange, isActiveProtocolSet, isNextSet, showRIR = false,
    unit = 'kg'
}: SetRowProps) => {
    const t = TRANSLATIONS[lang];
    const sr = t.setRow;
    const isDone = set.completed;
    const setType = set.type || 'regular';
    // For regular sets: show the set number (1-based index) instead of the
    // opaque bullet glyph gives instant orientation ("I'm on set 2 of 3").
    // For typed sets (warmup, myorep, drop...): keep the type letter badge.
    const effectiveBadgeLabel = badgeLabel
        ?? (setType === 'regular' && setIndex != null
            ? String(setIndex + 1)
            : getTypeLabel(setType));

    // Q11: stored values are always kg; localWeight holds the DISPLAY value.
    const shownWeight = useCallback((v: string | number | undefined, forUnit: WeightUnit = unit): string | number => {
        if (v === '' || v == null) return '';
        if (forUnit !== 'lb') return v;
        const n = Number(v);
        return Number.isFinite(n) ? toDisplay(n, 'lb') : v;
    }, [unit]);
    const storedWeight = useCallback((v: any, forUnit: WeightUnit = unit): any => {
        if (v === '' || v == null) return v;
        if (forUnit !== 'lb') return v;
        const n = Number(v);
        return Number.isFinite(n) ? fromDisplay(n, 'lb') : v;
    }, [unit]);
    const weightSuffix = unit === 'lb' ? 'lbs' : 'k';

    const [localWeight, setLocalWeight] = useState<string | number>(() => shownWeight(set.weight));
    const [localReps, setLocalReps] = useState(set.reps ?? '');
    const [localRpe, setLocalRpe] = useState(set.rpe ?? '');
    const [showExtraWeight, setShowExtraWeight] = useState(
        isBodyweight && (Number(set.weight) > 0 || Number(set.hintWeight) > 0)
    );
    // Swipe-to-complete
    const swipeOverlayRef = useRef<HTMLDivElement>(null);
    const checkIconRef = useRef<HTMLSpanElement>(null);
    const swipeRef = useRef({ startX: 0, startY: 0, tracking: false, locked: false, currentPct: 0 });

    const activeFieldRef = useRef<string | null>(null);
    const weightRef = useRef<HTMLInputElement>(null);
    const repsRef = useRef<HTMLInputElement>(null);
    const extraWeightRef = useRef<HTMLInputElement>(null);
    const commitTimersRef = useRef<Partial<Record<'weight' | 'reps' | 'rpe', ReturnType<typeof setTimeout>>>>({});

    useEffect(() => { if (activeFieldRef.current !== 'weight') setLocalWeight(shownWeight(set.weight)); }, [set.weight, shownWeight]);
    useEffect(() => { if (activeFieldRef.current !== 'reps') setLocalReps(set.reps ?? ''); }, [set.reps]);
    useEffect(() => { if (activeFieldRef.current !== 'rpe') setLocalRpe(set.rpe ?? ''); }, [set.rpe]);
    // Reset swipe when set state changes
    useEffect(() => {
        swipeRef.current.tracking = false;
        swipeRef.current.locked = false;
        swipeRef.current.currentPct = 0;
        if (swipeOverlayRef.current) {
            swipeOverlayRef.current.style.display = 'none';
            swipeOverlayRef.current.style.width = '0%';
        }
        if (checkIconRef.current) {
            checkIconRef.current.style.display = 'none';
        }
    }, [set.completed]);
    useEffect(() => () => {
        Object.values(commitTimersRef.current).forEach((timer) => {
            if (timer) clearTimeout(timer);
        });
    }, []);

    const commitChange = useCallback((field: string, value: any) => {
        if (value != set[field as keyof WorkoutSet]) {
            onUpdate(exInstanceId, set.id, field, value);
        }
    }, [exInstanceId, onUpdate, set]);

    const flushScheduledCommit = useCallback((field: 'weight' | 'reps' | 'rpe', value: any) => {
        const existing = commitTimersRef.current[field];
        if (existing) {
            clearTimeout(existing);
            delete commitTimersRef.current[field];
        }
        commitChange(field, value);
    }, [commitChange]);

    const scheduleCommit = useCallback((field: 'weight' | 'reps' | 'rpe', value: any, delay = 180) => {
        const existing = commitTimersRef.current[field];
        if (existing) clearTimeout(existing);
        commitTimersRef.current[field] = setTimeout(() => {
            delete commitTimersRef.current[field];
            commitChange(field, value);
        }, delay);
    }, [commitChange]);

    const flushPendingFields = useCallback(() => {
        Object.values(commitTimersRef.current).forEach((timer) => {
            if (timer) clearTimeout(timer);
        });
        commitTimersRef.current = {};

        const pendingStoredWeight = storedWeight(localWeight);
        if (pendingStoredWeight != set.weight) {
            onUpdate(exInstanceId, set.id, 'weight', pendingStoredWeight);
        }
        if (localReps != set.reps) {
            onUpdate(exInstanceId, set.id, 'reps', localReps);
        }
        if (showRIR && localRpe != set.rpe) {
            onUpdate(exInstanceId, set.id, 'rpe', localRpe);
        }
    }, [exInstanceId, localReps, localRpe, localWeight, onUpdate, set.id, set.reps, set.rpe, set.weight, showRIR, storedWeight]);

    const handleToggleComplete = useCallback(() => {
        flushPendingFields();
        triggerHaptic(isDone ? 'light' : 'medium');
        onToggleComplete(exInstanceId, set.id);
    }, [flushPendingFields, isDone, onToggleComplete, exInstanceId, set.id]);

    // Unit switched (possibly while editing): flush pending keystrokes under
    // the OLD unit, then resync the display so a later blur can't commit
    // stale text under the new unit.
    const prevUnitRef = useRef(unit);
    useEffect(() => {
        if (prevUnitRef.current === unit) return;
        const oldUnit = prevUnitRef.current;
        prevUnitRef.current = unit;
        const pending = commitTimersRef.current['weight'];
        if (pending) {
            clearTimeout(pending);
            delete commitTimersRef.current['weight'];
            const committed = storedWeight(localWeight, oldUnit);
            commitChange('weight', committed);
            setLocalWeight(shownWeight(committed, unit));
            skipWeightBlurRef.current = true;
        } else {
            setLocalWeight(shownWeight(set.weight, unit));
        }
    }, [unit, commitChange, localWeight, set.weight, shownWeight, storedWeight]);

    const handleWeightKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            repsRef.current?.focus();
        }
    };

    // Set by the unit-switch guard after flushing: the next blur must not
    // re-commit the resynced display value (display→stored is not bit-exact).
    const skipWeightBlurRef = useRef(false);
    const handleWeightBlur = (value: any) => {
        activeFieldRef.current = null;
        if (skipWeightBlurRef.current && !commitTimersRef.current['weight']) {
            skipWeightBlurRef.current = false;
            return;
        }
        skipWeightBlurRef.current = false;
        flushScheduledCommit('weight', storedWeight(value));
    };

    const handleBlur = (field: string, value: any) => {
        activeFieldRef.current = null;
        flushScheduledCommit(field as 'weight' | 'reps' | 'rpe', value);
    };
    // Swipe-to-complete handlers
    const onSwipeTouchStart = useCallback((e: React.TouchEvent) => {
        if (isDone || !e.touches?.[0]) return;
        const touch = e.touches[0];
        // Ignore swipes starting < 24px from left edge to avoid conflict with OS back gesture
        if (touch.clientX < 24) return;
        swipeRef.current = { startX: touch.clientX, startY: touch.clientY, tracking: true, locked: false, currentPct: 0 };
    }, [isDone]);

    const onSwipeTouchMove = useCallback((e: React.TouchEvent) => {
        const s = swipeRef.current;
        if (!s.tracking || isDone || s.locked || !e.touches?.[0]) return;
        const dx = e.touches[0].clientX - s.startX;
        const dy = e.touches[0].clientY - s.startY;

        // Cancel swipe if vertical movement dominates or user scrolls diagonally
        if (Math.abs(dy) > Math.abs(dx) || (Math.abs(dy) > 10 && dx < 20)) {
            s.tracking = false;
            s.currentPct = 0;
            if (swipeOverlayRef.current) {
                swipeOverlayRef.current.style.display = 'none';
                swipeOverlayRef.current.style.width = '0%';
            }
            if (checkIconRef.current) {
                checkIconRef.current.style.display = 'none';
            }
            return;
        }

        // Require clear horizontal dominance: dx > 10 and dx > 1.8 * |dy|
        if (dx > 10 && dx > Math.abs(dy) * 1.8) {
            const pct = Math.min(100, ((dx - 10) / 80) * 100);
            s.currentPct = pct;
            if (swipeOverlayRef.current) {
                swipeOverlayRef.current.style.display = 'flex';
                swipeOverlayRef.current.style.width = `${pct}%`;
            }
            if (checkIconRef.current) {
                checkIconRef.current.style.display = pct > 50 ? 'inline-flex' : 'none';
            }
        }
    }, [isDone]);

    const onSwipeTouchEnd = useCallback(() => {
        const s = swipeRef.current;
        if (s.currentPct >= 85 && !isDone && s.tracking) {
            s.locked = true;
            flushPendingFields();
            triggerHaptic('success');
            onToggleComplete(exInstanceId, set.id);
        }
        s.currentPct = 0;
        s.tracking = false;
        if (swipeOverlayRef.current) {
            swipeOverlayRef.current.style.display = 'none';
            swipeOverlayRef.current.style.width = '0%';
        }
        if (checkIconRef.current) {
            checkIconRef.current.style.display = 'none';
        }
    }, [isDone, flushPendingFields, exInstanceId, set.id, onToggleComplete]);

    const handleHoldSave = useCallback((seconds: number) => {
        onUpdate(exInstanceId, set.id, 'duration', seconds);
    }, [exInstanceId, set.id, onUpdate]);

    const focusPrimaryField = useCallback(() => {
        if (isDone || isIsometric) return;

        if (isBodyweight && !isCardio) {
            if (!String(localReps ?? '').trim()) {
                repsRef.current?.focus();
                return;
            }
            if (showExtraWeight) {
                extraWeightRef.current?.focus();
                return;
            }
            repsRef.current?.focus();
            return;
        }

        if (!String(localWeight ?? '').trim()) {
            weightRef.current?.focus();
            return;
        }
        repsRef.current?.focus();
    }, [isBodyweight, isCardio, isDone, isIsometric, localReps, localWeight, showExtraWeight]);

    const handleRowClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
        const target = event.target as HTMLElement;
        if (target.closest('button, input, textarea, select, a')) return;
        focusPrimaryField();
    }, [focusPrimaryField]);

    const inputBaseClass = "h-[38px] w-full rounded-[9px] bg-surface-elevated text-center text-[15px] font-semibold text-zinc-200 outline-none transition-colors border border-transparent focus:border-primary-500 focus:bg-surface-raised tabular-nums";
    const inputActiveClass = "h-[38px] w-full rounded-[9px] bg-surface-raised border border-primary-500/70 text-center text-[15px] font-semibold text-white outline-none focus:border-primary-500 tabular-nums shadow-sm";
    const inputDoneClass = "h-[38px] w-full rounded-[9px] bg-transparent text-center text-[15px] font-semibold text-primary-400 outline-none tabular-nums";
    const currentInputClass = isDone ? inputDoneClass : isNextSet ? inputActiveClass : inputBaseClass;

    const rowClass = `relative rounded-[12px] transition-all duration-150 ${
        isDone
            ? 'bg-primary-500/10 border border-primary-500/25'
            : isNextSet
            // S9: theme surface in light mode (was a hard-coded dark island); dark unchanged.
            ? 'bg-surface-base dark:bg-[#1b1b20] border border-primary-500/50 shadow-sm'
            : 'bg-surface-raised border border-border-subtle'
    }`;

    const checkBtnClass = `relative flex h-[34px] w-[34px] after:absolute after:-inset-[6px] after:content-[''] shrink-0 items-center justify-center rounded-full transition-all duration-150 active:scale-90 ${
        isDone
            ? 'bg-primary-500 text-zinc-950 font-black shadow-sm'
            : 'border border-zinc-700 bg-surface-elevated text-zinc-500 hover:border-zinc-500 hover:text-white'
    }`;

    const weightPlaceholder = set.hintWeight ? String(shownWeight(set.hintWeight)) : '0';
    const repsPlaceholder = set.hintReps ? String(set.hintReps) : '0';
    const prescriptionHint = set.prescribedReps !== undefined
        ? (set.prescribedReps === 'FAILURE'
            ? t.targetFailure
            : `OBJ: ${set.prescribedReps}${set.targetRpe !== undefined ? ` · RPE ${set.targetRpe}` : ''}`)
        : null;

    const prevText = useMemo(() => {
        if (isIsometric) {
            if (set.duration) return `${set.duration}s`;
            return '—';
        }
        if (isBodyweight) {
            if (set.prevReps) {
                return set.prevWeight && Number(set.prevWeight) > 0 ? `+${shownWeight(set.prevWeight)}${weightSuffix}` : `${set.prevReps}`;
            }
            return set.hintReps ? String(set.hintReps) : '—';
        }
        if (set.prevReps || set.prevWeight) {
            if (set.prevReps && set.prevWeight) return `${shownWeight(set.prevWeight)}${weightSuffix}`;
            return set.prevWeight && !set.prevReps ? String(shownWeight(set.prevWeight)) : String(set.prevReps || set.prevWeight);
        }
        if (set.hintReps || set.hintWeight) {
            return set.hintWeight && !set.hintReps ? String(shownWeight(set.hintWeight)) : String(set.hintReps || set.hintWeight);
        }
        return '—';
    }, [isBodyweight, isIsometric, set.duration, set.hintReps, set.hintWeight, set.prevReps, set.prevWeight, shownWeight, weightSuffix]);

    const setNumber = (setIndex ?? 0) + 1;
    const badgeAriaLabel = `${sr.setWord} ${setNumber}${(!disableTypeChange && !isDone) ? sr.changeType : ''}`;
    const BadgeEl = disableTypeChange || isDone ? 'div' : 'button';
    const badgeProps = (!disableTypeChange && !isDone)
        ? { id: tutorialId, onClick: () => onChangeType(exInstanceId, set.id, setType), 'aria-label': badgeAriaLabel }
        : { id: tutorialId, 'aria-label': badgeAriaLabel };
    const completeSetAriaLabel = t.completeSet;
    const badgeClass = `relative flex h-7 w-7 after:absolute after:-inset-2.5 after:content-[''] items-center justify-center rounded-full text-[11px] font-bold transition-all ${
        isDone
            ? 'bg-primary-500 text-zinc-950'
            : isNextSet
            ? 'bg-surface-elevated text-white border border-primary-500/60'
            : 'bg-surface-elevated text-muted border border-border-subtle'
    } ${!disableTypeChange && !isDone ? 'cursor-pointer active:scale-90' : 'cursor-default'}`;

    const SwipeOverlay = !isDone ? (
        <div
            ref={swipeOverlayRef}
            data-testid="swipe-overlay"
            className="absolute inset-y-0 left-0 rounded-xl bg-green-500/20 pointer-events-none transition-none flex items-center justify-start pl-3"
            style={{ width: '0%', display: 'none' }}
        >
            <span ref={checkIconRef} style={{ display: 'none' }}>
                <Icon name="Check" size={16} className="text-green-400" strokeWidth={3} />
            </span>
        </div>
    ) : null;


    return {
        set,
        exInstanceId,
        onUpdate,
        onToggleComplete,
        onChangeType,
        lang,
        isCardio,
        isBodyweight,
        isIsometric,
        isometricTargetSecs,
        setIndex,
        badgeLabel,
        tutorialId,
        disableTypeChange,
        isActiveProtocolSet,
        isNextSet,
        showRIR,
        unit,
        t,
        sr,
        isDone,
        setType,
        effectiveBadgeLabel,
        shownWeight,
        storedWeight,
        weightSuffix,
        localWeight,
        setLocalWeight,
        localReps,
        setLocalReps,
        localRpe,
        setLocalRpe,
        showExtraWeight,
        setShowExtraWeight,
        swipeOverlayRef,
        checkIconRef,
        swipeRef,
        activeFieldRef,
        weightRef,
        repsRef,
        extraWeightRef,
        commitTimersRef,
        commitChange,
        flushScheduledCommit,
        scheduleCommit,
        flushPendingFields,
        handleToggleComplete,
        prevUnitRef,
        handleWeightKeyDown,
        skipWeightBlurRef,
        handleWeightBlur,
        handleBlur,
        onSwipeTouchStart,
        onSwipeTouchMove,
        onSwipeTouchEnd,
        handleHoldSave,
        focusPrimaryField,
        handleRowClick,
        inputBaseClass,
        inputActiveClass,
        inputDoneClass,
        currentInputClass,
        rowClass,
        checkBtnClass,
        weightPlaceholder,
        repsPlaceholder,
        prescriptionHint,
        prevText,
        setNumber,
        badgeAriaLabel,
        BadgeEl,
        badgeProps,
        completeSetAriaLabel,
        badgeClass,
        SwipeOverlay,
    };
};

export type SetRowState = ReturnType<typeof useSetRowState>;
