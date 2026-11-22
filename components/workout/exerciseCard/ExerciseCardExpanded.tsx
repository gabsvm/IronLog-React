// U5: SortableExerciseCard expanded view, with 1:1 RP Note Modal, (i) detail button, real MuscleTag priority & dynamic guide pill.
import React, { useState, useCallback } from 'react';
import { Icon } from '../../ui/Icon';
import { MuscleTag } from '../../ui/MuscleTag';
import { Sheet } from '../../ui/Sheet';
import { Button } from '../../ui/Button';
import { ExerciseVolumeLine } from '../ExerciseVolumeLine';
import { ExerciseCardMenu } from '../ExerciseCardMenu';
import { ExerciseCardSets } from '../ExerciseCardSets';
import { ExerciseProtocolBanners } from '../ExerciseProtocolBanners';
import { getTranslated } from '../../../utils';
import { ALL_EQUIPMENT_IDS, getEquipmentLabel } from '../../../utils/equipment';
import { pickLang } from '../../../utils/i18n';
import { resolveMuscleLabel } from '../../../utils/muscle';
import type { EquipmentType } from '../../../types';
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
        completedCount,
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
        musclePriority,
        onMoveUp,
        onMoveDown,
        onPinNoteToLibrary,
    } = state;

    const [noteModalOpen, setNoteModalOpen] = useState(false);
    const [noteDraft, setNoteDraft] = useState('');
    const [pinToExercise, setPinToExercise] = useState(true);
    const [guideExpanded, setGuideExpanded] = useState(false);
    const [guideDismissed, setGuideDismissed] = useState(false);

    const openNoteModal = useCallback(() => {
        setNoteDraft(ex.note || ex.pinnedNote || '');
        setPinToExercise(ex.notePinned !== undefined ? Boolean(ex.notePinned) : true);
        setNoteModalOpen(true);
    }, [ex.note, ex.pinnedNote, ex.notePinned]);

    const handleSaveNote = useCallback((newNote: string, pinned: boolean) => {
        const trimmed = newNote.trim();
        setNoteModalOpen(false);
        if (onUpdateSession) {
            onUpdateSession((prev: any) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    exercises: (prev.exercises || []).map((e: any) =>
                        e.instanceId === ex.instanceId
                            ? { ...e, note: trimmed, notePinned: pinned, pinnedNote: pinned && trimmed ? trimmed : undefined }
                            : e
                    ),
                };
            });
        }
        if (onPinNoteToLibrary && ex.id) {
            onPinNoteToLibrary(ex.id, pinned && trimmed ? trimmed : undefined);
        }
    }, [ex.instanceId, ex.id, onUpdateSession, onPinNoteToLibrary]);

    const handleSkipRemainingSets = useCallback(() => {
        if (!onUpdateSession) return;
        onUpdateSession((prev: any) => {
            if (!prev) return prev;
            return {
                ...prev,
                exercises: (prev.exercises || []).map((e: any) => {
                    if (e.instanceId !== ex.instanceId) return e;
                    return {
                        ...e,
                        sets: (e.sets || []).map((s: any) => (s.completed ? s : { ...s, skipped: true })),
                    };
                }),
            };
        });
    }, [ex.instanceId, onUpdateSession]);

    const handleModifySets = useCallback((exId: number, delta: number) => {
        if (delta > 0) {
            onAddSet(exId);
        } else if (delta < 0 && sets.length > 0) {
            onDeleteSet(exId, sets[sets.length - 1].id);
        }
    }, [onAddSet, onDeleteSet, sets]);

    const targetRepsLabel = ex.targetReps ? String(ex.targetReps) : null;
    const activeNoteText = ex.note || ex.pinnedNote || '';
    const noteOrRepRange = activeNoteText || (targetRepsLabel ? `${targetRepsLabel} reps` : '8-12 reps');
    const rawEquipment = (ex as any).equipment;
    const resolvedEquip = rawEquipment
        ? (ALL_EQUIPMENT_IDS.includes(rawEquipment as EquipmentType)
            ? getEquipmentLabel(rawEquipment as EquipmentType, lang)
            : String(rawEquipment))
        : null;
    const exerciseSubtitle = resolvedEquip || ex.skillFamily || (ex.isBodyweight ? pickLang(lang, { es: 'Peso corporal', en: 'Bodyweight' }) : null);
    const hasSet1Weight = Number(sets?.[0]?.weight || 0) > 0;
    const warmupTitle = hasSet1Weight ? t.warmup : t.warmupRequiresWeight;
    const warmupAriaLabel = hasSet1Weight ? t.warmup : `${t.warmup}: ${t.warmupRequiresWeight}`;

    const isStartingWeightPhase = completedCount === 0;
    const guideTitle = isStartingWeightPhase
        ? pickLang(lang, { es: 'Cómo elegir tu peso inicial', en: 'How to choose your starting weight' })
        : pickLang(lang, { es: 'Cómo descansar antes de tu próxima serie', en: 'How to rest before your next set' });
    const guideDetail = isStartingWeightPhase
        ? pickLang(lang, {
              es: 'Elige una carga que te deje a ~3 RIR (repeticiones en reserva) con técnica limpia en el rango objetivo.',
              en: 'Pick a load that leaves ~3 reps in reserve (RIR) with crisp form across your target rep range.',
          })
        : pickLang(lang, {
              es: 'Descansa lo suficiente para que la respiración se normalice y el músculo objetivo rinda al máximo en la siguiente serie.',
              en: 'Rest until your breathing settles and the target muscle feels ready to match or beat your effort.',
          });

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
            {/* Top row: Muscle Tag (with real priority bars) + Drag handle + Protocol badges + (i) Detail & ⋮ Menu */}
            <div className="flex items-center justify-between gap-2 px-3 pt-2.5 pb-1">
                <div className="flex items-center gap-1.5 flex-wrap min-w-0">
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
                        priority={musclePriority}
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

                <div className="flex items-center gap-1 shrink-0 -mr-1">
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

                    {/* RP (i) Info / Technique & History button */}
                    <button
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation();
                            if (onOpenDetail) onOpenDetail(ex);
                        }}
                        className="relative flex h-8 w-8 items-center justify-center rounded-[4px] text-zinc-400 hover:text-white transition-colors"
                        aria-label={t.detail || 'History'}
                    >
                        <Icon name="Info" size={18} />
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
                            onNewNote={openNoteModal}
                            onMoveUp={onMoveUp}
                            onMoveDown={onMoveDown}
                            onAddSet={() => onAddSet(ex.instanceId)}
                            onSkipRemainingSets={handleSkipRemainingSets}
                            onCardioModeChange={handleCardioModeChange}
                            onInjectWarmup={handleInjectWarmup}
                            onOpenWarmup={canWarmup && onOpenWarmup && hasSet1Weight ? () => onOpenWarmup(ex.instanceId) : undefined}
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

            {/* Exercise Title row spanning full width */}
            <div className="px-3 pb-2 pt-0.5">
                <h3
                    onClick={(event) => {
                        event.stopPropagation();
                        if (onOpenDetail) onOpenDetail(ex);
                    }}
                    className="cursor-pointer truncate text-[17px] font-bold leading-snug text-white transition-colors hover:text-primary-400"
                >
                    {String(getTranslated(ex.name, lang))}
                </h3>
                {exerciseSubtitle && (
                    <div className="text-[12px] font-medium text-zinc-400 truncate mt-0.5">
                        {exerciseSubtitle}
                    </div>
                )}
            </div>

            {/* Pinned Note / Target Rep Range Banner */}
            <div className="mx-3 mb-2 flex items-center justify-between gap-2 rounded-[4px] bg-amber-500/15 border border-amber-500/30 px-2.5 py-1.5 text-[12px] font-medium text-amber-900 dark:text-amber-200/90">
                <button
                    type="button"
                    onClick={openNoteModal}
                    className="flex items-center justify-between gap-2 flex-1 min-w-0 text-left"
                >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Icon name="Edit3" size={14} className="shrink-0 text-amber-600 dark:text-amber-400" />
                        <div className="flex flex-1 min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="truncate">{noteOrRepRange}</span>
                            {heroMetric && (
                                <span className="inline-flex items-center rounded-[3px] bg-amber-500/20 border border-amber-500/35 px-1.5 py-0.5 text-[11px] font-semibold text-amber-900 dark:text-amber-200 truncate">
                                    {heroMetric.label}
                                </span>
                            )}
                        </div>
                    </div>
                    <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill={ex.notePinned ? 'currentColor' : 'none'}
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
                {activeNoteText && (
                    <button
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation();
                            handleSaveNote('', false);
                        }}
                        aria-label={pickLang(lang, { es: 'Quitar nota fijada', en: 'Unpin note' })}
                        className="shrink-0 rounded p-0.5 text-amber-400/80 hover:bg-amber-500/20 hover:text-white transition-colors"
                    >
                        <Icon name="X" size={12} />
                    </button>
                )}
            </div>

            {/* Dynamic Sky-Blue Contextual Guide Pill (RP 1:1) */}
            {!isCardio && !ex.isIsometric && !guideDismissed && (
                <div className="mx-3 mb-2 rounded-[6px] border border-sky-400/35 bg-sky-500/12 px-2.5 py-1.5 text-[12px] text-sky-300">
                    <div className="flex items-center justify-between gap-2">
                        <button
                            type="button"
                            data-testid="rp-contextual-guide-pill"
                            onClick={() => setGuideExpanded((prev) => !prev)}
                            className="flex items-center gap-1.5 flex-1 min-w-0 text-left font-semibold"
                        >
                            <Icon name="Info" size={13} className="shrink-0 text-sky-400" />
                            <span className="truncate">{guideTitle}</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setGuideDismissed(true)}
                            aria-label={pickLang(lang, { es: 'Ocultar guía', en: 'Dismiss guide' })}
                            className="shrink-0 rounded p-0.5 text-sky-300/70 hover:text-white"
                        >
                            <Icon name="X" size={12} />
                        </button>
                    </div>
                    {guideExpanded && (
                        <p className="mt-1.5 text-[12px] leading-snug text-sky-200/90">
                            {guideDetail}
                        </p>
                    )}
                </div>
            )}

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

            {/* RP 1:1 Exercise Note Sheet */}
            {noteModalOpen && (
                <Sheet
                    open={noteModalOpen}
                    onOpenChange={setNoteModalOpen}
                    title={pickLang(lang, { es: 'Nota de ejercicio', en: 'Exercise Note' })}
                    description={String(getTranslated(ex.name, lang))}
                    accent="primary"
                    footer={
                        <div className="flex gap-3">
                            <Button variant="secondary" fullWidth onClick={() => setNoteModalOpen(false)}>
                                {t.cancel}
                            </Button>
                            <Button fullWidth onClick={() => handleSaveNote(noteDraft, pinToExercise)}>
                                {pickLang(lang, { es: 'Guardar', en: 'Save' })}
                            </Button>
                        </div>
                    }
                >
                    <div className="p-4 space-y-4">
                        <textarea
                            rows={4}
                            autoFocus
                            value={noteDraft}
                            onChange={(e) => setNoteDraft(e.target.value)}
                            placeholder={pickLang(lang, { es: 'Ej: Asiento en pin 4, pausa 1s abajo…', en: 'e.g. Seat pin 4, 1s pause at bottom…' })}
                            className="w-full rounded-[8px] border border-border-subtle bg-surface-raised p-3 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-primary-500 resize-none"
                        />
                        <label className="flex items-center gap-2.5 cursor-pointer text-sm text-zinc-200">
                            <input
                                type="checkbox"
                                checked={pinToExercise}
                                onChange={(e) => setPinToExercise(e.target.checked)}
                                className="h-4 w-4 accent-primary-500 rounded"
                            />
                            <span>{pickLang(lang, { es: 'Fijar nota al ejercicio (recordar en futuras sesiones)', en: 'Pin note to exercise (carry over to future workouts)' })}</span>
                        </label>
                    </div>
                </Sheet>
            )}
        </div>
    );
};
