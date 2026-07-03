import React from 'react';
import { SetRow } from './SetRow';
import { SessionExercise, WorkoutSet, SetType, CardioType } from '../../types';

interface Props {
    ex: SessionExercise;
    regularSets: WorkoutSet[];

    // Display-state
    isCardio: boolean;
    isInterval: boolean;
    cardioMode: CardioType;
    unit: 'kg' | 'lb';
    unitLabel: string;
    isEMOM: boolean;
    isMyorep: boolean;
    isCluster: boolean;
    isSpecialProtocol: boolean;
    activeEmomMinute: number;
    nextSetIdx: number;
    setBadgeLabels: (string | undefined)[];

    // Handlers
    onSetUpdate: (exId: number, setId: number, field: string, value: any) => void;
    onSetComplete: (exId: number, setId: number) => void;
    onSetTypeChange: (exId: number, setId: number, type: SetType) => void;

    // Config/i18n
    config: any;
    stageConfig: any;
    t: any;
    lang: 'en' | 'es';
    viewMode?: 'list' | 'focus';
    tutorialId?: string;
}

/**
 * Sets section of an ExerciseCard: column header row + the list of SetRow.
 * Extracted from SortableExerciseCard to keep that orchestrator focused on layout/state.
 */
export const ExerciseCardSets: React.FC<Props> = React.memo(({
    ex,
    regularSets,
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
    config,
    stageConfig,
    t,
    lang,
    viewMode = 'list',
    tutorialId,
}) => (
    <>
        {/* Column header row */}
        <div className="grid grid-cols-12 items-center gap-2 border-b border-white/5 px-4 py-3 text-center text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">
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

        {/* Sets list */}
        <div className={`space-y-2 px-3 py-3 ${viewMode === 'focus' ? 'flex-1 overflow-y-auto' : ''}`}>
            {regularSets.map((set, idx) => (
                <SetRow
                    key={set.id}
                    set={set}
                    exInstanceId={ex.instanceId}
                    onUpdate={onSetUpdate}
                    onToggleComplete={onSetComplete}
                    onChangeType={onSetTypeChange}
                    lang={lang}
                    isCardio={isCardio}
                    isBodyweight={ex.isBodyweight}
                    isIsometric={ex.isIsometric}
                    isometricTargetSecs={ex.isIsometric ? (ex as any).isometricTargetSecs : undefined}
                    setIndex={idx}
                    badgeLabel={setBadgeLabels[idx]}
                    tutorialId={idx === 0 ? tutorialId : undefined}
                    disableTypeChange={isSpecialProtocol}
                    isActiveProtocolSet={isEMOM && activeEmomMinute === idx + 1}
                    isNextSet={nextSetIdx === idx}
                />
            ))}
        </div>
    </>
));
