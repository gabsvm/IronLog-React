import type { ActiveSession, MesoCycle } from '../../types';

export type RoutineStartAction = 'resume' | 'replace' | 'start';

/** Shared boundary: same meso+day resumes, other day with session replaces, else starts. */
export function resolveRoutineStartAction(
    activeSession: ActiveSession | null,
    activeMeso: MesoCycle | null,
    idx: number,
): RoutineStartAction {
    if (activeSession && activeSession.mesoId === activeMeso?.id && activeSession.dayIdx === idx) {
        return 'resume';
    }
    if (activeSession) return 'replace';
    return 'start';
}

/** KONG conversion may only confirm when no session appeared since authorization. */
export function canConfirmKongConversion(activeSession: ActiveSession | null): boolean {
    return activeSession === null;
}
