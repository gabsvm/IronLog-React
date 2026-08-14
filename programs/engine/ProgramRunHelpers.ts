import type { MesoCycle } from '../../types';
import type { ProgramSystemDefinition, ProgramRunState } from '../types';
import { getProgramBlockForWeek } from './ProgramResolver';

export function startProgramRun(definition: ProgramSystemDefinition, startedBodyWeight?: number): ProgramRunState {
  return {
    systemId: definition.id,
    systemVersion: definition.version,
    startedAt: Date.now(),
    startedBodyWeight,
    substitutions: {},
    seenGuideSections: [],
    seenBlockIntros: [],
  };
}

export function getProgramRunDefinition(meso: MesoCycle, registry: Record<string, ProgramSystemDefinition>): ProgramSystemDefinition | null {
  if (!meso.programSystem) return null;
  return registry[`${meso.programSystem.systemId}@${meso.programSystem.systemVersion}`] || null;
}

export function getBlockTransitionKey(definition: ProgramSystemDefinition, globalWeek: number): string | null {
  const { block } = getProgramBlockForWeek(definition, globalWeek);
  return `${definition.id}:block:${block.number}`;
}

export function hasSeenBlockIntro(run: ProgramRunState, key: string): boolean {
  return (run.seenBlockIntros || []).includes(key);
}

export function markBlockIntroSeen(run: ProgramRunState, key: string): ProgramRunState {
  return hasSeenBlockIntro(run, key) ? run : { ...run, seenBlockIntros: [...(run.seenBlockIntros || []), key] };
}
