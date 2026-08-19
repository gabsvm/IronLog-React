import type { ProgramDay, ProgramSlot } from '../../types';

const formatPrescriptionReps = (slot: ProgramSlot): string | undefined => {
  const prescription = slot.prescription;
  if (!prescription || prescription.length === 0) return slot.reps;

  const labels = prescription.map((set) => {
    if (set.repRange) return `${set.repRange.min}-${set.repRange.max}`;
    return set.reps === 'FAILURE' ? 'F' : String(set.reps);
  });
  if (labels.every((label) => label === labels[0])) return labels[0];
  return labels.join(' · ');
};

/**
 * Program Systems may carry per-set prescriptions and resolver metadata that
 * the legacy routine editor does not understand. A personal routine must be a
 * true editable snapshot, not a structured program with hidden prescriptions
 * still overriding the visible SETS/REPS fields.
 */
export function toEditableProgram(program: ProgramDay[]): ProgramDay[] {
  return program.map((day) => ({
    ...day,
    slots: (day.slots || []).map((slot) => {
      const {
        prescription,
        programSlotId,
        substitutionGroup,
        programSourceName,
        targetMuscle,
        ...legacySlot
      } = slot;

      const reps = formatPrescriptionReps(slot);
      return {
        ...legacySlot,
        setTarget: prescription?.length || slot.setTarget || 3,
        ...(reps ? { reps } : {}),
      };
    }),
  }));
}
