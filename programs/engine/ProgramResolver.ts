import type { ProgramDay, ProgramSlot } from '../../types';
import type {
  ProgramBlockDefinition,
  ProgramDayDefinition,
  ProgramExercisePrescription,
  ProgramSystemDefinition,
  ResolvedProgram,
} from '../types';

export function getProgramBlockForWeek(
  definition: ProgramSystemDefinition,
  globalWeek: number,
): { block: ProgramBlockDefinition; blockWeek: number } {
  const week = Math.max(1, Math.min(definition.durationWeeks, Math.floor(globalWeek || 1)));
  const block = definition.blocks.find((candidate) => week >= candidate.globalWeekStart && week <= candidate.globalWeekEnd);
  if (!block) throw new Error(`No program block resolves global week ${globalWeek}`);
  return { block, blockWeek: week - block.globalWeekStart + 1 };
}

export function resolveProgramSlot(
  definition: ProgramSystemDefinition,
  globalWeek: number,
  slot: ProgramExercisePrescription,
  substitutions: Record<string, string> = {},
): ProgramSlot {
  const { blockWeek } = getProgramBlockForWeek(definition, globalWeek);
  const prescription = slot.prescriptions[blockWeek];
  if (!prescription || prescription.sets.length === 0) {
    throw new Error(`Missing prescription for ${slot.slotId} block week ${blockWeek}`);
  }
  const setLabel = (set: typeof prescription.sets[number]) => set.repRange
    ? `${set.repRange.min}-${set.repRange.max}`
    : String(set.reps);
  return {
    muscle: slot.muscle,
    targetMuscle: slot.muscle,
    setTarget: prescription.sets.length,
    reps: prescription.sets.map(setLabel).join(','),
    prescription: prescription.sets.map((set) => ({ ...set })),
    exerciseId: substitutions[slot.slotId] || slot.exerciseId,
    supersetId: slot.supersetId,
    setType: prescription.sets[0]?.role === 'top' ? 'top' : 'regular',
    recommendedRestSeconds: slot.recommendedRestSeconds,
    substitutionGroup: slot.substitutionGroup,
    programSlotId: slot.slotId,
    programSourceName: slot.sourceExerciseName,
    notes: slot.guideNoteId,
  };
}

export function resolveProgramDay(
  definition: ProgramSystemDefinition,
  globalWeek: number,
  dayIndex: number,
  substitutions: Record<string, string> = {},
): ProgramDay {
  const { block } = getProgramBlockForWeek(definition, globalWeek);
  const day = block.days[dayIndex];
  if (!day) throw new Error(`No day ${dayIndex + 1} in ${block.id}`);
  return {
    id: day.id,
    dayName: day.name,
    notes: day.focus.en,
    slots: day.exercises.map((slot) => resolveProgramSlot(definition, globalWeek, slot, substitutions)),
  };
}

export function resolveProgramWeek(
  definition: ProgramSystemDefinition,
  globalWeek: number,
  substitutions: Record<string, string> = {},
): ProgramDay[] {
  const { block } = getProgramBlockForWeek(definition, globalWeek);
  return block.days.map((_, index) => resolveProgramDay(definition, globalWeek, index, substitutions));
}

export function resolveProgram(
  definition: ProgramSystemDefinition,
  globalWeek: number,
  dayIndex: number,
  substitutions: Record<string, string> = {},
): ResolvedProgram {
  const { block, blockWeek } = getProgramBlockForWeek(definition, globalWeek);
  const day = block.days[dayIndex];
  if (!day) throw new Error(`No day ${dayIndex + 1} in ${block.id}`);
  return { block, blockWeek, day, legacyDay: resolveProgramDay(definition, globalWeek, dayIndex, substitutions) };
}
