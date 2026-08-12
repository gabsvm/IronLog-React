import React from 'react';
import { Icon } from '../ui/Icon';
import { EMOMTimer, TabataTimer } from './ProtocolTimers';

interface Props {
    lang: 'en' | 'es';
    totalSets: number;
    isEMOM: boolean;
    isMyorep: boolean;
    isCluster: boolean;
    isGiant: boolean;
    hasTopBackoff: boolean;
    isTabata: boolean;
    isHIIT: boolean;
    onEmomMinuteChange: (m: number) => void;
}

/**
 * Per-protocol banners + timers. All props are primitives/stable callbacks, so
 * memoization prevents this subtree from re-rendering when unrelated set input
 * state changes elsewhere in the workout.
 */
export const ExerciseProtocolBanners: React.FC<Props> = React.memo(({
    lang,
    totalSets,
    isEMOM,
    isMyorep,
    isCluster,
    isGiant,
    hasTopBackoff,
    isTabata,
    isHIIT,
    onEmomMinuteChange,
}) => (
    <>
        {isEMOM && (
            <EMOMTimer totalSets={totalSets} lang={lang} onMinuteChange={onEmomMinuteChange} />
        )}
        {isMyorep && (
            <div className="flex items-center gap-2 px-2 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                <Icon name="Repeat" size={12} className="text-purple-400" />
                <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Myo-rep</span>
                <span className="text-[10px] text-purple-600 ml-0.5">
                    {lang === 'es' ? '· Serie 1 = activación' : '· Set 1 = activation'}
                </span>
                <span className="ml-auto text-[10px] text-purple-600 tabular-nums">{totalSets - 1} mini</span>
            </div>
        )}
        {isCluster && (
            <div className="flex items-center gap-2 px-2 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <Icon name="Grid3x3" size={12} className="text-emerald-400" />
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Cluster</span>
                <span className="ml-1 text-[10px] text-emerald-600">
                    {lang === 'es' ? '· ~15s entre clusters' : '· ~15s intra-set rest'}
                </span>
            </div>
        )}
        {isGiant && (
            <div className="flex items-center gap-2 px-2 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                <Icon name="Layers" size={12} className="text-orange-400" />
                <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">Giant Set</span>
                <span className="ml-1 text-[10px] text-orange-600">
                    {lang === 'es' ? '· Reps altas al fallo' : '· High reps to failure'}
                </span>
            </div>
        )}
        {hasTopBackoff && (
            <div className="flex items-center gap-1.5 px-2 py-1.5 bg-zinc-800/80 border border-zinc-700/50 rounded-xl">
                <span className="text-[9px] font-black text-red-400 bg-red-500/15 px-1.5 py-0.5 rounded">T</span>
                <Icon name="ArrowRight" size={10} className="text-zinc-600" />
                <span className="text-[9px] font-black text-blue-400 bg-blue-500/15 px-1.5 py-0.5 rounded">B</span>
                <span className="text-[10px] font-bold text-zinc-500 ml-1">
                    {lang === 'es' ? 'Top / Back-off' : 'Top / Back-off Protocol'}
                </span>
            </div>
        )}
        {isTabata && <TabataTimer totalRounds={totalSets} lang={lang} />}
        {isHIIT && (
            <div className="flex items-center gap-2 px-2 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <Icon name="Zap" size={12} className="text-amber-400" />
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">HIIT</span>
                <span className="ml-1 text-[10px] text-amber-600">
                    {lang === 'es' ? '· Intervalos alta intensidad' : '· High intensity intervals'}
                </span>
                <span className="ml-auto text-[10px] text-amber-600 tabular-nums">{totalSets}</span>
            </div>
        )}
    </>
));

ExerciseProtocolBanners.displayName = 'ExerciseProtocolBanners';
