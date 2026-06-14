import { ProgramDay, MesoCycle, ExerciseDef, Log, ActiveSession, SessionExercise } from '../types';
import { getLastLogForExercise, uid } from '../utils';

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

        const dayNameSafe = programDay.dayName
            ? (typeof programDay.dayName === 'object' ? programDay.dayName[lang as 'en'|'es'] : programDay.dayName)
            : `Day ${dayIdx + 1}`;

        const mesoPlan = Array.isArray(activeMeso.plan) ? activeMeso.plan : [];
        const dayPlan = Array.isArray(mesoPlan[dayIdx]) ? mesoPlan[dayIdx] : [];
        const safeExercises = Array.isArray(exercises) ? exercises.filter(e => !!e) : [];
        const safeLogs = Array.isArray(logs) ? logs : [];
        const isDeload = !!activeMeso.isDeload;

        const sessionExs = (programDay.slots || []).map((slotDef, sIdx) => {
            if (!slotDef) return null;
            const exId = dayPlan[sIdx];
            // Priority: exact ID match → same-muscle fallback → typed placeholder (never random index 0)
            let exDef = exId ? safeExercises.find(e => e.id === exId) : null;
            if (!exDef) exDef = safeExercises.find(e => e.muscle === slotDef.muscle) ?? null;
            if (!exDef) exDef = { id: `placeholder_${slotDef.muscle}_${sIdx}`, name: slotDef.muscle || 'Unknown', muscle: slotDef.muscle || 'CHEST' };

            let setTarget = slotDef.setTarget || 3;
            
            // RP Feedback adjustments
            if (config.rpEnabled && activeMeso && activeMeso.week > 1) {
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
            if (isDeload) setTarget = Math.max(1, Math.ceil(setTarget / 2));

            const lastSets = getLastLogForExercise(exDef.id, safeLogs);

            let initialSets;
            if (slotDef.isAVT) {
                const roundId = uid();
                initialSets = Array.from({ length: 4 }, () => ({
                    id: uid(),
                    weight: '',
                    reps: slotDef.avtStartReps ? String(slotDef.avtStartReps) : '6',
                    rpe: '', completed: false, type: 'avt_hop',
                    avtRoundId: roundId, isLastHop: false
                }));
            } else {
                initialSets = Array(setTarget).fill(null).map((_, i) => ({
                    id: uid(),
                    weight: '', reps: '', rpe: '', completed: false,
                    type: slotDef.setType || 'regular',
                    hintWeight: lastSets?.[i]?.weight, hintReps: lastSets?.[i]?.reps,
                    prevWeight: lastSets?.[i]?.weight, prevReps: lastSets?.[i]?.reps
                }));
            }

            return {
                ...exDef,
                instanceId: uid(),
                slotLabel: slotDef.muscle,
                targetReps: slotDef.reps,
                supersetId: slotDef.supersetId,
                sets: initialSets as any
            };
        }).filter(Boolean);

        return {
            id: Date.now(),
            dayIdx: dayIdx,
            name: `${activeMeso.week} • ${dayNameSafe}`,
            exercises: sessionExs as SessionExercise[],
            startTime: Date.now(),
            mesoId: activeMeso.id,
            week: activeMeso.week
        };
    }
}
