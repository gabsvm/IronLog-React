import type { ProgramSystemDefinition } from './types';
import { KONG_4DAY_V1 } from './kong/kong4Day';
import { PERFORMANCE_UPPER_LOWER_V1 } from './performance/performanceUpperLower';
import { GUTS_BLACK_SWORDSMAN_V1 } from './naturalHypertrophy/gutsBlackSwordsman';

export const PROGRAM_DEFINITIONS: ProgramSystemDefinition[] = [
  KONG_4DAY_V1,
  PERFORMANCE_UPPER_LOWER_V1,
  GUTS_BLACK_SWORDSMAN_V1,
];

export const PROGRAM_REGISTRY: Record<string, ProgramSystemDefinition> = Object.fromEntries(
  PROGRAM_DEFINITIONS.map((definition) => [`${definition.id}@${definition.version}`, definition]),
);

export function getProgramDefinition(systemId: string, version: number): ProgramSystemDefinition | null {
  return PROGRAM_REGISTRY[`${systemId}@${version}`] || null;
}

export function getLatestProgramDefinition(systemId: string): ProgramSystemDefinition | null {
  return PROGRAM_DEFINITIONS
    .filter((definition) => definition.id === systemId)
    .sort((a, b) => b.version - a.version)[0] || null;
}
