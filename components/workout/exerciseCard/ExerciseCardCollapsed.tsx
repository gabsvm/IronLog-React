import React from 'react';
import { Icon } from '../../ui/Icon';
import { MuscleTag } from '../MuscleTag';
import { ExerciseCardMenu } from '../ExerciseCardMenu';
import { getTranslated } from '../../../utils';
import { resolveMuscleLabel } from '../../../utils/muscle';
import { isWorkingSet } from '../../../utils/workoutProgress';
import type { ExerciseCardState } from './useSortableExerciseCardState';

export const ExerciseCardCollapsed: React.FC<{ state: ExerciseCardState }> = ({ state }) => {
    const {
        ex,
        onOpenDetail,
        onReplace,
        openMenuId,
        setOpenMenuId,
        t,
        lang,
        onToggleExpand,
        setNodeRef,
        isDragging,
        style,
        c,
        ssStyle,
        isCardio,
        cardioMode,
        isSuperseted,
        isLinkSource,
        isLinkingTarget,
        onLink,
        handleInjectWarmup,
        handleEditNote,
        handleEditRest,
        handleCardioModeChange,
        confirmDelete,
        handleSupersetAction,
        sets,
        allDone,
        heroMetric,
    } = state;

    return (
        <div
            ref={setNodeRef}
            style={style}
            onClick={() => {
                if (isLinkingTarget) {
                    handleSupersetAction();
                } else {
                    onToggleExpand?.(ex.instanceId);
                }
            }}
            className={`card-reference cursor-pointer p-3 transition-all duration-200 hover:border-zinc-500/60 ${
                ssStyle ? `border-l-4 ${ssStyle.border}` : ''
            } ${isDragging ? 'shadow-2xl' : ''} ${
                isLinkingTarget
                    ? 'ring-2 ring-cyan-400 bg-cyan-500/10 border-cyan-400/40 shadow-[0_0_16px_rgba(34,211,238,0.2)]'
                    : isLinkSource
                    ? 'ring-2 ring-amber-400 bg-amber-500/10 border-amber-400/40'
                    : ''
            }`}
        >
            <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <MuscleTag label={resolveMuscleLabel(ex.slotLabel || ex.muscle || 'CHEST', lang)} />
                        {isCardio ? (
                            <span className="chip-reference text-cyan-300">
                                {String(t.cardioModes?.[cardioMode] || cardioMode)}
                            </span>
                        ) : ex.targetReps ? (
                            <span className="chip-reference text-zinc-300">
                                {String(ex.targetReps)} Reps
                            </span>
                        ) : null}
                        {ex.isBodyweight && (
                            <span className="chip-reference text-blue-300">
                                BW
                            </span>
                        )}
                        {isLinkingTarget && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-cyan-400/40 bg-cyan-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-300 animate-pulse">
                                <Icon name="Link" size={10} />
                                {c.pairHere}
                            </span>
                        )}
                        {isLinkSource && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                                <Icon name="Link" size={10} />
                                {c.pickPair}
                            </span>
                        )}
                    </div>
                    <div className="mt-1 flex items-center gap-2 min-w-0">
                        <h3 className="truncate text-[15px] font-semibold text-white">
                            {String(getTranslated(ex.name, lang))}
                        </h3>
                        {isSuperseted && (
                            <span className="chip-reference text-violet-300 shrink-0 text-[9px] px-1.5 py-0.5 font-bold">
                                SS
                            </span>
                        )}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted">
                        <span>
                            {(() => {
                                const working = sets.filter(s => isWorkingSet(s));
                                const totalCount = working.length > 0 ? working.length : sets.length;
                                const completedCount = working.length > 0
                                    ? working.filter(s => s.completed).length
                                    : sets.filter(s => s.completed).length;
                                return `${completedCount}/${totalCount} ${c.setsLower}`;
                            })()}
                        </span>
                        {allDone && (
                            <span className="text-primary-400 font-semibold flex items-center gap-1">
                                <Icon name="Check" size={12} strokeWidth={3} />
                                {c.done}
                            </span>
                        )}
                    </div>
                    {heroMetric && !allDone && (
                        <div className="mt-1.5">
                            <span className={`chip-reference ${heroMetric.tone}`}>
                                <Icon name={heroMetric.icon} size={11} />
                                {heroMetric.label}
                            </span>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    {isLinkingTarget ? (
                        <button
                            type="button"
                            onClick={(event) => {
                                event.stopPropagation();
                                handleSupersetAction();
                            }}
                            className="flex h-9 items-center gap-1 rounded-full border border-cyan-400/50 bg-cyan-500/20 px-3 text-xs font-bold text-cyan-200 shadow-sm transition-all hover:bg-cyan-500/30"
                            aria-label={c.pairHere}
                        >
                            <Icon name="Link" size={14} />
                            <span>{c.pairHere}</span>
                        </button>
                    ) : isLinkSource ? (
                        <button
                            type="button"
                            onClick={(event) => {
                                event.stopPropagation();
                                onLink(null);
                            }}
                            className="flex h-8 items-center gap-1 rounded-full border border-amber-400/30 bg-amber-500/15 px-2.5 text-xs font-semibold text-amber-200"
                        >
                            <Icon name="X" size={13} />
                        </button>
                    ) : (
                        <>
                            <button
                                type="button"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    setOpenMenuId(openMenuId === ex.instanceId ? null : ex.instanceId);
                                }}
                                className="relative flex h-8 w-8 after:absolute after:-inset-1 after:content-[''] items-center justify-center rounded-full text-zinc-400 hover:text-white"
                                aria-label={c.moreOptions}
                            >
                                <Icon name="MoreVertical" size={16} />
                            </button>
                            <div className="flex h-8 w-8 items-center justify-center text-zinc-400">
                                <Icon name="ChevronDown" size={18} />
                            </div>
                        </>
                    )}
                </div>
            </div>
            <ExerciseCardMenu
                ex={ex}
                isOpen={openMenuId === ex.instanceId}
                onClose={() => setOpenMenuId(null)}
                isCardio={isCardio}
                cardioMode={cardioMode}
                hasSuperset={!!ssStyle}
                isLinking={isLinkSource}
                onOpenDetail={onOpenDetail}
                onCardioModeChange={handleCardioModeChange}
                onInjectWarmup={handleInjectWarmup}
                onEditNote={handleEditNote}
                onEditRest={handleEditRest}
                onFillFromPrevious={state.handleFillFromPrevious}
                onCopyToFollowing={state.handleCopyToFollowing}
                onSupersetAction={handleSupersetAction}
                onReplace={onReplace}
                onRequestDelete={confirmDelete}
                t={t}
                lang={lang}
            />
        </div>
    );
};
