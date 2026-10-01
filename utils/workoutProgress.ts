/**
 * utils/workoutProgress.ts
 *
 * Canonical helpers for working-set classification, workout progress calculation,
 * and template update eligibility.
 */

export type SetLike = {
    type?: string | null;
    completed?: boolean;
    [key: string]: any;
};

export type ExerciseLike = {
    sets?: SetLike[];
    [key: string]: any;
};

/**
 * Canonical working-set classifier.
 *
 * Protocol treatment:
 * - warmup: false (warmup sets are preparatory sets)
 * - avt_hop: false (AVT potentiation hops are preparatory jumps/hops)
 * - regular: true
 * - myorep: true
 * - myorep_match: true
 * - top: true
 * - backoff: true
 * - drop: true
 * - giant: true
 * - cluster: true
 * - emom: true
 * - rest_pause: true
 * - time_volume: true
 * - triple_add: true
 */
export function isWorkingSet(set: SetLike | null | undefined): boolean {
    if (!set) return false;
    const type = set.type ?? 'regular';
    if (type === 'warmup' || type === 'avt_hop') {
        return false;
    }
    return true;
}

export interface WorkingSetCounts {
    completedWorkingSets: number;
    totalWorkingSets: number;
    remainingWorkingSets: number;
    progressPct: number;
}

/**
 * Counts working sets across a collection of exercises using a single canonical domain.
 */
export function countWorkingSets(
    exercises?: ExerciseLike[] | null
): WorkingSetCounts {
    if (!exercises || exercises.length === 0) {
        return {
            completedWorkingSets: 0,
            totalWorkingSets: 0,
            remainingWorkingSets: 0,
            progressPct: 0,
        };
    }

    let completedWorkingSets = 0;
    let totalWorkingSets = 0;

    for (const ex of exercises) {
        for (const s of (ex.sets || [])) {
            if (isWorkingSet(s)) {
                totalWorkingSets++;
                if (s.completed) {
                    completedWorkingSets++;
                }
            }
        }
    }

    const remainingWorkingSets = Math.max(0, totalWorkingSets - completedWorkingSets);
    const progressPct = totalWorkingSets > 0 ? (completedWorkingSets / totalWorkingSets) * 100 : 0;

    return {
        completedWorkingSets,
        totalWorkingSets,
        remainingWorkingSets,
        progressPct,
    };
}

export interface TemplateEligibilitySession {
    id?: number | string;
    mesoId?: number | string;
    dayIdx?: number;
    week?: number;
    isDetached?: boolean;
    sessionType?: string;
    type?: string;
    isKong?: boolean;
    exercises?: ExerciseLike[];
    [key: string]: any;
}

export interface TemplateEligibilityMeso {
    id?: number | string;
    plan?: any[];
    programSystem?: {
        systemId?: string;
        [key: string]: any;
    };
    isCustom?: boolean;
    [key: string]: any;
}

/**
 * Determines whether the current session qualifies for the "Actualizar plantilla"
 * (Update Template) toggle in the Finish Session sheet.
 *
 * Requirements:
 * - completed workout data exists (at least one completed working set);
 * - active mesocycle exists;
 * - session is a planned session belonging to that mesocycle (matching mesoId);
 * - dayIdx is a valid in-range program day (0 <= dayIdx < activeMeso.plan.length);
 * - target routine is user-editable;
 * - canonical KONG definitions are not directly mutated;
 * - detached sessions (Freestyle, WOD, Calisthenics, Two Block) do not show the control.
 */
export function isTemplateUpdateEligible(
    activeSession: TemplateEligibilitySession | null | undefined,
    activeMeso: TemplateEligibilityMeso | null | undefined
): boolean {
    if (!activeSession || !activeMeso) return false;

    // 1. Completed workout data exists (at least one completed working set)
    const { completedWorkingSets } = countWorkingSets(activeSession.exercises);
    if (completedWorkingSets <= 0) return false;

    // 2. Active session must belong to the active mesocycle
    if (
        activeSession.mesoId === undefined ||
        activeSession.mesoId === null ||
        Number(activeSession.mesoId) < 0 ||
        String(activeSession.mesoId) !== String(activeMeso.id)
    ) {
        return false;
    }

    // 3. Detached sessions (Freestyle, WOD, Calisthenics, Two Block, etc.)
    if (
        activeSession.isDetached ||
        activeSession.sessionType === 'freestyle' ||
        activeSession.sessionType === 'wod' ||
        activeSession.sessionType === 'calisthenics' ||
        activeSession.sessionType === 'two_block' ||
        activeSession.type === 'freestyle' ||
        activeSession.type === 'wod' ||
        activeSession.type === 'calisthenics' ||
        activeSession.type === 'two_block'
    ) {
        return false;
    }

    // 4. Day index must be valid and in-range for the planned routine
    if (
        typeof activeSession.dayIdx !== 'number' ||
        activeSession.dayIdx < 0 ||
        !Array.isArray(activeMeso.plan) ||
        activeSession.dayIdx >= activeMeso.plan.length
    ) {
        return false;
    }

    // 5. Canonical KONG definitions are immutable and cannot be updated via template update
    const systemId = String(activeMeso.programSystem?.systemId || '').toLowerCase();
    const mesoId = String(activeMeso.id || '').toLowerCase();
    const mesoName = String(activeMeso.name || '').toLowerCase();
    const sessionId = String(activeSession.mesoId || '').toLowerCase();
    if (
        systemId === 'kong_4day' ||
        systemId.startsWith('kong_') ||
        mesoId.includes('kong') ||
        mesoName.includes('kong') ||
        sessionId.includes('kong') ||
        Boolean(activeSession.isKong)
    ) {
        return false;
    }

    return true;
}

/**
 * Resolves the initial default active exercise ID.
 * Prefers the first exercise with at least one incomplete set.
 */
export function resolveInitialActiveExerciseId(
    exercises?: Array<{ instanceId: number; sets?: Array<{ completed?: boolean }> }> | null
): number | null {
    if (!exercises || exercises.length === 0) return null;
    const firstIncomplete = exercises.find(ex => (ex.sets || []).some(s => !s.completed));
    return firstIncomplete ? firstIncomplete.instanceId : (exercises[0]?.instanceId ?? null);
}

/**
 * Toggles an exercise card between expanded and collapsed.
 * If target card is already expanded, returns null (genuinely collapsed).
 * Otherwise returns targetInstanceId.
 */
export function toggleExerciseCardExpansion(
    currentActiveId: number | null,
    targetInstanceId: number
): number | null {
    if (currentActiveId === targetInstanceId) {
        return null;
    }
    return targetInstanceId;
}

/**
 * Auto-advances the active exercise when the final set of the current exercise completes.
 */
export function advanceActiveExerciseOnCompletion(
    currentActiveId: number | null,
    completedExInstanceId: number,
    exercises: Array<{ instanceId: number; sets?: Array<{ completed?: boolean }> }>,
    allowAutoAdvance: boolean = true
): number | null {
    if (!allowAutoAdvance || currentActiveId === null) return currentActiveId;

    const currentEx = exercises.find(e => e.instanceId === completedExInstanceId);
    if (!currentEx) return currentActiveId;

    const hasPendingInCurrent = (currentEx.sets || []).some(s => !s.completed);
    if (hasPendingInCurrent) {
        return currentActiveId;
    }

    const nextIncomplete = exercises.find(
        e => e.instanceId !== completedExInstanceId && (e.sets || []).some(s => !s.completed)
    );
    if (nextIncomplete) {
        return nextIncomplete.instanceId;
    }

    return currentActiveId;
}

