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
    tutorialId,
}) => (
    <>
        {/* Column header row */}
        {isCardio ? (
            <div className="grid grid-cols-[28px_44px_1fr_1fr_1fr_36px] items-center gap-1.5 border-b border-border-subtle px-2.5 py-1.5 text-center text-[10px] font-bold uppercase tracking-wider text-muted">
                <div className={isEMOM ? 'text-cyan-400' : ''}>#</div>
                <div>{lang === 'es' ? 'Ant.' : 'Prev'}</div>
                {isInterval ? (
                    <>
                        <div className="text-green-400">{String(t.cardioWork)}</div>
                        <div className="text-blue-400">{String(t.cardioRest)}</div>
                        <div>{String(t.cardioRounds)}</div>
                    </>
                ) : (
                    <>
                        <div>{String(t.cardioTime)}</div>
                        <div>{String(t.cardioDist)}</div>
                        <div>{String(t.cardioSpeed)}</div>
                    </>
                )}
                <div></div>
            </div>
        ) : ex.isIsometric ? (
            <div className="grid grid-cols-[28px_44px_1fr_36px] items-center gap-2 border-b border-border-subtle px-2.5 py-1.5 text-center text-[10px] font-bold uppercase tracking-wider text-muted">
                <div>#</div>
                <div>{lang === 'es' ? 'Ant.' : 'Prev'}</div>
                <div className="text-violet-400">HOLD TIME</div>
                <div></div>
            </div>
        ) : ex.isBodyweight ? (
            <div className={`grid ${config?.showRIR ? 'grid-cols-[28px_38px_1fr_1fr_38px_36px]' : 'grid-cols-[28px_44px_1fr_1fr_36px]'} items-center gap-2 border-b border-border-subtle px-2.5 py-1.5 text-center text-[10px] font-bold uppercase tracking-wider text-muted`}>
                <div className={isEMOM ? 'text-cyan-400' : isMyorep ? 'text-purple-400' : isCluster ? 'text-emerald-400' : ''}>
                    {isEMOM ? 'Min' : isMyorep ? 'Set' : '#'}
                </div>
                <div>{lang === 'es' ? 'Ant.' : 'Prev'}</div>
                <div className="text-violet-400/90">+KG</div>
                <div>{String(t.reps)}</div>
                {config?.showRIR && <div>{String(t.rir)}</div>}
                <div></div>
            </div>
        ) : (
            <div className={`grid ${config?.showRIR ? 'grid-cols-[28px_38px_1fr_1fr_38px_36px]' : 'grid-cols-[28px_44px_1fr_1fr_36px]'} items-center gap-2 border-b border-border-subtle px-2.5 py-1.5 text-center text-[10px] font-bold uppercase tracking-wider text-muted`}>
                <div className={isEMOM ? 'text-cyan-400' : isMyorep ? 'text-purple-400' : isCluster ? 'text-emerald-400' : ''}>
                    {isEMOM ? 'Min' : isMyorep ? 'Set' : '#'}
                </div>
                <div>{lang === 'es' ? 'Ant.' : 'Prev'}</div>
                <div>{`${String(t.weight)} (${unitLabel})`}</div>
                <div>{String(t.reps)}</div>
                {config?.showRIR && <div>{String(t.rir)}</div>}
                <div></div>
            </div>
        )}

        {/* Sets list */}
        <div className="space-y-1.5 px-2 py-2">
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
                    showRIR={Boolean(config?.showRIR)}
                />
            ))}
        </div>
    </>
));
