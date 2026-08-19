import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardioType, SetType, WorkoutSet } from '../../types';
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
    cardioMode?: CardioType;
    isBodyweight?: boolean;
    isIsometric?: boolean;
    isometricTargetSecs?: number;
    setIndex?: number;
    badgeLabel?: string;
    tutorialId?: string;
    disableTypeChange?: boolean;
    isActiveProtocolSet?: boolean;
    isNextSet?: boolean;
    showRIR?: boolean;
}

const getTypeLabel = (type: SetType) => {
    const map: Record<string, string> = {
        regular: '•', warmup: 'W', myorep: 'M', myorep_match: 'MM', giant: 'G',
        top: 'T', backoff: 'B', cluster: 'C', avt_hop: 'H', emom: 'E', drop: 'D',
        rest_pause: 'RP', time_volume: 'TV', triple_add: 'TA',
    };
    return map[type] || '•';
};

const typeTone = (type: SetType) => {
    if (type === 'warmup') return 'border-amber-500/20 bg-amber-500/10 text-amber-300';
    if (type === 'myorep' || type === 'myorep_match') return 'border-fuchsia-500/20 bg-fuchsia-500/10 text-fuchsia-300';
    if (type === 'emom') return 'border-cyan-500/20 bg-cyan-500/10 text-cyan-300';
    if (type === 'drop') return 'border-orange-500/20 bg-orange-500/10 text-orange-300';
    return 'border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-base))] text-[rgb(var(--text-secondary))]';
};

const inputClass = 'h-10 w-full rounded-lg border border-transparent bg-[rgb(var(--surface-base))] px-1.5 text-center text-[15px] font-bold tabular-nums text-[rgb(var(--text-primary))] outline-none transition-colors placeholder:text-[rgb(var(--text-muted)/0.62)] focus:border-primary-500/45 focus:bg-[rgb(var(--surface-raised))] focus:ring-2 focus:ring-primary-500/10';

const HoldTimer: React.FC<{
    initialSeconds: number;
    targetSeconds?: number;
    onSave: (seconds: number) => void;
    lang: 'en' | 'es';
    isDone: boolean;
}> = ({ initialSeconds, targetSeconds, onSave, lang, isDone }) => {
    const [elapsed, setElapsed] = useState(initialSeconds);
    const [running, setRunning] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const startedAt = useRef<number | null>(null);
    const baseElapsed = useRef(initialSeconds);

    useEffect(() => {
        if (!running) setElapsed(initialSeconds);
    }, [initialSeconds, running]);

    useEffect(() => () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
    }, []);

    const start = () => {
        if (running) return;
        triggerHaptic('medium');
        setRunning(true);
        startedAt.current = Date.now();
        intervalRef.current = setInterval(() => {
            const delta = Math.floor((Date.now() - (startedAt.current || Date.now())) / 1000);
            setElapsed(baseElapsed.current + delta);
        }, 1000);
    };

    const stop = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
        setRunning(false);
        baseElapsed.current = elapsed;
        onSave(elapsed);
        triggerHaptic('medium');
    };

    const reset = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
        setRunning(false);
        setElapsed(0);
        baseElapsed.current = 0;
        onSave(0);
    };

    const display = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return m ? `${m}:${String(s).padStart(2, '0')}` : `${s}s`;
    };

    if (isDone) return <div className="text-center text-sm font-black tabular-nums text-emerald-400">{display(elapsed)}</div>;

    const remaining = targetSeconds ? Math.max(0, targetSeconds - elapsed) : null;
    return (
        <div className="flex min-h-10 items-center gap-2 rounded-lg bg-[rgb(var(--surface-base))] px-2">
            <button type="button" onClick={running ? stop : start} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-primary-500 active:scale-95" aria-label={running ? (lang === 'es' ? 'Detener' : 'Stop') : (lang === 'es' ? 'Iniciar' : 'Start')}>
                <Icon name={running ? 'Square' : 'Play'} size={15} fill="currentColor" />
            </button>
            <div className="min-w-0 flex-1 text-center text-base font-black tabular-nums text-[rgb(var(--text-primary))]">{display(remaining ?? elapsed)}</div>
            {elapsed > 0 && !running && (
                <button type="button" onClick={reset} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[rgb(var(--text-muted))] active:scale-95" aria-label={lang === 'es' ? 'Reiniciar' : 'Reset'}>
                    <Icon name="RotateCcw" size={14} />
                </button>
            )}
        </div>
    );
};

export const SetRow = React.memo(({
    set,
    exInstanceId,
    onUpdate,
    onToggleComplete,
    onChangeType,
    lang,
    isCardio,
    cardioMode = 'steady',
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
}: SetRowProps) => {
    const isDone = !!set.completed;
    const setType = set.type || 'regular';
    const effectiveBadgeLabel = badgeLabel ?? (setType === 'regular' && setIndex != null ? String(setIndex + 1) : getTypeLabel(setType));
    const [localWeight, setLocalWeight] = useState(set.weight ?? '');
    const [localReps, setLocalReps] = useState(set.reps ?? '');
    const [showExtraWeight, setShowExtraWeight] = useState(!!isBodyweight && Number(set.weight || 0) > 0);
    const weightRef = useRef<HTMLInputElement>(null);
    const repsRef = useRef<HTMLInputElement>(null);
    const [swipePct, setSwipePct] = useState(0);
    const swipeRef = useRef({ startX: 0, startY: 0, tracking: false });

    useEffect(() => setLocalWeight(set.weight ?? ''), [set.weight]);
    useEffect(() => setLocalReps(set.reps ?? ''), [set.reps]);
    useEffect(() => {
        if (isBodyweight && Number(set.weight || 0) > 0) setShowExtraWeight(true);
    }, [isBodyweight, set.weight]);

    const commit = useCallback((field: string, value: any) => {
        if (value != set[field as keyof WorkoutSet]) onUpdate(exInstanceId, set.id, field, value);
    }, [exInstanceId, onUpdate, set]);

    const toggleComplete = useCallback(() => {
        triggerHaptic(isDone ? 'light' : 'medium');
        onToggleComplete(exInstanceId, set.id);
    }, [exInstanceId, isDone, onToggleComplete, set.id]);

    const onSwipeStart = (event: React.TouchEvent) => {
        if (isDone) return;
        swipeRef.current = { startX: event.touches[0].clientX, startY: event.touches[0].clientY, tracking: true };
    };

    const onSwipeMove = (event: React.TouchEvent) => {
        if (!swipeRef.current.tracking || isDone) return;
        const dx = event.touches[0].clientX - swipeRef.current.startX;
        const dy = event.touches[0].clientY - swipeRef.current.startY;
        if (Math.abs(dy) > Math.abs(dx) * 1.25 && Math.abs(dx) < 18) {
            swipeRef.current.tracking = false;
            setSwipePct(0);
            return;
        }
        if (dx > 0) setSwipePct(Math.min(100, (dx / 88) * 100));
    };

    const onSwipeEnd = () => {
        if (!isDone && swipePct >= 85) {
            triggerHaptic('success');
            onToggleComplete(exInstanceId, set.id);
        }
        swipeRef.current.tracking = false;
        setSwipePct(0);
    };

    const copyPrevious = useCallback(() => {
        if (isDone) return;
        let copied = false;
        if (set.prevWeight !== undefined && set.prevWeight !== null && String(set.prevWeight) !== '') {
            setLocalWeight(set.prevWeight);
            onUpdate(exInstanceId, set.id, 'weight', set.prevWeight);
            if (isBodyweight && Number(set.prevWeight) > 0) setShowExtraWeight(true);
            copied = true;
        }
        if (set.prevReps !== undefined && set.prevReps !== null && String(set.prevReps) !== '') {
            setLocalReps(set.prevReps);
            onUpdate(exInstanceId, set.id, 'reps', set.prevReps);
            copied = true;
        }
        if (copied) {
            triggerHaptic('light');
            window.setTimeout(() => (isBodyweight ? repsRef.current : weightRef.current)?.focus(), 40);
        }
    }, [exInstanceId, isBodyweight, isDone, onUpdate, set.id, set.prevReps, set.prevWeight]);

    const previousText = (() => {
        const prevW = Number(set.prevWeight || 0);
        const prevR = Number(set.prevReps || 0);
        if (isBodyweight) {
            if (!prevR && !prevW) return '—';
            return `${prevR || '—'}${prevW > 0 ? ` +${prevW}` : ''}`;
        }
        if (!prevW && !prevR) return '—';
        return `${prevW || '—'} × ${prevR || '—'}`;
    })();

    const prescribedRange = (set as WorkoutSet & { prescribedRepRange?: { min: number; max: number } }).prescribedRepRange;
    const prescribedTarget = prescribedRange ? `${prescribedRange.min}–${prescribedRange.max}` : set.prescribedReps;
    const prescriptionHint = prescribedTarget !== undefined
        ? prescribedTarget === 'FAILURE'
            ? (lang === 'es' ? 'Objetivo: al fallo' : 'Target: failure')
            : `${lang === 'es' ? 'Objetivo' : 'Target'}: ${prescribedTarget}${set.targetRpe !== undefined ? ` · RPE ${set.targetRpe}` : ''}`
        : null;

    const rowTone = isDone
        ? 'bg-emerald-500/[0.07]'
        : isActiveProtocolSet
            ? 'bg-cyan-500/[0.06]'
            : isNextSet
                ? 'bg-primary-500/[0.055]'
                : 'bg-transparent';

    const badge = (
        <button id={tutorialId} type="button" disabled={disableTypeChange || isDone} onClick={() => onChangeType(exInstanceId, set.id, setType)} className={`flex h-8 w-8 items-center justify-center rounded-lg border text-[10px] font-black transition-transform active:scale-95 disabled:cursor-default ${isDone ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' : typeTone(setType)}`} aria-label={lang === 'es' ? `Serie ${effectiveBadgeLabel}` : `Set ${effectiveBadgeLabel}`}>
            {effectiveBadgeLabel}
        </button>
    );

    const check = (
        <button type="button" onClick={toggleComplete} className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-all active:scale-90 ${isDone ? 'border-primary-500 bg-primary-500 text-black' : 'border-[rgb(var(--border-strong))] bg-[rgb(var(--surface-base))] text-[rgb(var(--text-muted))]'}`} aria-pressed={isDone} aria-label={lang === 'es' ? (isDone ? 'Serie completada' : 'Completar serie') : (isDone ? 'Set completed' : 'Complete set')}>
            <Icon name="Check" size={18} strokeWidth={3} />
        </button>
    );

    const difficultyPicker = showRIR && isDone && (set.rpe === '' || set.rpe === null || set.rpe === undefined) ? (
        <div className="grid grid-cols-3 gap-1.5 px-2 pb-2 pt-0.5">
            {([
                { value: '3', label: lang === 'es' ? 'Fácil' : 'Easy', tone: 'text-emerald-400' },
                { value: '6', label: 'OK', tone: 'text-[rgb(var(--text-secondary))]' },
                { value: '9', label: lang === 'es' ? 'Duro' : 'Hard', tone: 'text-amber-400' },
            ] as const).map(option => (
                <button key={option.value} type="button" onClick={() => onUpdate(exInstanceId, set.id, 'rpe', option.value)} className={`min-h-8 rounded-lg bg-[rgb(var(--surface-base))] text-[10px] font-bold ${option.tone} active:scale-[0.98]`}>
                    {option.label}
                </button>
            ))}
        </div>
    ) : null;

    const swipeOverlay = swipePct > 0 && !isDone ? <div className="pointer-events-none absolute inset-y-0 left-0 z-0 bg-emerald-500/10" style={{ width: `${swipePct}%` }} /> : null;

    if (isCardio) {
        const interval = cardioMode === 'hiit' || cardioMode === 'tabata';
        return (
            <div id={`set-row-${set.id}`} className={`relative ${rowTone}`} onTouchStart={onSwipeStart} onTouchMove={onSwipeMove} onTouchEnd={onSwipeEnd}>
                {swipeOverlay}
                <div className="relative z-10 grid grid-cols-[34px_1fr_1fr_64px_40px] items-center gap-2 px-2 py-1.5">
                    {badge}
                    {interval ? (
                        <>
                            <input type="number" inputMode="numeric" className={inputClass} value={set.workSeconds ?? ''} placeholder="30" onChange={e => onUpdate(exInstanceId, set.id, 'workSeconds', e.target.value)} aria-label={lang === 'es' ? 'Trabajo segundos' : 'Work seconds'} />
                            <input type="number" inputMode="numeric" className={inputClass} value={set.restSeconds ?? ''} placeholder="30" onChange={e => onUpdate(exInstanceId, set.id, 'restSeconds', e.target.value)} aria-label={lang === 'es' ? 'Descanso segundos' : 'Rest seconds'} />
                            <input type="number" inputMode="numeric" className={inputClass} value={localReps} placeholder="1" onChange={e => setLocalReps(e.target.value)} onBlur={() => commit('reps', localReps)} aria-label={lang === 'es' ? 'Rondas' : 'Rounds'} />
                        </>
                    ) : (
                        <>
                            <input type="number" inputMode="decimal" className={inputClass} value={set.duration ?? ''} placeholder="0" onChange={e => onUpdate(exInstanceId, set.id, 'duration', e.target.value)} aria-label={lang === 'es' ? 'Tiempo' : 'Time'} />
                            <input type="number" inputMode="decimal" className={inputClass} value={set.distance ?? ''} placeholder="0" onChange={e => onUpdate(exInstanceId, set.id, 'distance', e.target.value)} aria-label={lang === 'es' ? 'Distancia' : 'Distance'} />
                            <div className="text-center text-xs font-bold tabular-nums text-[rgb(var(--text-muted))]">{Number(set.duration || 0) > 0 && Number(set.distance || 0) > 0 ? (Number(set.distance) / (Number(set.duration) / 60)).toFixed(1) : '—'}</div>
                        </>
                    )}
                    {check}
                </div>
            </div>
        );
    }

    if (isIsometric) {
        return (
            <div id={`set-row-${set.id}`} className={`relative ${rowTone}`} onTouchStart={onSwipeStart} onTouchMove={onSwipeMove} onTouchEnd={onSwipeEnd}>
                {swipeOverlay}
                <div className="relative z-10 grid grid-cols-[34px_minmax(72px,0.8fr)_minmax(130px,1.8fr)_40px] items-center gap-2 px-2 py-1.5">
                    {badge}
                    <div className="text-center text-xs font-bold text-[rgb(var(--text-muted))]">{isometricTargetSecs ? `${isometricTargetSecs}s` : '—'}</div>
                    <HoldTimer initialSeconds={Number(set.duration) || 0} targetSeconds={isometricTargetSecs} onSave={seconds => onUpdate(exInstanceId, set.id, 'duration', seconds)} lang={lang} isDone={isDone} />
                    {check}
                </div>
                {prescriptionHint && !isDone && <div className="pb-1 pl-[44px] text-[9px] font-bold text-primary-500/80">{prescriptionHint}</div>}
            </div>
        );
    }

    if (isBodyweight) {
        return (
            <div id={`set-row-${set.id}`} className={`relative ${rowTone}`} onTouchStart={onSwipeStart} onTouchMove={onSwipeMove} onTouchEnd={onSwipeEnd}>
                {swipeOverlay}
                <div className="relative z-10 grid grid-cols-[34px_minmax(76px,1.15fr)_minmax(58px,0.8fr)_52px_40px] items-center gap-2 px-2 py-1.5">
                    {badge}
                    <button type="button" onClick={copyPrevious} disabled={previousText === '—' || isDone} className="min-h-10 truncate rounded-lg px-1 text-center text-[11px] font-bold tabular-nums text-[rgb(var(--text-muted))] transition-colors enabled:active:bg-primary-500/10 enabled:active:text-primary-500 disabled:opacity-70" title={previousText === '—' ? undefined : (lang === 'es' ? 'Toca para copiar' : 'Tap to copy')}>{previousText}</button>
                    <input ref={repsRef} type="number" inputMode="numeric" className={inputClass} value={localReps} placeholder={set.hintReps ? String(set.hintReps) : '0'} onChange={e => setLocalReps(e.target.value)} onBlur={() => commit('reps', localReps)} enterKeyHint="done" disabled={isDone} />
                    {showExtraWeight ? <input ref={weightRef} type="number" inputMode="decimal" className={`${inputClass} text-violet-300`} value={localWeight} placeholder="0" onChange={e => setLocalWeight(e.target.value)} onBlur={() => commit('weight', localWeight)} enterKeyHint="done" disabled={isDone} /> : <button type="button" onClick={() => setShowExtraWeight(true)} disabled={isDone} className="flex h-10 items-center justify-center rounded-lg text-[10px] font-bold text-[rgb(var(--text-muted))] active:bg-[rgb(var(--surface-base))]">+KG</button>}
                    {check}
                </div>
                {prescriptionHint && !isDone && <div className="pb-1 pl-[44px] text-[9px] font-bold text-primary-500/80">{prescriptionHint}</div>}
                {difficultyPicker}
            </div>
        );
    }

    return (
        <div id={`set-row-${set.id}`} className={`relative ${rowTone}`} onTouchStart={onSwipeStart} onTouchMove={onSwipeMove} onTouchEnd={onSwipeEnd}>
            {swipeOverlay}
            <div className="relative z-10 grid grid-cols-[34px_minmax(78px,1.2fr)_minmax(60px,0.85fr)_minmax(54px,0.75fr)_40px] items-center gap-2 px-2 py-1.5">
                {badge}
                <button type="button" onClick={copyPrevious} disabled={previousText === '—' || isDone} className="min-h-10 truncate rounded-lg px-1 text-center text-[11px] font-bold tabular-nums text-[rgb(var(--text-muted))] transition-colors enabled:active:bg-primary-500/10 enabled:active:text-primary-500 disabled:opacity-70" title={previousText === '—' ? undefined : (lang === 'es' ? 'Toca para copiar' : 'Tap to copy')}>{previousText}</button>
                <input ref={weightRef} type="number" inputMode="decimal" className={inputClass} value={localWeight} placeholder={set.hintWeight ? String(set.hintWeight) : '0'} onChange={e => setLocalWeight(e.target.value)} onBlur={() => { commit('weight', localWeight); if (!isDone) window.setTimeout(() => repsRef.current?.focus(), 60); }} enterKeyHint="next" disabled={isDone} />
                <input ref={repsRef} type="number" inputMode="numeric" className={inputClass} value={localReps} placeholder={set.hintReps ? String(set.hintReps) : '0'} onChange={e => setLocalReps(e.target.value)} onBlur={() => commit('reps', localReps)} enterKeyHint="done" disabled={isDone} />
                {check}
            </div>
            {prescriptionHint && !isDone && <div className="pb-1 pl-[44px] text-[9px] font-bold text-primary-500/80">{prescriptionHint}</div>}
            {difficultyPicker}
        </div>
    );
});
