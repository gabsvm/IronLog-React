
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { WorkoutSet, SetType, CardioType } from '../../types';
import { Icon } from '../ui/Icon';
import { TRANSLATIONS } from '../../constants';
import { playTimerFinishSound, triggerHaptic } from '../../utils/audio';
import { PlateCalculatorModal } from '../ui/PlateCalculatorModal';

interface SetRowProps {
    set: WorkoutSet;
    exInstanceId: number;
    unit: string;
    unitLabel: string;
    plateWeight?: number;
    showRIR: boolean;
    stageRIR: string;
    onUpdate: (exId: number, setId: number, field: string, value: any) => void;
    onToggleComplete: (exId: number, setId: number) => void;
    onChangeType: (exId: number, setId: number, type: SetType) => void;
    lang: 'en' | 'es';
    isCardio?: boolean;
    cardioMode?: CardioType;
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
        case 'warmup':       return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30';
        case 'myorep':       return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
        case 'myorep_match': return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
        case 'top':          return 'bg-red-500/15 text-red-400 border-red-500/30';
        case 'backoff':      return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
        case 'cluster':      return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
        case 'giant':        return 'bg-orange-500/15 text-orange-400 border-orange-500/30';
        case 'avt_hop':      return 'bg-orange-500/15 text-orange-400 border-orange-500/30';
        case 'emom':         return 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30';
        case 'drop':         return 'bg-teal-500/15 text-teal-400 border-teal-500/30';
        default:             return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    }
};

const getRowAccent = (type: SetType): string => {
    switch (type) {
        case 'warmup':                    return 'bg-yellow-500/5';
        case 'top':                       return 'bg-red-500/5';
        case 'backoff':                   return 'bg-blue-500/5';
        case 'myorep': case 'myorep_match': return 'bg-purple-500/5';
        case 'cluster':                   return 'bg-emerald-500/5';
        case 'giant':                     return 'bg-orange-500/5';
        case 'emom':                      return 'bg-cyan-500/5';
        case 'drop':                      return 'bg-teal-500/5';
        default:                          return '';
    }
};

const getTypeLabel = (type: SetType) => {
    const map: Record<string, string> = {
        regular: '●',
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
    };
    return map[type] || '●';
};

// ─── HOLD TIMER ─────────────────────────────────────────────────────────────
const HoldTimer: React.FC<{
    initialSeconds: number;
    targetSeconds?: number;   // If set → countdown mode
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
        }, 100);
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

// ─── MAIN SETROW ─────────────────────────────────────────────────────────────
export const SetRow = React.memo(({
    set, exInstanceId, unit, unitLabel, plateWeight, showRIR, stageRIR,
    onUpdate, onToggleComplete, onChangeType,
    lang, isCardio, cardioMode = 'steady', isBodyweight, isIsometric, isometricTargetSecs,
    setIndex, badgeLabel, tutorialId, disableTypeChange, isActiveProtocolSet, isNextSet
}: SetRowProps) => {
    const isDone = set.completed;
    const setType = set.type || 'regular';
    const effectiveBadgeLabel = badgeLabel ?? getTypeLabel(setType);
    const rowAccent = isDone
        ? ''
        : isActiveProtocolSet
            ? getRowAccent(setType).replace('/5', '/15') + ' ring-1 ring-inset ring-cyan-500/20'
            : isNextSet
                ? 'bg-gradient-to-r from-orange-500/8 via-transparent to-transparent'
                : getRowAccent(setType);

    const [localWeight, setLocalWeight] = useState(set.weight ?? '');
    const [localReps, setLocalReps] = useState(set.reps ?? '');
    const [localRPE, setLocalRPE] = useState(set.rpe ?? '');
    const [showCalculator, setShowCalculator] = useState(false);
    const [showExtraWeight, setShowExtraWeight] = useState(
        // If there's already a weight value for a BW exercise, show the input
        isBodyweight && (Number(set.weight) > 0 || Number(set.hintWeight) > 0)
    );

    const activeFieldRef = useRef<string | null>(null);
    const repsRef = useRef<HTMLInputElement>(null);

    useEffect(() => { if (activeFieldRef.current !== 'weight') setLocalWeight(set.weight ?? ''); }, [set.weight]);
    useEffect(() => { if (activeFieldRef.current !== 'reps') setLocalReps(set.reps ?? ''); }, [set.reps]);
    useEffect(() => { if (activeFieldRef.current !== 'rpe') setLocalRPE(set.rpe ?? ''); }, [set.rpe]);

    const commitChange = (field: string, value: any) => {
        if (value != set[field as keyof WorkoutSet]) {
            onUpdate(exInstanceId, set.id, field, value);
        }
    };

    const handleWeightBlur = (value: any) => {
        activeFieldRef.current = null;
        commitChange('weight', value);
        if (!isIsometric) setTimeout(() => repsRef.current?.focus(), 80);
    };

    const handleBlur = (field: string, value: any) => {
        activeFieldRef.current = null;
        commitChange(field, value);
    };

    const handleHoldSave = useCallback((seconds: number) => {
        onUpdate(exInstanceId, set.id, 'duration', seconds);
    }, [exInstanceId, set.id, onUpdate]);

    const inputBase = "w-full text-center bg-zinc-800 rounded-xl py-3.5 text-xl font-bold text-white outline-none focus:ring-2 focus:ring-white/30 transition-all tabular-nums placeholder-zinc-600";
    const doneInput = "bg-transparent text-green-400 pointer-events-none";

    const weightPlaceholder = set.hintWeight ? String(set.hintWeight) : '—';
    const repsPlaceholder = set.hintReps ? String(set.hintReps) : '—';

    const BadgeEl = disableTypeChange || isDone ? 'div' : 'button';
    const badgeProps = (!disableTypeChange && !isDone)
        ? { id: tutorialId, onClick: () => onChangeType(exInstanceId, set.id, setType) }
        : { id: tutorialId };
    const badgeClass = `w-11 h-11 rounded-xl border flex items-center justify-center font-black text-xs transition-all ${isDone ? 'bg-green-500/10 border-green-500/20 text-green-400' : getTypeColor(setType)} ${!disableTypeChange && !isDone ? 'active:scale-90 cursor-pointer' : 'cursor-default'}`;

    // ── ISOMETRIC MODE ──────────────────────────────────────────────────────
    if (isIsometric) {
        return (
            <div id={`set-row-${set.id}`} className={`grid grid-cols-12 gap-2 items-center py-2.5 px-1 transition-colors duration-200 ${isDone ? 'opacity-60' : rowAccent}`}>
                {/* Set Type Badge */}
                <div className="col-span-2 flex justify-center">
                    <BadgeEl {...badgeProps as any} className={badgeClass}>
                        {isDone ? <Icon name="Check" size={16} strokeWidth={2.5} /> : effectiveBadgeLabel}
                    </BadgeEl>
                </div>

                {/* Hold Timer — takes up the weight+reps cols */}
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
                            w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-150 active:scale-90
                            ${isDone
                                ? 'bg-green-500 text-white animate-pulse-glow-green'
                                : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700 hover:text-white active:bg-green-600 active:text-white'}
                        `}
                    >
                        <Icon name="Check" size={20} strokeWidth={3} />
                    </button>
                </div>
            </div>
        );
    }

    // ── BODYWEIGHT MODE ─────────────────────────────────────────────────────
    if (isBodyweight && !isCardio) {
        return (
            <div id={`set-row-${set.id}`} className={`transition-colors duration-200 ${isDone ? 'opacity-60' : rowAccent}`}>
                <div className="grid grid-cols-12 gap-2 items-center py-2.5 px-1">
                    {/* Set Type Badge */}
                    <div className="col-span-2 flex justify-center">
                        <BadgeEl {...badgeProps as any} className={badgeClass}>
                            {isDone ? <Icon name="Check" size={16} strokeWidth={2.5} /> : effectiveBadgeLabel}
                        </BadgeEl>
                    </div>

                    {/* Reps (main field for BW) — prominent */}
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
                                className="w-8 h-8 flex flex-col items-center justify-center text-zinc-700 hover:text-zinc-400 transition-colors"
                                title={lang === 'es' ? '+ Peso Extra' : '+ Extra Weight'}
                            >
                                <Icon name="PlusCircle" size={14} />
                                <span className="text-[7px] font-bold mt-0.5 uppercase tracking-wide">+KG</span>
                            </button>
                        ) : (
                            <input
                                type="number" inputMode="decimal"
                                className="w-full text-center bg-zinc-800 rounded-xl py-3.5 text-sm font-bold text-violet-300 outline-none focus:ring-2 focus:ring-violet-500/30 transition-all tabular-nums placeholder-zinc-600"
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
                                w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-150 active:scale-90
                                ${isDone
                                    ? 'bg-green-500 text-white animate-pulse-glow-green'
                                    : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700 hover:text-white active:bg-green-600 active:text-white'}
                            `}
                        >
                            <Icon name="Check" size={20} strokeWidth={3} />
                        </button>
                    </div>
                </div>

                {/* Prev performance hint */}
                {!isDone && set.prevReps && (
                    <div className="flex justify-center pb-1.5 -mt-1">
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-800/80 border border-zinc-700/50">
                            <Icon name="Clock" size={9} className="text-zinc-500 shrink-0" />
                            <span className="text-[9px] font-bold text-zinc-400 tabular-nums">
                                {set.prevReps} reps{set.prevWeight && Number(set.prevWeight) > 0 ? ` +${set.prevWeight}kg` : ''}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ── STANDARD GYM / CARDIO MODE ──────────────────────────────────────────
    return (
        <div id={`set-row-${set.id}`} className={`transition-colors duration-200 ${isDone ? 'opacity-60' : rowAccent}`}>
        <div className="grid grid-cols-12 gap-2 items-center py-2.5 px-1">

            {/* Set Type / Number Badge */}
            <div className="col-span-2 flex justify-center">
                <BadgeEl {...badgeProps as any} className={badgeClass}>
                    {isDone ? <Icon name="Check" size={16} strokeWidth={2.5} /> : effectiveBadgeLabel}
                </BadgeEl>
            </div>

            {/* Weight Input */}
            <div className="col-span-4 relative flex items-center">
                {!isDone && !isBodyweight && !isCardio && (
                    <button
                        onClick={() => setShowCalculator(true)}
                        className="absolute left-2 w-6 h-6 flex items-center justify-center text-zinc-500 hover:text-white transition-colors"
                    >
                        <Icon name="Dumbbell" size={14} />
                    </button>
                )}
                <input
                    type="number" inputMode="decimal"
                    className={isDone ? inputBase + " " + doneInput : inputBase + (!isBodyweight && !isCardio ? " pl-8" : "")}
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
                        w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-150 active:scale-90
                        ${isDone
                            ? 'bg-green-500 text-white animate-pulse-glow-green'
                            : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700 hover:text-white active:bg-green-600 active:text-white'
                        }
                    `}
                >
                    <Icon name="Check" size={20} strokeWidth={3} />
                </button>
            </div>

            {showCalculator && (
                <PlateCalculatorModal
                    initialWeight={Number(localWeight) || 20}
                    onClose={() => setShowCalculator(false)}
                />
            )}
        </div>

        {/* Prev performance hint */}
        {!isDone && !isCardio && (set.prevWeight || set.prevReps) && (
            <div className="flex justify-center pb-1.5 -mt-1">
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-800/80 border border-zinc-700/50">
                    <Icon name="Clock" size={9} className="text-zinc-500 shrink-0" />
                    <span className="text-[9px] font-bold text-zinc-400 tabular-nums">
                        {[
                            set.prevWeight && Number(set.prevWeight) > 0 ? `${set.prevWeight}kg` : null,
                            set.prevReps && Number(set.prevReps) > 0 ? `${set.prevReps} reps` : null,
                        ].filter(Boolean).join(' × ')}
                    </span>
                </div>
            </div>
        )}
        </div>
    );
});
