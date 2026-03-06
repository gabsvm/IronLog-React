
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
    tutorialId?: string;
}

const getTypeColor = (type: SetType) => {
    switch (type) {
        case 'warmup': return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30';
        case 'myorep': return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
        case 'myorep_match': return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
        case 'top': return 'bg-red-500/15 text-red-400 border-red-500/30';
        case 'backoff': return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
        case 'cluster': return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
        case 'giant': return 'bg-orange-500/15 text-orange-400 border-orange-500/30';
        default: return 'bg-zinc-800 text-zinc-400 border-zinc-700';
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
        cluster: 'C'
    };
    return map[type] || '●';
};

export const SetRow = React.memo(({ set, exInstanceId, unit, unitLabel, plateWeight, showRIR, stageRIR, onUpdate, onToggleComplete, onChangeType, lang, isCardio, cardioMode = 'steady', isBodyweight, tutorialId }: SetRowProps) => {
    const isDone = set.completed;
    const setType = set.type || 'regular';

    const [localWeight, setLocalWeight] = useState(set.weight ?? '');
    const [localReps, setLocalReps] = useState(set.reps ?? '');
    const [localRPE, setLocalRPE] = useState(set.rpe ?? '');

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
        // Auto-advance to reps input
        setTimeout(() => repsRef.current?.focus(), 80);
    };

    const handleBlur = (field: string, value: any) => {
        activeFieldRef.current = null;
        commitChange(field, value);
    };

    // Larger, more tappable inputs with hint as placeholder
    const inputBase = "w-full text-center bg-zinc-800 rounded-xl py-3.5 text-xl font-bold text-white outline-none focus:ring-2 focus:ring-white/30 transition-all tabular-nums placeholder-zinc-600";
    const doneInput = "bg-transparent text-green-400 pointer-events-none";

    const weightPlaceholder = set.hintWeight ? String(set.hintWeight) : '—';
    const repsPlaceholder = set.hintReps ? String(set.hintReps) : '—';

    return (
        <div className={`grid grid-cols-12 gap-2 items-center py-2.5 px-1 transition-colors duration-200 ${isDone ? 'opacity-60' : ''}`}>

            {/* Set Type / Number Badge */}
            <div className="col-span-2 flex justify-center">
                <button
                    id={tutorialId}
                    onClick={() => !isDone && onChangeType(exInstanceId, set.id, setType)}
                    className={`w-10 h-10 rounded-xl border flex items-center justify-center font-black text-xs transition-all active:scale-90 ${isDone ? 'bg-green-500/10 border-green-500/20 text-green-400' : getTypeColor(setType)}`}
                >
                    {isDone ? <Icon name="Check" size={16} strokeWidth={2.5} /> : getTypeLabel(setType)}
                </button>
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
                    onClick={() => onToggleComplete(exInstanceId, set.id)}
                    className={`
                        w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-150 active:scale-85
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
});
