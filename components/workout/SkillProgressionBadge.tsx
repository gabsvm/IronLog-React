
import React, { useMemo } from 'react';
import { Icon } from '../ui/Icon';
import { getSkillProgressionInfo, getSkillReadyToProgress } from '../../data/SkillProgressionMap';
import { SessionExercise, WorkoutSet } from '../../types';

interface SkillProgressionBadgeProps {
    exercise: SessionExercise;
    lang: 'en' | 'es';
}

// Compute best performance for the current session (reps or hold time)
const getBestSessionValue = (sets: WorkoutSet[], isIsometric: boolean): number | null => {
    const completedSets = sets.filter(s => s.completed && s.type !== 'warmup');
    if (completedSets.length === 0) return null;

    if (isIsometric) {
        // For isometrics, best = max duration in seconds
        const maxDuration = Math.max(...completedSets.map(s => Number(s.duration) || 0));
        return maxDuration > 0 ? maxDuration : null;
    } else {
        // For bodyweight reps, best = max reps in one set
        const maxReps = Math.max(...completedSets.map(s => Number(s.reps) || 0));
        return maxReps > 0 ? maxReps : null;
    }
};

export const SkillProgressionBadge: React.FC<SkillProgressionBadgeProps> = ({ exercise, lang }) => {
    if (!exercise.skillFamily) return null;

    const progressionInfo = useMemo(
        () => getSkillProgressionInfo(exercise.id),
        [exercise.id]
    );

    if (!progressionInfo) return null;

    const { family, currentLevel, nextLevel } = progressionInfo;
    const isIsometric = !!exercise.isIsometric;

    const bestValue = getBestSessionValue(exercise.sets || [], isIsometric);
    const isReadyToProgress = getSkillReadyToProgress(exercise.id, bestValue);

    const familyColor = family.color; // e.g. 'bg-violet-500'
    // Map bg-X-500 to text-X-400 for display
    const colorMap: Record<string, { text: string; bg: string; ring: string }> = {
        'bg-violet-500': { text: 'text-violet-400', bg: 'bg-violet-500/10', ring: 'ring-violet-500/30' },
        'bg-blue-500': { text: 'text-blue-400', bg: 'bg-blue-500/10', ring: 'ring-blue-500/30' },
        'bg-amber-500': { text: 'text-amber-400', bg: 'bg-amber-500/10', ring: 'ring-amber-500/30' },
        'bg-emerald-500': { text: 'text-emerald-400', bg: 'bg-emerald-500/10', ring: 'ring-emerald-500/30' },
        'bg-rose-500': { text: 'text-rose-400', bg: 'bg-rose-500/10', ring: 'ring-rose-500/30' },
        'bg-cyan-500': { text: 'text-cyan-400', bg: 'bg-cyan-500/10', ring: 'ring-cyan-500/30' },
    };
    const colors = colorMap[familyColor] ?? { text: 'text-zinc-400', bg: 'bg-zinc-500/10', ring: 'ring-zinc-500/30' };

    const familyName = lang === 'es' ? family.name.es : family.name.en;
    const currentName = lang === 'es' ? currentLevel.name.es : currentLevel.name.en;

    return (
        <div className="px-3 pt-2 pb-1">
            {/* Skill Family Banner */}
            <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl ${colors.bg} ring-1 ${colors.ring}`}>
                <Icon name={family.icon as any} size={12} className={colors.text} />
                <span className={`text-[9px] font-black uppercase tracking-widest ${colors.text}`}>
                    {familyName}
                </span>
                <span className="text-[9px] text-zinc-600 mx-1">·</span>
                <span className={`text-[10px] font-bold ${colors.text} truncate flex-1`}>
                    {currentName}
                </span>

                {/* Level Dots */}
                <div className="flex items-center gap-0.5 shrink-0">
                    {family.levels.map((lvl) => (
                        <div
                            key={lvl.level}
                            className={`w-1.5 h-1.5 rounded-full transition-all ${
                                lvl.level <= currentLevel.level
                                    ? familyColor + ' shadow-sm'
                                    : 'bg-zinc-700'
                            }`}
                        />
                    ))}
                </div>
            </div>

            {/* Ready to Progress Banner */}
            {isReadyToProgress && nextLevel && (
                <div className="mt-1.5 flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-green-500/10 ring-1 ring-green-500/25 animate-pulse-slow">
                    <Icon name="TrendingUp" size={11} className="text-green-400 shrink-0" />
                    <span className="text-[9px] font-black text-green-400 uppercase tracking-wider">
                        {lang === 'es' ? '¡Listo para avanzar!' : 'Ready to progress!'}
                    </span>
                    <span className="text-[9px] text-zinc-500 truncate">
                        → {lang === 'es' ? nextLevel.name.es : nextLevel.name.en}
                    </span>
                </div>
            )}

            {/* Next Level Hint (if not yet ready) */}
            {!isReadyToProgress && nextLevel?.unlockAt && (
                <div className="mt-1 flex items-center gap-1.5 px-2.5">
                    <Icon name="Target" size={10} className="text-zinc-600 shrink-0" />
                    <span className="text-[9px] text-zinc-600 truncate">
                        {lang === 'es' ? 'Siguiente: ' : 'Next: '}
                        <span className="font-bold text-zinc-500">
                            {nextLevel.unlockAt.value}{nextLevel.unlockAt.unit === 'sec' ? 's' : ' reps'}
                        </span>
                        {' '}{lang === 'es' ? 'para' : 'to reach'}{' '}
                        {lang === 'es' ? nextLevel.name.es : nextLevel.name.en}
                    </span>
                </div>
            )}
        </div>
    );
};
