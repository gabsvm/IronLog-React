import React from 'react';
import { SetRow } from './SetRow';
import { Icon } from '../ui/Icon';
import { SessionExercise, WorkoutSet, SetType, CardioType } from '../../types';
import { TRANSLATIONS } from '../../constants';
import { useTimerActions } from '../../context/TimerContext';
import { useStore } from '../../lib/store';
import { formatRestSeconds } from '../../utils/strongTraining';
import { resolveSetRestSeconds } from '../../utils/resolveSetRest';

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
 * Extracted from SortableExerciseCard to keep that orchestrator focused on layout.
 * Strong parity: header reads Set / Previous / unit / Reps / check.
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
    config,
    t,
    lang,
    tutorialId,
}) => {
    const h = TRANSLATIONS[lang].setsHeader;
    const showRIR = Boolean(config?.showRIR);
    // Null-safe outside a TimerProvider (isolated unit tests): real app always provides it.
    let timerActions: ReturnType<typeof useTimerActions> | null = null;
    try {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        timerActions = useTimerActions();
    } catch {
        timerActions = null;
    }
    const activeMeso = useStore((state) => state.activeMeso);
    // Strong parity: tapping a rest label starts the rest for that gap.
    const startRestFor = (set: WorkoutSet) => {
        if (!timerActions) return;
        const seconds = resolveSetRestSeconds(set, ex, config, activeMeso);
        if (!seconds || seconds <= 0) return;
        const now = Date.now();
        timerActions.setRestTimer({
            active: true,
            duration: seconds,
            timeLeft: seconds,
            endAt: now + seconds * 1000,
            source: { exerciseInstanceId: ex.instanceId, setId: set.id },
        });
    };
    const restLabelFor = (set: WorkoutSet): string | null => {
        if (!set.completed || set.skipped) return null;
        const seconds = resolveSetRestSeconds(set, ex, config, activeMeso);
        return seconds && seconds > 0 ? formatRestSeconds(seconds) : null;
    };
    const setWord = TRANSLATIONS[lang].setRow.setWord;
    const firstColLabel = isEMOM ? 'Min' : isMyorep ? 'Set' : setWord;
    const checkHead = <Icon name="Check" size={12} className="mx-auto" aria-hidden />;
    return (
    <>
        {/* Column header row */}
        {isCardio ? (
        <div data-testid="sets-header" className="grid grid-cols-[28px_60px_1fr_1fr_1fr_36px] h-9 items-center gap-1.5 border-b border-border-subtle bg-surface-raised px-2.5 text-center text-xs font-semibold uppercase tracking-wide text-muted">
                <div className={isEMOM ? 'text-cyan-400' : ''}>{firstColLabel}</div>
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
                <div>{checkHead}</div>
            </div>
        ) : ex.isIsometric ? (
        <div data-testid="sets-header" className="grid grid-cols-[28px_44px_1fr_36px] h-9 items-center gap-2 border-b border-border-subtle bg-surface-raised px-2.5 text-center text-xs font-semibold uppercase tracking-wide text-muted">
                <div>{setWord}</div>
                <div>{h.prevCol}</div>
                <div className="text-violet-400">HOLD TIME</div>
                <div>{checkHead}</div>
            </div>
        ) : ex.isBodyweight ? (
        <div data-testid="sets-header" className={`grid ${showRIR ? 'grid-cols-[28px_38px_1fr_1fr_38px_36px]' : 'grid-cols-[28px_44px_1fr_1fr_36px]'} h-9 items-center gap-2 border-b border-border-subtle bg-surface-raised px-2.5 text-center text-xs font-semibold uppercase tracking-wide text-muted`}>
                <div className={isEMOM ? 'text-cyan-400' : isMyorep ? 'text-purple-400' : isCluster ? 'text-emerald-400' : ''}>
                    {firstColLabel}
                </div>
                <div>{h.prevCol}</div>
                <div className="text-violet-400/90">+{unitLabel}</div>
                <div>{String(t.reps)}</div>
                {showRIR && <div>{String(t.rir)}</div>}
                <div>{checkHead}</div>
            </div>
        ) : (
        <div data-testid="sets-header" className={`grid ${showRIR ? 'grid-cols-[28px_52px_1fr_1fr_40px_36px]' : 'grid-cols-[28px_60px_1fr_1fr_36px]'} h-9 items-center gap-2 border-b border-border-subtle bg-surface-raised px-2.5 text-center text-xs font-semibold uppercase tracking-wide text-muted`}>
                <div className={isEMOM ? 'text-cyan-400' : isMyorep ? 'text-purple-400' : isCluster ? 'text-emerald-400' : ''}>
                    {firstColLabel}
                </div>
                <div>{h.prevCol}</div>
                <div>{unitLabel}</div>
                <div>{String(t.reps)}</div>
                {showRIR && <div>{String(t.rir)}</div>}
                <div>{checkHead}</div>
            </div>
        )}

        {/* Sets list */}
        <div className="space-y-1 px-2 py-1.5">
            {regularSets.map((set, idx) => {
                const restLabel = restLabelFor(set);
                return (
                    <React.Fragment key={set.id}>
                        <SetRow
                    set={set}
                    exInstanceId={ex.instanceId}
                    onUpdate={onSetUpdate}
                    onToggleComplete={onSetComplete}
                    onChangeType={onSetTypeChange}
                    lang={lang}
                    isCardio={isCardio}
                    isBodyweight={ex.isBodyweight}
                    isIsometric={ex.isIsometric}
                    isometricTargetSecs={ex.isIsometric ? ex.isometricTargetSecs : undefined}
                    setIndex={idx}
                    badgeLabel={setBadgeLabels[idx]}
                    tutorialId={idx === 0 ? tutorialId : undefined}
                    disableTypeChange={isSpecialProtocol}
                    isActiveProtocolSet={isEMOM && activeEmomMinute === idx + 1}
                    isNextSet={nextSetIdx === idx}
                    showRIR={showRIR}
                    unit={unit}
                />
                {restLabel !== null && (
                    <button
                        type="button"
                        onClick={() => startRestFor(set)}
                        aria-label={`${t.timer?.resting ?? 'Rest'} ${restLabel}`}
                        className="mx-auto block px-4 py-0.5 text-center text-sm font-semibold text-[rgb(var(--accent-text))]"
                    >
                        {restLabel}
                    </button>
                )}
                    </React.Fragment>
                );
            })}
        </div>
    </>
    );
});
