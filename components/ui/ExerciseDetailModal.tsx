
import React, { useState, useEffect, useMemo } from 'react';
import { useApp, useAppPreferences } from '../../context/AppContext';
import { TRANSLATIONS } from '../../constants';
import { ExerciseDef, SessionExercise, VolumeCountingMode } from '../../types';
import { Icon } from './Icon';
import { getTranslated } from '../../utils';
import { exerciseIdGroup } from '../../utils/exerciseLibrary';
import { MuscleTag } from '../workout/MuscleTag';
import { Button } from './Button';
import { ProgressChart } from '../stats/ProgressChart';
import { Sheet } from './Sheet';
import { AppleExerciseMotion } from '../exercises/AppleExerciseMotion';
import { CURATED_ILLUSTRATION_OPTIONS } from '../../constants/exerciseIllustrationsMap';
import { useStatsWorker } from '../../hooks/useStatsWorker';
import { buildStatsLogsSignature } from '../../services/statsCache';
import { resolveMuscleLabel } from '../../utils/muscle';
import { useStore } from '../../lib/store';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

interface ExerciseDetailModalProps {
    exercise: ExerciseDef;
    onClose: () => void;
}

// Muscle → color map for the visual hint card
const MUSCLE_COLORS: Record<string, string> = {
    CHEST: 'from-red-900/40 to-zinc-900',
    BACK: 'from-blue-900/40 to-zinc-900',
    SHOULDERS: 'from-yellow-900/40 to-zinc-900',
    BICEPS: 'from-purple-900/40 to-zinc-900',
    TRICEPS: 'from-orange-900/40 to-zinc-900',
    QUADS: 'from-green-900/40 to-zinc-900',
    HAMSTRINGS: 'from-teal-900/40 to-zinc-900',
    GLUTES: 'from-pink-900/40 to-zinc-900',
    CALVES: 'from-lime-900/40 to-zinc-900',
    TRAPS: 'from-sky-900/40 to-zinc-900',
    ABS: 'from-amber-900/40 to-zinc-900',
    CARDIO: 'from-cyan-900/40 to-zinc-900',
};

const MUSCLE_ICONS: Record<string, string> = {
    CHEST: 'Layers', BACK: 'Layout', SHOULDERS: 'Zap', BICEPS: 'TrendingUp',
    TRICEPS: 'TrendingDown', QUADS: 'ChevronsDown', HAMSTRINGS: 'CornerRightDown',
    GLUTES: 'CircleDot', CALVES: 'ArrowDown', TRAPS: 'Triangle', ABS: 'Crosshair',
    CARDIO: 'Activity',
};

// Visual hint component shown when there's no video
const ExerciseVisualHint: React.FC<{ exercise: ExerciseDef; lang: 'en' | 'es' }> = ({ exercise, lang }) => {
    const name = String(getTranslated(exercise.name, lang));
    const muscle = exercise.muscle || 'CHEST';
    const gradient = MUSCLE_COLORS[muscle] || 'from-zinc-800 to-zinc-900';
    const icon = MUSCLE_ICONS[muscle] || 'Dumbbell';

    // Parse exercise category from name
    const isCompound = ['Squat', 'Deadlift', 'Press', 'Row', 'Pull', 'Sentadilla', 'Peso Muerto', 'Press', 'Remo', 'Jalón']
        .some(k => name.includes(k));
    const isBodyweight = exercise.isBodyweight;
    const isCardio = muscle === 'CARDIO';

    const tags = [
        isCompound ? (TRANSLATIONS[lang].copy.exerciseDetailModal.compound) : (TRANSLATIONS[lang].copy.exerciseDetailModal.isolation),
        isBodyweight ? (TRANSLATIONS[lang].copy.exerciseDetailModal.bodyweight) : (TRANSLATIONS[lang].copy.exerciseDetailModal.weighted),
        isCardio ? 'Cardio' : (TRANSLATIONS[lang].copy.exerciseDetailModal.strength),
    ];

    return (
        <div className={`w-full aspect-video bg-gradient-to-b ${gradient} flex flex-col items-center justify-center relative overflow-hidden`}>
            {/* Background rings */}
            <div className="absolute inset-0 flex items-center justify-center opacity-5">
                <div className="w-64 h-64 rounded-full border-2 border-white" />
                <div className="absolute w-48 h-48 rounded-full border-2 border-white" />
                <div className="absolute w-32 h-32 rounded-full border-2 border-white" />
            </div>

            {/* Center icon + muscle */}
            <div className="relative flex flex-col items-center gap-3">
                <div className="w-20 h-20 rounded-full bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-sm">
                    <Icon name={icon as any} size={36} className="text-white opacity-80" />
                </div>
                <div className="text-white font-black text-lg tracking-tight text-center px-4 leading-tight">
                    {name}
                </div>
                <div className="flex gap-2 flex-wrap justify-center px-4">
                    {tags.map((tag, i) => (
                        <span key={i} className="text-xs font-bold uppercase tracking-widest bg-white/10 border border-white/15 text-white/70 px-2 py-0.5 rounded-full">
                            {tag}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
};

// YouTube thumbnail card — opens video externally instead of broken embed
const YouTubeCard: React.FC<{ videoId: string; title: string; youtubeUrl: string }> = ({ videoId, title, youtubeUrl }) => {
    const [thumbError, setThumbError] = useState(false);
    // maxresdefault → hqdefault fallback
    const thumbSrc = thumbError
        ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
        : `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

    return (
        <a
            href={youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full aspect-video relative bg-black overflow-hidden group cursor-pointer"
            title={title}
        >
            {/* Thumbnail */}
            <img
                src={thumbSrc}
                alt={title}
                onError={() => setThumbError(true)}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />

            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors" />

            {/* Play button */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-red-600 shadow-[0_0_30px_rgba(220,38,38,0.6)] flex items-center justify-center transition-transform duration-200 group-hover:scale-110 group-active:scale-95">
                    <Icon name="Play" size={28} className="text-white ml-1" fill="white" />
                </div>
            </div>

            {/* "Open in YouTube" badge */}
            <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/70 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1.5 rounded-full border border-white/10">
                <Icon name="ExternalLink" size={11} />
                YouTube
            </div>

            {/* YouTube logo top-left */}
            <div className="absolute top-3 left-3">
                <div className="bg-red-600 text-white text-xs font-black px-1.5 py-0.5 rounded">YouTube</div>
            </div>
        </a>
    );
};

export const ExerciseDetailModal: React.FC<ExerciseDetailModalProps> = ({ exercise, onClose }) => {
    const { logs, exercises, setExercises, setLogs } = useApp();
    const { lang } = useAppPreferences();
    const t = TRANSLATIONS[lang];
    const [activeTab, setActiveTab] = useState<'guide' | 'history'>('guide');
    const [volumeCountingMode, setVolumeCountingMode] = useState<VolumeCountingMode>(exercise.volumeCountingMode || 'total');
    const [illustrationId, setIllustrationId] = useState<string>(exercise.illustrationId || '');
    const setActiveSession = useStore(state => state.setActiveSession);

    const previewExercise = useMemo(() => ({
        ...exercise,
        illustrationId: illustrationId || undefined,
    }), [exercise, illustrationId]);

    const { isWorkerReady, calculateChartData } = useStatsWorker();
    const [chartData, setChartData] = useState<any[]>([]);
    const [chartLoading, setChartLoading] = useState(false);

    const safeLogs = useMemo(() => (Array.isArray(logs) ? logs : []), [logs]);
    const logsSignature = useMemo(() => buildStatsLogsSignature(safeLogs), [safeLogs]);
    useEffect(() => {
        setVolumeCountingMode(exercise.volumeCountingMode || 'total');
        setIllustrationId(exercise.illustrationId || '');
    }, [exercise.id, exercise.volumeCountingMode, exercise.illustrationId]);

    useEffect(() => {
        if (activeTab === 'history' && isWorkerReady) {
            setChartLoading(true);
            const metric = exercise.muscle === 'CARDIO' ? 'duration' : '1rm';
            // Merged duplicates share one history chart (canonical group).
            calculateChartData(safeLogs, exerciseIdGroup(exercises, String(exercise.id)), metric).then(points => {
                setChartData(points);
                setChartLoading(false);
            });
        }
        // Depend on the stable logs signature, not logs identity, so an
        // identity-only logs change does not refetch/re-clone history.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, isWorkerReady, exercise.id, logsSignature, exercise.muscle, exercises]);

    const translatedName = getTranslated(exercise.name, lang);
    const translatedInstructions = getTranslated(exercise.instructions, lang);

    const youtubeUrl = exercise.videoId
        ? `https://www.youtube.com/watch?v=${exercise.videoId}`
        : `https://www.youtube.com/results?search_query=${encodeURIComponent(String(translatedName) + ' technique tutorial')}`;

    const saveExerciseConfig = () => {
        const updateExercise = <T extends ExerciseDef>(item: T): T => (
            item.id === exercise.id ? { ...item, volumeCountingMode, illustrationId: illustrationId || undefined } : item
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
                <button
                    role="tab"
                    aria-selected={activeTab === 'guide'}
                    onClick={() => setActiveTab('guide')}
                className={`min-h-[44px] flex-1 rounded-full px-3 text-xs font-bold transition-colors ${activeTab === 'guide' ? 'bg-primary-500 text-black shadow-sm' : 'text-muted'}`}
                >
                    {t.guide || 'Guide'}
                </button>
                <button
                    role="tab"
                    aria-selected={activeTab === 'history'}
                    onClick={() => setActiveTab('history')}
                className={`min-h-[44px] flex-1 rounded-full px-3 text-xs font-bold transition-colors ${activeTab === 'history' ? 'bg-primary-500 text-black shadow-sm' : 'text-muted'}`}
                >
                    {t.history || 'History'}
                </button>
            </div>

            {/* The Sheet owns the single scroll container. Nested overflow-y-auto
                intercepted vertical touch gestures on Android, leaving the
                tonnage options trapped beneath the sticky Save footer. */}
            <div data-vaul-no-drag className="min-w-0 pb-8">
                    {activeTab === 'guide' ? (
                        <>
                            {/* Apple Fitness+ Style Biomechanic Motion */}
                            <div className="mt-3 px-1">
                                <AppleExerciseMotion
                                    exercise={previewExercise}
                                    lang={lang}
                                    youtubeUrl={youtubeUrl}
                                />
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
                                            <Icon name="Dumbbell" size={13} /> {TRANSLATIONS[lang].copy.exerciseDetailModal.tonnageCalculation}
                                        </h4>
                                        <div className="space-y-2">
                                            <button type="button" aria-pressed={volumeCountingMode === 'total'} onClick={() => setVolumeCountingMode('total')} className={`min-h-[56px] w-full rounded-xl border p-3 text-left transition-colors ${volumeCountingMode === 'total' ? 'border-primary-500 bg-primary-500/10' : 'border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-elevated)/0.5)]'}`}>
                                                <span className="block text-sm font-bold text-[rgb(var(--text-primary))]">{TRANSLATIONS[lang].copy.exerciseDetailModal.recordedTotal1}</span>
                                                <span className="mt-1 block text-xs text-muted">{TRANSLATIONS[lang].copy.exerciseDetailModal.forBarsBilateralMachines}</span>

                                            </button>
                                            <button type="button" aria-pressed={volumeCountingMode === 'per_side'} onClick={() => setVolumeCountingMode('per_side')} className={`min-h-[56px] w-full rounded-xl border p-3 text-left transition-colors ${volumeCountingMode === 'per_side' ? 'border-primary-500 bg-primary-500/10' : 'border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-elevated)/0.5)]'}`}>
                                                <span className="block text-sm font-bold text-[rgb(var(--text-primary))]">{TRANSLATIONS[lang].copy.exerciseDetailModal.perSide2}</span>
                                                <span className="mt-1 block text-xs text-muted">{TRANSLATIONS[lang].copy.exerciseDetailModal.whenYouRecordLoad}</span>

                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Anatomical Illustration Selector / Override */}
                                <div>
                                    <h4 className="text-sm font-bold tracking-tight text-[rgb(var(--text-primary))] mb-3 flex items-center gap-2">
                                        <Icon name="Eye" size={13} /> {TRANSLATIONS[lang].copy.exerciseDetailModal.anatomicalIllustration}
                                    </h4>
                                    <select
                                        value={illustrationId}
                                        onChange={e => setIllustrationId(e.target.value)}
                                        className="gl-input font-medium"
                                    >
                                        <option value="">{TRANSLATIONS[lang].copy.exerciseDetailModal.autoSmartMatch}</option>
                                        {CURATED_ILLUSTRATION_OPTIONS.map(opt => (
                                            <option key={opt.id} value={opt.id}>
                                                {opt.name[lang] || opt.name.en}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="p-5">
                            <div className="gl-panel p-4">
                                <div className="mb-4">
                                    <h4 className="text-sm font-bold text-[rgb(var(--text-primary))]">{t.statsProgress}</h4>
                                    <p className="text-xs text-muted">Estimated 1RM / Max Performance</p>
                                </div>
                                <ProgressChart
                                    dataPoints={chartData}
                                    metric={exercise.muscle === 'CARDIO' ? 'duration' : '1rm'}
                                    loading={chartLoading}
                                />
                            </div>
                            {chartData.length === 0 && !chartLoading && (
                                <div className="text-center py-8 text-muted text-xs italic">
                                    {t.statsNoData}
                                </div>
                            )}
                        </div>
                    )}
                </div>
        </Sheet>
    );
};
