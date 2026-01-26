
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../constants';
import { MuscleGroup } from '../../types';
import { Button } from './Button';
import { Icon } from './Icon';
import { calculateVolumeAdjustment } from '../../utils';

interface FeedbackModalProps {
    muscles: MuscleGroup[];
    onConfirm: (feedback: Record<string, { soreness: number, performance: number, adjustment: number }>) => void;
    onCancel: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ muscles, onConfirm, onCancel }) => {
    const { lang } = useApp();
    const t = TRANSLATIONS[lang];
    
    // State stores tuple [soreness, performance]
    const [feedback, setFeedback] = useState<Record<string, { s: number | null, p: number | null }>>({});

    const handleInput = (m: string, type: 's' | 'p', val: number) => {
        setFeedback(prev => ({
            ...prev,
            [m]: { ...(prev[m] || { s: null, p: null }), [type]: val }
        }));
    };

    const uniqueMuscles = Array.from(new Set(muscles)) as MuscleGroup[];

    const isComplete = uniqueMuscles.every(m => feedback[m]?.s && feedback[m]?.p);

    const handleSubmit = () => {
        const result: Record<string, any> = {};
        uniqueMuscles.forEach(m => {
            const f = feedback[m];
            if (f && f.s && f.p) {
                result[m] = {
                    soreness: f.s,
                    performance: f.p,
                    adjustment: calculateVolumeAdjustment(f.s, f.p)
                };
            }
        });
        onConfirm(result);
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl border-t sm:border border-zinc-200 dark:border-white/10 max-h-[90vh] overflow-y-auto animate-slideUp">
                <div className="text-center mb-6">
                    <h3 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight mb-1">{t.rpFeedbackTitle}</h3>
                    <p className="text-xs text-zinc-500">{t.rpRatingHelp}</p>
                </div>

                <div className="space-y-8 mb-8">
                    {uniqueMuscles.map(m => {
                        const s = feedback[m]?.s;
                        const p = feedback[m]?.p;
                        const adj = (s && p) ? calculateVolumeAdjustment(s, p) : null;
                        
                        return (
                            <div key={m} className="space-y-3 pb-4 border-b border-zinc-100 dark:border-white/5 last:border-0">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-white bg-zinc-100 dark:bg-white/10 px-2 py-1 rounded">
                                        {(t.muscle as Record<string, string>)[m]}
                                    </span>
                                    {adj !== null && (
                                        <span className={`text-xs font-bold px-2 py-1 rounded ${adj > 0 ? 'bg-green-100 text-green-700' : adj < 0 ? 'bg-red-100 text-red-700' : 'bg-zinc-100 text-zinc-500'}`}>
                                            {adj > 0 ? t.fb.adjust.add : adj < 0 ? t.fb.adjust.sub : t.fb.adjust.keep}
                                        </span>
                                    )}
                                </div>

                                {/* Soreness Row (UI Order: 1, 2, 3) -> Matches Best to Worst */}
                                <div className="space-y-1">
                                    <div className="text-[10px] font-bold text-zinc-400 uppercase">{t.fb.sorenessLabel}</div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <button onClick={() => handleInput(m, 's', 1)} className={`p-2 rounded-lg border text-xs font-bold transition-all ${s === 1 ? 'bg-zinc-800 text-white border-zinc-800' : 'bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 border-zinc-200 dark:border-zinc-700'}`}>
                                            {t.fb.soreness[1]}
                                        </button>
                                        <button onClick={() => handleInput(m, 's', 2)} className={`p-2 rounded-lg border text-xs font-bold transition-all ${s === 2 ? 'bg-zinc-800 text-white border-zinc-800' : 'bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 border-zinc-200 dark:border-zinc-700'}`}>
                                            {t.fb.soreness[2]}
                                        </button>
                                        <button onClick={() => handleInput(m, 's', 3)} className={`p-2 rounded-lg border text-xs font-bold transition-all ${s === 3 ? 'bg-red-600 text-white border-red-600' : 'bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 border-zinc-200 dark:border-zinc-700'}`}>
                                            {t.fb.soreness[3]}
                                        </button>
                                    </div>
                                </div>

                                {/* Performance Row (UI Order: 3, 2, 1) -> Matches Best (3) to Worst (1) */}
                                <div className="space-y-1">
                                    <div className="text-[10px] font-bold text-zinc-400 uppercase">{t.fb.performanceLabel}</div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <button onClick={() => handleInput(m, 'p', 3)} className={`p-2 rounded-lg border text-xs font-bold transition-all ${p === 3 ? 'bg-green-600 text-white border-green-600' : 'bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 border-zinc-200 dark:border-zinc-700'}`}>
                                            {t.fb.performance[3]}
                                        </button>
                                        <button onClick={() => handleInput(m, 'p', 2)} className={`p-2 rounded-lg border text-xs font-bold transition-all ${p === 2 ? 'bg-zinc-800 text-white border-zinc-800' : 'bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 border-zinc-200 dark:border-zinc-700'}`}>
                                            {t.fb.performance[2]}
                                        </button>
                                        <button onClick={() => handleInput(m, 'p', 1)} className={`p-2 rounded-lg border text-xs font-bold transition-all ${p === 1 ? 'bg-red-600 text-white border-red-600' : 'bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 border-zinc-200 dark:border-zinc-700'}`}>
                                            {t.fb.performance[1]}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <Button variant="secondary" onClick={onCancel}>{t.cancel}</Button>
                    <Button 
                        onClick={handleSubmit}
                        disabled={!isComplete}
                    >
                        {t.save} & {t.finishWorkout}
                    </Button>
                </div>
            </div>
        </div>
    );
};
