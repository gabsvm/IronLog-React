// S6: Stats state, worker effects and derived data, moved verbatim from
// views/StatsViewImpl.tsx (the view is now an orchestrator + one component per tab).
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../constants';
import { ChartDataPoint } from '../../components/stats/ProgressChart';
import { buildWeeklyReport, filterWeekPRs } from '../../utils/weeklyReport';
import { getTranslated } from '../../utils';
import { useStatsWorker, ChartMetric } from '../../hooks/useStatsWorker';
import { useStore } from '../../lib/store';
import { buildStatsLogsSignature, statsCache } from '../../services/statsCache';
import { countSessionsByScope, scopeMesoId as scopeMesoIdFor, StatsScope } from '../../utils/statsScope';
import { buildDoughnutData, buildIntensityPalette } from '../../utils/chartColors';
import { resolveWeightUnit, unitLabel } from '../../utils/units';
import { aggregateExerciseFrequency, exerciseIdGroup, matchesExerciseQuery, resolveExerciseId } from '../../utils/exerciseLibrary';
import { buildSelectedExerciseInsight } from './exerciseInsight';

export const useStatsData = ({ activeTab, hideHeader, statsScope }: { activeTab?: 'overview' | 'progress' | 'volume'; hideHeader: boolean; statsScope: StatsScope }) => {
    const { logs, lang, exercises, tutorialProgress, markTutorialSeen, userProfile, config, rpFeedback } = useApp();
    const activeMeso = useStore(state => state.activeMeso);
    const t = TRANSLATIONS[lang];
    const s = t.statsView;
    const unit = resolveWeightUnit(config);
    const weightSuffix = unitLabel(unit).toLowerCase();

    const [selectedExId, setSelectedExId] = useState<string | null>(null);
    const [chartMetric, setChartMetric] = useState<ChartMetric>('1rm');
    const [showPicker, setShowPicker] = useState(false);
    const [pickerSearch, setPickerSearch] = useState('');

    const [volumeData, setVolumeData] = useState<[string, number][]>([]);
    const [rawMuscleCounts, setRawMuscleCounts] = useState<Record<string, number>>({});
    const [availableExercises, setAvailableExercises] = useState<any[]>([]);
    const [chartPoints, setChartPoints] = useState<ChartDataPoint[]>([]);
    const [setTypeDist, setSetTypeDist] = useState<Record<string, number>>({});
    const [overviewWeeks, setOverviewWeeks] = useState(1);

    const [loadingOverview, setLoadingOverview] = useState(true);
    const [loadingChart, setLoadingChart] = useState(false);

    const { isWorkerReady, calculateOverview, calculateChartData } = useStatsWorker();

    const safeLogs = useMemo(() => Array.isArray(logs) ? logs : [], [logs]);
    const logsSignature = useMemo(() => buildStatsLogsSignature(safeLogs), [safeLogs]);
    const scopeMesoId = scopeMesoIdFor(statsScope, activeMeso?.id);
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

    // Merged duplicates fold into their canonical exercise: counts aggregate
    // under the survivor and merged members never appear as options.
    const exsFromFrequency = useCallback((frequency: Record<string, number>) =>
        aggregateExerciseFrequency(frequency, exercises)
            .sort((a, b) => b[1] - a[1])
            .map(([id]) => exerciseMetaById.get(String(id)))
            .filter(Boolean),
        [exercises, exerciseMetaById],
    );

    // Canonical group (canonical id first) for the merged-aware chart query.
    const selectedGroupIds = useMemo(
        () => (selectedExId ? exerciseIdGroup(exercises, String(selectedExId)) : []),
        [selectedExId, exercises],
    );
    const canonicalSelectedExId = selectedGroupIds.length > 0 ? selectedGroupIds[0] : null;

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

        // A cached selection may point at an id that has since been merged
        // away: follow the pointer to the surviving exercise.
        if (selectedExId) {
            const canonical = resolveExerciseId(exercises, String(selectedExId));
            if (canonical !== String(selectedExId)) {
                setSelectedExId(canonical);
                return;
            }
        }

        if (!selectedExId || !selectedExAvailable || !currentEx) {
            setSelectedExId(String(availableExercises[0]!.id));
        }
    }, [availableExercises, currentEx, exercises, selectedExAvailable, selectedExId]);

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
        const mesoId = scopeMesoId;

        const loadOverview = async () => {
            setLoadingOverview(true);
            const cached = await statsCache.readOverview(logsSignature, mesoId);
            if (cached && !cancelled) {
                setVolumeData(cached.volumeData);
                setRawMuscleCounts(Object.fromEntries(cached.volumeData));
                setSetTypeDist(cached.setTypeDist);
                setOverviewWeeks(cached.weeks ?? 1);

                setAvailableExercises(exsFromFrequency(cached.exerciseFrequency));
                setLoadingOverview(false);
            }

            const { volumeData, exerciseFrequency, weeks } = await calculateOverview(safeLogs, scopeMesoId ?? undefined);
            if (cancelled) return;

            setVolumeData(volumeData);
            setOverviewWeeks(weeks);

            const counts: Record<string, number> = {};
            volumeData.forEach(([m, v]) => { counts[m] = v; });
            setRawMuscleCounts(counts);

            const typeCounts: Record<string, number> = {};
            safeLogs.forEach(log => {
                if (log.skipped) return;
                if (scopeMesoId != null && log.mesoId !== scopeMesoId) return;
                log.exercises?.forEach(ex => {
                    ex.sets?.forEach(set => {
                        if (set.completed && !set.skipped) {
                            const type = set.type || 'regular';
                            typeCounts[type] = (typeCounts[type] || 0) + 1;
                        }
                    });
                });
            });
            setSetTypeDist(typeCounts);

            setAvailableExercises(exsFromFrequency(exerciseFrequency));

            await statsCache.writeOverview(logsSignature, mesoId, {
                volumeData,
                exerciseFrequency,
                setTypeDist: typeCounts,
                weeks,
            });
            setLoadingOverview(false);
        };

        void loadOverview();
        return () => {
            cancelled = true;
        };
    }, [isWorkerReady, safeLogs, scopeMesoId, exerciseMetaById, exsFromFrequency, selectedExId, calculateOverview, logsSignature]);

    useEffect(() => {
        if (!isWorkerReady || !selectedExId || (activeTab && activeTab !== 'progress')) return;

        let cancelled = false;
        // The chart aggregates the whole canonical group (merged history
        // included); the cache key stays on the canonical id.
        const groupIds = selectedGroupIds.length > 0 ? selectedGroupIds : [String(selectedExId)];
        const cacheId = canonicalSelectedExId ?? String(selectedExId);

        const loadChart = async () => {
            setLoadingChart(true);
            const cached = await statsCache.readChart(logsSignature, cacheId, chartMetric, scopeMesoId);
            if (cached && !cancelled) {
                setChartPoints(cached.dataPoints);
                setLoadingChart(false);
            }

            const points = await calculateChartData(safeLogs, groupIds, chartMetric, scopeMesoId);
            if (cancelled) return;
            setChartPoints(points);
            await statsCache.writeChart(logsSignature, cacheId, chartMetric, scopeMesoId, points);
            setLoadingChart(false);
        };

        void loadChart();
        return () => {
            cancelled = true;
        };
    }, [isWorkerReady, selectedExId, selectedGroupIds, canonicalSelectedExId, chartMetric, safeLogs, calculateChartData, logsSignature, activeTab, scopeMesoId]);

    const filteredExercises = useMemo(() => {
        return availableExercises.filter(ex =>
            matchesExerciseQuery(ex, pickerSearch)
        );
    }, [availableExercises, pickerSearch]);

    const maxVal = Math.max(...volumeData.map(d => d[1]), 25);
    const totalSets = (Object.values(setTypeDist) as number[]).reduce((a, b) => a + b, 0);
    const trackedMuscles = volumeData.filter(([, count]) => count > 0).length;
    const hasData = totalSets > 0;
    const hasExerciseHistory = availableExercises.length > 0;

    const overviewPills = [
        { label: s.pillSessions, value: countSessionsByScope(safeLogs, scopeMesoId) },
        { label: s.pillExercises, value: availableExercises.length },
        { label: s.pillSets, value: totalSets },
        { label: s.pillMuscles, value: trackedMuscles },
    ];

    const doughnutData = buildDoughnutData(setTypeDist, t.types as Record<string, string>);
    const intensityPalette = buildIntensityPalette();

    const prHistory = useMemo(() => {
        const bestMap: Record<string, { e1rm: number; weight: number; reps: number; date: number; name: string; muscle: string }> = {};

        safeLogs.forEach(log => {
            if (log.skipped) return;
            if (scopeMesoId != null && log.mesoId !== scopeMesoId) return;
            (log.exercises || []).forEach(ex => {
                if (!ex.id || ex.isBodyweight || ex.isIsometric || ex.muscle === 'CARDIO') return;
                // Merged duplicates share one PR row under the surviving exercise.
                const canonicalId = resolveExerciseId(exercises, String(ex.id));
                const working = (ex.sets || []).filter(set => set.completed && set.type !== 'warmup' && set.type !== 'avt_hop');
                working.forEach(set => {
                    const weight = Number(set.weight || 0);
                    const reps = Number(set.reps || 0);
                    if (weight <= 0 || reps <= 0) return;
                    const e1rm = weight * (1 + reps / 30);
                    const existing = bestMap[canonicalId];
                    if (!existing || e1rm > existing.e1rm) {
                        const canonicalDef = canonicalId !== String(ex.id)
                            ? exercises.find(e => String(e.id) === canonicalId)
                            : null;
                        bestMap[canonicalId] = {
                            e1rm,
                            weight,
                            reps,
                            date: log.startTime,
                            name: canonicalDef ? getTranslated(canonicalDef.name, lang) : getTranslated(ex.name, lang),
                            muscle: ex.muscle
                        };
                    }
                });
            });
        });

        return Object.entries(bestMap)
            .sort((a, b) => b[1].date - a[1].date)
            .slice(0, 20);
    }, [safeLogs, lang, scopeMesoId, exercises]);

    const [showAllPRs, setShowAllPRs] = useState(false);
    const displayedPRs = showAllPRs ? prHistory : prHistory.slice(0, 6);

    // Q15: plan-scoped weekly report (meso coordinates, never the stats scope).
    const weeklyReport = useMemo(
        () => (activeMeso ? buildWeeklyReport({ logs: safeLogs, meso: activeMeso, rpFeedback }) : null),
        [activeMeso, safeLogs, rpFeedback],
    );
    const weekPRs = useMemo(
        () => (activeMeso ? filterWeekPRs(prHistory.map(([, row]) => row), safeLogs, activeMeso.id, activeMeso.week) : 0),
        [activeMeso, prHistory, safeLogs],
    );

    const metricButtons = (() => {
        const isIsometric = (currentEx as any)?.isIsometric;
        const isBW = (currentEx as any)?.isBodyweight && !isIsometric;
        const isCardioEx = currentEx?.muscle === 'CARDIO';

        if (isIsometric) return ['hold_time'] as ChartMetric[];
        if (isBW) return ['max_reps', 'volume'] as ChartMetric[];
        if (isCardioEx) return ['duration', 'distance'] as ChartMetric[];
        return ['1rm', 'volume'] as ChartMetric[];
    })();

    const selectedExerciseInsight = useMemo(
        () => buildSelectedExerciseInsight({ currentEx, exercises, lang, rawMuscleCounts, safeLogs, bodyWeight: userProfile?.bodyWeight, scopeMesoId, unit, weightSuffix, s }),
        [currentEx, exercises, lang, rawMuscleCounts, safeLogs, userProfile?.bodyWeight, scopeMesoId, unit, weightSuffix, s]
    );

    const statsTutorialSteps = [
        { targetId: 'tut-progress-chart', title: t.tutorial.stats[0].title, text: t.tutorial.stats[0].text, position: 'bottom' as const },
        { targetId: 'tut-radar-chart', title: t.tutorial.stats[1].title, text: t.tutorial.stats[1].text, position: 'top' as const },
        { targetId: 'tut-vol-bar', title: t.tutorial.stats[2].title, text: t.tutorial.stats[2].text, position: 'top' as const }
    ];

    return {
        activeTab,
        hideHeader,
        statsScope,
        logs,
        lang,
        exercises,
        tutorialProgress,
        markTutorialSeen,
        userProfile,
        config,
        rpFeedback,
        activeMeso,
        t,
        s,
        unit,
        weightSuffix,
        selectedExId,
        setSelectedExId,
        chartMetric,
        setChartMetric,
        showPicker,
        setShowPicker,
        pickerSearch,
        setPickerSearch,
        volumeData,
        setVolumeData,
        rawMuscleCounts,
        setRawMuscleCounts,
        availableExercises,
        setAvailableExercises,
        chartPoints,
        setChartPoints,
        setTypeDist,
        setSetTypeDist,
        overviewWeeks,
        setOverviewWeeks,
        loadingOverview,
        setLoadingOverview,
        loadingChart,
        setLoadingChart,
        isWorkerReady,
        calculateOverview,
        calculateChartData,
        safeLogs,
        logsSignature,
        scopeMesoId,
        exerciseMetaById,
        exsFromFrequency,
        selectedGroupIds,
        canonicalSelectedExId,
        currentEx,
        selectedExAvailable,
        filteredExercises,
        maxVal,
        totalSets,
        trackedMuscles,
        hasData,
        hasExerciseHistory,
        overviewPills,
        doughnutData,
        intensityPalette,
        prHistory,
        showAllPRs,
        setShowAllPRs,
        displayedPRs,
        weeklyReport,
        weekPRs,
        metricButtons,
        selectedExerciseInsight,
        statsTutorialSteps,
    };
};

export type StatsData = ReturnType<typeof useStatsData>;
