
import React, { useState, useEffect, useRef } from 'react';
import { WorkoutSet, SetType, CardioType } from '../../types';
import { Icon } from '../ui/Icon';
import { TRANSLATIONS } from '../../constants';
import { playTimerFinishSound, triggerHaptic } from '../../utils/audio';

// ... (Existing Imports)

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
    switch(type) {
        case 'warmup': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
        case 'myorep': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
        case 'top': return 'bg-red-500/10 text-red-500 border-red-500/20';
        default: return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    }
};

const getTypeLabel = (type: SetType) => {
    const map: Record<string, string> = { regular: '1', warmup: 'W', myorep: 'M', giant: 'G', top: 'T' };
    return map[type] || '1';
};

export const SetRow = React.memo(({ set, exInstanceId, unit, unitLabel, plateWeight, showRIR, stageRIR, onUpdate, onToggleComplete, onChangeType, lang, isCardio, cardioMode = 'steady', isBodyweight, tutorialId }: SetRowProps) => {
    const isDone = set.completed;
    const setType = set.type || 'regular';
    
    const [localWeight, setLocalWeight] = useState(set.weight ?? '');
    const [localReps, setLocalReps] = useState(set.reps ?? '');
    const [localRPE, setLocalRPE] = useState(set.rpe ?? '');
    
    // Safety Refs
    const activeFieldRef = useRef<string | null>(null);

    useEffect(() => { if (activeFieldRef.current !== 'weight') setLocalWeight(set.weight ?? ''); }, [set.weight]);
    useEffect(() => { if (activeFieldRef.current !== 'reps') setLocalReps(set.reps ?? ''); }, [set.reps]);
    useEffect(() => { if (activeFieldRef.current !== 'rpe') setLocalRPE(set.rpe ?? ''); }, [set.rpe]);

    const commitChange = (field: string, value: any) => {
        if (value != set[field as keyof WorkoutSet]) {
            onUpdate(exInstanceId, set.id, field, value);
        }
    };

    const handleBlur = (field: string, value: any) => {
        activeFieldRef.current = null;
        commitChange(field, value);
    };

    // New Boxed Input Style
    const inputBase = "w-full text-center bg-zinc-800 rounded-xl py-3 text-lg font-bold text-white outline-none focus:ring-2 focus:ring-white/20 transition-all tabular-nums placeholder-zinc-600";
    const doneInput = "bg-transparent text-green-500 pointer-events-none";

    return (
        <div className={`grid grid-cols-12 gap-3 items-center py-2 ${isDone ? 'opacity-50' : ''}`}>
            
            {/* Set Type / Number */}
            <div className="col-span-2 flex justify-center">
                <button 
                    id={tutorialId}
                    onClick={() => !isDone && onChangeType(exInstanceId, set.id, setType)}
                    className={`w-10 h-10 rounded-xl border flex items-center justify-center font-black text-xs transition-all ${isDone ? 'bg-green-500/10 border-green-500/20 text-green-500' : getTypeColor(setType)}`}
                >
                    {isDone ? <Icon name="Check" size={16} /> : getTypeLabel(setType)}
                </button>
            </div>

            {/* Inputs - Weight */}
            <div className="col-span-4 relative">
                <input 
                    type="number" inputMode="decimal"
                    className={isDone ? inputBase + " " + doneInput : inputBase}
                    placeholder={set.hintWeight ? String(set.hintWeight) : "-"}
                    value={localWeight}
                    onChange={e => setLocalWeight(e.target.value)}
                    onBlur={() => handleBlur('weight', localWeight)}
                    onFocus={() => activeFieldRef.current = 'weight'}
                />
                {!isDone && set.prevWeight && <div className="absolute -bottom-3 w-full text-center text-[9px] font-bold text-zinc-600">{set.prevWeight} {unitLabel}</div>}
            </div>

            {/* Inputs - Reps */}
            <div className="col-span-4 relative">
                <input 
                    type="number" inputMode="numeric"
                    className={isDone ? inputBase + " " + doneInput : inputBase}
                    placeholder={set.hintReps ? String(set.hintReps) : "-"}
                    value={localReps}
                    onChange={e => setLocalReps(e.target.value)}
                    onBlur={() => handleBlur('reps', localReps)}
                    onFocus={() => activeFieldRef.current = 'reps'}
                />
                {!isDone && set.prevReps && <div className="absolute -bottom-3 w-full text-center text-[9px] font-bold text-zinc-600">{set.prevReps} Reps</div>}
            </div>

            {/* Check Button */}
            <div className="col-span-2 flex justify-center">
                <button 
                    onClick={() => onToggleComplete(exInstanceId, set.id)}
                    className={`
                        w-12 h-12 rounded-xl flex items-center justify-center transition-all active:scale-90
                        ${isDone ? 'bg-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'}
                    `}
                >
                    <Icon name="Check" size={20} strokeWidth={3} />
                </button>
            </div>
        </div>
    );
});
