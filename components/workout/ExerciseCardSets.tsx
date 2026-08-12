import React from 'react';
import { SetRow } from './SetRow';
import { AVTRoundCard } from './AVTRoundCard';
import { SessionExercise, WorkoutSet, SetType, CardioType } from '../../types';

interface AVTRound {
    roundId: number;
    hops: WorkoutSet[];
}

interface Props {
    ex: SessionExercise;
    regularSets: WorkoutSet[];
    avtRounds: AVTRound[];
    isAVTExercise: boolean;
    isCardio: boolean;
    isInterval: boolean;
    cardioMode: CardioType;
    unit: 'kg' | 'lb' | 'pl';
    unitLabel: string;
    isEMOM: boolean;
    isMyorep: boolean;
    isCluster: boolean;
    isSpecialProtocol: boolean;
    activeEmomMinute: number;
    nextSetIdx: number;
    setBadgeLabels: (string | undefined)[];
    onSetUpdate: (exId: number, setId: number, field: string, value: any) => void;
    onSetComplete: (exId: number, setId: number) => void;
    onSetTypeChange: (exId: number, setId: number, type: SetType) => void;
    onMarkLastHop: (exId: number, setId: number) => void;
    onAddHopToRound: (exId: number, roundId: number) => void;
    config: any;
    stageConfig: any;
    t: any;
    lang: 'en' | 'es';
    viewMode?: 'list' | 'focus';
    tutorialId?: string;
}

/**
 * Hot workout subtree. Memoization is valuable here because untouched exercise
 * cards keep stable set-array references. SetRow also receives the original
 * onSetTypeChange callback directly instead of a fresh inline closure per row.
 */
export const ExerciseCardSets: React.FC<Props> = React.memo(({
    ex,
    regularSets,
    avtRounds,
    isAVTExercise,
    isCardio,
    isInterval,
    cardioMode,
    unit,
    unitLabel,
    isEMOM,
    isMyorep,
    isCluster,
    isSpecialProtocol,
    activeEmomMinute,
    nextSetIdx,
    setBadgeLabels,
    onSetUpdate,
    onSetComplete,
    onSetTypeChange,
    onMarkLastHop,
    onAddHopToRound,
    config,
    stageConfig,
    t,
    lang,
    viewMode = 'list',
    tutorialId,
}) => {
    const stageRIR = stageConfig?.rir !== null ? String(stageConfig?.rir) : '-';

    return (
        <>
            <div className="grid grid-cols-12 gap-2 px-2 py-2 bg-zinc-50 dark:bg-black/20 border-b border-zinc-100 dark:border-white/5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-center items-center">
                <div className={`col-span-2 ${isEMOM ? 'text-cyan-500' : isMyorep ? 'text-purple-500' : isCluster ? 'text-emerald-500' : ''}`}>
                    {isEMOM ? 'Min' : isMyorep ? 'Set' : '#'}
                </div>
                {isCardio ? (
                    isInterval ? (
                        <>
                            <div className="col-span-4 pl-2 text-left text-green-600 dark:text-green-400">{String(t.cardioWork)}</div>
                            <div className="col-span-4 text-blue-500 dark:text-blue-400">{String(t.cardioRest)}</div>
                            <div className="col-span-2">{String(t.cardioRounds)}</div>
                        </>
                    ) : (
                        <>
                            <div className="col-span-4 text-center">{String(t.cardioTime)}</div>
                            <div className="col-span-4 text-center">{String(t.cardioDist)}</div>
                            <div className="col-span-2 text-center">{String(t.cardioSpeed)}</div>
                        </>
                    )
                ) : ex.isIsometric ? (
                    <>
                        <div className="col-span-6 text-center text-violet-400">
                            {lang === 'es' ? '⏱ TIEMPO DE HOLD' : '⏱ HOLD TIME'}
                        </div>
                        <div className="col-span-2"></div>
                    </>
                ) : ex.isBodyweight ? (
                    <>
                        <div className="col-span-6 text-center">{String(t.reps)}</div>
                        <div className="col-span-2 text-center text-violet-400/60">+KG</div>
                    </>
                ) : (
                    <>
                        <div className="col-span-4 text-center">{`${String(t.weight)} (${unitLabel})`}</div>
                        <div className="col-span-4 text-center">{String(t.reps)}</div>
                        {config.showRIR ? <div className="col-span-2 text-center">{String(t.rir)}</div> : <div className="col-span-2" />}
                    </>
                )}
                <div className="col-span-2"></div>
            </div>

            <div className={`divide-y divide-zinc-100 dark:divide-white/5 ${viewMode === 'focus' ? 'overflow-y-auto flex-1' : ''}`}>
                {regularSets.map((set, idx) => (
                    <SetRow
                        key={set.id}
                        set={set}
                        exInstanceId={ex.instanceId}
                        unit={unit}
                        unitLabel={unitLabel}
                        plateWeight={ex.plateWeight}
                        showRIR={config.showRIR || isCardio}
                        stageRIR={stageRIR}
                        onUpdate={onSetUpdate}
                        onToggleComplete={onSetComplete}
                        onChangeType={onSetTypeChange}
                        lang={lang}
                        isCardio={isCardio}
                        cardioMode={cardioMode}
                        isBodyweight={ex.isBodyweight}
                        isIsometric={ex.isIsometric}
                        isometricTargetSecs={ex.isIsometric ? ex.isometricTargetSecs : undefined}
                        setIndex={idx}
                        badgeLabel={setBadgeLabels[idx]}
                        tutorialId={idx === 0 ? tutorialId : undefined}
                        disableTypeChange={isSpecialProtocol}
                        isActiveProtocolSet={isEMOM && activeEmomMinute === idx + 1}
                        isNextSet={nextSetIdx === idx}
                    />
                ))}

                {isAVTExercise && avtRounds.map((round, idx) => (
                    <AVTRoundCard
                        key={round.roundId}
                        roundId={round.roundId}
                        hops={round.hops}
                        roundNumber={idx + 1}
                        exInstanceId={ex.instanceId}
                        unit={unitLabel}
                        onUpdate={onSetUpdate}
                        onToggleComplete={onSetComplete}
                        onMarkLastHop={onMarkLastHop}
                        onAddHop={onAddHopToRound}
                    />
                ))}
            </div>
        </>
    );
});

ExerciseCardSets.displayName = 'ExerciseCardSets';
