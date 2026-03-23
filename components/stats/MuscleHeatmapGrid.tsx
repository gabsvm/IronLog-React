import React from 'react';
import { TRANSLATIONS } from '../../constants';
import { MuscleGroup } from '../../types';

interface MuscleHeatmapGridProps {
    volumeData: [string, number][]; // [muscle, count]
    lang: 'en' | 'es';
}

// RP Style Volume Landmarks mapping
const getHeatColor = (sets: number) => {
    if (sets === 0) return 'bg-zinc-800 border-zinc-700 text-zinc-500 shadow-none';
    if (sets < 6) return 'bg-yellow-900/40 border-yellow-500/30 text-yellow-500 shadow-[inset_0_0_10px_rgba(234,179,8,0.1)]';
    if (sets < 12) return 'bg-green-900/40 border-green-500/50 text-green-400 shadow-[inset_0_0_15px_rgba(34,197,94,0.1)]';
    if (sets <= 22) return 'bg-blue-900/60 border-blue-500/80 text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.3)] scale-105 z-10';
    return 'bg-red-900/80 border-red-500 text-white font-black shadow-[0_0_20px_rgba(239,68,68,0.5)] scale-110 z-20 ring-2 ring-red-500/50';
};

const MUSCLE_ORDER: MuscleGroup[] = [
    'CHEST', 'BACK', 'SHOULDERS',
    'BICEPS', 'TRICEPS', 'FOREARMS',
    'QUADS', 'HAMSTRINGS', 'GLUTES',
    'CALVES', 'ABS', 'TRAPS'
];

export const MuscleHeatmapGrid: React.FC<MuscleHeatmapGridProps> = ({ volumeData, lang }) => {
    const t = TRANSLATIONS[lang];
    const dataMap = new Map(volumeData);

    return (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {MUSCLE_ORDER.map(muscle => {
                const count = dataMap.get(muscle) || 0;
                const heatStyle = getHeatColor(count);
                const translated = t.muscle[muscle] || muscle;

                return (
                    <div
                        key={muscle}
                        className={`
                            relative flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-500
                            ${heatStyle}
                        `}
                    >
                        <span className="text-[10px] font-black uppercase tracking-wider text-center leading-tight mb-1 opacity-90">{translated}</span>
                        <span className="text-xl font-mono font-black">{count}</span>
                    </div>
                );
            })}
        </div>
    );
};
