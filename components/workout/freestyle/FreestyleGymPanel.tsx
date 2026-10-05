// T2: free-form gym panel, moved verbatim from components/workout/FreestyleSessionModal.tsx.
import React from 'react';
import { Icon } from '../../ui/Icon';
import type { FreestyleSessionState } from './useFreestyleSessionState';

export const FreestyleGymPanel: React.FC<{ state: FreestyleSessionState }> = ({ state }) => {
    const { discipline, f } = state;
    return (
        <>
            {discipline === 'gym' && (
                <div className="space-y-4">
                    <div className="rounded-2xl border-2 border-dashed border-zinc-200 dark:border-white/10 p-6 text-center">
                        <div className="w-14 h-14 bg-primary-500/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                            <Icon name="Dumbbell" size={28} className="text-primary-500" />
                        </div>
                        <h3 className="font-black text-zinc-900 dark:text-white mb-1">
                            {f.freeGymTitle}
                        </h3>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                            {f.freeGymDesc}
                        </p>
                    </div>
                    <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">
                            {f.duringTitle}
                        </p>
                        {[
                            f.tip1,
                            f.tip2,
                            f.tip3,
                        ].map((tip, i) => (
                            <div key={i} className="flex items-start gap-2 py-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 flex-shrink-0" />
                                <span className="text-xs text-zinc-600 dark:text-zinc-300">{tip}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
};
