import { describe, it, expect } from 'vitest';
import {
  isBuiltInExercise,
  analyzeExerciseReferences,
  canDestructivelyDelete,
  replaceExerciseReferences,
  archiveExercise,
  unarchiveExercise,
  deleteCustomExercise,
  executeExerciseReplacement,
} from '../../services/exerciseReferenceService';
import { ExerciseDef, ProgramDay, MesoCycle, GlobalTemplate } from '../../types';

describe('exerciseReferenceService', () => {
  const dummyExercises: ExerciseDef[] = [
    { id: 'bp_bar', name: 'Barbell Bench Press', muscle: 'CHEST' },
    { id: 'sq_bar', name: 'Barbell Squat', muscle: 'QUADS' },
    { id: 'cf_clean', name: 'Power Clean', muscle: 'BACK' },
    { id: 'cal_planche_tuck', name: 'Tuck Planche', muscle: 'SHOULDERS' },
    { id: 'nil_step_back_lunge', name: 'Step-Back Lunge', muscle: 'QUADS', source: 'nilsson_bw' },
    { id: 'custom_curls', name: 'My Special Curls', muscle: 'BICEPS', isCustom: true },
    { id: 'custom_unused', name: 'Old Test Move', muscle: 'TRICEPS', isCustom: true },
  ];

  const dummyProgram: ProgramDay[] = [
    {
      id: 'day-1',
      dayName: { en: 'Push Day', es: 'Día Empuje' },
      slots: [
        { exerciseId: 'bp_bar', muscle: 'CHEST', setTarget: 3 },
        { exerciseId: 'custom_curls', muscle: 'BICEPS', setTarget: 3 },
      ],
    },
    {
      id: 'day-2',
      dayName: { en: 'Leg Day', es: 'Día Pierna' },
      slots: [
        { exerciseId: 'sq_bar', muscle: 'QUADS', setTarget: 4 },
      ],
    },
  ];

  const dummyMeso: MesoCycle = {
    id: 101,
    name: 'Meso Test 1',
    mesoType: 'hypertrophy',
    week: 2,
    duration: 6,
    plan: [
      ['bp_bar', 'custom_curls'],
      ['sq_bar'],
    ],
  };

  const dummyTemplates: GlobalTemplate[] = [
    {
      id: 'template-custom-1',
      name: 'Favorite Upper',
      title: { en: 'Favorite Upper', es: 'Torso Favorito' },
      description: { en: 'Custom upper', es: 'Torso custom' },
      isPro: false,
      order: 1,
      program: [
        {
          id: 'tmpl-day-1',
          dayName: { en: 'Upper', es: 'Torso' },
          slots: [
            { exerciseId: 'custom_curls', muscle: 'BICEPS', setTarget: 3 },
          ],
        },
      ],
    },
  ];

  it('correctly identifies built-in vs custom exercises', () => {
    expect(isBuiltInExercise('bp_bar', dummyExercises)).toBe(true);
    expect(isBuiltInExercise('sq_bar', dummyExercises)).toBe(true);
    expect(isBuiltInExercise('custom_curls', dummyExercises)).toBe(false);
    expect(isBuiltInExercise('custom_unused', dummyExercises)).toBe(false);
  });

  it('canonical catalog classifies CrossFit, Calisthenics, and Nilsson exercises as built-in', () => {
    // CrossFit bundled exercises
    expect(isBuiltInExercise('cf_clean', dummyExercises)).toBe(true);
    expect(isBuiltInExercise('cf_thruster')).toBe(true);
    expect(isBuiltInExercise('cf_mu')).toBe(true);

    // Calisthenics bundled progressions
    expect(isBuiltInExercise('cal_planche_tuck', dummyExercises)).toBe(true);
    expect(isBuiltInExercise('cal_front_lever_adv_tuck')).toBe(true);

    // Nilsson bodyweight bundled exercises
    expect(isBuiltInExercise('nil_step_back_lunge', dummyExercises)).toBe(true);
    expect(isBuiltInExercise('nil_band_supp_dip')).toBe(true);

    // Rejects deletion of official catalog items
    const cfDelete = deleteCustomExercise(dummyExercises, 'cf_clean');
    expect(cfDelete.success).toBe(false);
    expect(cfDelete.error).toBe('builtin_exercise');

    const calDelete = deleteCustomExercise(dummyExercises, 'cal_planche_tuck');
    expect(calDelete.success).toBe(false);
    expect(calDelete.error).toBe('builtin_exercise');
  });

  it('detects all references for a referenced custom exercise', () => {
    const report = analyzeExerciseReferences('custom_curls', {
      exercises: dummyExercises,
      program: dummyProgram,
      activeMeso: dummyMeso,
      personalTemplates: dummyTemplates,
    });

    expect(report.isCustom).toBe(true);
    expect(report.isBuiltIn).toBe(false);
    expect(report.totalReferences).toBe(3); // 1 in program, 1 in activeMeso, 1 in personalTemplates
    expect(report.locations.some((l) => l.type === 'program')).toBe(true);
    expect(report.locations.some((l) => l.type === 'activeMeso')).toBe(true);
    expect(report.locations.some((l) => l.type === 'personalTemplate')).toBe(true);
  });

  it('reports zero references for an unused custom exercise', () => {
    const report = analyzeExerciseReferences('custom_unused', {
      exercises: dummyExercises,
      program: dummyProgram,
      activeMeso: dummyMeso,
      personalTemplates: dummyTemplates,
    });

    expect(report.isCustom).toBe(true);
    expect(report.totalReferences).toBe(0);
    expect(report.locations).toHaveLength(0);
  });

  it('prevents destructive deletion of built-in exercises', () => {
    const report = analyzeExerciseReferences('bp_bar', {
      exercises: dummyExercises,
      program: dummyProgram,
      activeMeso: dummyMeso,
    });

    const check = canDestructivelyDelete(report);
    expect(check.canDelete).toBe(false);
    expect(check.reason).toBe('builtin_exercise');
  });

  it('prevents destructive deletion of referenced custom exercises', () => {
    const report = analyzeExerciseReferences('custom_curls', {
      exercises: dummyExercises,
      program: dummyProgram,
      activeMeso: dummyMeso,
      personalTemplates: dummyTemplates,
    });

    const check = canDestructivelyDelete(report);
    expect(check.canDelete).toBe(false);
    expect(check.reason).toBe('has_active_references');
  });

  it('allows destructive deletion of unreferenced custom exercises', () => {
    const report = analyzeExerciseReferences('custom_unused', {
      exercises: dummyExercises,
      program: dummyProgram,
      activeMeso: dummyMeso,
      personalTemplates: dummyTemplates,
    });

    const check = canDestructivelyDelete(report);
    expect(check.canDelete).toBe(true);

    const result = deleteCustomExercise(dummyExercises, 'custom_unused', report);
    expect(result.success).toBe(true);
    expect(result.updatedExercises.some((e) => e.id === 'custom_unused')).toBe(false);
  });

  it('safely replaces exercise references across program, active meso, and personal templates', () => {
    const result = replaceExerciseReferences({
      oldExerciseId: 'custom_curls',
      newExerciseId: 'bp_bar',
      program: dummyProgram,
      activeMeso: dummyMeso,
      personalTemplates: dummyTemplates,
    });

    // In program
    const updatedSlot = result.updatedProgram[0].slots[1];
    expect(updatedSlot.exerciseId).toBe('bp_bar');

    // In active meso
    expect(result.updatedActiveMeso?.plan[0][1]).toBe('bp_bar');

    // In personal templates
    expect(result.updatedPersonalTemplates[0].program[0].slots[0].exerciseId).toBe('bp_bar');
  });

  it('executeExerciseReplacement atomically replaces references across all routine domains and deletes old custom exercise', () => {
    const initialExerciseCount = dummyExercises.length;
    const replacementResult = executeExerciseReplacement({
      oldExerciseId: 'custom_curls',
      newExerciseId: 'bp_bar',
      deleteOldExercise: true,
      exercises: dummyExercises,
      program: dummyProgram,
      activeMeso: dummyMeso,
      personalTemplates: dummyTemplates,
    });

    // 1. Program updated
    expect(replacementResult.updatedProgram[0].slots[1].exerciseId).toBe('bp_bar');

    // 2. Active meso updated
    expect(replacementResult.updatedActiveMeso?.plan[0][1]).toBe('bp_bar');

    // 3. Personal templates updated
    expect(replacementResult.updatedPersonalTemplates[0].program[0].slots[0].exerciseId).toBe('bp_bar');

    // 4. Old custom exercise deleted from exercises list
    expect(replacementResult.updatedExercises.some((e) => e.id === 'custom_curls')).toBe(false);
    expect(replacementResult.updatedExercises.length).toBe(initialExerciseCount - 1);

    // 5. Built-in exercises remain intact
    expect(replacementResult.updatedExercises.some((e) => e.id === 'bp_bar')).toBe(true);
  });

  it('archives and unarchives exercises cleanly', () => {
    const archivedList = archiveExercise(dummyExercises, 'custom_curls');
    const target = archivedList.find((e) => e.id === 'custom_curls');
    expect(target?.archived).toBe(true);

    const unarchivedList = unarchiveExercise(archivedList, 'custom_curls');
    const target2 = unarchivedList.find((e) => e.id === 'custom_curls');
    expect(target2?.archived).toBe(false);
  });
});
