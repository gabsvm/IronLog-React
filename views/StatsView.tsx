import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { TRANSLATIONS } from '../constants';
import { MuscleGroup } from '../types';
import { ProgressChart, ChartDataPoint } from '../components/stats/ProgressChart';
import { SymmetryRadar } from '../components/stats/SymmetryRadar';
import { MuscleHeatmapGrid } from '../components/stats/MuscleHeatmapGrid';
import { getTranslated } from '../utils';
import { Icon } from '../components/ui/Icon';
import { useStatsWorker, ChartMetric } from '../hooks/useStatsWorker';
import { TutorialOverlay } from '../components/ui/TutorialOverlay';
import { ProLock } from '../components/pro/ProLock';
import { useStore } from '../lib/store';
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

const getVolumeZone = (sets: number) => {
    if (sets < 6) return { color: 'bg-yellow-500', label: 'MV', textColor: 'text-yellow-500' };
    if (sets < 12) return { color: 'bg-green-500', label: 'MEV', textColor: 'text-green-500' };
    if (sets <= 22) return { color: 'bg-blue-500', label: 'MAV', textColor: 'text-blue-500' };
    return { color: 'bg-red-500', label: 'MRV', textColor: 'text-red-500' };
};

const chartMetricLabel = (metric: ChartMetric) => {
    switch (metric) {
        case '1rm': return '1RM';
        case 'volume': return 'VOL';
        case 'duration': return 'TIME';
        case 'distance': return 'DIST';
        case 'max_reps': return 'REPS';
        case 'hold_time': return 'HOLD';
        default: return '1RM';
    }
};

export const StatsView: React.FC = () => {
    const { logs, lang, exercises, tutorialProgress, markTutorialSeen } = useApp();
    const activeMeso = useStore(state => state.activeMeso);
    const t = TRANSLATIONS[lang];

    const [selectedExId, setSelectedExId] = useState<string | null>(null);
    const [chartMetric, setChartMetric] = useState<ChartMetric>('1rm');
    const [showPicker, setShowPicker] = useState(false);
    const [pickerSearch, setPickerSearch] = useState('');

    const [volumeData, setVolumeData] = useState<[string, number][]>([]);
    const [rawMuscleCounts, setRawMuscleCounts] = useState<Record<string, number>>({});
    const [availableExercises, setAvailableExercises] = useState<any[]>([]);
    const [chartPoints, setChartPoints] = useState<ChartDataPoint[]>([]);
    const [setTypeDist, setSetTypeDist] = useState<Record<string, number>>({});

    const [loadingOverview, setLoadingOverview] = useState(true);
    const [loadingChart, setLoadingChart] = useState(false);

    const { isWorkerReady, calculateOverview, calculateChartData } = useStatsWorker();

    const safeLogs = useMemo(() => Array.isArray(logs) ? logs : [], [logs]);
    const exerciseMetaById = useMemo(() => {
        const byId = new Map<string, any>();

        for (const ex of exercises) {
            const exId = ex?.id != null ? String(ex.id) : null;
            if (exId && !byId.has(exId)) byId.set(exId, ex);
        }

        for (const log of safeLogs) {
            for (const ex of (log.exercises || [])) {
                const exId = ex?.id != null ? String(ex.id) : null;
                if (!exId || byId.has(exId)) continue;
                byId.set(exId, {
                    id: ex.id,
                    name: ex.name,
                    muscle: ex.muscle,
                    isBodyweight: ex.isBodyweight,
                    isIsometric: ex.isIsometric,
                });
            }
        }

        return byId;
    }, [exercises, safeLogs]);

    const currentEx = selectedExId ? exerciseMetaById.get(String(selectedExId)) : null;

    useEffect(() => {
        if (!currentEx) return;
        const isIsometric = (currentEx as any).isIsometric;
        const isBodyweight = (currentEx as any).isBodyweight;
        const isCardioEx = currentEx?.muscle === 'CARDIO';

        if (isIsometric) {
            setChartMetric('hold_time');
        } else if (isCardioEx) {
            if (chartMetric !== 'duration' && chartMetric !== 'distance') setChartMetric('duration');
        } else if (isBodyweight) {
            if (chartMetric !== 'max_reps' && chartMetric !== 'volume') setChartMetric('max_reps');
        } else {
            if (chartMetric !== '1rm' && chartMetric !== 'volume') setChartMetric('1rm');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedExId]);

    useEffect(() => {
        if (!isWorkerReady) return;

        const loadOverview = async () => {
            setLoadingOverview(true);
            const { volumeData, exerciseFrequency } = await calculateOverview(safeLogs, activeMeso?.id);

            setVolumeData(volumeData);

            const counts: Record<string, number> = {};
            volumeData.forEach(([m, v]) => { counts[m] = v; });
            setRawMuscleCounts(counts);

            const typeCounts: Record<string, number> = {};
            safeLogs.forEach(log => {
                if (activeMeso?.id && log.mesoId !== activeMeso.id) return;
                log.exercises?.forEach(ex => {
                    ex.sets?.forEach(set => {
                        if (set.completed) {
                            const type = set.type || 'regular';
                            typeCounts[type] = (typeCounts[type] || 0) + 1;
                        }
                    });
                });
            });
            setSetTypeDist(typeCounts);

            const sortedExs = Object.entries(exerciseFrequency)
                .sort((a, b) => (b[1] as number) - (a[1] as number))
                .map(([id]) => exerciseMetaById.get(String(id)))
                .filter(Boolean);

            setAvailableExercises(sortedExs);

            if (!selectedExId && sortedExs.length > 0) {
                setSelectedExId(String(sortedExs[0]!.id));
            }

            setLoadingOverview(false);
        };

        loadOverview();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isWorkerReady, safeLogs, activeMeso?.id, exerciseMetaById, selectedExId, calculateOverview]);

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
            getTranslated(ex.name, lang).toLowerCase().includes(pickerSearch.toLowerCase())
        );
    }, [availableExercises, pickerSearch, lang]);

    const maxVal = Math.max(...volumeData.map(d => d[1]), 25);
    const totalSets = (Object.values(setTypeDist) as number[]).reduce((a, b) => a + b, 0);
    const trackedMuscles = volumeData.filter(([, count]) => count > 0).length;
    const hasData = totalSets > 0;
    const hasExerciseHistory = availableExercises.length > 0;

    const overviewPills = [
        { label: lang === 'es' ? 'Sesiones' : 'Sessions', value: safeLogs.filter(log => !log.skipped).length },
        { label: lang === 'es' ? 'Ejercicios' : 'Exercises', value: availableExercises.length },
        { label: lang === 'es' ? 'Series' : 'Sets', value: totalSets },
        { label: lang === 'es' ? 'Musculos' : 'Muscles', value: trackedMuscles },
    ];

    const doughnutData = {
        labels: Object.keys(setTypeDist).map(k => t.types[k] || k),
        datasets: [{
            data: Object.values(setTypeDist),
            backgroundColor: [
                'rgb(var(--primary-500))', '#ea580c', '#ca8a04', '#16a34a', '#2563eb', '#9333ea'
            ],
            borderWidth: 0,
            hoverOffset: 4
        }]
    };

    const prHistory = useMemo(() => {
        const bestMap: Record<string, { e1rm: number; weight: number; reps: number; date: number; name: string; muscle: string }> = {};

        safeLogs.forEach(log => {
            if (log.skipped) return;
            (log.exercises || []).forEach(ex => {
                if (!ex.id || ex.isBodyweight || ex.isIsometric || ex.muscle === 'CARDIO') return;
                const working = (ex.sets || []).filter(set => set.completed && set.type !== 'warmup' && set.type !== 'avt_hop');
                working.forEach(set => {
                    const weight = Number(set.weight || 0);
                    const reps = Number(set.reps || 0);
                    if (weight <= 0 || reps <= 0) return;
                    const e1rm = weight * (1 + reps / 30);
                    const existing = bestMap[String(ex.id)];
                    if (!existing || e1rm > existing.e1rm) {
                        bestMap[String(ex.id)] = {
                            e1rm,
                            weight,
                            reps,
                            date: log.startTime,
                            name: getTranslated(ex.name, lang),
                            muscle: ex.muscle
                        };
                    }
                });
            });
        });

        return Object.entries(bestMap)
            .sort((a, b) => b[1].date - a[1].date)
            .slice(0, 20);
    }, [safeLogs, lang]);

    const [showAllPRs, setShowAllPRs] = useState(false);
    const displayedPRs = showAllPRs ? prHistory : prHistory.slice(0, 6);

    const metricButtons = (() => {
        const isIsometric = (currentEx as any)?.isIsometric;
        const isBW = (currentEx as any)?.isBodyweight && !isIsometric;
        const isCardioEx = currentEx?.muscle === 'CARDIO';

        if (isIsometric) return ['hold_time'] as ChartMetric[];
        if (isBW) return ['max_reps', 'volume'] as ChartMetric[];
        if (isCardioEx) return ['duration', 'distance'] as ChartMetric[];
        return ['1rm', 'volume'] as ChartMetric[];
    })();

    const statsTutorialSteps = [
        { targetId: 'tut-progress-chart', title: t.tutorial.stats[0].title, text: t.tutorial.stats[0].text, position: 'bottom' as const },
        { targetId: 'tut-radar-chart', title: t.tutorial.stats[1].title, text: t.tutorial.stats[1].text, position: 'top' as const },
        { targetId: 'tut-vol-bar', title: t.tutorial.stats[2].title, text: t.tutorial.stats[2].text, position: 'top' as const }
    ];

    return (
        <div className="relative space-y-4 px-4 pb-24 pt-3">
            <div className="px-1">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h2 className="text-[1.7rem] font-black tracking-[-0.05em] text-white">Stats</h2>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                            {activeMeso
                                ? `${lang === 'es' ? 'Meso activo' : 'Active meso'} · ${t.week} ${activeMeso.week}`
                                : (lang === 'es' ? 'Historial global' : 'All-time history')}
                        </p>
                    </div>
                    {activeMeso && (
                        <div className="rounded-full border border-primary-500/15 bg-primary-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary-300">
                            {activeMeso.isDeload ? 'DELOAD' : activeMeso.mesoType}
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {overviewPills.map(pill => (
                    <div key={pill.label} className="rounded-2xl border border-white/6 bg-white/[0.03] px-3 py-3">
                        <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">{pill.label}</div>
                        <div className="mt-1 text-xl font-black tracking-[-0.04em] text-white">{pill.value}</div>
                    </div>
                ))}
            </div>

            <div id="tut-progress-chart" className="glass-card overflow-hidden rounded-[1.7rem] border border-white/6 p-5 shadow-md">
                <div className="mb-5 flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500/10 text-primary-500">
                                <Icon name="TrendingUp" size={16} />
                            </div>
                            <div>
                                <h3 className="font-bold text-white">{t.statsProgress}</h3>
                                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">
                                    {hasExerciseHistory
                                        ? `${availableExercises.length} ${lang === 'es' ? 'ejercicios con historial' : 'tracked exercises'}`
                                        : (lang === 'es' ? 'Sin historial cargado' : 'No history loaded')}
                                </p>
                            </div>
                        </div>

                        <div className="flex rounded-xl border border-white/5 bg-white/5 p-1">
                            {metricButtons.map(metric => (
                                <button
                                    key={metric}
                                    onClick={() => setChartMetric(metric)}
                                    className={`rounded-md px-3 py-1 text-[10px] font-black transition-all ${
                                        chartMetric === metric
                                            ? 'bg-primary-500 text-white shadow-[0_2px_8px] shadow-primary-500/25'
                                            : 'text-zinc-500 hover:text-zinc-300'
                                    }`}
                                >
                                    {chartMetricLabel(metric)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={() => { setPickerSearch(''); setShowPicker(true); }}
                        className="flex w-full items-center justify-between rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 text-left text-white outline-none transition-colors active:bg-white/10 focus:ring-2 focus:ring-primary-500"
                    >
                        <span className="truncate text-sm font-bold">
                            {loadingOverview
                                ? t.loading
                                : currentEx ? getTranslated(currentEx.name, lang) : t.selectEx}
                        </span>
                        <Icon name="CornerDownRight" size={16} className="text-zinc-400" />
                    </button>
                </div>

                {selectedExId && hasExerciseHistory ? (
                    <ProgressChart
                        dataPoints={chartPoints}
                        metric={chartMetric as any}
                        loading={loadingChart}
                    />
                ) : (
                    <div className="flex h-60 flex-col items-center justify-center rounded-[1.4rem] border border-dashed border-white/8 bg-white/[0.02] px-6 text-center">
                        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.04] text-zinc-500">
                            <Icon name="BarChart3" size={20} />
                        </div>
                        <p className="text-sm font-bold text-white">
                            {lang === 'es' ? 'Aun no hay ejercicios para graficar' : 'No exercises ready to chart yet'}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">
                            {lang === 'es'
                                ? 'Completa entrenamientos sincronizados para ver progresion por ejercicio.'
                                : 'Complete synced workouts to unlock exercise progress.'}
                        </p>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div id="tut-radar-chart" className="glass-card flex min-h-[320px] h-full flex-col overflow-hidden rounded-[1.7rem] border border-white/6 p-5 shadow-md">
                    <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-zinc-500">
                        <Icon name="Activity" size={14} /> {t.statsBalance}
                    </h3>
                    <div className="relative flex flex-1 items-center justify-center">
                        <ProLock featureName="Radar Analysis">
                            <div className="h-64 w-full">
                                <SymmetryRadar volumeData={rawMuscleCounts} />
                            </div>
                        </ProLock>
                    </div>
                </div>

                <div className="glass-card flex min-h-[320px] h-full flex-col rounded-[1.7rem] border border-white/6 p-5 shadow-md">
                    <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-zinc-500">
                        <Icon name="Layers" size={14} /> {t.statsIntensity}
                    </h3>
                    <div className="relative flex flex-1 flex-col items-center justify-center">
                        <ProLock featureName="Intensity Dist.">
                            {hasData ? (
                                <div className="relative h-48 w-48">
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
                                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-3xl font-black tracking-[-0.05em] text-white">{totalSets}</span>
                                        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">{t.statsSets}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3 opacity-60 flex flex-col items-center justify-center">
                                    <div className="flex h-32 w-32 items-center justify-center rounded-full border-[12px] border-zinc-800">
                                        <Icon name="CloudOff" size={24} className="text-zinc-600" />
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">{t.statsNoData}</span>
                                </div>
                            )}
                        </ProLock>
                    </div>
                </div>
            </div>

            <div className="glass-card relative overflow-hidden rounded-[1.7rem] border border-white/6 p-5 shadow-md">
                <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full bg-primary-500/5 blur-[80px]"></div>
                <div className="relative z-10 mb-5 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-zinc-500">
                        <Icon name="Grid3x3" size={14} />
                        {lang === 'es' ? 'Mapa de Calor Muscular' : 'Muscle Heatmap'}
                    </h3>
                </div>

                {loadingOverview ? (
                    <div className="h-48 animate-pulse rounded-2xl bg-zinc-800/50"></div>
                ) : (
                    <div className="relative z-10">
                        <MuscleHeatmapGrid volumeData={volumeData} lang={lang} />
                    </div>
                )}
            </div>

            <div id="tut-vol-bar" className="glass-card rounded-[1.7rem] border border-white/6 p-5 shadow-md">
                <div className="mb-5 flex items-center justify-between gap-3">
                    <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-zinc-500">
                        <Icon name="BarChart2" size={14} />
                        {t.volPerCycle}
                    </h3>
                    <div className="flex gap-2">
                        {['MV', 'MEV', 'MAV'].map(label => (
                            <div key={label} className="flex items-center gap-1">
                                <div className={`h-2 w-2 rounded-full ${label === 'MV' ? 'bg-yellow-500' : label === 'MEV' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                                <span className="text-[9px] font-bold text-zinc-400">{label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {loadingOverview ? (
                    <div className="space-y-4 animate-pulse">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="h-4 w-24 rounded bg-zinc-800"></div>
                                <div className="h-4 flex-1 rounded-full bg-zinc-800"></div>
                                <div className="h-4 w-6 rounded bg-zinc-800"></div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-3.5">
                        {volumeData.map(([muscle, count]) => {
                            const zone = getVolumeZone(count);
                            return (
                                <div key={muscle} className="group flex items-center gap-3">
                                    <div className="w-24 truncate text-right text-xs font-bold text-zinc-500">
                                        {TRANSLATIONS[lang].muscle[muscle as MuscleGroup]}
                                    </div>
                                    <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ${zone.color}`}
                                            style={{ width: `${Math.min(100, (count / maxVal) * 100)}%` }}
                                        />
                                    </div>
                                    <div className={`w-8 text-right text-xs font-mono font-bold ${zone.textColor}`}>{count}</div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {prHistory.length > 0 && (
                <div className="glass-card rounded-[1.7rem] border border-white/6 p-5 shadow-md">
                    <div className="mb-5 flex items-center justify-between">
                        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-zinc-500">
                            <Icon name="Trophy" size={14} />
                            {lang === 'es' ? 'Records Personales' : 'Personal Records'}
                        </h3>
                        <span className="text-[10px] font-bold uppercase text-zinc-600">{lang === 'es' ? 'e1RM estimado' : 'est. e1RM'}</span>
                    </div>

                    <div className="space-y-2">
                        {displayedPRs.map(([exId, pr]) => {
                            const dateStr = new Date(pr.date).toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: '2-digit'
                            });
                            return (
                                <div key={exId} className="flex items-center gap-3 border-b border-zinc-800/60 py-2 last:border-0">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-yellow-500/10 text-yellow-500 text-sm">T</div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-bold text-white">{pr.name}</p>
                                        <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                                            {TRANSLATIONS[lang].muscle[pr.muscle as MuscleGroup]} · {dateStr}
                                        </p>
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <p className="text-sm font-black text-white">
                                            {pr.weight}<span className="ml-0.5 text-[10px] text-zinc-500">kg</span>
                                        </p>
                                        <p className="text-[10px] text-zinc-500">
                                            x{pr.reps} · <span className="font-bold text-yellow-500">{Math.round(pr.e1rm)}kg</span>
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {prHistory.length > 6 && (
                        <button
                            onClick={() => setShowAllPRs(v => !v)}
                            className="mt-3 w-full py-1 text-center text-xs font-bold text-zinc-500 transition-colors hover:text-zinc-300"
                        >
                            {showAllPRs
                                ? (lang === 'es' ? '↑ Ver menos' : '↑ Show less')
                                : (lang === 'es' ? `↓ Ver todos (${prHistory.length})` : `↓ Show all (${prHistory.length})`)}
                        </button>
                    )}
                </div>
            )}

            {showPicker && (
                <div className="fixed inset-0 z-sheet flex flex-col bg-zinc-950 animate-in slide-in-from-bottom duration-200">
                    <div className="glass flex h-16 shrink-0 items-center gap-3 border-b border-white/5 px-4">
                        <button onClick={() => setShowPicker(false)} className="-ml-2 p-2 text-zinc-400 hover:text-white">
                            <Icon name="X" size={24} />
                        </button>
                        <div className="relative flex-1">
                            <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                            <input
                                autoFocus
                                type="text"
                                placeholder={t.searchPlaceholder}
                                className="glow-input-neon w-full rounded-xl border border-zinc-700/50 bg-zinc-800/50 py-2 pl-9 pr-4 text-sm font-medium text-white outline-none transition-all placeholder-zinc-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                                value={pickerSearch}
                                onChange={event => setPickerSearch(event.target.value)}
                            />
                        </div>
                    </div>

                    <div className="scroll-container flex-1 overflow-y-auto p-2">
                        <div className="space-y-1">
                            {filteredExercises.map(ex => (
                                <button
                                    key={ex.id}
                                    onClick={() => {
                                        setSelectedExId(String(ex.id));
                                        setShowPicker(false);
                                    }}
                                    className={`group flex w-full items-center justify-between rounded-xl border p-3 text-left transition-all active:scale-[0.99] ${
                                        selectedExId === String(ex.id)
                                            ? 'border-primary-500/30 bg-primary-500/10'
                                            : 'border-transparent hover:bg-white/5'
                                    }`}
                                >
                                    <div>
                                        <div className={`text-sm font-bold ${selectedExId === String(ex.id) ? 'text-primary-400' : 'text-zinc-100'}`}>
                                            {getTranslated(ex.name, lang)}
                                        </div>
                                        <div className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                                            {TRANSLATIONS[lang].muscle[ex.muscle]}
                                        </div>
                                    </div>
                                    {selectedExId === String(ex.id) && (
                                        <div className="text-primary-500">
                                            <Icon name="Check" size={18} />
                                        </div>
                                    )}
                                </button>
                            ))}

                            {filteredExercises.length === 0 && (
                                <div className="py-10 text-center text-xs text-zinc-400">
                                    {lang === 'es'
                                        ? `No hay ejercicios en tu historial que coincidan con "${pickerSearch}".`
                                        : `No exercises found in your history matching "${pickerSearch}".`}
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
