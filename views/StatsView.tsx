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
import { buildStatsLogsSignature, statsCache } from '../services/statsCache';
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
import { getEffectiveSetLoad, getLogBodyWeight, getSetLoadVolume } from '../utils/trainingMetrics';

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

type PerformanceBand = 'beginner' | 'intermediate' | 'advanced';

const getExerciseStrengthProfile = (exercise: { id?: string; muscle?: string; isBodyweight?: boolean; isIsometric?: boolean; skillLevel?: number } | null) => {
    const id = String(exercise?.id || '').toLowerCase();
    const muscle = exercise?.muscle || '';

    if (exercise?.isIsometric) return 'isometric';
    if (exercise?.isBodyweight) {
        if (/(pullup|chinup)/.test(id)) return 'bw_pull';
        if (/(dip)/.test(id)) return 'bw_dip';
        if (/(pushup|push_up|pu)/.test(id)) return 'bw_push';
        if (/(pistol|one_leg_squat|single_leg_squat)/.test(id)) return 'bw_single_leg';
        return 'bw_generic';
    }

    if (/(deadlift|rdl|rack_pull|good_morning)/.test(id)) return 'hinge';
    if (/(squat|leg_press|hack|lunge|split_squat|bulgarian|step_up)/.test(id)) return 'squat';
    if (/(shoulder_press|ohp|military_press|arnold_press)/.test(id)) return 'vertical_press';
    if (/(bench|chest_press|incline_press|decline_press|dip)/.test(id)) return 'horizontal_press';
    if (/(row|pulldown|pullup|chinup|lat_|seated_row)/.test(id)) return 'upper_pull';
    if (/(curl|pushdown|extension|lateral_raise|fly|pec_deck|rear_delt)/.test(id)) return 'isolation';
    if (muscle === 'QUADS' || muscle === 'HAMSTRINGS' || muscle === 'GLUTES') return 'squat';
    if (muscle === 'CHEST') return 'horizontal_press';
    if (muscle === 'BACK') return 'upper_pull';
    if (muscle === 'SHOULDERS') return 'vertical_press';
    return 'isolation';
};

const getWeightedLevel = (profile: string, relativeStrength: number): PerformanceBand => {
    const thresholds: Record<string, [number, number]> = {
        squat: [1, 1.8],
        hinge: [1.25, 2],
        horizontal_press: [0.85, 1.25],
        vertical_press: [0.6, 0.9],
        upper_pull: [0.9, 1.4],
        isolation: [0.25, 0.45],
    };
    const [intermediateFloor, advancedFloor] = thresholds[profile] || thresholds.isolation;
    if (relativeStrength >= advancedFloor) return 'advanced';
    if (relativeStrength >= intermediateFloor) return 'intermediate';
    return 'beginner';
};

const getBodyweightLevel = (profile: string, reps: number, addedLoad: number, skillLevel?: number, bestHoldSeconds?: number): PerformanceBand => {
    if (typeof skillLevel === 'number') {
        if (skillLevel >= 4) return 'advanced';
        if (skillLevel >= 2) return 'intermediate';
        return 'beginner';
    }
    if (typeof bestHoldSeconds === 'number' && bestHoldSeconds > 0) {
        if (bestHoldSeconds >= 30) return 'advanced';
        if (bestHoldSeconds >= 15) return 'intermediate';
        return 'beginner';
    }
    if (addedLoad > 0) return addedLoad >= 20 ? 'advanced' : 'intermediate';

    const thresholds: Record<string, [number, number]> = {
        bw_pull: [5, 12],
        bw_dip: [8, 15],
        bw_push: [15, 30],
        bw_single_leg: [5, 10],
        bw_generic: [10, 20],
    };
    const [intermediateFloor, advancedFloor] = thresholds[profile] || thresholds.bw_generic;
    if (reps >= advancedFloor) return 'advanced';
    if (reps >= intermediateFloor) return 'intermediate';
    return 'beginner';
};

export const StatsView: React.FC = () => {
    const { logs, lang, exercises, tutorialProgress, markTutorialSeen, userProfile } = useApp();
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
    const logsSignature = useMemo(() => buildStatsLogsSignature(safeLogs), [safeLogs]);
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
    const selectedExAvailable = useMemo(() => {
        if (!selectedExId) return false;
        return availableExercises.some(ex => String(ex.id) === String(selectedExId));
    }, [availableExercises, selectedExId]);

    useEffect(() => {
        let cancelled = false;

        void statsCache.readSelectedExercise().then((cachedExerciseId) => {
            if (!cancelled && cachedExerciseId) {
                setSelectedExId(prev => prev || cachedExerciseId);
            }
        });

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        void statsCache.writeSelectedExercise(selectedExId);
    }, [selectedExId]);

    useEffect(() => {
        if (availableExercises.length === 0) {
            if (selectedExId !== null) {
                setSelectedExId(null);
            }
            return;
        }

        if (!selectedExId || !selectedExAvailable || !currentEx) {
            setSelectedExId(String(availableExercises[0]!.id));
        }
    }, [availableExercises, currentEx, selectedExAvailable, selectedExId]);

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

        let cancelled = false;
        const mesoId = activeMeso?.id ?? null;

        const loadOverview = async () => {
            setLoadingOverview(true);
            const cached = await statsCache.readOverview(logsSignature, mesoId);
            if (cached && !cancelled) {
                setVolumeData(cached.volumeData);
                setRawMuscleCounts(Object.fromEntries(cached.volumeData));
                setSetTypeDist(cached.setTypeDist);

                const sortedExs = Object.entries(cached.exerciseFrequency)
                    .sort((a, b) => (b[1] as number) - (a[1] as number))
                    .map(([id]) => exerciseMetaById.get(String(id)))
                    .filter(Boolean);

                setAvailableExercises(sortedExs);
                setLoadingOverview(false);
            }

            const { volumeData, exerciseFrequency } = await calculateOverview(safeLogs, activeMeso?.id);
            if (cancelled) return;

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

            await statsCache.writeOverview(logsSignature, mesoId, {
                volumeData,
                exerciseFrequency,
                setTypeDist: typeCounts,
            });
            setLoadingOverview(false);
        };

        void loadOverview();
        return () => {
            cancelled = true;
        };
    }, [isWorkerReady, safeLogs, activeMeso?.id, exerciseMetaById, selectedExId, calculateOverview, logsSignature]);

    useEffect(() => {
        if (!isWorkerReady || !selectedExId) return;

        let cancelled = false;

        const loadChart = async () => {
            setLoadingChart(true);
            const cached = await statsCache.readChart(logsSignature, selectedExId, chartMetric);
            if (cached && !cancelled) {
                setChartPoints(cached.dataPoints);
                setLoadingChart(false);
            }

            const points = await calculateChartData(safeLogs, selectedExId, chartMetric);
            if (cancelled) return;
            setChartPoints(points);
            await statsCache.writeChart(logsSignature, selectedExId, chartMetric, points);
            setLoadingChart(false);
        };

        void loadChart();
        return () => {
            cancelled = true;
        };
    }, [isWorkerReady, selectedExId, chartMetric, safeLogs, calculateChartData, logsSignature]);

    const filteredExercises = useMemo(() => {
        return availableExercises.filter(ex =>
            String(getTranslated(ex.name, lang) || '').toLowerCase().includes(pickerSearch.toLowerCase())
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

    const selectedExerciseInsight = useMemo(() => {
        if (!currentEx) return null;

        const matchingLogs = safeLogs.filter(log => !log.skipped);
        let bestReps = 0;
        let bestAddedLoad = 0;
        let bestEstimated1RM = 0;
        let bestHoldSeconds = 0;
        let totalVolume = 0;

        matchingLogs.forEach(log => {
            const logBodyWeight = getLogBodyWeight(log, userProfile?.bodyWeight);
            const exercise = (log.exercises || []).find(ex => String(ex.id) === String(currentEx.id));
            if (!exercise) return;

            (exercise.sets || []).forEach(set => {
                if (!set.completed || set.skipped) return;

                const reps = Number(set.reps || 0);
                const addedLoad = Number(set.weight || 0);
                const effectiveLoad = getEffectiveSetLoad(set, exercise, logBodyWeight);

                totalVolume += getSetLoadVolume(set, exercise, logBodyWeight);
                if (reps > bestReps) bestReps = reps;
                if (addedLoad > bestAddedLoad) bestAddedLoad = addedLoad;
                if (Number(set.duration || 0) > bestHoldSeconds) bestHoldSeconds = Number(set.duration || 0);

                if (effectiveLoad > 0 && reps > 0 && !exercise.isIsometric && exercise.muscle !== 'CARDIO') {
                    const e1rm = effectiveLoad * (1 + reps / 30);
                    if (e1rm > bestEstimated1RM) bestEstimated1RM = e1rm;
                }
            });
        });

        const profile = getExerciseStrengthProfile(currentEx);
        const muscleWeeklySets = rawMuscleCounts[currentEx.muscle] || 0;
        const volumeStatus =
            muscleWeeklySets < 6 ? { id: 'low', label: lang === 'es' ? 'Bajo' : 'Low' } :
            muscleWeeklySets < 10 ? { id: 'maintenance', label: lang === 'es' ? 'Base' : 'Base' } :
            muscleWeeklySets <= 20 ? { id: 'optimal', label: lang === 'es' ? 'Optimo' : 'Optimal' } :
            { id: 'high', label: lang === 'es' ? 'Alto' : 'High' };

        let level: PerformanceBand | null = null;
        let rationale = '';

        if (currentEx.isBodyweight) {
            level = getBodyweightLevel(profile, bestReps, bestAddedLoad, (currentEx as any).skillLevel, bestHoldSeconds);
            rationale = currentEx.isIsometric
                ? (lang === 'es'
                    ? `Mejor hold: ${bestHoldSeconds}s`
                    : `Best hold: ${bestHoldSeconds}s`)
                : (lang === 'es'
                    ? `Mejor set: ${bestReps} reps${bestAddedLoad > 0 ? ` + ${bestAddedLoad}kg` : ''}`
                    : `Best set: ${bestReps} reps${bestAddedLoad > 0 ? ` + ${bestAddedLoad}kg` : ''}`);
        } else if (!currentEx.isIsometric && currentEx.muscle !== 'CARDIO' && userProfile?.bodyWeight) {
            const relativeStrength = bestEstimated1RM / userProfile.bodyWeight;
            level = getWeightedLevel(profile, relativeStrength);
            rationale = lang === 'es'
                ? `Est. 1RM relativo: ${relativeStrength.toFixed(2)}x peso corporal`
                : `Relative est. 1RM: ${relativeStrength.toFixed(2)}x bodyweight`;
        } else if (!currentEx.isIsometric && currentEx.muscle !== 'CARDIO' && bestEstimated1RM > 0) {
            level = bestEstimated1RM >= 100 ? 'advanced' : bestEstimated1RM >= 50 ? 'intermediate' : 'beginner';
            rationale = lang === 'es'
                ? `Est. 1RM: ${Math.round(bestEstimated1RM)}kg (sin peso corporal cargado)`
                : `Est. 1RM: ${Math.round(bestEstimated1RM)}kg (no bodyweight profile set)`;
        }

        const volumeBasis = currentEx.muscle === 'CARDIO'
            ? (lang === 'es'
                ? 'Cardio usa tiempo o distancia, no tonelaje.'
                : 'Cardio uses time or distance, not load tonnage.')
            : currentEx.isIsometric
                ? (lang === 'es'
                    ? 'Isometricos usan segundos de hold como progreso principal.'
                    : 'Isometrics use hold seconds as the main progress signal.')
                : currentEx.isBodyweight
                    ? (lang === 'es'
                        ? `El volumen de carga suma tu peso corporal${userProfile?.bodyWeight ? ` (${userProfile.bodyWeight}kg)` : ''} y cualquier lastre.`
                        : `Load volume adds your bodyweight${userProfile?.bodyWeight ? ` (${userProfile.bodyWeight}kg)` : ''} plus any added load.`)
                    : (lang === 'es'
                        ? 'Maquinas, poleas y pesos libres usan el peso que registras como carga externa.'
                        : 'Machines, cables, and free weights use the logged load as external resistance.');

        return {
            volumeBasis,
            level,
            rationale,
            totalVolume,
            muscleWeeklySets,
            volumeStatus,
        };
    }, [currentEx, lang, rawMuscleCounts, safeLogs, userProfile?.bodyWeight]);

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
                            {lang === 'es' ? 'Aún no hay ejercicios para graficar' : 'No exercises ready to chart yet'}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">
                            {lang === 'es'
                                ? 'Completa entrenamientos sincronizados para ver progresión por ejercicio.'
                                : 'Complete synced workouts to unlock exercise progress.'}
                        </p>
                    </div>
                )}
            </div>

            {selectedExerciseInsight && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="glass-card rounded-[1.7rem] border border-white/6 p-5 shadow-md">
                        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-zinc-500">
                            <Icon name="Scale" size={14} />
                            {lang === 'es' ? 'Base de Volumen' : 'Volume Basis'}
                        </h3>
                        <p className="text-sm leading-relaxed text-zinc-300">
                            {selectedExerciseInsight.volumeBasis}
                        </p>
                        {selectedExerciseInsight.totalVolume > 0 && (
                            <div className="mt-4 rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-3">
                                <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                                    {lang === 'es' ? 'Carga total acumulada' : 'Accumulated load volume'}
                                </div>
                                <div className="mt-1 text-2xl font-black tracking-[-0.04em] text-white">
                                    {Math.round(selectedExerciseInsight.totalVolume).toLocaleString()} kg
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="glass-card rounded-[1.7rem] border border-white/6 p-5 shadow-md">
                        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-zinc-500">
                            <Icon name="Award" size={14} />
                            {lang === 'es' ? 'Nivel Actual' : 'Current Level'}
                        </h3>
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <div className="text-2xl font-black capitalize tracking-[-0.04em] text-white">
                                    {selectedExerciseInsight.level || (lang === 'es' ? 'Sin clasificar' : 'Unrated')}
                                </div>
                                <p className="mt-1 text-sm text-zinc-400">
                                    {selectedExerciseInsight.rationale || (lang === 'es' ? 'Falta historial suficiente para clasificar.' : 'Not enough history to classify yet.')}
                                </p>
                            </div>
                            <div className="rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-3 text-right">
                                <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                                    {lang === 'es' ? 'Series semanales del musculo' : 'Weekly muscle sets'}
                                </div>
                                <div className="mt-1 text-xl font-black text-white">
                                    {selectedExerciseInsight.muscleWeeklySets}
                                </div>
                                <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-primary-300">
                                    {selectedExerciseInsight.volumeStatus.label}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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

