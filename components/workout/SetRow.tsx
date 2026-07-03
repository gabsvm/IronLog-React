
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { WorkoutSet, SetType } from '../../types';
import { Icon } from '../ui/Icon';
import { triggerHaptic } from '../../utils/audio';

interface SetRowProps {
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
}

const getTypeColor = (type: SetType) => {
    switch (type) {
        case 'warmup':       return 'bg-zinc-800 text-zinc-400 border-zinc-700';
        case 'myorep':       
        case 'myorep_match': 
        case 'top':          
        case 'backoff':      
        case 'cluster':      
        case 'giant':        
        case 'avt_hop':      
        case 'emom':         
        case 'drop':         
        case 'rest_pause':   
        case 'time_volume':  
        case 'triple_add':   return 'bg-[#1A1A1A] text-zinc-300 border-white/10';
        default:             return 'bg-[#121212] text-zinc-400 border-white/5';
    }
};

const getRowAccent = (type: SetType): string => {
    switch (type) {
        case 'warmup': return 'bg-[#18181c]';
        case 'drop': return 'bg-[#1c1816]';
        case 'myorep':
        case 'myorep_match': return 'bg-[#18141f]';
        case 'emom': return 'bg-[#131b1f]';
        default: return 'bg-[#17171b]';
    }
};

const getBorderAccent = (type: SetType): string => {
    switch (type) {
        case 'warmup': return 'border border-amber-500/10';
        case 'drop': return 'border border-orange-500/10';
        case 'myorep':
        case 'myorep_match': return 'border border-fuchsia-500/10';
        case 'emom': return 'border border-cyan-500/10';
        default: return 'border border-white/6';
    }
};

const getTypeLabel = (type: SetType) => {
    const map: Record<string, string> = {
        regular: 'â—',
        warmup: 'W',
        myorep: 'M',
        myorep_match: 'MM',
        giant: 'G',
        top: 'T',
        backoff: 'B',
        cluster: 'C',
        avt_hop: 'H',
        emom: 'E',
        drop: 'D',
        rest_pause: 'RP',
        time_volume: 'TV',
        triple_add: 'TA',
    };
    return map[type] || 'â—';
};

// â”€â”€â”€ HOLD TIMER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const HoldTimer: React.FC<{
    initialSeconds: number;
    targetSeconds?: number;   // If set -> countdown mode
    onSave: (seconds: number) => void;
    lang: 'en' | 'es';
    isDone: boolean;
}> = ({ initialSeconds, targetSeconds, onSave, lang, isDone }) => {
    const [elapsed, setElapsed] = useState(initialSeconds);
    const [running, setRunning] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const startTimeRef = useRef<number | null>(null);
    const baseElapsedRef = useRef(initialSeconds);

    const start = useCallback(() => {
        if (running) return;
        triggerHaptic('medium');
        setRunning(true);
        startTimeRef.current = Date.now();
        intervalRef.current = setInterval(() => {
            const now = Date.now();
            const delta = Math.floor((now - startTimeRef.current!) / 1000);
            setElapsed(baseElapsedRef.current + delta);
        }, 1000);
    }, [running]);

    const stop = useCallback(() => {
        if (!running) return;
        triggerHaptic('medium');
        if (intervalRef.current) clearInterval(intervalRef.current);
        setRunning(false);
        const finalElapsed = elapsed;
        baseElapsedRef.current = finalElapsed;
        onSave(finalElapsed);
    }, [running, elapsed, onSave]);

    const reset = useCallback(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setRunning(false);
        setElapsed(0);
        baseElapsedRef.current = 0;
        onSave(0);
    }, [onSave]);

    useEffect(() => {
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, []);

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return m > 0 ? `${m}:${sec.toString().padStart(2, '0')}` : `${sec}s`;
    };

    // Countdown display: timeRemaining counts down from target
    const timeRemaining = targetSeconds ? Math.max(0, targetSeconds - elapsed) : null;
    const countdownPct = targetSeconds ? Math.min(100, (elapsed / targetSeconds) * 100) : 0;
    const countdownUrgent = timeRemaining !== null && timeRemaining <= 5 && running;

    if (isDone) {
        return (
            <div className="flex items-center justify-center gap-1 text-green-400">
                <Icon name="Timer" size={13} />
                <span className="text-sm font-black tabular-nums">{formatTime(elapsed)}</span>
                {targetSeconds && <span className="text-[9px] text-green-600">/ {formatTime(targetSeconds)}</span>}
            </div>
        );
    }

    return (
        <div className="flex items-center gap-1.5 w-full">
            {/* Time Display */}
            <div className={`min-w-[52px] text-center text-xl font-black tabular-nums transition-colors ${
                countdownUrgent ? 'text-orange-400 animate-pulse'
                : running ? 'text-violet-400 animate-pulse'
                : elapsed > 0 ? 'text-white' : 'text-zinc-600'
            }`}>
                {timeRemaining !== null ? formatTime(timeRemaining) : formatTime(elapsed)}
            </div>
            {/* Countdown progress bar */}
            {targetSeconds && (
                <div className="flex-1 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-200 ${countdownUrgent ? 'bg-orange-400' : 'bg-violet-500'}`}
                        style={{ width: `${countdownPct}%` }} />
                </div>
            )}

            {/* Controls */}
            <div className="flex gap-1">
                {!running ? (
                    <button
                        onTouchStart={(e) => { e.stopPropagation(); start(); }}
                        onClick={(e) => { e.stopPropagation(); start(); }}
                        className="w-9 h-9 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center active:scale-90 transition-transform border border-violet-500/30"
                    >
                        <Icon name="Play" size={15} fill="currentColor" />
                    </button>
                ) : (
                    <button
                        onTouchStart={(e) => { e.stopPropagation(); stop(); }}
                        onClick={(e) => { e.stopPropagation(); stop(); }}
                        className="w-9 h-9 rounded-xl bg-violet-500 text-white flex items-center justify-center active:scale-90 transition-transform animate-pulse-slow"
                    >
                        <Icon name="Square" size={14} fill="currentColor" />
                    </button>
                )}
                {elapsed > 0 && !running && (
                    <button
                        onClick={(e) => { e.stopPropagation(); reset(); }}
                        className="w-7 h-9 flex items-center justify-center text-zinc-600 hover:text-zinc-400 active:scale-90 transition-all"
                    >
                        <Icon name="RotateCcw" size={13} />
                    </button>
                )}
            </div>
        </div>
    );
};

// â”€â”€â”€ MAIN SETROW â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const SetRow = React.memo(({
    set, exInstanceId,
    onUpdate, onToggleComplete, onChangeType,
    lang, isCardio, isBodyweight, isIsometric, isometricTargetSecs,
    setIndex, badgeLabel, tutorialId, disableTypeChange, isActiveProtocolSet, isNextSet
}: SetRowProps) => {
    const isDone = set.completed;
    const setType = set.type || 'regular';
    // For regular sets: show the set number (1-based index) instead of the
    // opaque bullet glyph gives instant orientation ("I'm on set 2 of 3").
    // For typed sets (warmup, myorep, drop...): keep the type letter badge.
    const effectiveBadgeLabel = badgeLabel
        ?? (setType === 'regular' && setIndex != null
            ? String(setIndex + 1)
            : getTypeLabel(setType));
    const rowAccent = isDone
        ? 'bg-emerald-500/12 ring-1 ring-inset ring-emerald-400/15'
        : isActiveProtocolSet
            ? 'bg-cyan-500/10 ring-1 ring-inset ring-cyan-400/25'
            : isNextSet
                ? 'bg-amber-400/12 ring-1 ring-inset ring-amber-300/20'
                : getRowAccent(setType);

    const [localWeight, setLocalWeight] = useState(set.weight ?? '');
    const [localReps, setLocalReps] = useState(set.reps ?? '');
    const [showExtraWeight, setShowExtraWeight] = useState(
        isBodyweight && (Number(set.weight) > 0 || Number(set.hintWeight) > 0)
    );
    // Swipe-to-complete
    const [swipePct, setSwipePct] = useState(0);
    const swipeRef = useRef({ startX: 0, startY: 0, tracking: false, locked: false });

    const activeFieldRef = useRef<string | null>(null);
    const repsRef = useRef<HTMLInputElement>(null);
    const commitTimersRef = useRef<Partial<Record<'weight' | 'reps', ReturnType<typeof setTimeout>>>>({});

    useEffect(() => { if (activeFieldRef.current !== 'weight') setLocalWeight(set.weight ?? ''); }, [set.weight]);
    useEffect(() => { if (activeFieldRef.current !== 'reps') setLocalReps(set.reps ?? ''); }, [set.reps]);
    // Reset swipe when set state changes
    useEffect(() => { setSwipePct(0); swipeRef.current.tracking = false; swipeRef.current.locked = false; }, [set.completed]);
    useEffect(() => () => {
        Object.values(commitTimersRef.current).forEach((timer) => {
            if (timer) clearTimeout(timer);
        });
    }, []);

    const commitChange = (field: string, value: any) => {
        if (value != set[field as keyof WorkoutSet]) {
            onUpdate(exInstanceId, set.id, field, value);
        }
    };

    const flushScheduledCommit = useCallback((field: 'weight' | 'reps', value: any) => {
        const existing = commitTimersRef.current[field];
        if (existing) {
            clearTimeout(existing);
            delete commitTimersRef.current[field];
        }
        commitChange(field, value);
    }, [commitChange]);

    const scheduleCommit = useCallback((field: 'weight' | 'reps', value: any, delay = 180) => {
        const existing = commitTimersRef.current[field];
        if (existing) clearTimeout(existing);
        commitTimersRef.current[field] = setTimeout(() => {
            delete commitTimersRef.current[field];
            commitChange(field, value);
        }, delay);
    }, [commitChange]);

    const handleWeightBlur = (value: any) => {
        activeFieldRef.current = null;
        flushScheduledCommit('weight', value);
        if (!isIsometric) setTimeout(() => repsRef.current?.focus(), 80);
    };

    const handleBlur = (field: string, value: any) => {
        activeFieldRef.current = null;
        flushScheduledCommit(field as 'weight' | 'reps', value);
    };
    // Swipe-to-complete handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const onSwipeTouchStart = useCallback((e: React.TouchEvent) => {
        if (isDone) return;
        swipeRef.current = { startX: e.touches[0].clientX, startY: e.touches[0].clientY, tracking: true, locked: false };
    }, [isDone]);

    const onSwipeTouchMove = useCallback((e: React.TouchEvent) => {
        const s = swipeRef.current;
        if (!s.tracking || isDone || s.locked) return;
        const dx = e.touches[0].clientX - s.startX;
        const dy = e.touches[0].clientY - s.startY;
        // Cancel if vertical gesture dominates (user is scrolling)
        if (Math.abs(dy) > Math.abs(dx) * 1.3 && Math.abs(dx) < 15) {
            s.tracking = false;
            setSwipePct(0);
            return;
        }
        if (dx > 0) {
            const pct = Math.min(100, (dx / 90) * 100);
            setSwipePct(pct);
        }
    }, [isDone]);

    const onSwipeTouchEnd = useCallback(() => {
        if (swipePct >= 85 && !isDone) {
            swipeRef.current.locked = true;
            triggerHaptic('success');
            onToggleComplete(exInstanceId, set.id);
        }
        setSwipePct(0);
        swipeRef.current.tracking = false;
    }, [swipePct, isDone, exInstanceId, set.id, onToggleComplete]);

    const handleHoldSave = useCallback((seconds: number) => {
        onUpdate(exInstanceId, set.id, 'duration', seconds);
    }, [exInstanceId, set.id, onUpdate]);

    const inputBase = "w-full rounded-[1.15rem] border border-white/6 bg-[#242428] px-2 py-2.5 text-center text-lg font-bold text-white outline-none transition-all tabular-nums placeholder-zinc-600 focus:border-primary-500/30 focus:ring-2 focus:ring-primary-500/20";
    const doneInput = "border-transparent bg-transparent text-white/90 pointer-events-none";

    // Show previous session value as placeholder so the field reads as "editable with context",
    // not as a disabled em dash. Falls back to '0' so the input reads clearly as empty & tappable.
    const weightPlaceholder = set.hintWeight ? String(set.hintWeight) : '0';
    const repsPlaceholder = set.hintReps ? String(set.hintReps) : '0';

    const BadgeEl = disableTypeChange || isDone ? 'div' : 'button';
    const badgeProps = (!disableTypeChange && !isDone)
        ? { id: tutorialId, onClick: () => onChangeType(exInstanceId, set.id, setType) }
        : { id: tutorialId };
    const badgeClass = `flex h-9 w-9 items-center justify-center rounded-full border font-black text-xs transition-all ${isDone ? 'border-emerald-400/20 bg-emerald-500 text-black shadow-[0_10px_25px_-10px_rgba(34,197,94,0.7)]' : getTypeColor(setType)} ${!disableTypeChange && !isDone ? 'cursor-pointer active:scale-90' : 'cursor-default'}`;

    // â”€â”€ Difficulty picker (shown after completing a set with no RPE) â”€
    const DifficultyPicker = !isDone ? null : (set.rpe === '' || set.rpe === null || set.rpe === undefined) ? (
        <div className="flex gap-1 px-2 pb-1.5 -mt-0.5 animate-in fade-in duration-300">
            {([{ emoji: 'Easy', label: lang === 'es' ? 'Facil' : 'Easy', val: '3' }, { emoji: 'OK', label: 'OK', val: '6' }, { emoji: 'Hard', label: lang === 'es' ? 'Duro' : 'Hard', val: '9' }] as const).map(d => (
                <button key={d.val}
                    onClick={() => onUpdate(exInstanceId, set.id, 'rpe', d.val)}
                    className="flex-1 text-[10px] font-bold py-1 rounded-lg bg-zinc-800/60 text-zinc-400 hover:bg-zinc-700 hover:text-white active:scale-95 transition-all">
                    {d.emoji} {d.label}
                </button>
            ))}
        </div>
    ) : null;

    // Swipe overlay - shared across all branches
    const SwipeOverlay = swipePct > 0 ? (
        <div className="absolute inset-y-0 left-0 rounded-xl bg-green-500/20 pointer-events-none transition-none flex items-center justify-start pl-3"
            style={{ width: `${swipePct}%` }}>
            {swipePct > 50 && <Icon name="Check" size={16} className="text-green-400" strokeWidth={3} />}
        </div>
    ) : null;

    // ISOMETRIC MODE
    if (isIsometric) {
        return (
            <div id={`set-row-${set.id}`}
                onTouchStart={onSwipeTouchStart} onTouchMove={onSwipeTouchMove} onTouchEnd={onSwipeTouchEnd}
                className={`relative grid grid-cols-12 gap-2 items-center rounded-[1.1rem] px-2 py-2.5 transition-colors duration-200 ${getBorderAccent(setType)} ${rowAccent} ${isDone ? 'opacity-80' : ''}`}>
                {SwipeOverlay}
                {/* Set Type Badge */}
                <div className="col-span-2 flex justify-center">
                    <BadgeEl {...badgeProps as any} className={badgeClass}>
                        {isDone ? <Icon name="Check" size={16} strokeWidth={2.5} /> : effectiveBadgeLabel}
                    </BadgeEl>
                </div>

                {/* Hold Timer - takes up the weight+reps cols */}
                <div className="col-span-8 flex items-center justify-center">
                    <HoldTimer
                        initialSeconds={Number(set.duration) || 0}
                        targetSeconds={isometricTargetSecs}
                        onSave={handleHoldSave}
                        lang={lang}
                        isDone={isDone}
                    />
                </div>

                {/* Complete Button */}
                <div className="col-span-2 flex justify-center">
                    <button
                        onClick={() => {
                            triggerHaptic(isDone ? 'light' : 'medium');
                            onToggleComplete(exInstanceId, set.id);
                        }}
                        className={`
                            flex h-10 w-10 items-center justify-center rounded-full transition-all duration-150 active:scale-90
                            ${isDone
                                ? 'bg-primary-500 text-black border-transparent shadow-[0_0_15px] shadow-primary-500/20'
                                : 'border border-white/8 bg-white/[0.04] text-zinc-500 hover:border-white/15 hover:text-white active:bg-primary-500 active:text-black'}
                        `}
                    >
                        <Icon name="Check" size={18} strokeWidth={3} />
                    </button>
                </div>
            </div>
        );
    }

    // BODYWEIGHT MODE
    if (isBodyweight && !isCardio) {
        return (
            <div id={`set-row-${set.id}`}
                onTouchStart={onSwipeTouchStart} onTouchMove={onSwipeTouchMove} onTouchEnd={onSwipeTouchEnd}
                className={`relative rounded-[1.1rem] transition-colors duration-200 ${getBorderAccent(setType)} ${rowAccent} ${isDone ? 'opacity-80' : ''}`}>
                {SwipeOverlay}
                <div className="grid grid-cols-12 items-center gap-2 px-2 py-2.5">
                    {/* Set Type Badge */}
                    <div className="col-span-2 flex justify-center">
                        <BadgeEl {...badgeProps as any} className={badgeClass}>
                            {isDone ? <Icon name="Check" size={16} strokeWidth={2.5} /> : effectiveBadgeLabel}
                        </BadgeEl>
                    </div>

                    {/* Reps (main field for BW) - prominent */}
                    <div className="col-span-6">
                        <input
                            ref={repsRef}
                            type="number" inputMode="numeric"
                            className={isDone ? inputBase + " " + doneInput : inputBase}
                            placeholder={repsPlaceholder}
                            value={localReps}
                            onChange={e => setLocalReps(e.target.value)}
                            onBlur={() => handleBlur('reps', localReps)}
                            onFocus={() => activeFieldRef.current = 'reps'}
                            enterKeyHint="done"
                        />
                    </div>

                    {/* Extra Weight Toggle or RIR */}
                    <div className="col-span-2 flex justify-center">
                        {!showExtraWeight ? (
                            <button
                                onClick={() => setShowExtraWeight(true)}
                                className="flex h-8 w-8 flex-col items-center justify-center text-zinc-600 transition-colors hover:text-zinc-300"
                                title={lang === 'es' ? '+ Peso Extra' : '+ Extra Weight'}
                            >
                                <Icon name="PlusCircle" size={14} />
                                <span className="text-[7px] font-bold mt-0.5 uppercase tracking-wide">+KG</span>
                            </button>
                        ) : (
                            <input
                                type="number" inputMode="decimal"
                                className="w-full rounded-[1rem] border border-white/6 bg-[#242428] px-1 py-2.5 text-center text-xs font-bold text-violet-300 outline-none transition-all tabular-nums placeholder-zinc-600 focus:ring-2 focus:ring-violet-500/20"
                                placeholder="0"
                                value={localWeight}
                                onChange={e => setLocalWeight(e.target.value)}
                                onBlur={() => handleWeightBlur(localWeight)}
                                onFocus={() => activeFieldRef.current = 'weight'}
                                enterKeyHint="next"
                            />
                        )}
                    </div>

                    {/* Complete Button */}
                    <div className="col-span-2 flex justify-center">
                        <button
                            onClick={() => {
                                triggerHaptic(isDone ? 'light' : 'medium');
                                onToggleComplete(exInstanceId, set.id);
                            }}
                            className={`
                                flex h-10 w-10 items-center justify-center rounded-full transition-all duration-150 active:scale-90
                                ${isDone
                                    ? 'bg-primary-500 text-black border-transparent shadow-[0_0_15px] shadow-primary-500/20'
                                    : 'border border-white/8 bg-white/[0.04] text-zinc-500 hover:border-white/15 hover:text-white active:bg-primary-500 active:text-black'}
                            `}
                        >
                            <Icon name="Check" size={18} strokeWidth={3} />
                        </button>
                    </div>
                </div>

                {/* Prev performance hint */}
                {!isDone && set.prevReps && (
                    <div className="flex justify-center pb-1.5 -mt-1">
                        <div className="inline-flex items-center gap-1 rounded-full bg-zinc-800/70 px-2 py-0.5 border border-zinc-700/40">
                            <Icon name="Clock" size={9} className="text-zinc-500 shrink-0" />
                            <span className="text-[8px] font-bold text-zinc-500 tabular-nums">
                                {set.prevReps} reps{set.prevWeight && Number(set.prevWeight) > 0 ? ` +${set.prevWeight}kg` : ''}
                            </span>
                        </div>
                    </div>
                )}
                {DifficultyPicker}
            </div>
        );
    }

    // STANDARD GYM / CARDIO MODE
    return (
        <div id={`set-row-${set.id}`}
            onTouchStart={onSwipeTouchStart} onTouchMove={onSwipeTouchMove} onTouchEnd={onSwipeTouchEnd}
            className={`relative rounded-[1.1rem] transition-colors duration-200 ${getBorderAccent(setType)} ${rowAccent} ${isDone ? 'opacity-80' : ''}`}>
            {SwipeOverlay}
        <div className="grid grid-cols-12 items-center gap-2 px-2 py-2.5">

            {/* Set Type / Number Badge */}
            <div className="col-span-2 flex justify-center">
                <BadgeEl {...badgeProps as any} className={badgeClass}>
                    {isDone ? <Icon name="Check" size={16} strokeWidth={2.5} /> : effectiveBadgeLabel}
                </BadgeEl>
            </div>

            {/* Weight Input */}
            <div className="col-span-4">
                <input
                    type="number" inputMode="decimal"
                    className={isDone ? inputBase + " " + doneInput : inputBase}
                    placeholder={weightPlaceholder}
                    value={localWeight}
                    onChange={e => setLocalWeight(e.target.value)}
                    onBlur={() => handleWeightBlur(localWeight)}
                    onFocus={() => activeFieldRef.current = 'weight'}
                    enterKeyHint="next"
                />
            </div>

            {/* Reps Input */}
            <div className="col-span-4">
                <input
                    ref={repsRef}
                    type="number" inputMode="numeric"
                    className={isDone ? inputBase + " " + doneInput : inputBase}
                    placeholder={repsPlaceholder}
                    value={localReps}
                    onChange={e => setLocalReps(e.target.value)}
                    onBlur={() => handleBlur('reps', localReps)}
                    onFocus={() => activeFieldRef.current = 'reps'}
                    enterKeyHint="done"
                />
            </div>

            {/* Complete Button */}
            <div className="col-span-2 flex justify-center">
                <button
                    onClick={() => {
                        triggerHaptic(isDone ? 'light' : 'medium');
                        onToggleComplete(exInstanceId, set.id);
                    }}
                    className={`
                        flex h-10 w-10 items-center justify-center rounded-full transition-all duration-150 active:scale-90
                        ${isDone
                            ? 'bg-primary-500 text-black border-transparent shadow-[0_0_15px] shadow-primary-500/20'
                            : 'border border-white/8 bg-white/[0.04] text-zinc-500 hover:border-white/15 hover:text-white active:bg-primary-500 active:text-black'
                        }
                    `}
                >
                    <Icon name="Check" size={18} strokeWidth={3} />
                </button>
            </div>
        </div>

        {/* Prev performance hint */}
        {!isDone && !isCardio && (set.prevWeight || set.prevReps) && (
            <div className="flex justify-center pb-1.5 -mt-1">
                <div className="inline-flex items-center gap-1 rounded-full bg-zinc-800/70 px-2 py-0.5 border border-zinc-700/40">
                    <Icon name="Clock" size={9} className="text-zinc-500 shrink-0" />
                    <span className="text-[8px] font-bold text-zinc-500 tabular-nums">
                        {[
                            set.prevWeight && Number(set.prevWeight) > 0 ? `${set.prevWeight}kg` : null,
                            set.prevReps && Number(set.prevReps) > 0 ? `${set.prevReps} reps` : null,
                        ].filter(Boolean).join(' x ')}
                    </span>
                </div>
            </div>
        )}
        {DifficultyPicker}
        </div>
    );
});
