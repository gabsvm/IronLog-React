import type { ExerciseDef, Log, MesoCycle, MesocycleDraft, MuscleGroup, MusclePriorityLevel, ProgramDay } from '../types';
import { pickLang } from './i18n';

export const MESO_DRAFT_STORAGE_KEY = 'repyntra_meso_draft';
export const MESO_EDITOR_INTENT_KEY = 'repyntra_editor_intent';

export type MesoEditorIntent = 'builder' | 'scratch' | 'resume' | 'copy' | 'template';

export function loadMesocycleDraft(): MesocycleDraft | null {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    try {
        const raw = window.localStorage.getItem(MESO_DRAFT_STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as MesocycleDraft;
        if (!parsed || !Array.isArray(parsed.program)) return null;
        return parsed;
    } catch {
        return null;
    }
}

export function saveMesocycleDraft(draft: MesocycleDraft): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
        window.localStorage.setItem(MESO_DRAFT_STORAGE_KEY, JSON.stringify(draft));
    } catch {
        // Ignore storage quota / privacy mode errors
    }
}

export function clearMesocycleDraft(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
        window.localStorage.removeItem(MESO_DRAFT_STORAGE_KEY);
    } catch {
        // Ignore storage errors
    }
}

export function setMesoEditorIntent(intent: MesoEditorIntent): void {
    if (typeof window === 'undefined' || !window.sessionStorage) return;
    try {
        window.sessionStorage.setItem(MESO_EDITOR_INTENT_KEY, intent);
    } catch {
        // Ignore
    }
}

export function consumeMesoEditorIntent(): MesoEditorIntent | null {
    if (typeof window === 'undefined' || !window.sessionStorage) return null;
    try {
        const val = window.sessionStorage.getItem(MESO_EDITOR_INTENT_KEY) as MesoEditorIntent | null;
        if (val) window.sessionStorage.removeItem(MESO_EDITOR_INTENT_KEY);
        return val;
    } catch {
        return null;
    }
}

export interface PastMesoSummary {
    mesoId: number;
    name: string;
    weeksLogged: number;
    sessionsCount: number;
    lastDate: number;
    days: ProgramDay[];
}

/**
 * Reconstructs historical mesocycles from logged workouts (excluding current activeMeso)
 * so any prior mesocycle can be copied 1:1 into the Meso Builder / Editor.
 */
export function extractPastMesocycles(
    logs: readonly Log[],
    activeMesoId: number | null | undefined,
    exercises: readonly ExerciseDef[] = [],
): PastMesoSummary[] {
    const byMeso = new Map<number, Log[]>();
    for (const log of logs || []) {
        if (!log || typeof log.mesoId !== 'number' || log.mesoId < 0) continue;
        if (activeMesoId != null && log.mesoId === activeMesoId) continue;
        const arr = byMeso.get(log.mesoId) || [];
        arr.push(log);
        byMeso.set(log.mesoId, arr);
    }

    const result: PastMesoSummary[] = [];
    for (const [mesoId, mesoLogs] of byMeso.entries()) {
        const sorted = [...mesoLogs].sort((a, b) => (b.endTime || b.startTime || 0) - (a.endTime || a.startTime || 0));
        const latestPerDay = new Map<number, Log>();
        let maxWeek = 1;
        let lastDate = 0;

        for (const l of sorted) {
            if (l.week > maxWeek) maxWeek = l.week;
            const ts = l.endTime || l.startTime || 0;
            if (ts > lastDate) lastDate = ts;
            if (!l.skipped && typeof l.dayIdx === 'number' && l.dayIdx >= 0 && !latestPerDay.has(l.dayIdx)) {
                latestPerDay.set(l.dayIdx, l);
            }
        }

        const dayIndices = Array.from(latestPerDay.keys()).sort((a, b) => a - b);
        if (dayIndices.length === 0) continue;

        const days: ProgramDay[] = dayIndices.map((dayIdx, i) => {
            const log = latestPerDay.get(dayIdx)!;
            const rawName = (log.name || `Day ${i + 1}`).replace(/^\d+\s*[•·-]\s*/, '');
            return {
                id: `copy_${mesoId}_${dayIdx}_${i}`,
                dayName: { en: rawName, es: rawName },
                slots: (log.exercises || []).map((ex) => {
                    const matched = exercises.find((e) => e.id === ex.id);
                    const workingSets = (ex.sets || []).filter((s) => s.type !== 'warmup' && s.type !== 'avt_hop');
                    return {
                        muscle: (ex.muscle || matched?.muscle || 'CHEST') as MuscleGroup,
                        setTarget: Math.max(1, workingSets.length || 3),
                        exerciseId: matched ? matched.id : ex.id,
                        reps: ex.targetReps,
                        notes: ex.note,
                    };
                }),
            };
        });

        const dateLabel = lastDate ? new Date(lastDate).toLocaleDateString() : String(mesoId);
        result.push({
            mesoId,
            name: `Meso ${dateLabel}`,
            weeksLogged: maxWeek,
            sessionsCount: mesoLogs.filter((l) => !l.skipped).length,
            lastDate,
            days,
        });
    }

    return result.sort((a, b) => b.lastDate - a.lastDate);
}

export function buildMesoDraftFromProgram(
    name: string,
    program: ProgramDay[],
    weeks = 5,
    musclePriorities?: Partial<Record<MuscleGroup, MusclePriorityLevel>>,
    mesoType = 'hyp_1',
): MesocycleDraft {
    return {
        name,
        mesoType,
        weeks,
        program: (program || []).map((day, idx) => ({
            ...day,
            id: `draft_d_${Date.now()}_${idx}`,
            slots: (day.slots || []).map((slot) => ({ ...slot })),
        })),
        musclePriorities: musclePriorities ? { ...musclePriorities } : undefined,
        updatedAt: Date.now(),
    };
}

export function createDefaultMesoBuilderDays(lang: 'en' | 'es'): ProgramDay[] {
    return [
        {
            id: `mb_1_${Date.now()}`,
            dayName: { en: 'Upper A', es: 'Torso A' },
            slots: [
                { muscle: 'CHEST', setTarget: 3, reps: '8-12' },
                { muscle: 'BACK', setTarget: 3, reps: '8-12' },
                { muscle: 'SHOULDERS', setTarget: 3, reps: '10-15' },
                { muscle: 'BICEPS', setTarget: 2, reps: '10-15' },
                { muscle: 'TRICEPS', setTarget: 2, reps: '10-15' },
            ],
        },
        {
            id: `mb_2_${Date.now()}`,
            dayName: { en: 'Lower A', es: 'Pierna A' },
            slots: [
                { muscle: 'QUADS', setTarget: 3, reps: '8-12' },
                { muscle: 'HAMSTRINGS', setTarget: 3, reps: '8-12' },
                { muscle: 'CALVES', setTarget: 3, reps: '12-15' },
                { muscle: 'ABS', setTarget: 2, reps: '12-20' },
            ],
        },
        {
            id: `mb_3_${Date.now()}`,
            dayName: { en: 'Upper B', es: 'Torso B' },
            slots: [
                { muscle: 'BACK', setTarget: 3, reps: '8-12' },
                { muscle: 'CHEST', setTarget: 3, reps: '10-15' },
                { muscle: 'SHOULDERS', setTarget: 3, reps: '12-15' },
                { muscle: 'BICEPS', setTarget: 3, reps: '10-15' },
                { muscle: 'TRICEPS', setTarget: 3, reps: '10-15' },
            ],
        },
        {
            id: `mb_4_${Date.now()}`,
            dayName: { en: 'Lower B', es: 'Pierna B' },
            slots: [
                { muscle: 'HAMSTRINGS', setTarget: 3, reps: '8-12' },
                { muscle: 'QUADS', setTarget: 3, reps: '10-15' },
                { muscle: 'GLUTES', setTarget: 3, reps: '10-15' },
                { muscle: 'CALVES', setTarget: 3, reps: '12-15' },
            ],
        },
    ];
    void lang;
}

export interface NextMesoCarryOverResult {
    draft: MesocycleDraft;
    carryOverLoads: Record<string, { w1PrevKg: number; nextW1Kg: number; deltaPct: number }>;
    flaggedForRotation: string[];
    specializationNextPhase: 'accumulate' | 'active_rest' | 'maintenance';
    nextBlockNumber: number;
}

/**
 * Official RP Next-Mesocycle Carry-Over Formula:
 * - Anchors starting Week 1 loads to Week 1 of the PREVIOUS mesocycle (NOT peak week)
 *   +5% (beginner/intermediate) or +2.5% (advanced).
 * - Resets weekly working sets back to personal MEV baseline per muscle priority.
 * - Flags exercises that reported joint pain for rotation.
 * - Advances 3-mesocycle specialization blocks into Active Rest / Maintenance after Meso 3.
 */
export function buildNextMesocycleCarryOver(input: {
    prevMeso: MesoCycle;
    program: ProgramDay[];
    logs: readonly Log[];
    experience?: 'beginner' | 'intermediate' | 'advanced';
    lang: 'en' | 'es';
    jointPainIds?: string[];
}): NextMesoCarryOverResult {
    const { prevMeso, program, logs, experience = 'intermediate', lang, jointPainIds = [] } = input;
    const bumpPct = experience === 'advanced' ? 0.025 : 0.05;

    const w1Logs = (logs || []).filter((l) => l.mesoId === prevMeso.id && !l.skipped && l.week === 1);
    const w1Weights = new Map<string, number>();
    for (const log of w1Logs) {
        for (const ex of log.exercises || []) {
            if (!ex.id || w1Weights.has(ex.id)) continue;
            const working = (ex.sets || []).filter((s) => !s.skipped && s.type !== 'warmup' && Number(s.weight) > 0);
            if (working.length > 0) {
                w1Weights.set(ex.id, Number(working[0].weight));
            }
        }
    }

    const carryOverLoads: Record<string, { w1PrevKg: number; nextW1Kg: number; deltaPct: number }> = {};
    w1Weights.forEach((w1Kg, exId) => {
        const nextKg = Math.round((w1Kg * (1 + bumpPct)) * 2) / 2;
        carryOverLoads[exId] = { w1PrevKg: w1Kg, nextW1Kg: nextKg, deltaPct: bumpPct * 100 };
    });

    const priorities = prevMeso.musclePriorities || {};
    const flaggedSet = new Set<string>(jointPainIds);

    const resetProgram: ProgramDay[] = (program || []).map((day, idx) => ({
        ...day,
        id: `next_d_${Date.now()}_${idx}`,
        slots: (day.slots || []).map((slot) => {
            const prio = priorities[slot.muscle] || 'grow';
            const mevSets = prio === 'emphasize' ? 3 : prio === 'maintain' ? 2 : 2;
            const carry = slot.exerciseId ? carryOverLoads[slot.exerciseId] : undefined;
            const nextNote = carry
                ? `W1 start: ${carry.nextW1Kg} kg (+${carry.deltaPct}% vs prior W1)`
                : undefined;
            return {
                ...slot,
                setTarget: mevSets,
                notes: nextNote || slot.notes,
            };
        }),
    }));

    const currSpec = prevMeso.specializationBlock;
    const currentMesoNum = currSpec?.currentMeso ?? 1;
    const totalMesosNum = currSpec?.totalMesos ?? 3;
    const isEndOfBlock = currentMesoNum >= totalMesosNum;
    const nextBlockNumber = isEndOfBlock ? 1 : currentMesoNum + 1;
    const specializationNextPhase: NextMesoCarryOverResult['specializationNextPhase'] = isEndOfBlock ? 'active_rest' : 'accumulate';

    const rawBase = (prevMeso.name || 'Meso').replace(/\s*·?\s*(Meso\s*\d+\/\d+|Next).*$/i, '').trim() || 'MEVRA';
    const suffix = pickLang(lang, {
        es: isEndOfBlock ? 'Active Rest (2 sem)' : `Meso ${nextBlockNumber}/${totalMesosNum}`,
        en: isEndOfBlock ? 'Active Rest (2w)' : `Meso ${nextBlockNumber}/${totalMesosNum}`,
    });

    const draft = buildMesoDraftFromProgram(
        `${rawBase} · ${suffix}`,
        resetProgram,
        prevMeso.targetWeeks || prevMeso.duration || 5,
        prevMeso.musclePriorities,
        prevMeso.mesoType || 'hyp_1',
    );

    return {
        draft,
        carryOverLoads,
        flaggedForRotation: Array.from(flaggedSet),
        specializationNextPhase,
        nextBlockNumber,
    };
}

/**
 * Condenses 4-6 day deload splits into half as many sessions (e.g. 4d -> 2d),
 * halving each slot's sets so the lifter earns extra full rest days.
 */
export function condenseDeloadDays(programDays: ProgramDay[]): ProgramDay[] {
    const active = (programDays || []).filter((d) => (d.slots || []).length > 0);
    if (active.length <= 2) return programDays;

    const merged: ProgramDay[] = [];
    for (let i = 0; i < active.length; i += 2) {
        const first = active[i];
        const second = active[i + 1];
        const combinedSlots = [...(first.slots || []), ...(second?.slots || [])].map((slot) => ({
            ...slot,
            setTarget: Math.max(1, Math.ceil((slot.setTarget || 2) / 2)),
        }));
        merged.push({
            id: `deload_c_${i}`,
            dayName: second
                ? {
                      en: `${first.dayName.en} + ${second.dayName.en}`,
                      es: `${first.dayName.es} + ${second.dayName.es}`,
                  }
                : first.dayName,
            slots: combinedSlots,
        });
    }
    return merged;
}

export function buildCopyFromActiveMeso(
    activeMeso: MesoCycle,
    program: ProgramDay[],
    lang: 'en' | 'es',
): MesocycleDraft {
    const baseName = activeMeso.name || 'Mesocycle';
    const prefix = pickLang(lang, { es: 'Copia de', en: 'Copy of' });
    return buildMesoDraftFromProgram(
        baseName.startsWith(prefix) ? baseName : `${prefix} ${baseName}`,
        program,
        activeMeso.targetWeeks || activeMeso.duration || 5,
        activeMeso.musclePriorities,
        activeMeso.mesoType || 'hyp_1',
    );
}
