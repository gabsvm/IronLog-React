
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../constants';
import { MuscleGroup } from '../../types';
import { Button } from './Button';
import { Sheet } from './Sheet';
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
        <Sheet
            open={true}
            onOpenChange={(o) => { if (!o) onCancel(); }}
            title={t.rpFeedbackTitle}
            description={t.rpRatingHelp}
            accent="primary"
            footer={
                <div className="grid grid-cols-2 gap-3">
                    <Button variant="secondary" onClick={onCancel}>{t.cancel}</Button>
                    <Button onClick={handleSubmit} disabled={!isComplete}>
                        {t.save} & {t.finishWorkout}
                    </Button>
                </div>
            }
        >
            <div className="p-6">
                <p className="text-xs text-zinc-500 text-center mb-6">{t.rpRatingHelp}</p>

                <div className="space-y-8">
                    {uniqueMuscles.map(m => {
                        const s = feedback[m]?.s;
                        const p = feedback[m]?.p;
                        const adj = (s && p) ? calculateVolumeAdjustment(s, p) : null;
                        
                        return (
                            <div key={m} className="space-y-4 pb-6 border-b border-zinc-850 last:border-0">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-black uppercase tracking-widest text-white bg-zinc-800/80 px-3 py-1.5 rounded-lg border border-white/5 shadow-inner">
                                        {(t.muscle as Record<string, string>)[m]}
                                    </span>
                                    {adj !== null && (
                                        <div className={`text-[10px] font-black tracking-widest uppercase px-3 py-1.5 rounded-full border transition-all ${
                                            adj > 0 ? 'bg-green-950/20 text-green-400 border-green-500/20 shadow-[0_0_12px_rgba(34,197,94,0.1)]' 
                                            : adj < 0 ? 'bg-rose-950/20 text-rose-400 border-rose-500/20 shadow-[0_0_12px_rgba(244,63,94,0.1)]' 
                                            : 'bg-zinc-950 text-zinc-500 border-zinc-850'
                                        }`}>
                                            {adj > 0 ? `${t.fb.adjust.add} (+${adj} ${lang === 'es' ? 'series' : 'sets'})` 
                                            : adj < 0 ? `${t.fb.adjust.sub} (${adj} ${lang === 'es' ? 'series' : 'sets'})` 
                                            : t.fb.adjust.keep}
                                        </div>
                                    )}
                                </div>

                                {/* Soreness Row */}
                                <div className="space-y-1.5">
                                    <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">{t.fb.sorenessLabel}</div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <button 
                                            onClick={() => handleInput(m, 's', 1)} 
                                            className={`p-2.5 rounded-xl border text-xs font-bold transition-all active:scale-95 ${
                                                s === 1 
                                                    ? 'bg-green-500/10 text-green-400 border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.05)]' 
                                                    : 'bg-zinc-950 text-zinc-500 border-zinc-900 hover:border-zinc-800'
                                            }`}
                                        >
                                            {t.fb.soreness[1]}
                                        </button>
                                        <button 
                                            onClick={() => handleInput(m, 's', 2)} 
                                            className={`p-2.5 rounded-xl border text-xs font-bold transition-all active:scale-95 ${
                                                s === 2 
                                                    ? 'bg-zinc-800 text-white border-zinc-700' 
                                                    : 'bg-zinc-950 text-zinc-500 border-zinc-900 hover:border-zinc-800'
                                            }`}
                                        >
                                            {t.fb.soreness[2]}
                                        </button>
                                        <button 
                                            onClick={() => handleInput(m, 's', 3)} 
                                            className={`p-2.5 rounded-xl border text-xs font-bold transition-all active:scale-95 ${
                                                s === 3 
                                                    ? 'bg-rose-500/15 text-rose-400 border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.05)]' 
                                                    : 'bg-zinc-950 text-zinc-500 border-zinc-900 hover:border-zinc-800'
                                            }`}
                                        >
                                            {t.fb.soreness[3]}
                                        </button>
                                    </div>
                                </div>

                                {/* Performance Row */}
                                <div className="space-y-1.5">
                                    <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">{t.fb.performanceLabel}</div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <button 
                                            onClick={() => handleInput(m, 'p', 3)} 
                                            className={`p-2.5 rounded-xl border text-xs font-bold transition-all active:scale-95 ${
                                                p === 3 
                                                    ? 'bg-green-500/10 text-green-400 border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.05)]' 
                                                    : 'bg-zinc-950 text-zinc-500 border-zinc-900 hover:border-zinc-800'
                                            }`}
                                        >
                                            {t.fb.performance[3]}
                                        </button>
                                        <button 
                                            onClick={() => handleInput(m, 'p', 2)} 
                                            className={`p-2.5 rounded-xl border text-xs font-bold transition-all active:scale-95 ${
                                                p === 2 
                                                    ? 'bg-zinc-800 text-white border-zinc-700' 
                                                    : 'bg-zinc-950 text-zinc-500 border-zinc-900 hover:border-zinc-800'
                                            }`}
                                        >
                                            {t.fb.performance[2]}
                                        </button>
                                        <button 
                                            onClick={() => handleInput(m, 'p', 1)} 
                                            className={`p-2.5 rounded-xl border text-xs font-bold transition-all active:scale-95 ${
                                                p === 1 
                                                    ? 'bg-rose-500/15 text-rose-400 border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.05)]' 
                                                    : 'bg-zinc-950 text-zinc-500 border-zinc-900 hover:border-zinc-800'
                                            }`}
                                        >
                                            {t.fb.performance[1]}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </Sheet>
    );
};
