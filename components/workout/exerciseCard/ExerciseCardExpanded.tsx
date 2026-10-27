// U5: SortableExerciseCard expanded view, moved verbatim from components/workout/SortableExerciseCardImpl.tsx.
import React from 'react';
import { Icon } from '../../ui/Icon';
import { ExerciseVolumeLine } from '../ExerciseVolumeLine';
import { ExerciseCardMenu } from '../ExerciseCardMenu';
import { ExerciseCardSets } from '../ExerciseCardSets';
import { ExerciseProtocolBanners } from '../ExerciseProtocolBanners';
import { getTranslated } from '../../../utils';
import type { ExerciseCardState } from './useSortableExerciseCardState';

export const ExerciseCardExpanded: React.FC<{ state: ExerciseCardState }> = ({ state }) => {
    const { ex, onSetUpdate, onSetComplete, onSetTypeChange, onAddSet, onDeleteSet, onOpenDetail, onLink, onReplace, onOpenWarmup, openMenuId, setOpenMenuId, t, lang, isLinkingTarget, config, stageConfig, dragEnabled, tutorialId, attributes, listeners, setNodeRef, isDragging, exDoneFlash, activeEmomMinute, setActiveEmomMinute, style, sets, c, ssStyle, unit, unitLabel, isCardio, cardioMode, isInterval, regularSets, volumeComparison, allDone, isLinkSource, canWarmup, isEMOM, isMyorep, isCluster, isGiant, hasTopBackoff, isTabata, isHIIT, isRestPause, isDrop, isTimeVolume, isTripleAdd, isSpecialProtocol, nextSetIdx, setBadgeLabels, handleInjectWarmup, canFillPrevious, copyFromIndex, handleFillFromPrevious, handleCopyToFollowing, removedSet, handleRemoveLastSet, handleUndoRemoveSet, handleCardioModeChange, confirmDelete, handleSupersetAction, heroMetric, workDensity, handleToggleProgressionMode, onStartRest, restPresetSeconds } = state;
    const restSeconds = ex.defaultRestSeconds && ex.defaultRestSeconds > 0 ? ex.defaultRestSeconds : (restPresetSeconds ?? 90);
    const restLabel = `${Math.floor(restSeconds / 60)}:${String(restSeconds % 60).padStart(2, '0')}`;
    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`
                card-strong expressive-reveal flex flex-col ${state.isMenuOpen ? 'overflow-visible' : 'overflow-hidden'} transition-shadow
                ${ssStyle ? `border-l-4 ${ssStyle.border}` : ''}
                ${isDragging ? 'shadow-2xl ring-2 ring-red-500/20' : ''}
                ${isLinkSource ? 'ring-2 ring-amber-400/40 shadow-[0_0_0_1px_rgba(251,191,36,0.15)]' : ''}
                ${isLinkingTarget ? 'ring-2 ring-cyan-400/30 shadow-[0_0_0_1px_rgba(34,211,238,0.12)]' : ''}
                ${allDone ? 'shadow-[0_20px_50px_-24px_rgba(34,197,94,0.32)]' : ''}
            `}
        >
            <div className="border-b border-border-subtle">
                <div className="flex min-h-[48px] items-center gap-2 bg-surface-raised px-4">
                            {dragEnabled && (
                                <div
                                    className="-ml-2 rounded-full p-1 text-zinc-500 touch-none cursor-grab active:cursor-grabbing hover:text-zinc-200"
                                    {...attributes}
                                    {...listeners}
                                >
                                    <Icon name="GripVertical" size={15} />
                                </div>
                            )}
                            {/* Muscle, target and type labels live in the rail, the set rows and the detail view. */}
                            <h3 className="min-w-0 flex-1 text-[17px] font-semibold leading-tight tracking-tight text-[rgb(var(--text-primary))]">
                                <button
                                    type="button"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        if (onOpenDetail) onOpenDetail(ex);
                                    }}
                                    className="text-left transition-colors hover:text-[rgb(var(--accent-text))]"
                                >
                                    {String(getTranslated(ex.name, lang))}
                                </button>
                            </h3>
                            <button
                                type="button"
                                data-testid="exercise-rest-chip"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    if (onStartRest) onStartRest(restSeconds);
                                }}
                                className="relative flex h-[28px] min-w-[40px] shrink-0 items-center gap-1 rounded-md bg-surface-elevated px-2 text-[13px] font-bold tabular-nums text-white transition-colors after:absolute after:-inset-2 after:content-[''] hover:bg-surface-elevated/80 active:scale-95"
                            >
                                <Icon name="Timer" size={13} />
                                <span>{restLabel}</span>
                            </button>

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
                                    className={`relative flex h-8 w-8 after:absolute after:-inset-1 after:content-[''] items-center justify-center rounded-full border transition-colors ${
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

                        <div className="relative">
                            <button
                                aria-label={c.moreOptions}
                                aria-haspopup="menu"
                                aria-expanded={openMenuId === ex.instanceId}
                                onClick={(event) => {
                                    event.stopPropagation();
                                    setOpenMenuId(openMenuId === ex.instanceId ? null : ex.instanceId);
                                }}
                                className={`relative flex h-8 w-8 after:absolute after:-inset-1 after:content-[''] items-center justify-center rounded-full border transition-colors duration-fast ease-natural ${openMenuId === ex.instanceId ? 'border-zinc-500/70 bg-zinc-800 text-white' : 'border-zinc-700/80 bg-zinc-900/80 text-zinc-400 hover:border-zinc-500/70 hover:bg-zinc-800 hover:text-white'}`}
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
                                onFillFromPrevious={canFillPrevious ? handleFillFromPrevious : undefined}
                                onCopyToFollowing={copyFromIndex >= 0 ? handleCopyToFollowing : undefined}
                                onRemoveLastSet={handleRemoveLastSet}
                                canRemoveLastSet={sets.length > 1}
                                onSupersetAction={handleSupersetAction}
                                onReplace={onReplace}
                                onRequestDelete={confirmDelete}
                                onToggleProgressionMode={handleToggleProgressionMode}
                                t={t}
                                lang={lang}
                            />
                        </div>
                </div>
                {ex.note && (
                    <p className="px-4 pb-2 text-xs text-muted">{ex.note}</p>
                )}
                <div className="px-4 pb-3 pt-2">
                        {((heroMetric && !allDone) || isLinkSource || isLinkingTarget) && (
                            <div className="flex flex-wrap items-center gap-1 pl-0.5">
                                {heroMetric && !allDone && (
                                    <div className={`inline-flex max-w-full items-start gap-1 rounded-full px-1 py-0.5 text-xs font-semibold ${heroMetric.tone}`}>
                                        <Icon name={heroMetric.icon} size={12} className="mt-0.5 shrink-0" />
                                        <span>{heroMetric.label}</span>
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
                <div className="empty:hidden">
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
                    {allDone && volumeComparison && (
                        <div className="mt-2">
                            <ExerciseVolumeLine comparison={volumeComparison} unit={unit} unitLabel={unitLabel} lang={lang} labels={c.volumeLine} />
                        </div>
                    )}
                    {allDone && workDensity && workDensity.densityRate > 0 && (
                        <div className="mt-1 flex items-center justify-between gap-2 px-0.5 text-xs tabular-nums text-muted" data-testid="exercise-density-line">
                            <span className="flex items-center gap-1.5">
                                <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                                    ex.progressionMode === 'density' ? 'bg-amber-500/15 text-amber-400' : 'bg-surface-elevated text-secondary'
                                }`}>
                                    <Icon name="Zap" size={10} />
                                    {ex.progressionMode === 'density' ? (t.progression?.densityBadge || 'Densidad') : 'Ritmo'}
                                </span>
                                <span className="font-bold text-white">
                                    {Math.round(workDensity.densityRate)} {ex.isBodyweight ? 'reps/min' : `${unitLabel.toLowerCase()}/min`}
                                </span>
                            </span>
                            {workDensity.comparison ? (
                                <span className={workDensity.comparison.percentChange >= 0 ? 'font-bold text-green-500' : 'text-muted'}>
                                    {c.volumeLine.vsPrevious.replace('{delta}', `${workDensity.comparison.percentChange >= 0 ? '+' : ''}${workDensity.comparison.percentChange}%`)}
                                </span>
                            ) : null}
                        </div>
                    )}
                </div>
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

            {removedSet && (
                <div className="flex items-center justify-between px-3 py-1.5 border-t border-border-subtle bg-surface-base/30 text-xs text-muted" role="status">
                    <span>{c.setRemoved}</span>
                    <button type="button" onClick={handleUndoRemoveSet} className="font-bold text-primary-400 active:scale-95">{c.undo}</button>
                </div>
            )}

            <div className="flex items-center justify-center border-t border-border-subtle px-3 py-1">
                <button
                    type="button"
                    onClick={() => onAddSet(ex.instanceId)}
                    className="flex min-h-[48px] w-full items-center justify-center gap-1.5 text-sm font-semibold text-[rgb(var(--accent-text))] transition-colors hover:opacity-80 active:scale-95"
                >
                    <Icon name="Plus" size={14} /> {t.addSetBtn}
                </button>
            </div>
        </div>
    );
};
