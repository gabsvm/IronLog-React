
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

// Register components for the Line Chart (ProgressChart) used in this modal
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Filler
);

interface ExerciseDetailModalProps {
    exercise: ExerciseDef;
    onClose: () => void;
}

export const ExerciseDetailModal: React.FC<ExerciseDetailModalProps> = ({ exercise, onClose }) => {
    const { lang, logs } = useApp();
    const t = TRANSLATIONS[lang];
    const [activeTab, setActiveTab] = useState<'guide' | 'history'>('guide');
    const [videoLoaded, setVideoLoaded] = useState(false);
    
    // Stats Logic
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

    // Smart fallback: If ID exists use it, otherwise search
    const youtubeUrl = exercise.videoId 
        ? `https://www.youtube.com/watch?v=${exercise.videoId}`
        : `https://www.youtube.com/results?search_query=${encodeURIComponent(translatedName + " technique")}`;

    // Standard embed URL with enhanced compatibility parameters
    const embedUrl = exercise.videoId 
        ? `https://www.youtube.com/embed/${exercise.videoId}?autoplay=0&rel=0&modestbranding=1&playsinline=1&origin=${window.location.origin}&enablejsapi=1`
        : '';

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
            <div 
                className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-2xl shadow-2xl border border-zinc-200 dark:border-white/10 flex flex-col max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-4 duration-300" 
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-zinc-100 dark:border-white/5 bg-zinc-50/50 dark:bg-white/[0.02]">
                    <div className="flex-1 min-w-0 pr-4">
                        <h3 className="text-lg font-black text-zinc-900 dark:text-white leading-tight truncate">
                            {String(translatedName)}
                        </h3>
                        <div className="mt-1">
                            <MuscleTag label={exercise.muscle} />
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 -mr-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors rounded-full hover:bg-zinc-100 dark:hover:bg-white/5">
                        <Icon name="X" size={24} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800 mx-4 mt-4 rounded-xl">
                    <button 
                        onClick={() => setActiveTab('guide')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'guide' ? 'bg-white dark:bg-zinc-700 shadow text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-zinc-400'}`}
                    >
                        {t.guide || "Guide"}
                    </button>
                    <button 
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'history' ? 'bg-white dark:bg-zinc-700 shadow text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-zinc-400'}`}
                    >
                        {t.history || "History"}
                    </button>
                </div>

                <div className="overflow-y-auto scroll-container flex-1 bg-white dark:bg-zinc-900">
                    {activeTab === 'guide' ? (
                        <>
                            {/* Video Section */}
                            <div className="w-full bg-black relative aspect-video group mt-4">
                                {exercise.videoId ? (
                                    <>
                                        {!videoLoaded && (
                                            <div className="absolute inset-0 flex items-center justify-center z-0">
                                                <div className="w-10 h-10 border-4 border-zinc-600 border-t-zinc-400 rounded-full animate-spin"></div>
                                            </div>
                                        )}
                                        <iframe 
                                            className={`w-full h-full relative z-10 transition-opacity duration-500 ${videoLoaded ? 'opacity-100' : 'opacity-0'}`}
                                            src={embedUrl}
                                            title={String(translatedName)} 
                                            frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                            allowFullScreen
                                            loading="lazy"
                                            referrerPolicy="strict-origin-when-cross-origin"
                                            onLoad={() => setVideoLoaded(true)}
                                        ></iframe>
                                    </>
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800">
                                        <Icon name="VideoOff" size={48} className="opacity-20 mb-4" />
                                        <p className="text-sm font-bold opacity-70">{t.noVideo}</p>
                                    </div>
                                )}
                            </div>

                            {/* Video Actions Bar */}
                            <div className="flex items-center justify-between px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-100 dark:border-white/5">
                                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">
                                    {t.videoIssues}
                                </div>
                                <a 
                                    href={youtubeUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-xs font-bold text-red-600 dark:text-red-500 hover:underline bg-red-50 dark:bg-red-900/10 px-3 py-1.5 rounded-full transition-colors"
                                >
                                    <Icon name="ExternalLink" size={14} /> 
                                    {t.watchVideo}
                                </a>
                            </div>

                            {/* Content Section */}
                            <div className="p-6 space-y-6">
                                {/* Instructions */}
                                <div>
                                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <Icon name="FileText" size={14} /> {t.instructions}
                                    </h4>
                                    <div className="prose prose-sm dark:prose-invert leading-relaxed text-zinc-600 dark:text-zinc-300">
                                        {translatedInstructions && translatedInstructions !== 'Unknown' ? (
                                            <p>{String(translatedInstructions)}</p>
                                        ) : (
                                            <p className="italic text-zinc-400">{t.noData}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Pro Tip */}
                                <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-4 border border-blue-100 dark:border-blue-500/10">
                                    <div className="flex gap-3">
                                        <div className="bg-blue-100 dark:bg-blue-500/20 p-1.5 rounded-lg h-fit shrink-0">
                                            <Icon name="Info" size={18} className="text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div className="text-sm text-blue-900 dark:text-blue-100">
                                            <p className="font-bold mb-1">{t.executionTipTitle}</p>
                                            <p className="opacity-80 text-xs leading-relaxed">
                                                {t.executionTipText}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="p-6">
                            <div className="bg-zinc-50 dark:bg-white/5 rounded-2xl p-4 border border-zinc-100 dark:border-white/5">
                                <div className="mb-4">
                                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white">{t.statsProgress}</h4>
                                    <p className="text-xs text-zinc-500">Estimated 1RM / Max Performance</p>
                                </div>
                                <ProgressChart 
                                    dataPoints={chartData} 
                                    metric={exercise.muscle === 'CARDIO' ? 'duration' : '1rm'} 
                                    loading={chartLoading} 
                                />
                            </div>
                            {chartData.length === 0 && !chartLoading && (
                                <div className="text-center py-8 text-zinc-400 text-xs italic">
                                    {t.statsNoData}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-zinc-100 dark:border-white/5 bg-zinc-50/50 dark:bg-white/[0.02]">
                    <Button fullWidth onClick={onClose} variant="secondary">
                        {t.close}
                    </Button>
                </div>
            </div>
        </div>
    );
};
