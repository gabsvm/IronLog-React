import type { MuscleGroup, ProgramDay } from '../types';

export type LocalizedText = { en: string; es: string };

export type ProgramSetRole =
  | 'work'
  | 'top'
  | 'backoff'
  | 'high_rep_backoff'
  | 'failure';

export interface RepRange {
  min: number;
  max: number;
}

export interface SetPrescription {
  reps: number | 'FAILURE';
  repRange?: RepRange;
  targetRpe?: number;
  role?: ProgramSetRole;
}

export interface ExerciseWeekPrescription {
  sets: SetPrescription[];
}

export interface ProgramExercisePrescription {
  slotId: string;
  sourceExerciseName: string;
  exerciseId: string;
  muscle: MuscleGroup;
  prescriptions: Record<number, ExerciseWeekPrescription>;
  supersetId?: string;
  substitutionGroup?: string;
  recommendedRestSeconds?: number;
  guideNoteId?: string;
  preserveOrderReason?: LocalizedText;
}

export interface ProgramDayDefinition {
  id: string;
  dayNumber: number;
  name: LocalizedText;
  focus: LocalizedText;
  exercises: ProgramExercisePrescription[];
}

export interface ProgramBlockDefinition {
  id: string;
  number: number;
  globalWeekStart: number;
  globalWeekEnd: number;
  name: LocalizedText;
  goal: LocalizedText;
  principles: string[];
  days: ProgramDayDefinition[];
}

export interface ProgramCadence {
  unit: 'week' | 'cycle';
  rolling?: boolean;
  recommendedRestDaysBetweenSessions?: number;
}

export interface ProgramSystemDefinition {
  id: string;
  version: number;
  title: string;
  subtitle: LocalizedText;
  author: string;
  durationWeeks: number;
  daysPerWeek: number;
  blocks: ProgramBlockDefinition[];
  guideId: string;
  cadence?: ProgramCadence;
  progressionModel?: 'prescribed' | 'double_progression' | 'evolving_rep_range';
}

export interface ProgramRunState {
  systemId: string;
  systemVersion: number;
  startedAt: number;
  startedBodyWeight?: number;
  substitutions: Record<string, string>;
  seenGuideSections?: string[];
  seenBlockIntros?: string[];
}

export interface ResolvedProgram {
  block: ProgramBlockDefinition;
  blockWeek: number;
  day: ProgramDayDefinition;
  legacyDay: ProgramDay;
}
