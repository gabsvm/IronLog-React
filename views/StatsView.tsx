
import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { TRANSLATIONS } from '../constants';
import { MuscleGroup } from '../types';
import { ProgressChart, ChartDataPoint } from '../components/stats/ProgressChart';
import { SymmetryRadar } from '../components/stats/SymmetryRadar';
import { getTranslated } from '../utils';
import { Icon } from '../components/ui/Icon';
import { useStatsWorker } from '../hooks/useStatsWorker';
import { TutorialOverlay } from '../components/ui/TutorialOverlay';
import { ProLock } from '../components/pro/ProLock';
import { 
    Chart as ChartJS, 
    RadialLinearScale, 
    ArcElement, 
    Tooltip, 
    Legend, 
    PointElement, 
    LineElement, 
    Filler,
    CategoryScale,
    LinearScale
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

// --- REGISTER CHARTS GLOBALLY FOR THIS CHUNK ---
ChartJS.register(
    RadialLinearScale, 
    ArcElement, 
    Tooltip, 
    Legend, 
    PointElement, 
    LineElement, 
    Filler,
    CategoryScale,
    LinearScale
);

// --- HELPER: Volume Zones (Dr. Mike / RP Logic) ---
const getVolumeZone = (sets: number) => {
    if (sets < 6) return { color: 'bg-yellow-500', label: 'Maintenance (MV)', textColor: 'text-yellow-500' };
    if (sets < 12) return { color: 'bg-green-500', label: 'Minimum Effective (MEV)', textColor: 'text-green-500' };
    if (sets <= 22) return { color: 'bg-blue-500', label: 'Optimal (MAV)', textColor: 'text-blue-500' };
    return { color: 'bg-red-500', label: 'Overreaching (MRV)', textColor: 'text-red-500' };
};

export const StatsView: React.FC = () => {
    const { logs, lang, activeMeso, exercises, tutorialProgress, markTutorialSeen } = useApp();
    const t = TRANSLATIONS[lang];
    
    // UI State
    const [selectedExId, setSelectedExId] = useState<string | null>(null);
    const [chartMetric, setChartMetric] = useState<'1rm' | 'volume' | 'duration' | 'distance'>('1rm');
    const [showPicker, setShowPicker] = useState(false);
    const [pickerSearch, setPickerSearch] = useState('');

    // Async Data State
    const [volumeData, setVolumeData] = useState<[string, number][]>([]);
    const [rawMuscleCounts, setRawMuscleCounts] = useState<Record<string, number>>({});
    const [availableExercises, setAvailableExercises] = useState<any[]>([]);
    const [chartPoints, setChartPoints] = useState<ChartDataPoint[]>([]);
    const [setTypeDist, setSetTypeDist] = useState<Record<string, number>>({});
    
    const [loadingOverview, setLoadingOverview] = useState(true);
    const [loadingChart, setLoadingChart] = useState(false);

    // Worker Hook
    const { isWorkerReady, calculateOverview, calculateChartData } = useStatsWorker();
    
    const safeLogs = useMemo(() => Array.isArray(logs) ? logs : [], [logs]);
    const currentEx = exercises.find(e => e.id === selectedExId);
    const isCardio = currentEx?.muscle === 'CARDIO';

    // Auto-switch metric when exercise type changes
    useEffect(() => {
        if (isCardio) {
            if (chartMetric !== 'duration' && chartMetric !== 'distance') {
                setChartMetric('duration');
            }
        } else {
            if (chartMetric !== '1rm' && chartMetric !== 'volume') {
                setChartMetric('1rm');
            }
        }
    }, [isCardio]);

    // 1. Load Overview (Volume + Exercise List)
    useEffect(() => {
        if (!isWorkerReady) return;

        const loadOverview = async () => {
            setLoadingOverview(true);
            const { volumeData, exerciseFrequency } = await calculateOverview(safeLogs, activeMeso?.id);
            
            setVolumeData(volumeData);
            
            // Convert array to object for Radar
            const counts: Record<string, number> = {};
            volumeData.forEach(([m, v]) => counts[m] = v);
            setRawMuscleCounts(counts);

            // Calculate Set Type Distribution
            const typeCounts: Record<string, number> = {};
            safeLogs.forEach(l => {
                if(activeMeso?.id && l.mesoId !== activeMeso.id) return;
                l.exercises?.forEach(ex => {
                    ex.sets?.forEach(s => {
                        if(s.completed) {
                            const type = s.type || 'regular';
                            typeCounts[type] = (typeCounts[type] || 0) + 1;
                        }
                    });
                });
            });
            setSetTypeDist(typeCounts);

            // Transform frequency map to sorted exercise objects
            const sortedExs = Object.entries(exerciseFrequency)
                .sort((a, b) => (b[1] as number) - (a[1] as number)) // Most frequent first
                .map(([id]) => exercises.find(e => e.id === id))
                .filter(Boolean);
            
            setAvailableExercises(sortedExs);
            
            // Auto-select first exercise if none selected
            if (!selectedExId && sortedExs.length > 0) {
                setSelectedExId(sortedExs[0]!.id);
            }
            
            setLoadingOverview(false);
        };

        loadOverview();
    }, [isWorkerReady, safeLogs, activeMeso?.id, exercises, calculateOverview]);

    // 2. Load Chart Data
    useEffect(() => {
        if (!isWorkerReady || !selectedExId) return;

        const loadChart = async () => {
            setLoadingChart(true);
            const points = await calculateChartData(safeLogs, selectedExId, chartMetric);
            setChartPoints(points);
            setLoadingChart(false);
        };

        loadChart();
    }, [isWorkerReady, selectedExId, chartMetric, safeLogs, calculateChartData]);


    const filteredExercises = useMemo(() => {
        return availableExercises.filter(ex => 
            getTranslated(ex!.name, lang).toLowerCase().includes(pickerSearch.toLowerCase())
        );
    }, [availableExercises, pickerSearch, lang]);

    const maxVal = Math.max(...volumeData.map(d => d[1]), 25); 

    const doughnutData = {
        labels: Object.keys(setTypeDist).map(k => t.types[k] || k),
        datasets: [{
            data: Object.values(setTypeDist),
            backgroundColor: [
                '#dc2626', '#ea580c', '#ca8a04', '#16a34a', '#2563eb', '#9333ea'
            ],
            borderWidth: 0,
            hoverOffset: 4
        }]
    };

    const totalSets = (Object.values(setTypeDist) as number[]).reduce((a, b) => a + b, 0);
    const hasData = totalSets > 0;

    const statsTutorialSteps = [
        { targetId: 'tut-progress-chart', title: t.tutorial.stats[0].title, text: t.tutorial.stats[0].text, position: 'bottom' as const },
        { targetId: 'tut-radar-chart', title: t.tutorial.stats[1].title, text: t.tutorial.stats[1].text, position: 'top' as const },
        { targetId: 'tut-vol-bar', title: t.tutorial.stats[2].title, text: t.tutorial.stats[2].text, position: 'top' as const }
    ];

    return (
        <div className="p-4 space-y-6 pb-24 relative">
            <h2 className="text-2xl font-black text-white px-2">Analytics</h2>
            
            {/* --- Progress Chart Section (FREE) --- */}
            <div id="tut-progress-chart" className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800 shadow-sm">
                <div className="flex flex-col gap-4 mb-6">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                             <div className="w-8 h-8 rounded-full bg-red-900/20 text-red-500 flex items-center justify-center">
                                <Icon name="TrendingUp" size={16} />
                            </div>
                            <h3 className="font-bold text-white">{t.statsProgress}</h3>
                        </div>
                        
                        <div className="flex bg-zinc-800 p-1 rounded-lg">
                            {isCardio ? (
                                <>
                                    <button 
                                        onClick={() => setChartMetric('duration')}
                                        className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${chartMetric === 'duration' ? 'bg-zinc-700 shadow text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                                    >
                                        TIME
                                    </button>
                                    <button 
                                        onClick={() => setChartMetric('distance')}
                                        className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${chartMetric === 'distance' ? 'bg-zinc-700 shadow text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                                    >
                                        DIST
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button 
                                        onClick={() => setChartMetric('1rm')}
                                        className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${chartMetric === '1rm' ? 'bg-zinc-700 shadow text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                                    >
                                        1RM
                                    </button>
                                    <button 
                                        onClick={() => setChartMetric('volume')}
                                        className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${chartMetric === 'volume' ? 'bg-zinc-700 shadow text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                                    >
                                        VOL
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    <button 
                        onClick={() => { setPickerSearch(''); setShowPicker(true); }}
                        className="w-full bg-white/5 border border-white/10 text-white text-sm font-bold rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-red-500 flex justify-between items-center active:bg-white/10 transition-colors"
                    >
                        <span className="truncate">
                            {loadingOverview 
                                ? t.loading 
                                : currentEx ? getTranslated(currentEx.name, lang) : t.selectEx}
                        </span>
                        <Icon name="CornerDownRight" size={16} className="text-zinc-400" />
                    </button>
                </div>

                {selectedExId && (
                    <ProgressChart 
                        dataPoints={chartPoints}
                        metric={chartMetric as any} 
                        loading={loadingChart}
                    />
                )}
            </div>

            {/* --- Symmetry Radar & Doughnut (PRO LOCKED) --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Symmetry Radar */}
                <div id="tut-radar-chart" className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800 shadow-sm overflow-hidden flex flex-col h-full min-h-[320px]">
                    <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Icon name="Activity" size={14} /> {t.statsBalance}
                    </h3>
                    <div className="flex-1 relative flex items-center justify-center">
                        <ProLock featureName="Radar Analysis">
                            <div className="w-full h-64">
                                <SymmetryRadar volumeData={rawMuscleCounts} />
                            </div>
                        </ProLock>
                    </div>
                </div>

                {/* Set Type Distribution */}
                <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800 shadow-sm flex flex-col h-full min-h-[320px]">
                    <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Icon name="Layers" size={14} /> {t.statsIntensity}
                    </h3>
                    <div className="flex-1 flex flex-col items-center justify-center relative">
                        <ProLock featureName="Intensity Dist.">
                            {hasData ? (
                                <div className="relative w-48 h-48">
                                    <Doughnut 
                                        data={doughnutData} 
                                        options={{ 
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            cutout: '75%', 
                                            plugins: { legend: { display: false } },
                                            elements: { arc: { borderWidth: 0 } }
                                        }} 
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                                        <span className="text-3xl font-black text-white tracking-tighter">
                                            {totalSets}
                                        </span>
                                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{t.statsSets}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center opacity-50 space-y-3">
                                    <div className="w-32 h-32 rounded-full border-[12px] border-zinc-800 flex items-center justify-center">
                                         <Icon name="CloudOff" size={24} className="text-zinc-600" />
                                    </div>
                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{t.statsNoData}</span>
                                </div>
                            )}
                        </ProLock>
                    </div>
                </div>
            </div>

            {/* --- Volume Bar Chart Section --- */}
            <div id="tut-vol-bar" className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                        <Icon name="BarChart2" size={14} />
                        {t.volPerCycle}
                    </h3>
                    {/* Legend */}
                    <div className="flex gap-2">
                        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-yellow-500"></div><span className="text-[9px] text-zinc-400 font-bold">MV</span></div>
                        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div><span className="text-[9px] text-zinc-400 font-bold">MEV</span></div>
                        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div><span className="text-[9px] text-zinc-400 font-bold">MAV</span></div>
                    </div>
                </div>
                
                {loadingOverview ? (
                    <div className="space-y-4 animate-pulse">
                        {[1,2,3,4].map(i => (
                            <div key={i} className="flex gap-3 items-center">
                                <div className="w-24 h-4 bg-zinc-800 rounded"></div>
                                <div className="flex-1 h-4 bg-zinc-800 rounded-full"></div>
                                <div className="w-6 h-4 bg-zinc-800 rounded"></div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {volumeData.map(([muscle, count]) => {
                            const zone = getVolumeZone(count);
                            return (
                                <div key={muscle} className="flex items-center gap-3 group">
                                    <div className="w-24 text-xs font-bold text-zinc-500 truncate text-right">
                                        {TRANSLATIONS[lang].muscle[muscle as MuscleGroup]}
                                    </div>
                                    <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden relative">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-1000 ${zone.color}`}
                                            style={{ width: `${Math.min(100, (count / maxVal) * 100)}%` }}
                                        ></div>
                                    </div>
                                    <div className={`w-8 text-xs font-mono font-bold text-right ${zone.textColor}`}>
                                        {count}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* --- Full Screen Picker Modal --- */}
            {showPicker && (
                <div className="fixed inset-0 z-[60] bg-zinc-950 flex flex-col animate-in slide-in-from-bottom duration-200">
                    <div className="glass px-4 h-16 shrink-0 flex items-center gap-3 border-b border-white/5">
                        <button onClick={() => setShowPicker(false)} className="p-2 -ml-2 text-zinc-400 hover:text-white">
                            <Icon name="X" size={24} />
                        </button>
                        <div className="relative flex-1">
                            <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                            <input 
                                autoFocus
                                type="text" 
                                placeholder={t.searchPlaceholder}
                                className="w-full bg-zinc-800/50 rounded-xl py-2 pl-9 pr-4 text-sm font-medium focus:ring-2 focus:ring-red-500 border-none outline-none text-white placeholder-zinc-400"
                                value={pickerSearch}
                                onChange={e => setPickerSearch(e.target.value)}
                            />
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-2 scroll-container">
                        <div className="space-y-1">
                            {filteredExercises.map(ex => (
                                <button
                                    key={ex!.id}
                                    onClick={() => {
                                        setSelectedExId(ex!.id);
                                        setShowPicker(false);
                                    }}
                                    className={`w-full text-left p-3 rounded-xl active:scale-[0.99] transition-all flex items-center justify-between group
                                        ${selectedExId === ex!.id ? 'bg-red-900/10 border border-red-900/50' : 'hover:bg-white/5 border border-transparent'}
                                    `}
                                >
                                    <div>
                                        <div className={`font-bold text-sm ${selectedExId === ex!.id ? 'text-red-400' : 'text-zinc-100'}`}>
                                            {getTranslated(ex!.name, lang)}
                                        </div>
                                        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-0.5">
                                            {TRANSLATIONS[lang].muscle[ex!.muscle]}
                                        </div>
                                    </div>
                                    {selectedExId === ex!.id && (
                                        <div className="text-red-500">
                                            <Icon name="Check" size={18} />
                                        </div>
                                    )}
                                </button>
                            ))}
                            {filteredExercises.length === 0 && (
                                <div className="text-center py-10 text-zinc-400 text-xs">
                                    No exercises found in your history matching "{pickerSearch}".
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            
            <TutorialOverlay 
                steps={statsTutorialSteps}
                isActive={!tutorialProgress.stats}
                onComplete={() => markTutorialSeen('stats')}
            />
        </div>
    );
};
