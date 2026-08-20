import React, { useMemo } from 'react';
import type { Log, WorkoutSet } from '../../types';
import { PERFORMANCE_UPPER_LOWER_V1 } from '../../programs/performance/performanceUpperLower';
import { GUTS_BLACK_SWORDSMAN_V1 } from '../../programs/naturalHypertrophy/gutsBlackSwordsman';
import { evaluateNhEvolvingRepCue } from '../../programs/naturalHypertrophy/nhVerifiedKnowledge';
import { getExerciseHistorySummary } from '../../utils/exerciseHistoryIndex';
import { Icon } from '../ui/Icon';
import { SortableExerciseCard as SortableExerciseCardImpl } from './SortableExerciseCardImpl';

type SortableExerciseCardProps = React.ComponentProps<typeof SortableExerciseCardImpl>;
type RangedWorkoutSet = WorkoutSet & { prescribedRepRange?: { min: number; max: number } };
type StructuredProgressExercise = SortableExerciseCardProps['exercise'] & {
    progressionPolicy?: 'double' | 'hold' | 'pivot' | 'evolving';
    performanceVolumeDelta?: number;
};

const makeCompletedSet = (patch: Partial<WorkoutSet>): WorkoutSet => ({
    id: -1,
    weight: '',
    reps: '',
    rpe: '',
    completed: true,
    type: 'regular',
    ...patch,
});

export const SortableExerciseCard = React.memo((props: SortableExerciseCardProps) => {
    const { logs, exercise, lang } = props;
    const structuredExercise = exercise as StructuredProgressExercise;

    const programTargetSummary = useMemo(() => {
        if (!exercise?.programSlotId || !Array.isArray(exercise.sets) || exercise.sets.length === 0) return null;
        const labels = exercise.sets.map((set) => {
            const ranged = set as RangedWorkoutSet;
            if (ranged.prescribedRepRange) return `${ranged.prescribedRepRange.min}–${ranged.prescribedRepRange.max}`;
            if (set.prescribedReps == null) return null;
            return set.prescribedReps === 'FAILURE' ? 'F' : String(set.prescribedReps);
        });
        if (labels.some(value => value == null)) return null;
        const safeLabels = labels as string[];
        return safeLabels.every(label => label === safeLabels[0])
            ? `${safeLabels.length}×${safeLabels[0]}`
            : safeLabels.join('·');
    }, [exercise?.programSlotId, exercise?.sets]);

    const historySummary = useMemo(() => {
        if (!Array.isArray(logs) || logs.length === 0 || exercise?.id == null) return null;
        return getExerciseHistorySummary(logs, String(exercise.id));
    }, [logs, exercise?.id]);

    const progressionSystemId = structuredExercise.progressionPolicy === 'evolving'
        ? GUTS_BLACK_SWORDSMAN_V1.id
        : structuredExercise.progressionPolicy
            ? PERFORMANCE_UPPER_LOWER_V1.id
            : null;

    const previousStructuredSets = useMemo(() => {
        if (!progressionSystemId || !exercise?.programSlotId || exercise?.id == null || !Array.isArray(logs)) return null;
        const ordered = logs
            .filter(log => !log.skipped && log.programSystem?.systemId === progressionSystemId)
            .slice()
            .sort((a, b) => (b.endTime || b.startTime || 0) - (a.endTime || a.startTime || 0));

        for (const log of ordered) {
            const pastExercise = (log.exercises || []).find(item =>
                String(item.id) === String(exercise.id) && item.programSlotId === exercise.programSlotId
            );
            if (!pastExercise) continue;
            const working = (pastExercise.sets || []).filter(set => set.type !== 'warmup' && set.type !== 'avt_hop');
            if (working.length > 0) return working;
        }
        return null;
    }, [exercise?.id, exercise?.programSlotId, logs, progressionSystemId]);

    const progressionCue = useMemo(() => {
        if (!structuredExercise.progressionPolicy || !exercise?.programSlotId || !Array.isArray(exercise.sets) || exercise.sets.length === 0) return null;
        const rangedSets = exercise.sets as RangedWorkoutSet[];
        if (!rangedSets.every(set => !!set.prescribedRepRange)) return null;

        if (structuredExercise.progressionPolicy === 'pivot') {
            return { ready: false, label: lang === 'es' ? 'Pivote · mantené la carga y no busques PR' : 'Pivot · hold load and do not chase PRs' };
        }
        if (structuredExercise.progressionPolicy === 'hold') {
            return { ready: false, label: lang === 'es' ? 'Recovery amarillo · mantené la carga hoy' : 'Yellow recovery · hold load today' };
        }

        const ranges = rangedSets.map(set => set.prescribedRepRange!);
        const minTarget = Math.min(...ranges.map(range => range.min));
        const maxTarget = Math.max(...ranges.map(range => range.max));

        if (!previousStructuredSets) {
            if (structuredExercise.progressionPolicy === 'evolving') {
                return { ready: false, label: lang === 'es' ? `Primera referencia · elegí una carga limpia para ${minTarget}–${maxTarget}` : `First reference · choose a clean ${minTarget}–${maxTarget} load` };
            }
            const targetRpe = rangedSets.find(set => Number.isFinite(Number(set.targetRpe)))?.targetRpe;
            return { ready: false, label: lang === 'es' ? `Primera referencia · elegí carga para RPE ${targetRpe ?? 'objetivo'}` : `First reference · choose load for RPE ${targetRpe ?? 'target'}` };
        }

        const latest = previousStructuredSets
            .filter(set => set.completed && !set.skipped && set.type !== 'warmup' && set.type !== 'avt_hop')
            .slice(0, rangedSets.length);

        if (structuredExercise.progressionPolicy === 'evolving') {
            if (latest.length < rangedSets.length) {
                return { ready: false, label: lang === 'es' ? 'Evolving reps · completá el trabajo antes de evaluar la transición' : 'Evolving reps · complete the work before evaluating the transition' };
            }
            const reps = latest.map(set => Number(set.reps || 0));
            const cue = evaluateNhEvolvingRepCue(reps, minTarget, maxTarget);
            return { ready: cue.ready, label: cue.label[lang === 'es' ? 'es' : 'en'] };
        }

        const targetRpe = rangedSets.find(set => Number.isFinite(Number(set.targetRpe)))?.targetRpe;
        if (latest.length < rangedSets.length) {
            return { ready: false, label: lang === 'es' ? 'Construí reps · mantené la carga' : 'Build reps · hold the load' };
        }
        const hitCeiling = latest.every(set => Number(set.reps || 0) >= maxTarget);
        if (!hitCeiling) {
            return { ready: false, label: lang === 'es' ? 'Construí reps · mantené la carga' : 'Build reps · hold the load' };
        }
        const recordedRpe = latest.map(set => Number(set.rpe)).filter(value => Number.isFinite(value) && value > 0);
        if (targetRpe !== undefined && recordedRpe.length === latest.length) {
            if (Math.max(...recordedRpe) <= targetRpe) {
                return { ready: true, label: lang === 'es' ? 'Techo logrado · subí el mínimo práctico' : 'Rep ceiling earned · add the smallest practical load' };
            }
            return { ready: false, label: lang === 'es' ? 'Techo de reps, esfuerzo alto · mantené carga' : 'Rep ceiling reached, effort high · hold load' };
        }
        return { ready: true, label: lang === 'es' ? `Techo de reps · si fue ≤RPE ${targetRpe ?? 'objetivo'}, subí el mínimo` : `Rep ceiling · if ≤RPE ${targetRpe ?? 'target'}, add the minimum` };
    }, [exercise?.programSlotId, exercise?.sets, lang, previousStructuredSets, structuredExercise.progressionPolicy]);

    const compactHistory = useMemo<Log[]>(() => {
        if (!historySummary || exercise?.id == null) return [];
        const summary = historySummary;
        const synthetic: any[] = [];
        let bestSet: WorkoutSet | null = null;

        if (exercise.isIsometric && summary.bestHoldSeconds > 0) {
            bestSet = makeCompletedSet({ duration: summary.bestHoldSeconds });
        } else if (exercise.isBodyweight && summary.bestBodyweightReps > 0) {
            bestSet = makeCompletedSet({ reps: summary.bestBodyweightReps, weight: summary.bestBodyweightWeight });
        } else if (summary.bestWeighted1RM > 0 && summary.bestWeightedWeight != null && summary.bestWeightedReps != null) {
            bestSet = makeCompletedSet({ weight: summary.bestWeightedWeight, reps: summary.bestWeightedReps });
        }

        if (bestSet) {
            synthetic.push({ id: -1, dayIdx: -1, name: 'history-best', startTime: 0, endTime: 0, duration: 0, mesoId: -1, week: 0, skipped: false, exercises: [{ id: exercise.id, sets: [bestSet] }] });
        }
        if (!exercise.programSlotId && summary.latestWorkingSets && summary.latestWorkingSets.length > 0) {
            synthetic.push({ id: -2, dayIdx: -1, name: 'history-latest', startTime: 1, endTime: 1, duration: 0, mesoId: -1, week: 0, skipped: false, exercises: [{ id: exercise.id, sets: summary.latestWorkingSets }] });
        }
        return synthetic as Log[];
    }, [historySummary, exercise.id, exercise.isBodyweight, exercise.isIsometric, exercise.programSlotId]);

    const displayExercise = useMemo(
        () => programTargetSummary ? { ...exercise, targetReps: programTargetSummary } : exercise,
        [exercise, programTargetSummary],
    );
    const volumeDelta = Number(structuredExercise.performanceVolumeDelta || 0);

    return (
        <div className={progressionCue || volumeDelta !== 0 ? 'space-y-1.5' : undefined}>
            {volumeDelta !== 0 && (
                <div className={`mx-1 flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] font-bold ${volumeDelta > 0 ? 'bg-emerald-500/[0.08] text-emerald-400' : 'bg-amber-500/[0.08] text-amber-400'}`}>
                    <Icon name={volumeDelta > 0 ? 'Plus' : 'Minus'} size={12} />
                    <span className="truncate">{volumeDelta > 0 ? (lang === 'es' ? 'Check-in previo · +1 serie en este slot' : 'Previous check-in · +1 set on this slot') : (lang === 'es' ? 'Check-in previo · −1 serie en este slot' : 'Previous check-in · −1 set on this slot')}</span>
                </div>
            )}
            {progressionCue && (
                <div className={`mx-1 flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] font-bold ${progressionCue.ready ? 'bg-primary-500/[0.08] text-primary-400' : 'bg-[rgb(var(--surface-raised)/0.65)] text-[rgb(var(--text-muted))]'}`}>
                    <Icon name={progressionCue.ready ? 'TrendingUp' : 'Target'} size={12} />
                    <span className="truncate">{progressionCue.label}</span>
                </div>
            )}
            <SortableExerciseCardImpl {...props} exercise={displayExercise} logs={compactHistory} />
        </div>
    );
});
