import type { ProgramSystemDefinition } from './types';
import { KONG_4DAY_V1 } from './kong/kong4Day';

export const PROGRAM_REGISTRY: Record<string, ProgramSystemDefinition> = {
  [`${KONG_4DAY_V1.id}@${KONG_4DAY_V1.version}`]: KONG_4DAY_V1,
};

export function getProgramDefinition(systemId: string, version: number): ProgramSystemDefinition | null {
  return PROGRAM_REGISTRY[`${systemId}@${version}`] || null;
}
