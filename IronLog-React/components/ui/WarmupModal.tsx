import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../constants';
import { Button } from './Button';
import { Icon } from './Icon';
import { roundWeight } from '../../utils';

interface WarmupModalProps {
    targetWeight: number;
    exerciseName: string;
    onClose: () => void;
}

export const WarmupModal: React.FC<WarmupModalProps> = ({ targetWeight, exerciseName, onClose }) => {
    const { lang } = useApp();
    const t = TRANSLATIONS[lang];
    const [checked, setChecked] = useState<number[]>([]);

    const toggleCheck = (idx: number) => {
        if (checked.includes(idx)) setChecked(checked.filter(i => i !== idx));
        else setChecked([...checked, idx]);
    };

    // RP Style Warmup Logic (Chapter 3 of PDF)
    // 1. Light: ~50% for 10-12 reps (or 20RM)
    // 2. Moderate: ~75% for 4-6 reps
    // 3. Potentiation: ~90% for 1-2 reps
    const steps = [
        { pct: 0.5, reps: "10-12", label: t.warmupSets.light },
        { pct: 0.75, reps: "4-6", label: t.warmupSets.moderate },
        { pct: 0.90, reps: "1", label: t.warmupSets.potentiation }
    ];

    if (!targetWeight || targetWeight <= 0) {
        return (
             <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200" onClick={onClose}>
                <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-2xl p-6 text-center space-y-4 shadow-2xl" onClick={e => e.stopPropagation()}>
                    <Icon name="CloudOff" size={48} className="mx-auto text-zinc-300" />
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white">{t.warmupTitle}</h3>
                    <p className="text-sm text-zinc-500">{lang === 'en' ? "Please enter a weight in your first working set to calculate warmup sets." : "Introduce un peso en tu primera serie efectiva para calcular el calentamiento."}</p>
                    <Button onClick={onClose} fullWidth>{t.close}</Button>
                </div>
             </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-zinc-200 dark:border-white/10 animate-slideUp" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <div className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                            <Icon name="Zap" size={10} /> {t.warmupTitle}
                        </div>
                        <h3 className="text-lg font-black text-zinc-900 dark:text-white leading-tight pr-4">
                            {exerciseName}
                        </h3>
                    </div>
                    <div className="text-right">
                        <div className="text-[10px] text-zinc-400 font-bold uppercase">{t.workingWeight}</div>
                        <div className="text-xl font-mono font-bold text-zinc-900 dark:text-white">{targetWeight}</div>
                    </div>
                </div>

                <div className="space-y-3 mb-6">
                    {steps.map((step, idx) => {
                        const weight = roundWeight(targetWeight * step.pct);
                        const isChecked = checked.includes(idx);
                        
                        return (
                            <div 
                                key={idx}
                                onClick={() => toggleCheck(idx)}
                                className={`flex items-center p-3 rounded-xl border transition-all cursor-pointer
                                    ${isChecked 
                                        ? 'bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-900/30' 
                                        : 'bg-zinc-50 dark:bg-white/5 border-transparent hover:bg-zinc-100 dark:hover:bg-white/10'
                                    }
                                `}
                            >
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4 transition-colors ${isChecked ? 'bg-orange-500 border-orange-500 text-white' : 'border-zinc-300 dark:border-zinc-600'}`}>
                                    {isChecked && <Icon name="Check" size={14} strokeWidth={3} />}
                                </div>
                                
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-0.5">
                                        <span className={`text-sm font-bold ${isChecked ? 'text-orange-700 dark:text-orange-400' : 'text-zinc-700 dark:text-zinc-200'}`}>
                                            {weight} <span className="text-[10px] text-zinc-400">KG</span>
                                        </span>
                                        <span className={`font-mono font-bold text-sm ${isChecked ? 'text-orange-700 dark:text-orange-400' : 'text-zinc-900 dark:text-white'}`}>
                                            {step.reps} <span className="text-[10px] text-zinc-400">REPS</span>
                                        </span>
                                    </div>
                                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{step.label}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <p className="text-xs text-zinc-400 italic text-center mb-6 px-4 leading-relaxed">
                    {lang === 'en' 
                        ? "Perform these sets to potentiate your CNS without accumulating fatigue." 
                        : "Realiza estas series para potenciar tu SNC sin acumular fatiga antes de tus series efectivas."}
                </p>

                <Button onClick={onClose} fullWidth size="lg" className="bg-orange-600 hover:bg-orange-500 shadow-orange-600/20">
                    {t.close}
                </Button>
            </div>
        </div>
    );
};