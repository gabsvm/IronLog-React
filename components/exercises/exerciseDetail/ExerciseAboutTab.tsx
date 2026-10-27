import React from 'react';
import type { ExerciseDef, Lang, VolumeCountingMode } from '../../../types';
import { TRANSLATIONS } from '../../../constants';
import { getTranslated } from '../../../utils';
import { Icon } from '../../ui/Icon';
import { AppleExerciseMotion } from '../AppleExerciseMotion';
import { CURATED_ILLUSTRATION_OPTIONS } from '../../../constants/exerciseIllustrationsMap';
import type { ExerciseDetailStrings } from './exerciseDetailStrings';
import type { ExerciseHistoryEntry } from './exerciseDetailData';

interface ExerciseAboutTabProps {
    exercise: ExerciseDef;
    lang: Lang;
    labels: ExerciseDetailStrings;
    youtubeUrl: string;
    volumeCountingMode: VolumeCountingMode;
    onVolumeCountingModeChange: (mode: VolumeCountingMode) => void;
    illustrationId: string;
    onIllustrationIdChange: (id: string) => void;
    restSeconds: string;
    onRestSecondsChange: (value: string) => void;
    onClearRest: () => void;
    sessionsCount: number;
    lastEntry: ExerciseHistoryEntry | null;
    bestEntry: ExerciseHistoryEntry | null;
    bestSetText: string | null;
    lastDateText: string | null;
}

// About: technique guide + history reference strip + per-exercise
// preferences. Every preference maps to an existing ExerciseDef field
// (volumeCountingMode, illustrationId, defaultRestSeconds) so persistence
// and back-compat need no schema change.
export const ExerciseAboutTab: React.FC<ExerciseAboutTabProps> = ({
    exercise,
    lang,
    labels,
    youtubeUrl,
    volumeCountingMode,
    onVolumeCountingModeChange,
    illustrationId,
    onIllustrationIdChange,
    restSeconds,
    onRestSecondsChange,
    onClearRest,
    sessionsCount,
    lastEntry,
    bestEntry,
    bestSetText,
    lastDateText,
}) => {
    const t = TRANSLATIONS[lang];
    const copy = TRANSLATIONS[lang].copy.exerciseDetailModal;
    const translatedInstructions = getTranslated(exercise.instructions, lang);
    const showReference = sessionsCount > 0 && (lastEntry || bestEntry);

    return (
        <>
            {/* Apple Fitness+ Style Biomechanic Motion */}
            <div className="mt-3 px-1">
                <AppleExerciseMotion
                    exercise={{ ...exercise, illustrationId: illustrationId || undefined }}
                    lang={lang}
                    youtubeUrl={youtubeUrl}
                />
            </div>

            {/* History reference strip */}
            <div className="px-5 pt-4">
                <div className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-elevated)/0.5)] p-4">
                    <h4 className="text-xs font-black uppercase tracking-[0.14em] text-muted">
                        {labels.refTitle}
                    </h4>
                    {showReference ? (
                        <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                            <div>
                                <div className="text-lg font-black tabular-nums text-[rgb(var(--text-primary))]">{sessionsCount}</div>
                                <div className="text-[11px] font-bold uppercase tracking-wider text-muted">{labels.refSessions}</div>
                            </div>
                            <div>
                                <div className="truncate text-lg font-black text-[rgb(var(--text-primary))]">{lastDateText ?? '—'}</div>
                                <div className="text-[11px] font-bold uppercase tracking-wider text-muted">{labels.refLast}</div>
                            </div>
                            <div>
                                <div className="truncate text-lg font-black tabular-nums text-[rgb(var(--text-primary))]">{bestSetText ?? '—'}</div>
                                <div className="text-[11px] font-bold uppercase tracking-wider text-muted">{labels.refBest}</div>
                            </div>
                        </div>
                    ) : (
                        <p className="mt-2 text-sm italic text-muted">{labels.refNever}</p>
                    )}
                </div>
            </div>

            {/* Instructions & Tip */}
            <div className="p-5 space-y-5">
                <div>
                    <h4 className="text-sm font-bold tracking-tight text-[rgb(var(--text-primary))] mb-3 flex items-center gap-2">
                        <Icon name="FileText" size={13} /> {t.instructions}
                    </h4>
                    <div className="text-sm text-[rgb(var(--text-secondary))] leading-relaxed">
                        {translatedInstructions && translatedInstructions !== 'Unknown' ? (
                            <p>{String(translatedInstructions)}</p>
                        ) : (
                            <p className="italic text-muted">{t.noData}</p>
                        )}
                    </div>
                </div>

                <div className="rounded-2xl border border-primary-500/15 bg-primary-500/10 p-4">
                    <div className="flex gap-3">
                        <div className="bg-primary-500/20 p-1.5 rounded-lg h-fit shrink-0">
                            <Icon name="Info" size={16} className="text-primary-400" />
                        </div>
                        <div className="text-sm text-[rgb(var(--text-secondary))]">
                            <p className="font-bold mb-1 text-primary-700 dark:text-primary-300">{t.executionTipTitle}</p>
                            <p className="opacity-70 text-xs leading-relaxed">{t.executionTipText}</p>
                        </div>
                    </div>
                </div>

                {exercise.muscle !== 'CARDIO' && (
                    <div>
                        <h4 className="text-sm font-bold tracking-tight text-[rgb(var(--text-primary))] mb-3 flex items-center gap-2">
                            <Icon name="Dumbbell" size={13} /> {copy.tonnageCalculation}
                        </h4>
                        <div className="space-y-2">
                            <button type="button" aria-pressed={volumeCountingMode === 'total'} onClick={() => onVolumeCountingModeChange('total')} className={`min-h-[56px] w-full rounded-xl border p-3 text-left transition-colors ${volumeCountingMode === 'total' ? 'border-primary-500 bg-primary-500/10' : 'border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-elevated)/0.5)]'}`}>
                                <span className="block text-sm font-bold text-[rgb(var(--text-primary))]">{copy.recordedTotal1}</span>
                                <span className="mt-1 block text-xs text-muted">{copy.forBarsBilateralMachines}</span>
                            </button>
                            <button type="button" aria-pressed={volumeCountingMode === 'per_side'} onClick={() => onVolumeCountingModeChange('per_side')} className={`min-h-[56px] w-full rounded-xl border p-3 text-left transition-colors ${volumeCountingMode === 'per_side' ? 'border-primary-500 bg-primary-500/10' : 'border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-elevated)/0.5)]'}`}>
                                <span className="block text-sm font-bold text-[rgb(var(--text-primary))]">{copy.perSide2}</span>
                                <span className="mt-1 block text-xs text-muted">{copy.whenYouRecordLoad}</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Per-exercise rest override (maps to ExerciseDef.defaultRestSeconds). */}
                <div>
                    <h4 className="text-sm font-bold tracking-tight text-[rgb(var(--text-primary))] mb-3 flex items-center gap-2">
                        <Icon name="Timer" size={13} /> {labels.restTitle}
                    </h4>
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            inputMode="numeric"
                            min={0}
                            value={restSeconds}
                            onChange={e => onRestSecondsChange(e.target.value)}
                            placeholder={labels.restPlaceholder}
                            aria-label={labels.restTitle}
                            className="gl-input font-medium tabular-nums"
                        />
                        <span className="shrink-0 text-xs font-bold text-muted">{labels.restSeconds}</span>
                        {restSeconds.trim() !== '' && (
                            <button
                                type="button"
                                onClick={onClearRest}
                                className="shrink-0 rounded-full px-3 py-2 text-xs font-bold text-muted transition-colors hover:text-[rgb(var(--text-primary))]"
                            >
                                {labels.restClear}
                            </button>
                        )}
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-muted">{labels.restHint}</p>
                </div>

                {/* Anatomical Illustration Selector / Override */}
                <div>
                    <h4 className="text-sm font-bold tracking-tight text-[rgb(var(--text-primary))] mb-3 flex items-center gap-2">
                        <Icon name="Eye" size={13} /> {copy.anatomicalIllustration}
                    </h4>
                    <select
                        value={illustrationId}
                        onChange={e => onIllustrationIdChange(e.target.value)}
                        className="gl-input font-medium"
                    >
                        <option value="">{copy.autoSmartMatch}</option>
                        {CURATED_ILLUSTRATION_OPTIONS.map(opt => (
                            <option key={opt.id} value={opt.id}>
                                {opt.name[lang] || opt.name.en}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </>
    );
};
