
import React, { useState, useEffect, useRef } from 'react';
import { WorkoutSet, SetType, CardioType } from '../../types';
import { Icon } from '../ui/Icon';
import { TRANSLATIONS } from '../../constants';
import { playTimerFinishSound, triggerHaptic } from '../../utils/audio';

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
}

const getTypeColor = (type: SetType) => {
    switch(type) {
        case 'warmup': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900';
        case 'myorep': case 'myorep_match': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-900';
        case 'giant': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-900';
        case 'top': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-900';
        default: return 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700';
    }
};

const getTypeLabel = (type: SetType) => {
    const map: Record<string, string> = { regular: 'R', warmup: 'W', myorep: 'M', myorep_match: 'MM', giant: 'G', top: 'T', backoff: 'B', cluster: 'C' };
    return map[type] || 'R';
};

export const SetRow = React.memo(({ set, exInstanceId, unit, unitLabel, plateWeight, showRIR, stageRIR, onUpdate, onToggleComplete, onChangeType, lang, isCardio, cardioMode = 'steady', isBodyweight }: SetRowProps) => {
    const t = TRANSLATIONS[lang];
    const isDone = set.completed;
    const setType = set.type || 'regular';
    const isInterval = cardioMode === 'hiit' || cardioMode === 'tabata';

    // Local State for Inputs
    const [localWeight, setLocalWeight] = useState(set.weight ?? '');
    const [localReps, setLocalReps] = useState(set.reps ?? '');
    const [localRPE, setLocalRPE] = useState(set.rpe ?? '');
    
    // Cardio Specific State
    const [localDuration, setLocalDuration] = useState(set.duration ?? '');
    const [localDistance, setLocalDistance] = useState(set.distance ?? '');
    const [localWork, setLocalWork] = useState(set.workSeconds ?? (cardioMode === 'tabata' ? 20 : ''));
    const [localRest, setLocalRest] = useState(set.restSeconds ?? (cardioMode === 'tabata' ? 10 : ''));
    const [localRounds, setLocalRounds] = useState(set.reps ?? (cardioMode === 'tabata' ? 8 : 4)); 

    // Error State for Validation
    const [showError, setShowError] = useState(false);

    // Timer State
    const [timerActive, setTimerActive] = useState(false);
    const [intervalPhase, setIntervalPhase] = useState<'work' | 'rest'>('work');
    const [intervalSeconds, setIntervalSeconds] = useState(0); 
    const [roundsLeft, setRoundsLeft] = useState(0);
    const timerRef = useRef<any>(null);
    
    // Safety Refs for Focus Management
    const activeFieldRef = useRef<string | null>(null);

    // Sync props to state (Safely)
    useEffect(() => { if (activeFieldRef.current !== 'weight') setLocalWeight(set.weight ?? ''); }, [set.weight]);
    useEffect(() => { if (activeFieldRef.current !== 'reps') setLocalReps(set.reps ?? ''); }, [set.reps]);
    useEffect(() => { if (activeFieldRef.current !== 'rpe') setLocalRPE(set.rpe ?? ''); }, [set.rpe]);
    useEffect(() => { if (activeFieldRef.current !== 'duration') setLocalDuration(set.duration ?? ''); }, [set.duration]);
    useEffect(() => { if (activeFieldRef.current !== 'distance') setLocalDistance(set.distance ?? ''); }, [set.distance]);
    
    useEffect(() => { 
        if (set.workSeconds !== undefined && activeFieldRef.current !== 'workSeconds') setLocalWork(set.workSeconds);
        if (set.restSeconds !== undefined && activeFieldRef.current !== 'restSeconds') setLocalRest(set.restSeconds);
        if (isInterval && set.reps !== undefined && activeFieldRef.current !== 'reps') setLocalRounds(set.reps);
    }, [set.workSeconds, set.restSeconds, set.reps, isInterval]);

    useEffect(() => {
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, []);

    const commitChange = (field: string, value: any) => {
        if (value != set[field as keyof WorkoutSet]) {
            onUpdate(exInstanceId, set.id, field, value);
        }
        if (showError) setShowError(false);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>, field: string) => {
        activeFieldRef.current = field;
        e.target.select();
    };

    const handleBlur = (field: string, value: any) => {
        activeFieldRef.current = null;
        commitChange(field, value);
    };

    const tryComplete = () => {
        if (isCardio) {
            if(!isInterval) onToggleComplete(exInstanceId, set.id);
            return;
        }
        if (!localWeight || !localReps) {
            setShowError(true);
            triggerHaptic('heavy');
            return;
        }
        onToggleComplete(exInstanceId, set.id);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, field: string, val: any) => {
        if (e.key === 'Enter') {
            e.currentTarget.blur(); 
            if (!isDone && !isInterval) tryComplete();
        }
    };

    const toggleSteadyTimer = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (timerActive) {
            clearInterval(timerRef.current);
            setTimerActive(false);
            commitChange('duration', localDuration);
        } else {
            let startSecs = 0;
            if (localDuration) {
                const parts = String(localDuration).split(':');
                if (parts.length === 2) startSecs = (Number(parts[0]) * 60) + Number(parts[1]);
                else startSecs = Number(localDuration) * 60;
            }
            timerRef.current = setInterval(() => {
                startSecs++;
                const m = Math.floor(startSecs / 60);
                const s = startSecs % 60;
                setLocalDuration(`${m}:${s.toString().padStart(2, '0')}`);
            }, 1000);
            setTimerActive(true);
        }
    };

    const toggleIntervalTimer = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (timerActive) {
            clearInterval(timerRef.current);
            setTimerActive(false);
            setIntervalPhase('work'); 
        } else {
            const workSecs = Number(localWork) || 20;
            const restSecs = Number(localRest) || 10;
            const totalRounds = Number(localRounds) || 8;
            
            if (workSecs <= 0) return;

            commitChange('workSeconds', workSecs);
            commitChange('restSeconds', restSecs);
            commitChange('reps', totalRounds); 

            setRoundsLeft(totalRounds);
            setIntervalSeconds(workSecs);
            setIntervalPhase('work');
            setTimerActive(true);

            let currentSecs = workSecs;
            let currentPhase: 'work' | 'rest' = 'work';
            let rLeft = totalRounds;

            timerRef.current = setInterval(() => {
                currentSecs--;
                setIntervalSeconds(currentSecs);

                if (currentSecs > 0 && currentSecs <= 3) triggerHaptic('light');

                if (currentSecs <= 0) {
                    playTimerFinishSound();
                    triggerHaptic('medium');

                    if (currentPhase === 'work') {
                        if (restSecs > 0 && rLeft > 1) { 
                            currentPhase = 'rest';
                            currentSecs = restSecs;
                            setIntervalPhase('rest');
                        } else {
                            rLeft--;
                            setRoundsLeft(rLeft);
                            if (rLeft > 0) {
                                currentPhase = 'work';
                                currentSecs = workSecs;
                                setIntervalPhase('work');
                            } else {
                                clearInterval(timerRef.current);
                                setTimerActive(false);
                                setIntervalPhase('work');
                                onToggleComplete(exInstanceId, set.id);
                                return;
                            }
                        }
                    } else {
                        rLeft--;
                        setRoundsLeft(rLeft);
                        if (rLeft > 0) {
                            currentPhase = 'work';
                            currentSecs = workSecs;
                            setIntervalPhase('work');
                        } else {
                            clearInterval(timerRef.current);
                            setTimerActive(false);
                        }
                    }
                    setIntervalSeconds(currentSecs);
                }
            }, 1000);
        }
    };

    const inputBaseClass = `w-full text-lg font-bold text-center border-0 outline-none tabular-nums rounded-lg py-2 transition-all focus:ring-2 focus:ring-inset focus:ring-red-500/50`;
    const activeInputClass = `bg-white dark:bg-zinc-900 shadow-sm border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder-zinc-300 dark:placeholder-zinc-600`;
    const doneInputClass = `bg-transparent text-green-700 dark:text-green-400 placeholder-green-700/30 border border-transparent`;
    const errorInputClass = `bg-red-50 dark:bg-red-900/20 border border-red-500 shadow-sm text-red-900 dark:text-red-100 placeholder-red-300 animate-pulse`;

    const getClasses = (val: any) => {
        if (isDone) return doneInputClass;
        if (showError && !val) return errorInputClass;
        return activeInputClass;
    };

    // Use gap-2 to match the header and provide breathing room
    const containerClasses = `grid grid-cols-12 gap-2 px-2 items-center transition-all duration-200 relative group border-b border-zinc-50 dark:border-white/[0.02] last:border-0 ${isDone ? 'bg-green-50/50 dark:bg-green-900/5' : ''}`;

    if (isInterval) {
        return (
            <div className={`py-2 ${containerClasses}`}>
                <div className="col-span-1 flex justify-center">
                    <div className="w-6 h-6 rounded bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-500">
                        {isDone ? <Icon name="Check" size={12} strokeWidth={4} className="text-green-600" /> : set.id.toString().slice(-1)}
                    </div>
                </div>

                <div className="col-span-4 relative">
                    <input 
                        type="number" 
                        className={`${inputBaseClass} ${isDone ? doneInputClass : activeInputClass} text-green-600 dark:text-green-400`} 
                        placeholder="20s" 
                        value={localWork} 
                        onChange={(e) => setLocalWork(Number(e.target.value))}
                        onBlur={() => handleBlur('workSeconds', Number(localWork))}
                        onFocus={(e) => handleFocus(e, 'workSeconds')}
                        disabled={timerActive}
                    />
                </div>

                <div className="col-span-4 relative">
                    <input 
                        type="number" 
                        className={`${inputBaseClass} ${isDone ? doneInputClass : activeInputClass} text-blue-500 dark:text-blue-400`} 
                        placeholder="10s" 
                        value={localRest} 
                        onChange={(e) => setLocalRest(Number(e.target.value))}
                        onBlur={() => handleBlur('restSeconds', Number(localRest))}
                        onFocus={(e) => handleFocus(e, 'restSeconds')}
                        disabled={timerActive}
                    />
                </div>

                <div className="col-span-2 relative">
                    <input 
                        type="number" 
                        className={`w-full text-sm font-bold py-1.5 text-center rounded-lg outline-none border ${isDone ? 'bg-transparent border-transparent text-green-600' : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700'}`} 
                        placeholder="8" 
                        value={localRounds} 
                        onChange={(e) => setLocalRounds(Number(e.target.value))}
                        onBlur={() => handleBlur('reps', Number(localRounds))}
                        onFocus={(e) => handleFocus(e, 'reps')}
                        disabled={timerActive}
                    />
                </div>

                <div className="col-span-1 flex justify-center">
                    <button 
                        onClick={toggleIntervalTimer}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 shadow-sm ${
                            timerActive 
                            ? (intervalPhase === 'work' ? 'bg-green-500 text-white animate-pulse' : 'bg-blue-500 text-white animate-pulse')
                            : (isDone ? 'bg-zinc-100 dark:bg-zinc-800 text-green-600' : 'bg-red-600 text-white hover:bg-red-500')
                        }`}
                    >
                        {timerActive ? (
                            <span className="font-mono font-bold text-[9px]">{intervalSeconds}</span>
                        ) : isDone ? (
                            <Icon name="Check" size={14} />
                        ) : (
                            <Icon name="Play" size={12} />
                        )}
                    </button>
                </div>
            </div>
        );
    }

    if (isCardio) {
        return (
            <div className={`py-2 ${containerClasses}`}>
                 <div className="col-span-1 flex justify-center relative">
                    <div className="w-6 h-6 rounded bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-500">
                        {isDone ? <Icon name="Check" size={12} strokeWidth={4} className="text-green-600" /> : set.id.toString().slice(-1)}
                    </div>
                 </div>

                 <div className="col-span-4 relative flex items-center">
                    <div className="relative w-full">
                         <input 
                            type="text" 
                            className={`${inputBaseClass} ${isDone ? doneInputClass : activeInputClass} ${timerActive ? 'text-red-600 dark:text-red-400 animate-pulse' : ''}`}
                            placeholder="Min" 
                            value={localDuration} 
                            onChange={(e) => setLocalDuration(e.target.value)}
                            onBlur={() => handleBlur('duration', localDuration)}
                            onFocus={(e) => handleFocus(e, 'duration')}
                        />
                    </div>
                 </div>

                 <div className="col-span-4 relative flex flex-col items-center">
                    <div className="relative w-full">
                        <input 
                            type="number" 
                            inputMode="decimal"
                            className={`${inputBaseClass} ${isDone ? doneInputClass : activeInputClass}`} 
                            placeholder="Km" 
                            value={localDistance} 
                            onChange={(e) => setLocalDistance(e.target.value)}
                            onBlur={() => handleBlur('distance', localDistance)}
                            onFocus={(e) => handleFocus(e, 'distance')}
                        />
                    </div>
                 </div>

                 <div className="col-span-2 flex justify-center">
                     <input 
                        type="text"
                        className={`w-full text-sm font-bold py-2 text-center rounded-lg transition-all focus:ring-1 focus:ring-zinc-500 outline-none border ${isDone ? 'bg-transparent border-transparent text-green-600 opacity-60' : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300'}`}
                        placeholder="-"
                        value={localRPE}
                        onChange={(e) => setLocalRPE(e.target.value)}
                        onBlur={() => handleBlur('rpe', localRPE)}
                        onFocus={(e) => handleFocus(e, 'rpe')}
                    />
                 </div>

                <div className="col-span-1 flex justify-center">
                    <button 
                        onClick={tryComplete} 
                        className={`
                            w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 active:scale-90
                            ${isDone 
                                ? 'bg-green-500 text-white shadow-lg shadow-green-500/30 scale-100 rotate-0' 
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-300 dark:text-zinc-600 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                            }
                        `}
                    >
                        <Icon name="Check" size={16} strokeWidth={3} />
                    </button>
                </div>
            </div>
        );
    }

    // REGULAR STRENGTH SET ROW
    return (
        <div className={`py-2 ${containerClasses}`}>
            
            <div className="col-span-1 flex justify-center relative">
                <button 
                    onClick={(e) => { e.stopPropagation(); if (!isDone) onChangeType(exInstanceId, set.id, setType); }}
                    className={`w-6 h-6 rounded border flex items-center justify-center text-[9px] font-black cursor-pointer transition-all active:scale-95 ${isDone ? 'bg-green-100 dark:bg-green-500/20 border-green-200 dark:border-green-500/30 text-green-700 dark:text-green-400' : getTypeColor(setType)}`}
                >
                   {isDone ? <Icon name="Check" size={10} strokeWidth={4} /> : getTypeLabel(setType)}
                </button>
            </div>
            
            <div className="col-span-4 relative flex flex-col items-center">
                <div className="relative w-full">
                    {set.hintWeight && set.prevWeight && Number(set.hintWeight) > Number(set.prevWeight) && !localWeight && !isDone && (
                        <div className="absolute right-1 -top-2 text-[8px] font-bold text-green-500 bg-green-100 dark:bg-green-900/30 px-1 rounded pointer-events-none z-10">
                            +{Number(set.hintWeight) - Number(set.prevWeight)}
                        </div>
                    )}
                    <input 
                        type="number" 
                        inputMode="decimal" 
                        className={getClasses(localWeight)}
                        placeholder={set.hintWeight ? String(set.hintWeight) : "-"} 
                        value={localWeight} 
                        onChange={(e) => setLocalWeight(e.target.value)}
                        onBlur={() => handleBlur('weight', localWeight)}
                        onFocus={(e) => handleFocus(e, 'weight')}
                        onKeyDown={(e) => handleKeyDown(e, 'weight', localWeight)}
                    />
                </div>
                {/* Simplified Prev Below */}
                {!isDone && (set.prevWeight || unitLabel) && (
                    <div className="text-[8px] font-bold text-zinc-400 uppercase mt-0.5 opacity-60">
                        {isBodyweight ? (set.prevWeight ? `+${set.prevWeight}` : '+BW') : (set.prevWeight ? `${set.prevWeight}` : unitLabel)}
                    </div>
                )}
            </div>

            <div className="col-span-4 relative flex flex-col items-center">
                <div className="relative w-full">
                    <input 
                        type="number" 
                        inputMode="numeric" 
                        className={getClasses(localReps)}
                        placeholder={set.hintReps ? String(set.hintReps) : "-"} 
                        value={localReps} 
                        onChange={(e) => setLocalReps(e.target.value)}
                        onBlur={() => handleBlur('reps', localReps)}
                        onFocus={(e) => handleFocus(e, 'reps')}
                        onKeyDown={(e) => handleKeyDown(e, 'reps', localReps)}
                    />
                </div>
                {!isDone && (set.prevReps || !set.prevWeight) && (
                    <div className="text-[8px] font-bold text-zinc-400 uppercase mt-0.5 opacity-60">
                        {set.prevReps ? `${set.prevReps}` : 'reps'}
                    </div>
                )}
            </div>

            {showRIR ? (
                <div className="col-span-2 flex justify-center w-full">
                    <input 
                        type="number" 
                        inputMode="numeric" 
                        className={`w-full text-sm font-bold py-2 text-center rounded-lg transition-all focus:ring-1 focus:ring-zinc-500 outline-none border ${isDone ? 'bg-transparent border-transparent text-green-600 opacity-60' : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300'}`} 
                        placeholder={stageRIR}
                        value={localRPE} 
                        onChange={(e) => setLocalRPE(e.target.value)}
                        onBlur={() => handleBlur('rpe', localRPE)}
                        onFocus={(e) => handleFocus(e, 'rpe')}
                        onKeyDown={(e) => handleKeyDown(e, 'rpe', localRPE)}
                    />
                </div>
            ) : (
                <div className="col-span-2"></div>
            )}

            <div className="col-span-1 flex justify-center">
                <button 
                    onClick={tryComplete} 
                    className={`
                        w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 active:scale-90
                        ${isDone 
                            ? 'bg-green-500 text-white shadow-lg shadow-green-500/30 scale-100 rotate-0' 
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-300 dark:text-zinc-600 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                        }
                    `}
                >
                    <Icon name="Check" size={16} strokeWidth={3} />
                </button>
            </div>
        </div>
    );
});
