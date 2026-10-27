import React, { useState, useEffect, useMemo } from 'react';
import { useApp, useAppPreferences, useAppConfig } from '../../context/AppContext';
import { TRANSLATIONS } from '../../constants';
import { ExerciseDef, SessionExercise, VolumeCountingMode } from '../../types';
import { getTranslated, formatDate } from '../../utils';
import { exerciseIdGroup } from '../../utils/exerciseLibrary';
import { resolveWeightUnit, formatWeight, unitLabel } from '../../utils/units';
import { MuscleTag } from '../workout/MuscleTag';
import { Button } from './Button';
import { Sheet } from './Sheet';
import { useStore } from '../../lib/store';
import { resolveMuscleLabel } from '../../utils/muscle';
import { useTrainingConfig } from '../../hooks/useTrainingConfig';
import { EXERCISE_DETAIL_STRINGS } from '../exercises/exerciseDetail/exerciseDetailStrings';
import { getExerciseHistoryEntries, computeExerciseRecords } from '../exercises/exerciseDetail/exerciseDetailData';
import { ExerciseAboutTab } from '../exercises/exerciseDetail/ExerciseAboutTab';
import { ExerciseHistoryTab } from '../exercises/exerciseDetail/ExerciseHistoryTab';
import { ExerciseChartsTab } from '../exercises/exerciseDetail/ExerciseChartsTab';
import { ExerciseRecordsTab } from '../exercises/exerciseDetail/ExerciseRecordsTab';

interface ExerciseDetailModalProps {
    exercise: ExerciseDef;
    onClose: () => void;
}

type DetailTab = 'about' | 'history' | 'charts' | 'records';

// Strong-style detail: About (guide + per-exercise preferences), History
// (every logged session), Charts (1RM / heaviest load / volume graphs with
// an accessible data table) and Records (bests + actual-vs-estimated reps).
// Creation, filters and archive live in views/exercises/* and are untouched:
// this modal keeps the same {exercise, onClose} contract.
export const ExerciseDetailModal: React.FC<ExerciseDetailModalProps> = ({ exercise, onClose }) => {
    const { logs, exercises, setExercises, setLogs, userProfile } = useApp();
    const { lang } = useAppPreferences();
    const { config } = useAppConfig();
    const [trainingPrefs] = useTrainingConfig();
    const formula = trainingPrefs.oneRmFormula;
    const factorInRpe = trainingPrefs.factorInRpe === true;
    const t = TRANSLATIONS[lang];
    const labels = EXERCISE_DETAIL_STRINGS[lang];
    const unit = resolveWeightUnit(config);
    const suffix = unitLabel(unit).toLowerCase();
    const [activeTab, setActiveTab] = useState<DetailTab>('about');
    const [volumeCountingMode, setVolumeCountingMode] = useState<VolumeCountingMode>(exercise.volumeCountingMode || 'total');
    const [illustrationId, setIllustrationId] = useState<string>(exercise.illustrationId || '');
    const [restSeconds, setRestSeconds] = useState<string>(
        exercise.defaultRestSeconds && exercise.defaultRestSeconds > 0 ? String(exercise.defaultRestSeconds) : '',
    );
    const setActiveSession = useStore(state => state.setActiveSession);

    const safeLogs = useMemo(() => (Array.isArray(logs) ? logs : []), [logs]);
    const groupIds = useMemo(() => exerciseIdGroup(exercises, String(exercise.id)), [exercises, exercise.id]);

    useEffect(() => {
        setVolumeCountingMode(exercise.volumeCountingMode || 'total');
        setIllustrationId(exercise.illustrationId || '');
        setRestSeconds(exercise.defaultRestSeconds && exercise.defaultRestSeconds > 0 ? String(exercise.defaultRestSeconds) : '');
        setActiveTab('about');
    }, [exercise.id, exercise.volumeCountingMode, exercise.illustrationId, exercise.defaultRestSeconds]);

    const entries = useMemo(
        () => getExerciseHistoryEntries(safeLogs, groupIds.length > 0 ? groupIds : [String(exercise.id)], userProfile?.bodyWeight, formula, factorInRpe),
        [safeLogs, groupIds, exercise.id, userProfile?.bodyWeight, formula, factorInRpe],
    );
    const records = useMemo(() => computeExerciseRecords(entries), [entries]);

    const lastEntry = entries.length > 0 ? entries[0] : null;
    const bestEntry = useMemo(() => {
        let best: (typeof entries)[number] | null = null;
        for (const entry of entries) {
            if (!best || entry.best1RM > best.best1RM || (entry.best1RM === best.best1RM && entry.bestWeight > best.bestWeight)) {
                best = entry;
            }
        }
        return best;
    }, [entries]);

    const translatedName = getTranslated(exercise.name, lang);
    const bestSetText = bestEntry && bestEntry.bestWeight > 0
        ? `${formatWeight(bestEntry.bestWeight, unit, lang)} ${suffix} × ${bestEntry.bestReps}`
        : null;
    const lastDateText = lastEntry ? formatDate(lastEntry.date, lang) : null;

    const youtubeUrl = exercise.videoId
        ? `https://www.youtube.com/watch?v=${exercise.videoId}`
        : `https://www.youtube.com/results?search_query=${encodeURIComponent(String(translatedName) + ' technique tutorial')}`;

    const saveExerciseConfig = () => {
        const parsedRest = Number.parseInt(restSeconds, 10);
        const defaultRestSeconds = Number.isFinite(parsedRest) && parsedRest > 0 ? parsedRest : undefined;
        const updateExercise = <T extends ExerciseDef>(item: T): T => (
            item.id === exercise.id ? { ...item, volumeCountingMode, illustrationId: illustrationId || undefined, defaultRestSeconds } : item
        ) as T;

        setExercises(prev => prev.map(updateExercise));
        // Logs store a snapshot of the exercise. Update matching snapshots too so
        // existing history and every summary use the configuration the user chose.
        setLogs(prev => prev.map(log => ({
            ...log,
            exercises: (log.exercises || []).map(updateExercise),
        })));
        setActiveSession(session => session ? {
            ...session,
            exercises: session.exercises.map(updateExercise as (item: SessionExercise) => SessionExercise),
        } : session);
        onClose();
    };

    const tabs: Array<{ id: DetailTab; label: string }> = [
        { id: 'about', label: labels.about },
        { id: 'history', label: labels.history },
        { id: 'charts', label: labels.charts },
        { id: 'records', label: labels.records },
    ];

    return (
        <Sheet
            open={true}
            onOpenChange={(o) => { if (!o) onClose(); }}
            title={String(translatedName)}
            description={resolveMuscleLabel(exercise.muscle, lang)}
            accent="primary"
            contentId="exercise-detail-scroll"
            dragHandleOnly
            footer={
                <div className="flex gap-3">
                    <Button fullWidth onClick={onClose} variant="secondary">{t.close}</Button>
                    <Button fullWidth onClick={saveExerciseConfig}>{TRANSLATIONS[lang].copy.exerciseDetailModal.save}</Button>
                </div>
            }
        >
            <div className="px-5 pt-1">
                <MuscleTag label={resolveMuscleLabel(exercise.muscle, lang)} />
            </div>

            {/* Tabs */}
            <div role="tablist" aria-label={String(translatedName)} className="gl-panel mx-4 mt-4 flex p-1">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        role="tab"
                        aria-selected={activeTab === tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`min-h-[44px] flex-1 rounded-full px-1 text-[11px] font-bold transition-colors ${activeTab === tab.id ? 'bg-primary-500 text-black shadow-sm' : 'text-muted'}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* The Sheet owns the single scroll container. Nested overflow-y-auto
                intercepted vertical touch gestures on Android, leaving the
                tonnage options trapped beneath the sticky Save footer. */}
            <div data-vaul-no-drag className="min-w-0 pb-8">
                {activeTab === 'about' && (
                    <ExerciseAboutTab
                        exercise={exercise}
                        lang={lang}
                        labels={labels}
                        youtubeUrl={youtubeUrl}
                        volumeCountingMode={volumeCountingMode}
                        onVolumeCountingModeChange={setVolumeCountingMode}
                        illustrationId={illustrationId}
                        onIllustrationIdChange={setIllustrationId}
                        restSeconds={restSeconds}
                        onRestSecondsChange={setRestSeconds}
                        onClearRest={() => setRestSeconds('')}
                        sessionsCount={entries.length}
                        lastEntry={lastEntry}
                        bestEntry={bestEntry}
                        bestSetText={bestSetText}
                        lastDateText={lastDateText}
                    />
                )}
                {activeTab === 'history' && (
                    <ExerciseHistoryTab
                        entries={entries}
                        unit={unit}
                        lang={lang}
                        labels={labels}
                        isCardio={exercise.muscle === 'CARDIO'}
                        isIsometric={!!exercise.isIsometric}
                    />
                )}
                {activeTab === 'charts' && (
                    <ExerciseChartsTab
                        exercise={exercise}
                        exercises={exercises}
                        safeLogs={safeLogs}
                        unit={unit}
                        lang={lang}
                        labels={labels}
                        series={t.statsView}
                        formula={formula}
                        bodyWeight={userProfile?.bodyWeight}
                    />
                )}
                {activeTab === 'records' && (
                    <ExerciseRecordsTab
                        exercise={exercise}
                        safeLogs={safeLogs}
                        groupIds={groupIds.length > 0 ? groupIds : [String(exercise.id)]}
                        records={records}
                        unit={unit}
                        lang={lang}
                        labels={labels}
                        repLabels={t.statsView}
                        formula={formula}
                        factorInRpe={factorInRpe}
                    />
                )}
            </div>
        </Sheet>
    );
};
