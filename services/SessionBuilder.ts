import { pickLang } from '../utils/i18n';
import { ProgramDay, MesoCycle, ExerciseDef, Log, ActiveSession, SessionExercise, PreviousScope } from '../types';
import { getLastLogForExercise, uid } from '../utils';
import { KONG_4DAY_V1 } from '../programs/kong/kong4Day';
import { getProgramBlockForWeek, resolveProgramDay } from '../programs/engine/ProgramResolver';
import { getKongDayDisplay } from '../programs/kong/kongDisplay';
import { filterLogsByPreviousScope } from '../utils/strongTraining';
import { getExerciseRestOverride } from '../utils/exerciseRestOverrides';
import { getSessionTemplateContext } from '../utils/templateIdentity';

export class SessionBuilder {
    static buildFromProgramDay(
        dayIdx: number,
        programDay: ProgramDay,
        activeMeso: MesoCycle,
        exercises: ExerciseDef[],
        logs: Log[],
        lang: string,
        rpFeedback: Record<string, Record<string, Record<string, any>>>,
        config: { rpEnabled: boolean; previousScope?: PreviousScope }
    ): ActiveSession | null {
        if (!programDay) return null;

        const isKong = activeMeso.programSystem?.systemId === KONG_4DAY_V1.id;

        // Structured programs resolve their immutable definition at build time;
        // normal templates continue through the legacy path unchanged.
        const resolvedDay = isKong
            ? resolveProgramDay(KONG_4DAY_V1, activeMeso.week, dayIdx, activeMeso.programSystem?.substitutions || {})
            : programDay;

        const kongBlock = isKong ? getProgramBlockForWeek(KONG_4DAY_V1, activeMeso.week).block : null;
        const localizedKongDay = kongBlock ? getKongDayDisplay(kongBlock.number, dayIdx) : null;
        const dayNameSafe = localizedKongDay
            ? localizedKongDay[(pickLang(lang, { es: 'es', en: 'en' }))]
            : resolvedDay.dayName
                ? (typeof resolvedDay.dayName === 'object' ? resolvedDay.dayName[lang as 'en'|'es'] : resolvedDay.dayName)
                : `Day ${dayIdx + 1}`;

        const mesoPlan = Array.isArray(activeMeso.plan) ? activeMeso.plan : [];
        const dayPlan = Array.isArray(mesoPlan[dayIdx]) ? mesoPlan[dayIdx] : [];
        const safeExercises = Array.isArray(exercises) ? exercises.filter(e => !!e) : [];
        const safeLogs = Array.isArray(logs) ? logs : [];
        const isDeload = !!activeMeso.isDeload;

        // Strong parity: initial suggestions resolve over the same scope as the
        // Previous column. KONG/custom/pre-feature contexts fall back to the
        // legacy plan-day pair inside the filter; 'any' keeps global history.
        const templateCtx = getSessionTemplateContext(activeMeso, dayIdx, programDay);
        const scopedLogs = filterLogsByPreviousScope(safeLogs, config.previousScope ?? 'any', activeMeso.id, dayIdx, templateCtx?.templateId ?? null, templateCtx?.templateDayKey ?? null);

        const sessionExs = (resolvedDay.slots || []).map((slotDef, sIdx) => {
            if (!slotDef) return null;
            const exId = slotDef.exerciseId || dayPlan[sIdx];
            // Priority: exact ID match → same-muscle fallback → typed placeholder (never random index 0)
            let exDef = exId ? safeExercises.find(e => e.id === exId) : null;
            if (!exDef) exDef = safeExercises.find(e => e.muscle === slotDef.muscle) ?? null;
            if (!exDef) exDef = { id: `placeholder_${slotDef.muscle}_${sIdx}`, name: slotDef.muscle || 'Unknown', muscle: slotDef.muscle || 'CHEST' };

            let setTarget = slotDef.setTarget || 3;

            // RP Feedback adjustments
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

            const lastSets = getLastLogForExercise(exDef.id, scopedLogs, safeExercises);

            // Strong parity: prefill inputs with the previous workout's values
            // (hints stay for display). Empty when there is no history.
            const fillWeight = (i: number): string => {
                const v = lastSets?.[i]?.weight;
                return v === '' || v === undefined || v === null || !Number.isFinite(Number(v)) ? '' : String(v);
            };
            const fillReps = (i: number): string => {
                const v = lastSets?.[i]?.reps;
                return v === '' || v === undefined || v === null || !/^\d+$/.test(String(v)) ? '' : String(v);
            };

            const initialSets = (slotDef.prescription || Array.from({ length: setTarget }, () => undefined)).map((prescription, i) => ({
                id: uid(),
                weight: fillWeight(i),
                reps: fillReps(i),
                rpe: '',
                completed: false,
                type: prescription?.role === 'top' ? 'top' : prescription?.role === 'backoff' || prescription?.role === 'high_rep_backoff' ? 'backoff' : slotDef.setType || 'regular',
                prescribedReps: prescription?.reps,
                targetRpe: prescription?.targetRpe,
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
                defaultRestSeconds: getExerciseRestOverride(exDef.id) ?? (exDef as { defaultRestSeconds?: number }).defaultRestSeconds,
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

        return {
            id: Date.now(),
            dayIdx: dayIdx,
            name: isKong ? dayNameSafe : `${activeMeso.week} • ${dayNameSafe}`,
            exercises: sessionExs as SessionExercise[],
            startTime: Date.now(),
            mesoId: activeMeso.id,
            week: activeMeso.week,
            templateId: templateCtx?.templateId ?? null,
            templateDayKey: templateCtx?.templateDayKey ?? null
        };
    }
}
