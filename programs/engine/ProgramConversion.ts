import type { ProgramDay, ProgramSlot, MesoCycle } from '../../types';
import { KONG_4DAY_V1 } from '../kong/kong4Day.ts';
import { getKongDayDisplay } from '../kong/kongDisplay.ts';
import { getProgramBlockForWeek, resolveProgramWeek } from './ProgramResolver.ts';
import { TRANSLATIONS } from '../../constants/translations';

const formatPrescriptionReps = (slot: ProgramSlot): string | undefined => {
  const prescription = slot.prescription;
  if (!prescription || prescription.length === 0) return slot.reps;

  const labels = prescription.map((set) => set.reps === 'FAILURE' ? 'F' : String(set.reps));
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

export interface KongConversionResult {
  editableProgram: ProgramDay[];
  convertedMeso: MesoCycle;
}

/**
 * Canonical conversion of an active structured KONG mesocycle into an editable personal routine.
 * Resolves current week with active substitutions, strips prescription tags, rebuilds plan,
 * and resets duration/week semantics into an editable 4-week personal mesocycle.
 */
export function convertKongToPersonalRoutine(
  activeMeso: MesoCycle,
  lang: 'en' | 'es' = 'es',
  now: number = Date.now()
): KongConversionResult {
  const week = activeMeso.week || 1;
  const substitutions = activeMeso.programSystem?.substitutions || {};
  const { block } = getProgramBlockForWeek(KONG_4DAY_V1, week);

  const resolvedDays = resolveProgramWeek(KONG_4DAY_V1, week, substitutions).map((day, dayIndex) => ({
    ...day,
    dayName: getKongDayDisplay(block.number, dayIndex),
  }));

  const editableProgram = toEditableProgram(resolvedDays);
  const editablePlan = editableProgram.map((day) => (day.slots || []).map((slot) => slot.exerciseId || null));

  const convertedMeso: MesoCycle = {
    ...activeMeso,
    id: now,
    name: TRANSLATIONS[lang].copy.programConversion.kongPersonalRoutine,
    mesoType: 'personal',
    targetWeeks: 4,
    duration: 4,
    week: 1,
    plan: editablePlan,
    isDeload: false,
    programSystem: undefined,
  };

  return {
    editableProgram,
    convertedMeso,
  };
}
