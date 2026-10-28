import React from 'react';
import { SetRow } from './SetRow';
import { SessionExercise, WorkoutSet, SetType, CardioType } from '../../types';
import { TRANSLATIONS } from '../../constants';
import { pickLang } from '../../utils/i18n';

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
    onAddSet?: (id: number) => void;
    onDeleteSet?: (exId: number, setId: number) => void;
    onModifySets?: (exId: number, delta: number) => void;

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
    onAddSet,
    onDeleteSet,
    onModifySets,
    config,
    t,
    lang,
    tutorialId,
}) => {
    const h = TRANSLATIONS[lang].setsHeader;
    return (
    <>
        {/* Column header row */}
        {isCardio ? (
            <div className="grid grid-cols-[28px_44px_1fr_1fr_1fr_36px] items-center gap-1.5 border-b border-border-subtle px-2.5 py-1.5 text-center text-[10px] font-bold uppercase tracking-wider text-muted">
                <div className={isEMOM ? 'text-cyan-400' : ''}>#</div>
                <div>{h.prevCol}</div>
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
                <div>{h.prevCol}</div>
                <div className="text-violet-400">HOLD TIME</div>
                <div></div>
            </div>
        ) : (
            <div
                className={`grid ${
                    config?.showRIR
                        ? 'grid-cols-[32px_1fr_1fr_44px_44px]'
                        : 'grid-cols-[32px_1fr_1fr_44px]'
                } items-center gap-3 border-t border-b border-border-subtle/80 px-3 py-2 text-center text-[11px] font-bold uppercase tracking-wider text-zinc-400`}
            >
                <div></div>
                <div>{ex.isBodyweight ? `+${unitLabel}` : pickLang(lang, { es: 'PESO', en: 'WEIGHT' })}</div>
                <div className="flex items-center justify-center gap-1">
                    <span>REPS</span>
                    <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border border-zinc-600 text-[9px] text-zinc-400">
                        i
                    </span>
                </div>
                {config?.showRIR && <div>{String(t.rir)}</div>}
                <div>LOG</div>
            </div>
        )}

        {/* Sets list */}
        <div className="divide-y divide-border-subtle/60">
            {regularSets.map((set, idx) => (
                <SetRow
                    key={set.id}
                    set={set}
                    exInstanceId={ex.instanceId}
                    onUpdate={onSetUpdate}
                    onToggleComplete={onSetComplete}
                    onChangeType={onSetTypeChange}
                    onAddSet={onAddSet}
                    onDeleteSet={onDeleteSet}
                    onModifySets={onModifySets}
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
                    unit={unit}
                />
            ))}
        </div>
    </>
    );
});
