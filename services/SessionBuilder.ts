import { ProgramDay, MesoCycle, ExerciseDef, Log, ActiveSession, SessionExercise } from '../types';
import { getLastLogForExercise, uid } from '../utils';
import { KONG_4DAY_V1 } from '../programs/kong/kong4Day';
import { PERFORMANCE_UPPER_LOWER_V1 } from '../programs/performance/performanceUpperLower';
import { consumePendingPerformanceRecoveryMode } from '../programs/performance/performanceRecovery';
import { getProgramBlockForWeek, resolveProgramDay } from '../programs/engine/ProgramResolver';
import { getKongDayDisplay } from '../programs/kong/kongDisplay';
import { getProgramDefinition } from '../programs/registry';

export class SessionBuilder {
    static buildFromProgramDay(
        dayIdx: number,
        programDay: ProgramDay,
        activeMeso: MesoCycle,
        exercises: ExerciseDef[],
        logs: Log[],
        lang: string,
        rpFeedback: Record<string, Record<string, Record<string, any>>>,
        config: { rpEnabled: boolean }
    ): ActiveSession | null {
        if (!programDay) return null;

        const structuredDefinition = activeMeso.programSystem
            ? getProgramDefinition(activeMeso.programSystem.systemId, activeMeso.programSystem.systemVersion)
            : null;
        const isKong = structuredDefinition?.id === KONG_4DAY_V1.id;
        const isPerformance = structuredDefinition?.id === PERFORMANCE_UPPER_LOWER_V1.id;
        const performanceRecoveryMode = isPerformance ? consumePendingPerformanceRecoveryMode() : 'green';

        // Structured programs resolve their immutable definition at build time;
        // normal templates continue through the legacy path unchanged.
        const resolvedDay = structuredDefinition
            ? resolveProgramDay(
                structuredDefinition,
                activeMeso.week,
                dayIdx,
                activeMeso.programSystem?.substitutions || {},
            )
            : programDay;

        const structuredBlockResolution = structuredDefinition
            ? getProgramBlockForWeek(structuredDefinition, activeMeso.week)
            : null;
        const structuredBlock = structuredBlockResolution?.block || null;
        const localizedKongDay = isKong && structuredBlock
            ? getKongDayDisplay(structuredBlock.number, dayIdx)
            : null;
        const dayNameSafe = localizedKongDay
            ? localizedKongDay[(lang === 'es' ? 'es' : 'en')]
            : resolvedDay.dayName
                ? (typeof resolvedDay.dayName === 'object' ? resolvedDay.dayName[lang as 'en'|'es'] : resolvedDay.dayName)
                : `Day ${dayIdx + 1}`;

        const mesoPlan = Array.isArray(activeMeso.plan) ? activeMeso.plan : [];
        const dayPlan = Array.isArray(mesoPlan[dayIdx]) ? mesoPlan[dayIdx] : [];
        const safeExercises = Array.isArray(exercises) ? exercises.filter(e => !!e) : [];
        const safeLogs = Array.isArray(logs) ? logs : [];
        const isDeload = !!activeMeso.isDeload;
        const resolvedSlots = resolvedDay.slots || [];
        const sessionSlots = isPerformance && performanceRecoveryMode === 'yellow'
            ? resolvedSlots.slice(0, Math.max(1, resolvedSlots.length - 2))
            : resolvedSlots;

        const sessionExs = sessionSlots.map((slotDef, sIdx) => {
            if (!slotDef) return null;
            const exId = slotDef.exerciseId || dayPlan[sIdx];
            // Priority: exact ID match → same-muscle fallback → typed placeholder (never random index 0)
            let exDef = exId ? safeExercises.find(e => e.id === exId) : null;
            if (!exDef) exDef = safeExercises.find(e => e.muscle === slotDef.muscle) ?? null;
            if (!exDef) exDef = { id: `placeholder_${slotDef.muscle}_${sIdx}`, name: slotDef.muscle || 'Unknown', muscle: slotDef.muscle || 'CHEST' };

            let setTarget = slotDef.setTarget || 3;

            // RP Feedback adjustments apply only to legacy/adaptive templates.
            // Structured program prescriptions are intentionally immutable here.
            if (!slotDef.prescription && config.rpEnabled && activeMeso && activeMeso.week > 1) {
                let accumulatedAdjustment = 0;
                const fbForMeso = rpFeedback[activeMeso.id];
                if (fbForMeso) {
                    for (let w = 1; w < activeMeso.week; w++) {
                        const weekFb = fbForMeso[w] || fbForMeso[String(w)];
                        if (weekFb && weekFb[slotDef.muscle]) {
                            accumulatedAdjustment += weekFb[slotDef.muscle].adjustment || 0;
                        }
                    }
                }
                setTarget = Math.max(1, setTarget + accumulatedAdjustment);
            }
            if (!slotDef.prescription && isDeload) setTarget = Math.max(1, Math.ceil(setTarget / 2));

            const lastSets = getLastLogForExercise(exDef.id, safeLogs);

            const initialSets = (slotDef.prescription || Array.from({ length: setTarget }, () => undefined)).map((prescription, i) => ({
                id: uid(),
                weight: '',
                reps: '',
                rpe: '',
                completed: false,
                type: prescription?.role === 'top' ? 'top' : prescription?.role === 'backoff' || prescription?.role === 'high_rep_backoff' ? 'backoff' : slotDef.setType || 'regular',
                prescribedReps: prescription?.reps,
                prescribedRepRange: prescription?.repRange,
                targetRpe: prescription?.targetRpe !== undefined && isPerformance && performanceRecoveryMode === 'yellow'
                    ? Math.max(1, prescription.targetRpe - 1)
                    : prescription?.targetRpe,
                prescriptionRole: prescription?.role,
                programSetIndex: slotDef.prescription ? i : undefined,
                hintWeight: lastSets?.[i]?.weight,
                hintReps: lastSets?.[i]?.reps,
                prevWeight: lastSets?.[i]?.weight,
                prevReps: lastSets?.[i]?.reps
            }));

            return {
                ...exDef,
                instanceId: uid(),
                slotLabel: slotDef.label || slotDef.muscle,
                targetReps: slotDef.reps,
                note: slotDef.notes,
                supersetId: slotDef.supersetId,
                programSlotId: slotDef.programSlotId,
                recommendedRestSeconds: slotDef.recommendedRestSeconds,
                substitutionGroup: slotDef.substitutionGroup,
                programSourceName: slotDef.programSourceName,
                targetMuscle: slotDef.targetMuscle,
                sets: initialSets as any
            };
        }).filter(Boolean);

        const structuredMeta = structuredDefinition && activeMeso.programSystem && structuredBlockResolution
            ? {
                programSystem: {
                    systemId: activeMeso.programSystem.systemId,
                    systemVersion: activeMeso.programSystem.systemVersion,
                    blockNumber: structuredBlockResolution.block.number,
                    blockWeek: structuredBlockResolution.blockWeek,
                }
            }
            : {};

        return {
            id: Date.now(),
            dayIdx: dayIdx,
            name: structuredDefinition ? dayNameSafe : `${activeMeso.week} • ${dayNameSafe}`,
            exercises: sessionExs as SessionExercise[],
            startTime: Date.now(),
            mesoId: activeMeso.id,
            week: activeMeso.week,
            ...(isPerformance ? { note: `PERFORMANCE Recovery Gate: ${performanceRecoveryMode.toUpperCase()}` } : {}),
            ...structuredMeta,
        } as ActiveSession;
    }
}
