
import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../constants';
import { ExerciseDef, SessionExercise, VolumeCountingMode } from '../../types';
import { Icon } from './Icon';
import { getTranslated } from '../../utils';
import { MuscleTag } from '../workout/MuscleTag';
import { Button } from './Button';
import { ProgressChart } from '../stats/ProgressChart';
import { Sheet } from './Sheet';
import { useStatsWorker } from '../../hooks/useStatsWorker';
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
        isCompound ? (lang === 'en' ? 'Compound' : 'Compuesto') : (lang === 'en' ? 'Isolation' : 'Aislamiento'),
        isBodyweight ? (lang === 'en' ? 'Bodyweight' : 'Peso Corporal') : (lang === 'en' ? 'Weighted' : 'Con Peso'),
        isCardio ? 'Cardio' : (lang === 'en' ? 'Strength' : 'Fuerza'),
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
                        <span key={i} className="text-[9px] font-bold uppercase tracking-widest bg-white/10 border border-white/15 text-white/70 px-2 py-0.5 rounded-full">
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
            <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/70 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1.5 rounded-full border border-white/10">
                <Icon name="ExternalLink" size={11} />
                YouTube
            </div>

            {/* YouTube logo top-left */}
            <div className="absolute top-3 left-3">
                <div className="bg-red-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded">YouTube</div>
            </div>
        </a>
    );
};

export const ExerciseDetailModal: React.FC<ExerciseDetailModalProps> = ({ exercise, onClose }) => {
    const { lang, logs, setExercises, setLogs } = useApp();
    const t = TRANSLATIONS[lang];
    const [activeTab, setActiveTab] = useState<'guide' | 'history'>('guide');
    const [volumeCountingMode, setVolumeCountingMode] = useState<VolumeCountingMode>(exercise.volumeCountingMode || 'total');
    const setActiveSession = useStore(state => state.setActiveSession);

    const { isWorkerReady, calculateChartData } = useStatsWorker();
    const [chartData, setChartData] = useState<any[]>([]);
    const [chartLoading, setChartLoading] = useState(false);

    useEffect(() => {
        setVolumeCountingMode(exercise.volumeCountingMode || 'total');
    }, [exercise.id, exercise.volumeCountingMode]);

    useEffect(() => {
        if (activeTab === 'history' && isWorkerReady) {
            setChartLoading(true);
            const metric = exercise.muscle === 'CARDIO' ? 'duration' : '1rm';
            const safeLogs = Array.isArray(logs) ? logs : [];
            calculateChartData(safeLogs, exercise.id, metric).then(points => {
                setChartData(points);
                setChartLoading(false);
            });
        }
        // `calculateChartData` from useStatsWorker is stable across renders.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, isWorkerReady, exercise.id, logs, exercise.muscle]);

    const translatedName = getTranslated(exercise.name, lang);
    const translatedInstructions = getTranslated(exercise.instructions, lang);

    const youtubeUrl = exercise.videoId
        ? `https://www.youtube.com/watch?v=${exercise.videoId}`
        : `https://www.youtube.com/results?search_query=${encodeURIComponent(String(translatedName) + ' technique tutorial')}`;

    const saveVolumeCountingMode = () => {
        const updateExercise = <T extends ExerciseDef>(item: T): T => (
            item.id === exercise.id ? { ...item, volumeCountingMode } : item
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
            description={`${exercise.muscle} exercise details`}
            accent="primary"
            footer={
                <div className="flex gap-3">
                    <Button fullWidth onClick={onClose} variant="secondary">{t.close}</Button>
                    <Button fullWidth onClick={saveVolumeCountingMode}>{lang === 'es' ? 'Guardar' : 'Save'}</Button>
                </div>
            }
        >
            <div className="px-5 pt-1">
                <MuscleTag label={exercise.muscle} />
            </div>

            {/* Tabs */}
            <div role="tablist" className="flex p-1 bg-zinc-100 dark:bg-zinc-800 mx-4 mt-4 rounded-xl">
                <button
                    role="tab"
                    aria-selected={activeTab === 'guide'}
                    onClick={() => setActiveTab('guide')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-fast ease-natural ${activeTab === 'guide' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow' : 'text-zinc-500'}`}
                >
                    {t.guide || 'Guide'}
                </button>
                <button
                    role="tab"
                    aria-selected={activeTab === 'history'}
                    onClick={() => setActiveTab('history')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-fast ease-natural ${activeTab === 'history' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow' : 'text-zinc-500'}`}
                >
                    {t.history || 'History'}
                </button>
            </div>

            <div className="overflow-y-auto scroll-container">
                    {activeTab === 'guide' ? (
                        <>
                            {/* Video / Visual Section */}
                            <div className="mt-4 overflow-hidden">
                                {exercise.videoId ? (
                                    <YouTubeCard
                                        videoId={exercise.videoId}
                                        title={String(translatedName)}
                                        youtubeUrl={youtubeUrl}
                                    />
                                ) : (
                                    <ExerciseVisualHint exercise={exercise} lang={lang} />
                                )}
                            </div>

                            {/* Search on YouTube link (always shown) */}
                            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
                                <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">
                                    {exercise.videoId
                                        ? (lang === 'en' ? 'Tap to open in YouTube' : 'Toca para abrir en YouTube')
                                        : (lang === 'en' ? 'Search tutorial online' : 'Buscar tutorial en línea')
                                    }
                                </div>
                                <a
                                    href={youtubeUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 text-[10px] font-bold text-red-500 hover:text-red-400 transition-colors"
                                >
                                    <Icon name="ExternalLink" size={12} />
                                    {t.watchVideo || 'Watch Video'}
                                </a>
                            </div>

                            {/* Instructions & Tip */}
                            <div className="p-5 space-y-5">
                                <div>
                                    <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <Icon name="FileText" size={13} /> {t.instructions}
                                    </h4>
                                    <div className="text-sm text-zinc-300 leading-relaxed">
                                        {translatedInstructions && translatedInstructions !== 'Unknown' ? (
                                            <p>{String(translatedInstructions)}</p>
                                        ) : (
                                            <p className="italic text-zinc-600">{t.noData}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-primary-500/10 rounded-xl p-4 border border-primary-500/15">
                                    <div className="flex gap-3">
                                        <div className="bg-primary-500/20 p-1.5 rounded-lg h-fit shrink-0">
                                            <Icon name="Info" size={16} className="text-primary-400" />
                                        </div>
                                        <div className="text-sm text-primary-900 dark:text-primary-100">
                                            <p className="font-bold mb-1 text-primary-700 dark:text-primary-300">{t.executionTipTitle}</p>
                                            <p className="opacity-70 text-xs leading-relaxed">{t.executionTipText}</p>
                                        </div>
                                    </div>
                                </div>

                                {exercise.muscle !== 'CARDIO' && (
                                    <div>
                                        <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <Icon name="Dumbbell" size={13} /> {lang === 'es' ? 'Cálculo de tonelaje' : 'Tonnage calculation'}
                                        </h4>
                                        <div className="space-y-2">
                                            <button type="button" onClick={() => setVolumeCountingMode('total')} className={`w-full text-left rounded-xl border p-3 transition-colors ${volumeCountingMode === 'total' ? 'border-primary-500 bg-primary-500/10' : 'border-white/10 bg-white/5'}`}>
                                                <span className="block text-sm font-bold text-white">{lang === 'es' ? 'Total registrado · ×1' : 'Recorded total · ×1'}</span>
                                                <span className="block mt-1 text-xs text-zinc-400">{lang === 'es' ? 'Usá esto para barras, máquinas bilaterales o si las reps alternadas ya son el total.' : 'For bars, bilateral machines, or alternating reps already entered as a total.'}</span>
                                            </button>
                                            <button type="button" onClick={() => setVolumeCountingMode('per_side')} className={`w-full text-left rounded-xl border p-3 transition-colors ${volumeCountingMode === 'per_side' ? 'border-primary-500 bg-primary-500/10' : 'border-white/10 bg-white/5'}`}>
                                                <span className="block text-sm font-bold text-white">{lang === 'es' ? 'Por lado · ×2' : 'Per side · ×2'}</span>
                                                <span className="block mt-1 text-xs text-zinc-400">{lang === 'es' ? 'Si anotás la carga y reps de un brazo/pierna y entrenás los dos lados.' : 'When you record load and reps for one arm/leg and train both sides.'}</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="p-5">
                            <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                <div className="mb-4">
                                    <h4 className="text-sm font-bold text-white">{t.statsProgress}</h4>
                                    <p className="text-xs text-zinc-500">Estimated 1RM / Max Performance</p>
                                </div>
                                <ProgressChart
                                    dataPoints={chartData}
                                    metric={exercise.muscle === 'CARDIO' ? 'duration' : '1rm'}
                                    loading={chartLoading}
                                />
                            </div>
                            {chartData.length === 0 && !chartLoading && (
                                <div className="text-center py-8 text-zinc-500 text-xs italic">
                                    {t.statsNoData}
                                </div>
                            )}
                        </div>
                    )}
                </div>
        </Sheet>
    );
};
