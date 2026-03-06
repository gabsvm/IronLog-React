
import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../constants';
import { ExerciseDef } from '../../types';
import { Icon } from './Icon';
import { getTranslated } from '../../utils';
import { MuscleTag } from '../workout/MuscleTag';
import { Button } from './Button';
import { ProgressChart } from '../stats/ProgressChart';
import { useStatsWorker } from '../../hooks/useStatsWorker';
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
    const { lang, logs } = useApp();
    const t = TRANSLATIONS[lang];
    const [activeTab, setActiveTab] = useState<'guide' | 'history'>('guide');

    const { isWorkerReady, calculateChartData } = useStatsWorker();
    const [chartData, setChartData] = useState<any[]>([]);
    const [chartLoading, setChartLoading] = useState(false);

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
    }, [activeTab, isWorkerReady, exercise.id, logs, exercise.muscle]);

    const translatedName = getTranslated(exercise.name, lang);
    const translatedInstructions = getTranslated(exercise.instructions, lang);

    const youtubeUrl = exercise.videoId
        ? `https://www.youtube.com/watch?v=${exercise.videoId}`
        : `https://www.youtube.com/results?search_query=${encodeURIComponent(String(translatedName) + ' technique tutorial')}`;

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
            <div
                className="bg-zinc-900 w-full max-w-lg rounded-2xl shadow-2xl border border-white/10 flex flex-col max-h-[90vh] overflow-hidden animate-spring-in"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-white/5">
                    <div className="flex-1 min-w-0 pr-4">
                        <h3 className="text-lg font-black text-white leading-tight truncate">
                            {String(translatedName)}
                        </h3>
                        <div className="mt-1">
                            <MuscleTag label={exercise.muscle} />
                        </div>
                    </div>
                    <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white transition-colors active:scale-90">
                        <Icon name="X" size={18} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex p-1 bg-zinc-800 mx-4 mt-4 rounded-xl">
                    <button
                        onClick={() => setActiveTab('guide')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'guide' ? 'bg-zinc-700 text-white shadow' : 'text-zinc-500'}`}
                    >
                        {t.guide || "Guide"}
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'history' ? 'bg-zinc-700 text-white shadow' : 'text-zinc-500'}`}
                    >
                        {t.history || "History"}
                    </button>
                </div>

                <div className="overflow-y-auto scroll-container flex-1">
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

                                <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/15">
                                    <div className="flex gap-3">
                                        <div className="bg-blue-500/20 p-1.5 rounded-lg h-fit shrink-0">
                                            <Icon name="Info" size={16} className="text-blue-400" />
                                        </div>
                                        <div className="text-sm text-blue-100">
                                            <p className="font-bold mb-1 text-blue-300">{t.executionTipTitle}</p>
                                            <p className="opacity-70 text-xs leading-relaxed">{t.executionTipText}</p>
                                        </div>
                                    </div>
                                </div>
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

                <div className="p-4 border-t border-white/5">
                    <Button fullWidth onClick={onClose} variant="secondary">
                        {t.close}
                    </Button>
                </div>
            </div>
        </div>
    );
};
