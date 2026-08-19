import { ProgramDay, MesoCycle, ExerciseDef, Log, ActiveSession, SessionExercise } from '../types';
import { getLastLogForExercise, uid } from '../utils';
import { KONG_4DAY_V1 } from '../programs/kong/kong4Day';
import { PERFORMANCE_UPPER_LOWER_V1 } from '../programs/performance/performanceUpperLower';
import { GUTS_BLACK_SWORDSMAN_V1 } from '../programs/naturalHypertrophy/gutsBlackSwordsman';
import { getPerformanceAdaptiveSlot } from '../programs/performance/performanceProgression';
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
        const isGuts = structuredDefinition?.id === GUTS_BLACK_SWORDSMAN_V1.id;
        const performanceRecoveryMode = isPerformance ? consumePendingPerformanceRecoveryMode() : 'green';

        const resolvedDay = structuredDefinition
            ? resolveProgramDay(structuredDefinition, activeMeso.week, dayIdx, activeMeso.programSystem?.substitutions || {})
            : programDay;

        const structuredBlockResolution = structuredDefinition ? getProgramBlockForWeek(structuredDefinition, activeMeso.week) : null;
        const structuredBlock = structuredBlockResolution?.block || null;
        const localizedKongDay = isKong && structuredBlock ? getKongDayDisplay(structuredBlock.number, dayIdx) : null;
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
        const structuredProgressionPolicy: 'double' | 'hold' | 'pivot' | 'evolving' | undefined = isPerformance
            ? performanceRecoveryMode === 'yellow'
                ? 'hold'
                : structuredBlock?.id === 'performance-pivot' ? 'pivot' : 'double'
            : isGuts ? 'evolving' : undefined;

        const slotHistorySystemId = isPerformance
            ? PERFORMANCE_UPPER_LOWER_V1.id
            : isGuts ? GUTS_BLACK_SWORDSMAN_V1.id : null;
        const structuredLogsNewestFirst = slotHistorySystemId
            ? safeLogs.filter(log => !log.skipped && log.programSystem?.systemId === slotHistorySystemId).slice().sort((a, b) => (b.endTime || b.startTime || 0) - (a.endTime || a.startTime || 0))
            : [];

        const sessionExs = sessionSlots.map((slotDef, sIdx) => {
            if (!slotDef) return null;
            const exId = slotDef.exerciseId || dayPlan[sIdx];
            let exDef = exId ? safeExercises.find(e => e.id === exId) : null;

            // A structured program must never silently swap a missing exact ID
            // for a random same-muscle movement. Keep the source identity intact
            // even if an older persisted library has not merged the additive
            // exercise definition yet.
            if (!exDef && structuredDefinition && exId) {
                const sourceName = slotDef.programSourceName || slotDef.label || String(exId);
                exDef = {
                    id: String(exId),
                    name: { en: sourceName, es: sourceName },
                    muscle: slotDef.muscle || 'CHEST',
                } as ExerciseDef;
            }
            if (!exDef) exDef = safeExercises.find(e => e.muscle === slotDef.muscle) ?? null;
            if (!exDef) exDef = { id: `placeholder_${slotDef.muscle}_${sIdx}`, name: slotDef.muscle || 'Unknown', muscle: slotDef.muscle || 'CHEST' };

            let setTarget = slotDef.setTarget || 3;
            if (!slotDef.prescription && config.rpEnabled && activeMeso && activeMeso.week > 1) {
                let accumulatedAdjustment = 0;
                const fbForMeso = rpFeedback[activeMeso.id];
                if (fbForMeso) {
                    for (let w = 1; w < activeMeso.week; w++) {
                        const weekFb = fbForMeso[w] || fbForMeso[String(w)];
                        if (weekFb && weekFb[slotDef.muscle]) accumulatedAdjustment += weekFb[slotDef.muscle].adjustment || 0;
                    }
                }
                setTarget = Math.max(1, setTarget + accumulatedAdjustment);
            }
            if (!slotDef.prescription && isDeload) setTarget = Math.max(1, Math.ceil(setTarget / 2));

            let performanceVolumeDelta = 0;
            if (
                isPerformance && performanceRecoveryMode === 'green' && activeMeso.week >= 3 && activeMeso.week <= 7 &&
                slotDef.prescription && getPerformanceAdaptiveSlot(slotDef.muscle) === slotDef.programSlotId
            ) {
                const previousCycleFeedback = rpFeedback[activeMeso.id]?.[activeMeso.week - 1] || rpFeedback[activeMeso.id]?.[String(activeMeso.week - 1)];
                const storedDelta = Number(previousCycleFeedback?.[slotDef.muscle]?.adjustment || 0);
                performanceVolumeDelta = storedDelta > 0 ? 1 : storedDelta < 0 ? -1 : 0;
            }

            let effectivePrescription = slotDef.prescription ? slotDef.prescription.map(prescription => ({ ...prescription })) : undefined;
            if (effectivePrescription && performanceVolumeDelta > 0 && effectivePrescription.length > 0) effectivePrescription.push({ ...effectivePrescription[effectivePrescription.length - 1] });
            else if (effectivePrescription && performanceVolumeDelta < 0 && effectivePrescription.length > 1) effectivePrescription = effectivePrescription.slice(0, effectivePrescription.length - 1);

            let lastSets = slotHistorySystemId ? null : getLastLogForExercise(exDef.id, safeLogs);
            if (slotHistorySystemId && slotDef.programSlotId) {
                for (const previousLog of structuredLogsNewestFirst) {
                    const previousExercise = (previousLog.exercises || []).find(item => String(item.id) === String(exDef.id) && item.programSlotId === slotDef.programSlotId);
                    if (!previousExercise) continue;
                    const workingSets = (previousExercise.sets || []).filter(set => set.type !== 'warmup' && set.type !== 'avt_hop');
                    if (workingSets.length > 0) { lastSets = workingSets; break; }
                }
            }

            const prescriptionForSession = effectivePrescription || Array.from({ length: setTarget }, () => undefined);
            const initialSets = prescriptionForSession.map((prescription, i) => ({
                id: uid(), weight: '', reps: '', rpe: '', completed: false,
                type: prescription?.role === 'top' ? 'top' : prescription?.role === 'backoff' || prescription?.role === 'high_rep_backoff' ? 'backoff' : slotDef.setType || 'regular',
                prescribedReps: prescription?.reps,
                prescribedRepRange: prescription?.repRange,
                targetRpe: prescription?.targetRpe !== undefined && isPerformance && performanceRecoveryMode === 'yellow' ? Math.max(1, prescription.targetRpe - 1) : prescription?.targetRpe,
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
                ...(isGuts && slotDef.recommendedRestSeconds ? { defaultRestSeconds: slotDef.recommendedRestSeconds } : {}),
                ...(structuredProgressionPolicy ? { progressionPolicy: structuredProgressionPolicy } : {}),
                ...(performanceVolumeDelta !== 0 ? { performanceVolumeDelta } : {}),
                sets: initialSets as any
            };
        }).filter(Boolean);

        const structuredMeta = structuredDefinition && activeMeso.programSystem && structuredBlockResolution
            ? { programSystem: { systemId: activeMeso.programSystem.systemId, systemVersion: activeMeso.programSystem.systemVersion, blockNumber: structuredBlockResolution.block.number, blockWeek: structuredBlockResolution.blockWeek } }
            : {};

        return {
            id: Date.now(), dayIdx, name: structuredDefinition ? dayNameSafe : `${activeMeso.week} • ${dayNameSafe}`,
            exercises: sessionExs as SessionExercise[], startTime: Date.now(), mesoId: activeMeso.id, week: activeMeso.week,
            ...(isPerformance ? { note: `PERFORMANCE Recovery Gate: ${performanceRecoveryMode.toUpperCase()}` } : {}),
            ...structuredMeta,
        } as ActiveSession;
    }
}
