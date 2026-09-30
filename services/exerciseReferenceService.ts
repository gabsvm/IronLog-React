import { ExerciseDef, ProgramDay, MesoCycle, GlobalTemplate } from '../types';
import { DEFAULT_LIBRARY } from '../data/defaultLibrary';

const BUILTIN_EXERCISE_IDS = new Set(DEFAULT_LIBRARY.map((e) => e.id));

export interface ExerciseReferenceLocation {
  type: 'program' | 'activeMeso' | 'personalTemplate';
  containerName: string;
  detail: string;
}

export interface ExerciseReferenceReport {
  exerciseId: string;
  isCustom: boolean;
  isBuiltIn: boolean;
  isArchived: boolean;
  totalReferences: number;
  locations: ExerciseReferenceLocation[];
}

export interface ExerciseAnalysisContext {
  exercises?: ExerciseDef[] | null;
  program?: ProgramDay[] | null;
  activeMeso?: MesoCycle | null;
  personalTemplates?: GlobalTemplate[] | null;
}

/**
 * Checks whether an exercise is a built-in catalog exercise
 * (cannot be destructively deleted by users).
 */
export const isBuiltInExercise = (exerciseId: string, exercises?: ExerciseDef[] | null): boolean => {
  if (BUILTIN_EXERCISE_IDS.has(exerciseId)) return true;
  const def = exercises?.find((e) => e.id === exerciseId);
  if (def?.source === 'nilsson_bw') return true;
  // Custom exercises created by users always have id prefixed with 'custom_' or explicitly marked
  if (def?.isCustom) return false;
  return !exerciseId.startsWith('custom_') && BUILTIN_EXERCISE_IDS.has(exerciseId);
};

/**
 * Analyzes where an exercise is referenced across the active program,
 * active mesocycle plan, and personal templates.
 */
export const analyzeExerciseReferences = (
  exerciseId: string,
  context: ExerciseAnalysisContext
): ExerciseReferenceReport => {
  const { exercises = [], program = [], activeMeso = null, personalTemplates = [] } = context;

  const exDef = exercises?.find((e) => e.id === exerciseId);
  const isBuiltIn = isBuiltInExercise(exerciseId, exercises);
  const isCustom = !isBuiltIn;
  const isArchived = !!exDef?.archived;

  const locations: ExerciseReferenceLocation[] = [];

  // 1. Inspect current active program
  if (Array.isArray(program)) {
    program.forEach((day, dayIdx) => {
      const dayName = typeof day.dayName === 'string'
        ? day.dayName
        : day.dayName?.es || day.dayName?.en || `Día ${dayIdx + 1}`;

      (day.slots || []).forEach((slot, slotIdx) => {
        if (slot?.exerciseId === exerciseId) {
          locations.push({
            type: 'program',
            containerName: `Rutina: ${dayName}`,
            detail: `Ejercicio #${slotIdx + 1} (${slot.label || slot.muscle || 'Slot'})`,
          });
        }
      });
    });
  }

  // 2. Inspect active mesocycle plan
  if (activeMeso && Array.isArray(activeMeso.plan)) {
    const mesoName = activeMeso.name || `Mesociclo #${activeMeso.id || 1}`;
    activeMeso.plan.forEach((daySlots, dayIdx) => {
      if (Array.isArray(daySlots)) {
        daySlots.forEach((slotExId, slotIdx) => {
          if (slotExId === exerciseId) {
            locations.push({
              type: 'activeMeso',
              containerName: `Meso activo: ${mesoName}`,
              detail: `Día ${dayIdx + 1}, Slot #${slotIdx + 1}`,
            });
          }
        });
      }
    });
  }

  // 3. Inspect personal templates
  if (Array.isArray(personalTemplates)) {
    personalTemplates.forEach((template) => {
      const templateName = template.name || template.title?.es || template.title?.en || 'Plantilla personal';
      (template.program || []).forEach((day, dayIdx) => {
        const dayTitle = typeof day.dayName === 'string'
          ? day.dayName
          : day.dayName?.es || day.dayName?.en || `Día ${dayIdx + 1}`;

        (day.slots || []).forEach((slot, slotIdx) => {
          if (slot?.exerciseId === exerciseId) {
            locations.push({
              type: 'personalTemplate',
              containerName: `Plantilla: ${templateName}`,
              detail: `${dayTitle} · Slot #${slotIdx + 1}`,
            });
          }
        });
      });
    });
  }

  return {
    exerciseId,
    isCustom,
    isBuiltIn,
    isArchived,
    totalReferences: locations.length,
    locations,
  };
};

/**
 * Determines if an exercise can be safely and destructively deleted.
 */
export const canDestructivelyDelete = (
  report: ExerciseReferenceReport
): { canDelete: boolean; reason?: 'builtin_exercise' | 'has_active_references' } => {
  if (report.isBuiltIn) {
    return { canDelete: false, reason: 'builtin_exercise' };
  }
  if (report.totalReferences > 0) {
    return { canDelete: false, reason: 'has_active_references' };
  }
  return { canDelete: true };
};

/**
 * Replaces all references to an exercise across the user's program,
 * active mesocycle plan, and personal templates.
 */
export const replaceExerciseReferences = ({
  oldExerciseId,
  newExerciseId,
  program,
  activeMeso,
  personalTemplates,
}: {
  oldExerciseId: string;
  newExerciseId: string;
  program?: ProgramDay[] | null;
  activeMeso?: MesoCycle | null;
  personalTemplates?: GlobalTemplate[] | null;
}): {
  updatedProgram: ProgramDay[];
  updatedActiveMeso: MesoCycle | null;
  updatedPersonalTemplates: GlobalTemplate[];
} => {
  // Update program
  const updatedProgram: ProgramDay[] = (program || []).map((day) => ({
    ...day,
    slots: (day.slots || []).map((slot) =>
      slot.exerciseId === oldExerciseId ? { ...slot, exerciseId: newExerciseId } : slot
    ),
  }));

  // Update active meso plan
  let updatedActiveMeso: MesoCycle | null = null;
  if (activeMeso) {
    const updatedPlan = Array.isArray(activeMeso.plan)
      ? activeMeso.plan.map((daySlots) =>
          Array.isArray(daySlots)
            ? daySlots.map((id) => (id === oldExerciseId ? newExerciseId : id))
            : daySlots
        )
      : activeMeso.plan;

    updatedActiveMeso = {
      ...activeMeso,
      plan: updatedPlan,
    };
  }

  // Update personal templates
  const updatedPersonalTemplates: GlobalTemplate[] = (personalTemplates || []).map((tmpl) => ({
    ...tmpl,
    program: (tmpl.program || []).map((day) => ({
      ...day,
      slots: (day.slots || []).map((slot) =>
        slot.exerciseId === oldExerciseId ? { ...slot, exerciseId: newExerciseId } : slot
      ),
    })),
  }));

  return {
    updatedProgram,
    updatedActiveMeso,
    updatedPersonalTemplates,
  };
};

/**
 * Archives a custom or catalog exercise.
 */
export const archiveExercise = (exercises: ExerciseDef[], exerciseId: string): ExerciseDef[] => {
  return exercises.map((ex) =>
    ex.id === exerciseId ? { ...ex, archived: true } : ex
  );
};

/**
 * Unarchives an exercise.
 */
export const unarchiveExercise = (exercises: ExerciseDef[], exerciseId: string): ExerciseDef[] => {
  return exercises.map((ex) =>
    ex.id === exerciseId ? { ...ex, archived: false } : ex
  );
};

/**
 * Destructively deletes a custom exercise provided it has zero references.
 */
export const deleteCustomExercise = (
  exercises: ExerciseDef[],
  exerciseId: string,
  report?: ExerciseReferenceReport
): { success: boolean; updatedExercises: ExerciseDef[]; error?: string } => {
  if (report) {
    const check = canDestructivelyDelete(report);
    if (!check.canDelete) {
      return { success: false, updatedExercises: exercises, error: check.reason };
    }
  } else if (isBuiltInExercise(exerciseId, exercises)) {
    return { success: false, updatedExercises: exercises, error: 'builtin_exercise' };
  }

  return {
    success: true,
    updatedExercises: exercises.filter((e) => e.id !== exerciseId),
  };
};
