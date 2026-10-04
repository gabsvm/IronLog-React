import React from 'react';
import { Icon } from '../ui/Icon';
import { EMOMTimer, TabataTimer } from './ProtocolTimers';
import { TRANSLATIONS } from '../../constants';

interface Props {
    lang: 'en' | 'es';
    totalSets: number;
    isEMOM: boolean;
    isMyorep: boolean;
    isCluster: boolean;
    isGiant: boolean;
    isRestPause: boolean;
    isDrop: boolean;
    isTimeVolume: boolean;
    isTripleAdd: boolean;
    hasTopBackoff: boolean;
    isTabata: boolean;
    isHIIT: boolean;
    onEmomMinuteChange: (m: number) => void;
}

export const ExerciseProtocolBanners: React.FC<Props> = ({
    lang,
    totalSets,
    isEMOM,
    isMyorep,
    isCluster,
    isGiant,
    isRestPause,
    isDrop,
    isTimeVolume,
    isTripleAdd,
    hasTopBackoff,
    isTabata,
    isHIIT,
    onEmomMinuteChange,
}) => {
    const b = TRANSLATIONS[lang].protocolBanners;
    return (
    <>
        {isEMOM && (
            <EMOMTimer totalSets={totalSets} lang={lang} onMinuteChange={onEmomMinuteChange} />
        )}
        {isMyorep && (
            <div className="flex items-center gap-2 rounded-xl border border-purple-500/20 bg-purple-500/10 px-2 py-1.5">
                <Icon name="Repeat" size={12} className="text-purple-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Myo-rep</span>
                <span className="ml-0.5 text-[10px] text-purple-600">
                    {b.myorep}
                </span>
                <span className="ml-auto text-[10px] tabular-nums text-purple-600">{totalSets - 1} mini</span>
            </div>
        )}
        {isCluster && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-2 py-1.5">
                <Icon name="Grid3x3" size={12} className="text-emerald-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Cluster</span>
                <span className="ml-1 text-[10px] text-emerald-600">
                    {b.cluster}
                </span>
            </div>
        )}
        {isGiant && (
            <div className="flex items-center gap-2 rounded-xl border border-orange-500/20 bg-orange-500/10 px-2 py-1.5">
                <Icon name="Layers" size={12} className="text-orange-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400">Giant Set</span>
                <span className="ml-1 text-[10px] text-orange-600">
                    {b.giant}
                </span>
            </div>
        )}
        {isRestPause && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-2 py-1.5">
                <Icon name="Pause" size={12} className="text-rose-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">Rest Pause</span>
                <span className="ml-1 text-[10px] text-rose-600">
                    {b.restPause}
                </span>
            </div>
        )}
        {isDrop && (
            <div className="flex items-center gap-2 rounded-xl border border-teal-500/20 bg-teal-500/10 px-2 py-1.5">
                <Icon name="TrendingDown" size={12} className="text-teal-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400">Drop Set</span>
                <span className="ml-1 text-[10px] text-teal-600">
                    {b.drop}
                </span>
            </div>
        )}
        {isTimeVolume && (
            <div className="flex items-center gap-2 rounded-xl border border-sky-500/20 bg-sky-500/10 px-2 py-1.5">
                <Icon name="Timer" size={12} className="text-sky-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400">Time Volume</span>
                <span className="ml-1 text-[10px] text-sky-600">
                    {b.timeVolume}
                </span>
            </div>
        )}
        {isTripleAdd && (
            <div className="flex items-center gap-2 rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-2 py-1.5">
                <Icon name="Layers" size={12} className="text-indigo-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Triple Add</span>
                <span className="ml-1 text-[10px] text-indigo-600">
                    {b.tripleAdd}
                </span>
            </div>
        )}
        {hasTopBackoff && (
            <div className="flex items-center gap-1.5 rounded-xl border border-zinc-700/50 bg-zinc-800/80 px-2 py-1.5">
                <span className="rounded bg-red-500/15 px-1.5 py-0.5 text-[9px] font-black text-red-400">T</span>
                <Icon name="ArrowRight" size={10} className="text-zinc-600" />
                <span className="rounded bg-blue-500/15 px-1.5 py-0.5 text-[9px] font-black text-blue-400">B</span>
                <span className="ml-1 text-xs font-bold text-muted">
                    {b.topBackoff}
                </span>
            </div>
        )}
        {isTabata && <TabataTimer totalRounds={totalSets} lang={lang} />}
        {isHIIT && (
            <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-2 py-1.5">
                <Icon name="Zap" size={12} className="text-amber-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">HIIT</span>
                <span className="ml-1 text-[10px] text-amber-600">
                    {b.hiit}
                </span>
                <span className="ml-auto text-[10px] tabular-nums text-amber-600">{totalSets}</span>
            </div>
        )}
    </>
    );
};
