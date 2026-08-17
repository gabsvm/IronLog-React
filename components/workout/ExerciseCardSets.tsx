import React from 'react';
import { SetRow } from './SetRow';
import { SessionExercise, WorkoutSet, SetType, CardioType } from '../../types';

interface Props {
    ex: SessionExercise;
    regularSets: WorkoutSet[];
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
    onSetUpdate: (exId: number, setId: number, field: string, value: any) => void;
    onSetComplete: (exId: number, setId: number) => void;
    onSetTypeChange: (exId: number, setId: number, type: SetType) => void;
    config: any;
    stageConfig: any;
    t: any;
    lang: 'en' | 'es';
    tutorialId?: string;
}

const headerLabel = 'text-center text-[9px] font-bold uppercase tracking-[0.12em] text-[rgb(var(--text-muted))]';

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
}) => {
    const previousLabel = lang === 'es' ? 'Anterior' : 'Previous';
    const showRIR = !!config?.showRIR && !isCardio && !ex.isIsometric;

    return (
        <div className="gainslab-set-table border-t border-[rgb(var(--border-subtle)/0.72)]">
            {isCardio ? (
                <div className="grid grid-cols-[34px_1fr_1fr_64px_40px] items-center gap-2 px-2 py-2">
                    <div className={headerLabel}>{isEMOM ? 'Min' : '#'}</div>
                    <div className={headerLabel}>{isInterval ? String(t.cardioWork) : String(t.cardioTime)}</div>
                    <div className={headerLabel}>{isInterval ? String(t.cardioRest) : String(t.cardioDist)}</div>
                    <div className={headerLabel}>{isInterval ? String(t.cardioRounds) : String(t.cardioSpeed)}</div>
                    <div />
                </div>
            ) : ex.isIsometric ? (
                <div className="grid grid-cols-[34px_minmax(72px,0.8fr)_minmax(130px,1.8fr)_40px] items-center gap-2 px-2 py-2">
                    <div className={headerLabel}>#</div>
                    <div className={headerLabel}>{previousLabel}</div>
                    <div className={`${headerLabel} text-violet-400`}>{lang === 'es' ? 'Tiempo' : 'Hold'}</div>
                    <div />
                </div>
            ) : ex.isBodyweight ? (
                <div className={`grid ${showRIR ? 'grid-cols-[32px_minmax(68px,1fr)_minmax(48px,.72fr)_48px_42px_38px]' : 'grid-cols-[34px_minmax(76px,1.15fr)_minmax(58px,0.8fr)_52px_40px]'} items-center gap-2 px-2 py-2`}>
                    <div className={headerLabel}>{isMyorep ? 'Set' : '#'}</div>
                    <div className={headerLabel}>{previousLabel}</div>
                    <div className={headerLabel}>{String(t.reps)}</div>
                    <div className={`${headerLabel} text-violet-400/75`}>+KG</div>
                    {showRIR && <div className={headerLabel}>RIR</div>}
                    <div />
                </div>
            ) : (
                <div className={`grid ${showRIR ? 'grid-cols-[32px_minmax(70px,1.1fr)_minmax(52px,.78fr)_minmax(48px,.72fr)_42px_38px]' : 'grid-cols-[34px_minmax(78px,1.2fr)_minmax(60px,0.85fr)_minmax(54px,0.75fr)_40px]'} items-center gap-2 px-2 py-2`}>
                    <div className={`${headerLabel} ${isEMOM ? 'text-cyan-500' : isMyorep ? 'text-purple-500' : isCluster ? 'text-emerald-500' : ''}`}>
                        {isEMOM ? 'Min' : isMyorep ? 'Set' : '#'}
                    </div>
                    <div className={headerLabel}>{previousLabel}</div>
                    <div className={headerLabel}>{unitLabel}</div>
                    <div className={headerLabel}>{String(t.reps)}</div>
                    {showRIR && <div className={headerLabel}>RIR</div>}
                    <div />
                </div>
            )}

            <div className="divide-y divide-[rgb(var(--border-subtle)/0.56)] border-t border-[rgb(var(--border-subtle)/0.5)]">
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
                        cardioMode={cardioMode}
                        isBodyweight={ex.isBodyweight}
                        isIsometric={ex.isIsometric}
                        isometricTargetSecs={ex.isIsometric ? (ex as any).isometricTargetSecs : undefined}
                        setIndex={idx}
                        badgeLabel={setBadgeLabels[idx]}
                        tutorialId={idx === 0 ? tutorialId : undefined}
                        disableTypeChange={isSpecialProtocol}
                        isActiveProtocolSet={isEMOM && activeEmomMinute === idx + 1}
                        isNextSet={nextSetIdx === idx}
                        showRIR={showRIR}
                    />
                ))}
            </div>
        </div>
    );
});
