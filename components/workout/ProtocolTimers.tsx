
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Icon } from '../ui/Icon';
import { triggerHaptic, playTimerFinishSound } from '../../utils/audio';

const fmt = (s: number) =>
    s >= 60 ? `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}` : `${s}s`;

// ── EMOM TIMER ────────────────────────────────────────────────────────────────
interface EMOMTimerProps {
    totalSets: number;
    lang: 'en' | 'es';
    onMinuteChange: (minute: number) => void; // 0 = idle, 1..N = active minute
}

export const EMOMTimer: React.FC<EMOMTimerProps> = ({ totalSets, lang, onMinuteChange }) => {
    const [state, setState] = useState<'idle' | 'running' | 'done'>('idle');
    const [timeLeft, setTimeLeft] = useState(60);
    const [minute, setMinute] = useState(0);

    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const phaseStartRef = useRef<number>(0);
    const minuteRef = useRef<number>(0);
    const totalSetsRef = useRef(totalSets);
    totalSetsRef.current = totalSets;

    const clear = () => {
        if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    };

    const tick = useCallback(() => {
        const elapsed = Math.floor((Date.now() - phaseStartRef.current) / 1000);
        const rem = Math.max(0, 60 - elapsed);
        setTimeLeft(rem);
        if (rem > 0) return;

        const next = minuteRef.current + 1;
        if (next > totalSetsRef.current) {
            clear();
            setState('done');
            onMinuteChange(0);
            triggerHaptic('success');
            playTimerFinishSound();
        } else {
            minuteRef.current = next;
            setMinute(next);
            phaseStartRef.current = Date.now();
            onMinuteChange(next);
            triggerHaptic('heavy');
        }
    }, [onMinuteChange]);

    const start = useCallback(() => {
        setState('running');
        minuteRef.current = 1;
        setMinute(1);
        setTimeLeft(60);
        phaseStartRef.current = Date.now();
        onMinuteChange(1);
        triggerHaptic('success');
        clear();
        intervalRef.current = setInterval(tick, 200);
    }, [tick, onMinuteChange]);

    const stop = useCallback(() => {
        clear();
        setState('idle');
        setMinute(0);
        setTimeLeft(60);
        minuteRef.current = 0;
        onMinuteChange(0);
        triggerHaptic('light');
    }, [onMinuteChange]);

    useEffect(() => () => clear(), []);

    const l = (en: string, es: string) => lang === 'en' ? en : es;
    const pct = ((60 - timeLeft) / 60) * 100;
    const urgent = timeLeft <= 10 && timeLeft > 0;

    if (state === 'idle') return (
        <div className="flex items-center gap-3 px-3 py-2.5 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
            <Icon name="Timer" size={14} className="text-cyan-400 shrink-0" />
            <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-cyan-400 uppercase tracking-wider">
                    EMOM · {totalSets} {l('rounds', 'rondas')}
                </p>
                <p className="text-[9px] text-cyan-700">{l('One set per minute — tap Start', 'Una serie por minuto — toca Iniciar')}</p>
            </div>
            <button
                onClick={start}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500 text-white rounded-lg text-xs font-black active:scale-95 transition-all shrink-0"
            >
                <Icon name="Play" size={12} fill="currentColor" />
                {l('Start', 'Iniciar')}
            </button>
        </div>
    );

    if (state === 'done') return (
        <div className="flex items-center gap-3 px-3 py-2.5 bg-green-500/10 border border-green-500/20 rounded-xl">
            <Icon name="CheckCircle" size={14} className="text-green-400 shrink-0" />
            <p className="text-[10px] font-black text-green-400 uppercase tracking-wider flex-1">
                EMOM {l('complete', 'completo')} · {totalSets} {l('rounds done', 'rondas')}
            </p>
            <button onClick={stop} className="text-[10px] font-bold text-zinc-500 hover:text-white transition-colors px-2 py-1">
                {l('Reset', 'Reiniciar')}
            </button>
        </div>
    );

    // Running
    return (
        <div className={`border rounded-xl overflow-hidden ${urgent ? 'bg-orange-500/10 border-orange-500/30' : 'bg-cyan-500/10 border-cyan-500/25'}`}>
            <div className="flex items-center gap-2 px-3 pt-2 pb-0.5">
                <Icon name="Timer" size={13} className={urgent ? 'text-orange-400' : 'text-cyan-400'} />
                <span className={`text-[10px] font-black uppercase tracking-wider flex-1 ${urgent ? 'text-orange-400' : 'text-cyan-400'}`}>
                    EMOM · {l('Min', 'Min')} {minute} / {totalSets}
                </span>
                <span className={`text-[9px] font-bold uppercase tracking-widest ${urgent ? 'text-orange-500' : 'text-cyan-600'}`}>
                    {urgent ? l('GO NOW!', '¡AHORA!') : l('next set in', 'próxima serie en')}
                </span>
                <button
                    onClick={stop}
                    className="ml-1 text-[10px] font-bold text-zinc-600 hover:text-white px-2 py-0.5 rounded-lg bg-zinc-800/80 transition-colors"
                >
                    {l('Stop', 'Detener')}
                </button>
            </div>
            <div className="px-3 pb-2">
                <div className={`text-4xl font-black tabular-nums text-center py-0.5 tracking-tight ${urgent ? 'text-orange-300 animate-pulse' : 'text-cyan-200'}`}>
                    {fmt(timeLeft)}
                </div>
                <div className={`h-2 rounded-full overflow-hidden mt-1 ${urgent ? 'bg-orange-900/30' : 'bg-cyan-900/30'}`}>
                    <div
                        className={`h-full rounded-full transition-all duration-200 ${urgent ? 'bg-orange-400' : 'bg-cyan-400'}`}
                        style={{ width: `${pct}%` }}
                    />
                </div>
            </div>
        </div>
    );
};

// ── TABATA TIMER ──────────────────────────────────────────────────────────────
interface TabataTimerProps {
    totalRounds: number;
    lang: 'en' | 'es';
}

const WORK_SEC = 20;
const REST_SEC = 10;

export const TabataTimer: React.FC<TabataTimerProps> = ({ totalRounds, lang }) => {
    const [state, setState] = useState<'idle' | 'running' | 'done'>('idle');
    const [phase, setPhase] = useState<'work' | 'rest'>('work');
    const [timeLeft, setTimeLeft] = useState(WORK_SEC);
    const [round, setRound] = useState(1);

    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const phaseStartRef = useRef<number>(0);
    const phaseRef = useRef<'work' | 'rest'>('work');
    const roundRef = useRef<number>(1);
    const totalRoundsRef = useRef(totalRounds);
    totalRoundsRef.current = totalRounds;

    const clear = () => {
        if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    };

    const tick = useCallback(() => {
        const dur = phaseRef.current === 'work' ? WORK_SEC : REST_SEC;
        const elapsed = Math.floor((Date.now() - phaseStartRef.current) / 1000);
        const rem = Math.max(0, dur - elapsed);
        setTimeLeft(rem);
        if (rem > 0) return;

        if (phaseRef.current === 'work') {
            phaseRef.current = 'rest';
            setPhase('rest');
            phaseStartRef.current = Date.now();
            triggerHaptic('medium');
        } else {
            const next = roundRef.current + 1;
            if (next > totalRoundsRef.current) {
                clear();
                setState('done');
                triggerHaptic('success');
                playTimerFinishSound();
            } else {
                roundRef.current = next;
                setRound(next);
                phaseRef.current = 'work';
                setPhase('work');
                phaseStartRef.current = Date.now();
                triggerHaptic('heavy');
            }
        }
    }, []);

    const start = useCallback(() => {
        setState('running');
        phaseRef.current = 'work';
        roundRef.current = 1;
        setPhase('work');
        setRound(1);
        setTimeLeft(WORK_SEC);
        phaseStartRef.current = Date.now();
        triggerHaptic('success');
        clear();
        intervalRef.current = setInterval(tick, 200);
    }, [tick]);

    const stop = useCallback(() => {
        clear();
        setState('idle');
        setPhase('work');
        setRound(1);
        setTimeLeft(WORK_SEC);
        phaseRef.current = 'work';
        roundRef.current = 1;
        triggerHaptic('light');
    }, []);

    useEffect(() => () => clear(), []);

    const l = (en: string, es: string) => lang === 'en' ? en : es;
    const isWork = phase === 'work';
    const phaseDur = isWork ? WORK_SEC : REST_SEC;
    const pct = ((phaseDur - timeLeft) / phaseDur) * 100;
    const urgent = timeLeft <= 3;

    if (state === 'idle') return (
        <div className="flex items-center gap-3 px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl">
            <Icon name="Timer" size={14} className="text-red-400 shrink-0" />
            <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-red-400 uppercase tracking-wider">
                    Tabata · {totalRounds} {l('rounds', 'rondas')}
                </p>
                <p className="text-[9px] text-red-700 font-mono">20s {l('work', 'trabajo')} / 10s {l('rest', 'descanso')}</p>
            </div>
            <button
                onClick={start}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-black active:scale-95 transition-all shrink-0"
            >
                <Icon name="Play" size={12} fill="currentColor" />
                {l('Start', 'Iniciar')}
            </button>
        </div>
    );

    if (state === 'done') return (
        <div className="flex items-center gap-3 px-3 py-2.5 bg-green-500/10 border border-green-500/20 rounded-xl">
            <Icon name="CheckCircle" size={14} className="text-green-400 shrink-0" />
            <p className="text-[10px] font-black text-green-400 uppercase tracking-wider flex-1">
                Tabata {l('complete', 'completo')} · {totalRounds} {l('rounds done', 'rondas')}
            </p>
            <button onClick={stop} className="text-[10px] font-bold text-zinc-500 hover:text-white transition-colors px-2 py-1">
                {l('Reset', 'Reiniciar')}
            </button>
        </div>
    );

    // Running
    return (
        <div className={`border rounded-xl overflow-hidden ${isWork ? 'bg-red-500/10 border-red-500/25' : 'bg-blue-500/10 border-blue-500/25'}`}>
            <div className="flex items-center gap-2 px-3 pt-2 pb-0.5">
                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded shrink-0 ${isWork ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'}`}>
                    {isWork ? l('WORK', 'TRABAJO') : l('REST', 'DESCANSO')}
                </span>
                <span className={`text-[10px] font-bold uppercase tracking-wider flex-1 ${isWork ? 'text-red-400' : 'text-blue-400'}`}>
                    {l('Round', 'Ronda')} {round} / {totalRounds}
                </span>
                <button
                    onClick={stop}
                    className="text-[10px] font-bold text-zinc-600 hover:text-white px-2 py-0.5 rounded-lg bg-zinc-800/80 transition-colors"
                >
                    {l('Stop', 'Detener')}
                </button>
            </div>
            <div className="px-3 pb-2">
                <div className={`text-4xl font-black tabular-nums text-center py-0.5 tracking-tight ${urgent ? 'animate-pulse' : ''} ${isWork ? 'text-red-200' : 'text-blue-200'}`}>
                    {timeLeft}s
                </div>
                <div className={`h-2 rounded-full overflow-hidden mt-1 ${isWork ? 'bg-red-900/30' : 'bg-blue-900/30'}`}>
                    <div
                        className={`h-full rounded-full transition-all duration-200 ${isWork ? 'bg-red-400' : 'bg-blue-400'}`}
                        style={{ width: `${pct}%` }}
                    />
                </div>
            </div>
        </div>
    );
};
