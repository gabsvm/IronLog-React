// U5: SortableExerciseCard expanded view, moved verbatim from components/workout/SortableExerciseCardImpl.tsx.
import React from 'react';
import { Icon } from '../../ui/Icon';
import { MuscleTag } from '../MuscleTag';
import { ExerciseCardStats } from '../ExerciseCardStats';
import { ExerciseCardMenu } from '../ExerciseCardMenu';
import { ExerciseCardSets } from '../ExerciseCardSets';
import { ExerciseProtocolBanners } from '../ExerciseProtocolBanners';
import { getTranslated } from '../../../utils';
import { resolveMuscleLabel } from '../../../utils/muscle';
import { TRANSLATIONS } from '../../../constants';
import type { ExerciseCardState } from './useSortableExerciseCardState';

export const ExerciseCardExpanded: React.FC<{ state: ExerciseCardState }> = ({ state }) => {
    const { ex, onSetUpdate, onSetComplete, onSetTypeChange, onAddSet, onDeleteSet, onOpenDetail, onLink, onReplace, onOpenWarmup, openMenuId, setOpenMenuId, t, lang, isLinkingTarget, config, stageConfig, dragEnabled, tutorialId, onToggleExpand, attributes, listeners, setNodeRef, transition, isDragging, exDoneFlash, activeEmomMinute, setActiveEmomMinute, style, sets, c, ssStyle, unit, unitLabel, isCardio, cardioMode, isInterval, regularSets, completedCount, allDone, isSuperseted, isLinkSource, canWarmup, isEMOM, isMyorep, isCluster, isGiant, hasTopBackoff, isTabata, isHIIT, isRestPause, isDrop, isTimeVolume, isTripleAdd, isSpecialProtocol, nextSetIdx, setBadgeLabels, handleInjectWarmup, handleCardioModeChange, confirmDelete, handleSupersetAction, heroMetric } = state;
    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`
                card-reference flex flex-col overflow-hidden transition-shadow
                ${ssStyle ? `border-l-4 ${ssStyle.border}` : ''}
                ${isDragging ? 'shadow-2xl ring-2 ring-red-500/20' : ''}
                ${isLinkSource ? 'ring-2 ring-amber-400/40 shadow-[0_0_0_1px_rgba(251,191,36,0.15)]' : ''}
                ${isLinkingTarget ? 'ring-2 ring-cyan-400/30 shadow-[0_0_0_1px_rgba(34,211,238,0.12)]' : ''}
                ${allDone ? 'shadow-[0_20px_50px_-24px_rgba(34,197,94,0.32)]' : ''}
            `}
        >
            <div className="border-b border-border-subtle bg-surface-elevated/40 px-3 pb-2 pt-2">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-1">
                            {dragEnabled && (
                                <div
                                    className="mr-0.5 -ml-2 rounded-full p-1 text-zinc-500 touch-none cursor-grab active:cursor-grabbing hover:text-zinc-200"
                                    {...attributes}
                                    {...listeners}
                                >
                                    <Icon name="GripVertical" size={15} />
                                </div>
                            )}

                            <MuscleTag label={resolveMuscleLabel(ex.slotLabel || ex.muscle || 'CHEST', lang)} />

                            {isCardio ? (
                                <span className="inline-flex items-center rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.16em] text-cyan-300">
                                    {String(t.cardioModes?.[cardioMode] || cardioMode)}
                                </span>
                            ) : ex.targetReps ? (
                                <span className="inline-flex items-center rounded-full border border-zinc-700/70 bg-zinc-900/70 px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.16em] text-zinc-300">
                                    {String(ex.targetReps)} Reps
                                </span>
                            ) : null}

                            {ex.isBodyweight && (
                                <span className="inline-flex items-center rounded-full border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.16em] text-blue-300">
                                    BW
                                </span>
                            )}

                        </div>

                        <div className="flex items-center gap-2 min-w-0">
                            <h3
                                onClick={(event) => {
                                    event.stopPropagation();
                                    if (onOpenDetail) onOpenDetail(ex);
                                }}
                                className="cursor-pointer truncate pl-0.5 text-[1.06rem] font-black leading-none tracking-[-0.04em] text-white transition-colors hover:text-primary-400"
                            >
                                {String(getTranslated(ex.name, lang))}
                            </h3>
                            {isSuperseted && (
                                <span className={`inline-flex shrink-0 items-center rounded-full border px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.16em] ${ssStyle?.badge || 'border-violet-500/20 bg-violet-500/10 text-violet-300'}`}>
                                    SS
                                </span>
                            )}
                        </div>

                        {((heroMetric && !allDone) || isLinkSource || isLinkingTarget) && (
                            <div className="flex flex-wrap items-center gap-1 pl-0.5">
                                {heroMetric && !allDone && (
                                    <div className={`inline-flex max-w-full items-center gap-1 rounded-full px-1 py-0.5 text-[9px] font-semibold ${heroMetric.tone}`}>
                                        <Icon name={heroMetric.icon} size={10} />
                                        <span className="truncate">{heroMetric.label}</span>
                                    </div>
                                )}

                                {isLinkSource && (
                                    <button
                                        type="button"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            onLink(null);
                                        }}
                                        className="inline-flex items-center gap-1 rounded-full border border-amber-400/20 bg-amber-500/10 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-amber-200 transition-colors hover:bg-amber-500/15"
                                    >
                                        <Icon name="Link" size={10} />
                                        <span>{c.pickPair}</span>
                                    </button>
                                )}

                                {isLinkingTarget && (
                                    <button
                                        type="button"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            handleSupersetAction();
                                        }}
                                        className="inline-flex items-center gap-1 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-cyan-200 transition-colors hover:bg-cyan-500/15"
                                    >
                                        <Icon name="Link" size={10} />
                                        <span>{c.pairHere}</span>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-1.5">
                        {onOpenWarmup && canWarmup && (() => {
                            const firstSetWeight = Number(ex.sets?.[0]?.weight || 0);
                            const hasFirstSetWeight = firstSetWeight > 0;
                            return (
                                <button
                                    id={tutorialId ? 'tut-warmup-btn' : undefined}
                                    type="button"
                                    disabled={!hasFirstSetWeight}
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        if (hasFirstSetWeight) {
                                            onOpenWarmup(ex.instanceId);
                                        }
                                    }}
                                    className={`flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${
                                        hasFirstSetWeight
                                            ? 'border-zinc-700/80 bg-zinc-900/80 text-amber-400 hover:border-amber-400/60 hover:bg-zinc-800'
                                            : 'border-zinc-800 bg-zinc-900/40 text-zinc-600 opacity-50 cursor-not-allowed'
                                    }`}
                                    title={hasFirstSetWeight ? t.warmup : t.warmupRequiresWeight}
                                    aria-label={hasFirstSetWeight ? t.warmup : `${t.warmup}: ${t.warmupRequiresWeight}`}
                                    aria-disabled={!hasFirstSetWeight}
                                >
                                    <Icon name="Zap" size={15} />
                                </button>
                            );
                        })()}

                        <button
                            type="button"
                            onClick={(event) => {
                                event.stopPropagation();
                                handleSupersetAction();
                            }}
                            className={`flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${isSuperseted ? 'border-violet-500/30 bg-violet-500/15 text-violet-200' : isLinkSource ? 'border-amber-400/30 bg-amber-500/15 text-amber-200' : 'border-zinc-700/80 bg-zinc-900/80 text-zinc-400 hover:border-zinc-500/70 hover:bg-zinc-800 hover:text-white'}`}
                            aria-label={isSuperseted ? TRANSLATIONS[lang].cardMenu.unlink : TRANSLATIONS[lang].cardMenu.link}
                        >
                            <Icon name={isSuperseted ? 'Unlink' : 'Link'} size={15} />
                        </button>

                        <div className="relative">
                            <button
                                aria-label={c.moreOptions}
                                aria-haspopup="menu"
                                aria-expanded={openMenuId === ex.instanceId}
                                onClick={(event) => {
                                    event.stopPropagation();
                                    setOpenMenuId(openMenuId === ex.instanceId ? null : ex.instanceId);
                                }}
                                className={`flex h-8 w-8 items-center justify-center rounded-full border transition-colors duration-fast ease-natural ${openMenuId === ex.instanceId ? 'border-zinc-500/70 bg-zinc-800 text-white' : 'border-zinc-700/80 bg-zinc-900/80 text-zinc-400 hover:border-zinc-500/70 hover:bg-zinc-800 hover:text-white'}`}
                            >
                                <Icon name="MoreVertical" size={18} />
                            </button>

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
                                onSupersetAction={handleSupersetAction}
                                onReplace={onReplace}
                                onRequestDelete={confirmDelete}
                                t={t}
                                lang={lang}
                            />
                        </div>

                        {onToggleExpand && (
                            <button
                                type="button"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    onToggleExpand(ex.instanceId);
                                }}
                                className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-700/80 bg-zinc-900/80 text-zinc-400 hover:border-zinc-500/70 hover:bg-zinc-800 hover:text-white transition-colors"
                                aria-label={c.collapse}
                            >
                                <Icon name="ChevronUp" size={17} />
                            </button>
                        )}
                    </div>
                </div>

                <div className="mt-2">
                    {(isEMOM || isMyorep || isCluster || isGiant || isRestPause || isDrop || isTimeVolume || isTripleAdd || hasTopBackoff || isTabata || isHIIT) && (
                        <div className="mb-1.5">
                            <ExerciseProtocolBanners
                                lang={lang}
                                totalSets={regularSets.length}
                                isEMOM={isEMOM}
                                isMyorep={isMyorep}
                                isCluster={isCluster}
                                isGiant={isGiant}
                                isRestPause={isRestPause}
                                isDrop={isDrop}
                                isTimeVolume={isTimeVolume}
                                isTripleAdd={isTripleAdd}
                                hasTopBackoff={hasTopBackoff}
                                isTabata={isTabata}
                                isHIIT={isHIIT}
                                onEmomMinuteChange={setActiveEmomMinute}
                            />
                        </div>
                    )}
                    <ExerciseCardStats
                        completedCount={completedCount}
                        totalSets={regularSets.length}
                    />
                </div>

            </div>

            <ExerciseCardSets
                ex={ex}
                regularSets={regularSets}
                isCardio={isCardio}
                isInterval={isInterval}
                cardioMode={cardioMode}
                unit={unit}
                unitLabel={unitLabel}
                isEMOM={isEMOM}
                isMyorep={isMyorep}
                isCluster={isCluster}
                isSpecialProtocol={isSpecialProtocol}
                activeEmomMinute={activeEmomMinute}
                nextSetIdx={nextSetIdx}
                setBadgeLabels={setBadgeLabels}
                onSetUpdate={onSetUpdate}
                onSetComplete={onSetComplete}
                onSetTypeChange={onSetTypeChange}
                config={config}
                stageConfig={stageConfig}
                t={t}
                lang={lang}
                tutorialId={tutorialId}
            />

            {exDoneFlash && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[1.35rem] bg-green-500/5 ring-2 ring-green-500/60 pointer-events-none animate-in fade-in duration-150">
                    <div className="animate-bounce rounded-full bg-green-500 px-3 py-1.5 text-xs font-black text-white shadow-lg shadow-green-500/30">
                        <Icon name="CheckCircle" size={14} className="mr-1 inline" />
                        {c.done}
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between px-3 py-2 border-t border-border-subtle bg-surface-base/30 text-xs text-muted">
                <button
                    type="button"
                    onClick={() => sets.length > 0 && onDeleteSet(ex.instanceId, sets[sets.length - 1].id)}
                    disabled={sets.length <= 1}
                    className="flex items-center gap-1.5 py-1 text-muted transition-colors hover:text-red-400 active:scale-95 disabled:opacity-25"
                >
                    <Icon name="Minus" size={13} /> {String(t.removeSetBtn)}
                </button>
                <button
                    type="button"
                    onClick={() => onAddSet(ex.instanceId)}
                    className="flex items-center gap-1.5 py-1 text-primary-400 font-semibold transition-colors hover:text-primary-300 active:scale-95"
                >
                    <Icon name="Plus" size={13} /> {t.addSetBtn}
                </button>
            </div>
        </div>
    );
};
