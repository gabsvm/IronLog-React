import type { ProgramSystemDefinition } from '../types';

export function applyPersistentSubstitution(
  substitutions: Record<string, string>,
  slotId: string,
  replacementExerciseId: string,
): Record<string, string> {
  return { ...substitutions, [slotId]: replacementExerciseId };
}

export function clearPersistentSubstitution(substitutions: Record<string, string>, slotId: string): Record<string, string> {
  const next = { ...substitutions };
  delete next[slotId];
  return next;
}

export function isValidSubstitution(definition: ProgramSystemDefinition, slotId: string, replacementExerciseId: string): boolean {
  const slot = definition.blocks.flatMap((block) => block.days.flatMap((day) => day.exercises)).find((candidate) => candidate.slotId === slotId);
  return !!slot && replacementExerciseId.trim().length > 0;
}
