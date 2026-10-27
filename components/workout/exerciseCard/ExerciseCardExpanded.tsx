// U5: SortableExerciseCard expanded view, moved verbatim from components/workout/SortableExerciseCardImpl.tsx.
import React, { useState } from 'react';
import { Icon } from '../../ui/Icon';
import { Sheet } from '../../ui/Sheet';
import { ExerciseVolumeLine } from '../ExerciseVolumeLine';
import { ExerciseCardMenu } from '../ExerciseCardMenu';
import { ExerciseCardSets } from '../ExerciseCardSets';
import { ExerciseProtocolBanners } from '../ExerciseProtocolBanners';
import { getTranslated } from '../../../utils';
import type { ExerciseCardState } from './useSortableExerciseCardState';
import { formatRestSeconds } from '../../../utils/strongTraining';
import { resolveSetRestSeconds } from '../../../utils/resolveSetRest';
import { useStore } from '../../../lib/store';
const REST_PRESET_OPTIONS = [60, 90, 120, 180] as const;

const NoteEditorSheet: React.FC<{
    title: string;
    initial: string;
    saveLabel: string;
    cancelLabel: string;
    placeholder: string;
    onSave: (text: string) => void;
    onClose: () => void;
}> = ({ title, initial, saveLabel, cancelLabel, placeholder, onSave, onClose }) => {
    const [draft, setDraft] = useState(initial);
    return (
        <Sheet open onOpenChange={(open) => { if (!open) onClose(); }} title={title} accent="primary">
            <div className="space-y-3 p-4">
                <textarea
                    autoFocus
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder={placeholder}
                    rows={4}
                    className="w-full rounded-[20px] border border-border-subtle bg-surface-raised px-3.5 py-3 text-sm text-[rgb(var(--text-primary))] outline-none transition-all placeholder:text-muted focus:border-primary-500"
                />
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="min-h-[48px] flex-1 rounded-full bg-surface-elevated text-sm font-bold text-[rgb(var(--text-secondary))] active:scale-98"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        onClick={() => onSave(draft)}
                        className="min-h-[48px] flex-1 rounded-full bg-primary-500 text-sm font-bold text-zinc-950 active:scale-98"
                    >
                        {saveLabel}
                    </button>
                </div>
            </div>
        </Sheet>
    );
};

const RestEditorSheet: React.FC<{
    title: string;
    secondsLabel: string;
    saveLabel: string;
    cancelLabel: string;
    current: number;
    fallback: number;
    onSave: (seconds: number) => void;
    onClose: () => void;
}> = ({ title, secondsLabel, saveLabel, cancelLabel, current, fallback, onSave, onClose }) => {
    const [draft, setDraft] = useState(String(current > 0 ? current : fallback));
    return (
        <Sheet open onOpenChange={(open) => { if (!open) onClose(); }} title={title} accent="primary">
            <div className="space-y-3 p-4">
                <div className="grid grid-cols-4 gap-2">
                    {REST_PRESET_OPTIONS.map((preset) => (
                        <button
                            key={preset}
                            type="button"
                            onClick={() => setDraft(String(preset))}
                            className={`min-h-[48px] rounded-[10px] text-sm font-bold tabular-nums transition-colors active:scale-95 ${Number(draft) === preset ? 'bg-primary-500 text-zinc-950' : 'bg-surface-elevated text-[rgb(var(--text-primary))]'}`}
                        >
                            {preset}s
                        </button>
                    ))}
                </div>
                <label className="block text-xs font-semibold text-muted">
                    {secondsLabel}
                    <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={600}
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        className="mt-1 h-11 w-full rounded-[10px] bg-surface-raised px-3 text-center text-base font-semibold text-[rgb(var(--text-primary))] outline-none focus:border-primary-500"
                    />
                </label>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="min-h-[48px] flex-1 rounded-full bg-surface-elevated text-sm font-bold text-[rgb(var(--text-secondary))] active:scale-98"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        onClick={() => onSave(Number(draft))}
                        className="min-h-[48px] flex-1 rounded-full bg-primary-500 text-sm font-bold text-zinc-950 active:scale-98"
                    >
                        {saveLabel}
                    </button>
                </div>
            </div>
        </Sheet>
    );
};
export const ExerciseCardExpanded: React.FC<{ state: ExerciseCardState }> = ({ state }) => {
    const { ex, onSetUpdate, onSetComplete, onSetTypeChange, onAddSet, onDeleteSet, onOpenDetail, onLink, onReplace, onOpenWarmup, openMenuId, setOpenMenuId, t, lang, isLinkingTarget, config, stageConfig, dragEnabled, tutorialId, attributes, listeners, setNodeRef, isDragging, exDoneFlash, activeEmomMinute, setActiveEmomMinute, style, sets, c, ssStyle, unit, unitLabel, isCardio, cardioMode, isInterval, regularSets, volumeComparison, allDone, isLinkSource, canWarmup, isEMOM, isMyorep, isCluster, isGiant, hasTopBackoff, isTabata, isHIIT, isRestPause, isDrop, isTimeVolume, isTripleAdd, isSpecialProtocol, nextSetIdx, setBadgeLabels, handleInjectWarmup, canFillPrevious, copyFromIndex, handleFillFromPrevious, handleCopyToFollowing, removedSet, handleRemoveLastSet, handleUndoRemoveSet, handleCardioModeChange, confirmDelete, handleSupersetAction, heroMetric, workDensity, handleToggleProgressionMode, onStartRest, restPresetSeconds, editingNote, setEditingNote, editingRest, setEditingRest, handleEditNote, handleSaveNote, handleEditRest, handleSaveRest } = state;
    const restSeconds = ex.defaultRestSeconds && ex.defaultRestSeconds > 0 ? ex.defaultRestSeconds : (restPresetSeconds ?? 90);
    const restLabel = `${Math.floor(restSeconds / 60)}:${String(restSeconds % 60).padStart(2, '0')}`;
    // Below-band wrapper carries px-4/pb-3/pt-2: skip it entirely when every inner
    // block is empty so no 20px strip renders (inner empty:hidden alone can't
    // collapse the outer padding).
    const hasBelowBand = Boolean(((heroMetric && !allDone) || isLinkSource || isLinkingTarget)
        || isEMOM || isMyorep || isCluster || isGiant || isRestPause || isDrop || isTimeVolume || isTripleAdd || hasTopBackoff || isTabata || isHIIT
        || (allDone && volumeComparison) || (allDone && workDensity && workDensity.densityRate > 0));
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
                                    if (onStartRest) onStartRest(restSeconds, ex.instanceId);
                                }}
                                className="relative flex h-[28px] min-w-[40px] shrink-0 items-center gap-1 rounded-md bg-surface-elevated px-2 text-[13px] font-bold tabular-nums text-[rgb(var(--text-primary))] transition-colors after:absolute after:-inset-2 after:content-[''] hover:bg-surface-elevated/80 active:scale-95"
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
                                    className={`relative flex h-8 w-8 after:absolute after:-inset-[6px] after:content-[''] items-center justify-center rounded-full border transition-colors ${
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
                                className={`relative flex h-8 w-8 after:absolute after:-inset-[6px] after:content-[''] items-center justify-center rounded-full border transition-colors duration-fast ease-natural ${openMenuId === ex.instanceId ? 'border-zinc-500/70 bg-zinc-800 text-white' : 'border-zinc-700/80 bg-zinc-900/80 text-zinc-400 hover:border-zinc-500/70 hover:bg-zinc-800 hover:text-white'}`}
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
                                onEditNote={handleEditNote}
                                onInjectWarmup={handleInjectWarmup}
                                onEditRest={handleEditRest}
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
                {ex.stickyNote && (
                    <div className="flex items-start gap-2 border-b border-amber-500/20 bg-amber-500/10 px-4 py-2">
                        <Icon name="FileText" size={13} className="mt-0.5 shrink-0 text-amber-800 dark:text-amber-300" />
                        <p className="min-w-0 flex-1 whitespace-pre-wrap text-xs leading-relaxed text-amber-900 dark:text-amber-100/90">{ex.stickyNote}</p>
                    </div>
                )}
                {ex.note && (
                    <p className="px-4 pb-2 text-xs text-muted">{ex.note}</p>
                )}
                {hasBelowBand && (<div className="px-4 pb-3 pt-2">
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
                </div>)}
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
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-none bg-green-500/5 ring-2 ring-green-500/60 pointer-events-none animate-in fade-in duration-150">
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
                    <Icon name="Plus" size={14} /> {t.addSetBtn}{(() => {
                        const secs = resolveSetRestSeconds({ type: 'regular' }, ex, config, useStore.getState().activeMeso);
                        return secs && secs > 0 ? ` (${formatRestSeconds(secs)})` : '';
                    })()}
                </button>
            </div>
            {editingNote !== null && (
                <NoteEditorSheet
                    title={editingNote === 'sticky' ? t.cardMenu.addStickyNote : t.cardMenu.addNote}
                    initial={editingNote === 'sticky' ? (ex.stickyNote ?? '') : (ex.note ?? '')}
                    saveLabel={t.save}
                    cancelLabel={t.cancel}
                    placeholder={t.logWeight.notePlaceholder}
                    onSave={handleSaveNote}
                    onClose={() => setEditingNote(null)}
                />
            )}
            {editingRest && (
                <RestEditorSheet
                    title={t.restPreset.title}
                    secondsLabel={t.restPreset.seconds}
                    saveLabel={t.save}
                    cancelLabel={t.cancel}
                    current={ex.defaultRestSeconds ?? 0}
                    fallback={restPresetSeconds ?? 90}
                    onSave={handleSaveRest}
                    onClose={() => setEditingRest(false)}
                />
            )}
        </div>
    );
};
