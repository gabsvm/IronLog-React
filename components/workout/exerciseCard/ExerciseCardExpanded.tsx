// U5: SortableExerciseCard expanded view, moved verbatim from components/workout/SortableExerciseCardImpl.tsx.
import React, { useState, useCallback } from 'react';
import { Icon } from '../../ui/Icon';
import { MuscleTag } from '../../ui/MuscleTag';
import { ExerciseVolumeLine } from '../ExerciseVolumeLine';
import { ExerciseCardMenu } from '../ExerciseCardMenu';
import { ExerciseCardSets } from '../ExerciseCardSets';
import { ExerciseProtocolBanners } from '../ExerciseProtocolBanners';
import { getTranslated } from '../../../utils';
import { pickLang } from '../../../utils/i18n';
import { resolveMuscleLabel } from '../../../utils/muscle';
import type { ExerciseCardState } from './useSortableExerciseCardState';

export const ExerciseCardExpanded: React.FC<{ state: ExerciseCardState }> = ({ state }) => {
    const {
        ex,
        onSetUpdate,
        onSetComplete,
        onSetTypeChange,
        onAddSet,
        onDeleteSet,
        onOpenDetail,
        onReplace,
        onUpdateSession,
        onOpenWarmup,
        openMenuId,
        setOpenMenuId,
        t,
        lang,
        isLinkingTarget,
        config,
        stageConfig,
        dragEnabled,
        tutorialId,
        attributes,
        listeners,
        setNodeRef,
        isDragging,
        exDoneFlash,
        activeEmomMinute,
        setActiveEmomMinute,
        style,
        sets,
        c,
        ssStyle,
        unit,
        unitLabel,
        isCardio,
        cardioMode,
        isInterval,
        regularSets,
        volumeComparison,
        allDone,
        isSuperseted,
        isLinkSource,
        canWarmup,
        isEMOM,
        isMyorep,
        isCluster,
        isGiant,
        hasTopBackoff,
        isTabata,
        isHIIT,
        isRestPause,
        isDrop,
        isTimeVolume,
        isTripleAdd,
        isSpecialProtocol,
        nextSetIdx,
        setBadgeLabels,
        handleInjectWarmup,
        canFillPrevious,
        copyFromIndex,
        handleFillFromPrevious,
        handleCopyToFollowing,
        removedSet,
        handleUndoRemoveSet,
        handleCardioModeChange,
        confirmDelete,
        handleSupersetAction,
        heroMetric,
    } = state;

    const [isEditingNote, setIsEditingNote] = useState(false);

    const handleSaveNote = useCallback((newNote: string) => {
        setIsEditingNote(false);
        if (onUpdateSession) {
            onUpdateSession((prev: any) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    exercises: (prev.exercises || []).map((e: any) =>
                        e.instanceId === ex.instanceId ? { ...e, note: newNote } : e
                    ),
                };
            });
        }
    }, [ex.instanceId, onUpdateSession]);

    const handleModifySets = useCallback((exId: number, delta: number) => {
        if (delta > 0) {
            onAddSet(exId);
        } else if (delta < 0 && sets.length > 0) {
            onDeleteSet(exId, sets[sets.length - 1].id);
        }
    }, [onAddSet, onDeleteSet, sets]);

    const targetRepsLabel = ex.targetReps ? String(ex.targetReps) : null;
    const noteOrRepRange = ex.note || (targetRepsLabel ? `${targetRepsLabel} reps` : '8-12 reps');
    const hasSet1Weight = Number(sets?.[0]?.weight || 0) > 0;
    const warmupTitle = hasSet1Weight ? t.warmup : t.warmupRequiresWeight;
    const warmupAriaLabel = hasSet1Weight ? t.warmup : `${t.warmup}: ${t.warmupRequiresWeight}`;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`
                rounded-[8px] border border-border-subtle bg-surface-raised flex flex-col overflow-visible transition-shadow
                ${ssStyle ? `border-l-4 ${ssStyle.border}` : ''}
                ${isDragging ? 'shadow-2xl ring-2 ring-red-500/20' : ''}
                ${isLinkSource ? 'ring-2 ring-amber-400/40 shadow-[0_0_0_1px_rgba(251,191,36,0.15)]' : ''}
                ${isLinkingTarget ? 'ring-2 ring-cyan-400/30 shadow-[0_0_0_1px_rgba(34,211,238,0.12)]' : ''}
                ${allDone ? 'shadow-[0_20px_50px_-24px_rgba(34,197,94,0.32)]' : ''}
            `}
        >
            {/* Top row: Muscle Tag + Drag handle + Special protocol badge */}
            <div className="flex items-center justify-between gap-2 px-3 pt-3 pb-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                    {dragEnabled && (
                        <div
                            className="mr-0.5 -ml-1 rounded-full p-1 text-zinc-500 touch-none cursor-grab active:cursor-grabbing hover:text-zinc-200"
                            {...attributes}
                            {...listeners}
                        >
                            <Icon name="GripVertical" size={15} />
                        </div>
                    )}

                    <MuscleTag
                        label={resolveMuscleLabel(ex.slotLabel || ex.muscle || 'CHEST', lang)}
                        muscle={ex.muscle || ex.slotLabel}
                    />

                    {isCardio ? (
                        <span className="inline-flex items-center rounded-[4px] border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-cyan-300">
                            {String(t.cardioModes?.[cardioMode] || cardioMode)}
                        </span>
                    ) : ex.isBodyweight ? (
                        <span className="inline-flex items-center rounded-[4px] border border-blue-500/20 bg-blue-500/10 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-blue-300">
                            BW
                        </span>
                    ) : null}

                    {isEMOM ? (
                        <span className="inline-flex items-center rounded-[4px] border border-cyan-500/30 bg-cyan-500/20 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-cyan-300">
                            EMOM
                        </span>
                    ) : isMyorep ? (
                        <span className="inline-flex items-center rounded-[4px] border border-purple-500/30 bg-purple-500/20 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-purple-300">
                            MYOREP
                        </span>
                    ) : isCluster ? (
                        <span className="inline-flex items-center rounded-[4px] border border-emerald-500/30 bg-emerald-500/20 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-emerald-300">
                            CLUSTER
                        </span>
                    ) : null}

                    {isSuperseted && (
                        <span className={`inline-flex shrink-0 items-center rounded-[4px] border px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider ${ssStyle?.badge || 'border-violet-500/20 bg-violet-500/10 text-violet-300'}`}>
                            SS
                        </span>
                    )}
                </div>
            </div>

            {/* Exercise Title + Right Action Icons (ONLY 2 visible: History + ⋮ Menu) */}
            <div className="flex items-start justify-between gap-3 px-3 pb-2 pt-0.5">
                <div className="min-w-0 flex-1">
                    <h3
                        onClick={(event) => {
                            event.stopPropagation();
                            if (onOpenDetail) onOpenDetail(ex);
                        }}
                        className="cursor-pointer truncate text-[17px] font-bold leading-snug text-white transition-colors hover:text-primary-400"
                    >
                        {String(getTranslated(ex.name, lang))}
                    </h3>
                    <div className="text-[12px] font-medium text-zinc-400 truncate mt-0.5">
                        {(ex as any).equipment || ex.skillFamily || (ex.isBodyweight ? pickLang(lang, { es: 'Peso corporal', en: 'Bodyweight' }) : pickLang(lang, { es: 'Estándar', en: 'Standard' }))}
                    </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 pt-0.5">
                    {canWarmup && onOpenWarmup && (
                        <button
                            type="button"
                            disabled={!hasSet1Weight}
                            title={warmupTitle}
                            aria-label={warmupAriaLabel}
                            onClick={(event) => {
                                event.stopPropagation();
                                if (hasSet1Weight) onOpenWarmup(ex.instanceId);
                            }}
                            className="sr-only"
                        >
                            {t.warmup}
                        </button>
                    )}

                    {/* History / Details button */}
                    <button
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation();
                            if (onOpenDetail) onOpenDetail(ex);
                        }}
                        className="relative flex h-8 w-8 items-center justify-center rounded-[4px] text-zinc-400 hover:text-white transition-colors"
                        aria-label={t.detail || 'History'}
                    >
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                            <path d="M3 3v5h5" />
                            <path d="M12 7v5l4 2" />
                        </svg>
                    </button>

                    {/* ⋮ MoreVertical menu button */}
                    <div className="relative">
                        <button
                            type="button"
                            aria-label={c.moreOptions}
                            aria-haspopup="menu"
                            aria-expanded={openMenuId === ex.instanceId}
                            onClick={(event) => {
                                event.stopPropagation();
                                setOpenMenuId(openMenuId === ex.instanceId ? null : ex.instanceId);
                            }}
                            className="relative flex h-8 w-8 items-center justify-center rounded-[4px] text-zinc-400 hover:text-white transition-colors"
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
                            onSupersetAction={handleSupersetAction}
                            onReplace={onReplace}
                            onRequestDelete={confirmDelete}
                            t={t}
                            lang={lang}
                        />
                    </div>
                </div>
            </div>

            {/* Pinned Note / Target Rep Range Banner */}
            <div className="mx-3 mb-2 flex items-center justify-between gap-2 rounded-[4px] bg-amber-500/15 border border-amber-500/30 px-2.5 py-1.5 text-[12px] font-medium text-amber-900 dark:text-amber-200/90">
                {isEditingNote ? (
                    <div className="flex items-center gap-2 w-full">
                        <Icon name="Edit3" size={14} className="shrink-0 text-amber-600 dark:text-amber-400" />
                        <input
                            type="text"
                            autoFocus
                            defaultValue={ex.note || ''}
                            placeholder={pickLang(lang, { es: 'Añadir nota...', en: 'Add note...' })}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleSaveNote((e.target as HTMLInputElement).value);
                                } else if (e.key === 'Escape') {
                                    setIsEditingNote(false);
                                }
                            }}
                            onBlur={(e) => handleSaveNote(e.target.value)}
                            className="w-full bg-transparent text-[12px] text-amber-900 dark:text-amber-100 placeholder:text-amber-600/50 dark:placeholder:text-amber-400/50 outline-none"
                        />
                        <button
                            type="button"
                            onClick={() => setIsEditingNote(false)}
                            className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider"
                        >
                            {pickLang(lang, { es: 'OK', en: 'Done' })}
                        </button>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => setIsEditingNote(true)}
                        className="flex items-center justify-between gap-2 w-full text-left"
                    >
                        <div className="flex items-center gap-2 min-w-0 flex-wrap">
                            <Icon name="Edit3" size={14} className="shrink-0 text-amber-600 dark:text-amber-400" />
                            <span className="truncate">{noteOrRepRange}</span>
                            {heroMetric && (
                                <span className="text-[11px] text-amber-800 dark:text-amber-300/90 truncate">
                                    {heroMetric.label}
                                </span>
                            )}
                        </div>
                        {/* Pushpin SVG */}
                        <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="shrink-0 text-amber-400/90"
                            aria-hidden="true"
                        >
                            <line x1="12" y1="17" x2="12" y2="22" />
                            <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Protocol Banners & Stats if any */}
            {(isEMOM || isMyorep || isCluster || isGiant || isRestPause || isDrop || isTimeVolume || isTripleAdd || hasTopBackoff || isTabata || isHIIT) && (
                <div className="px-3 mb-1.5">
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

            {volumeComparison && (
                <div className="px-3 mb-1">
                    <ExerciseVolumeLine
                        comparison={volumeComparison}
                        unit={unit}
                        unitLabel={unitLabel}
                        lang={lang}
                        labels={c.volumeLine}
                    />
                </div>
            )}

            {/* Set Table */}
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
                onAddSet={onAddSet}
                onDeleteSet={onDeleteSet}
                onModifySets={handleModifySets}
                config={config}
                stageConfig={stageConfig}
                t={t}
                lang={lang}
                tutorialId={tutorialId}
            />

            {/* Completion flash */}
            {exDoneFlash && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[8px] bg-green-500/5 ring-2 ring-green-500/60 pointer-events-none animate-in fade-in duration-150">
                    <div className="animate-bounce rounded-full bg-green-500 px-3 py-1.5 text-xs font-black text-white shadow-lg shadow-green-500/30">
                        <Icon name="CheckCircle" size={14} className="mr-1 inline" />
                        {c.done}
                    </div>
                </div>
            )}

            {/* Undo snackbar for removed set */}
            {removedSet && (
                <div className="flex items-center justify-between px-3 py-1.5 border-t border-border-subtle bg-surface-base/30 text-xs text-muted" role="status">
                    <span>{c.setRemoved}</span>
                    <button type="button" onClick={handleUndoRemoveSet} className="font-bold uppercase tracking-wider text-primary-400 active:scale-95">{c.undo}</button>
                </div>
            )}
        </div>
    );
};
