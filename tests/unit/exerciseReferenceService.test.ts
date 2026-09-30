import { describe, it, expect } from 'vitest';
import {
  isBuiltInExercise,
  analyzeExerciseReferences,
  canDestructivelyDelete,
  replaceExerciseReferences,
  archiveExercise,
  unarchiveExercise,
  deleteCustomExercise,
} from '../../services/exerciseReferenceService';
import { ExerciseDef, ProgramDay, MesoCycle, GlobalTemplate } from '../../types';

describe('exerciseReferenceService', () => {
  const dummyExercises: ExerciseDef[] = [
    { id: 'bp_bar', name: 'Barbell Bench Press', muscle: 'CHEST' },
    { id: 'sq_bar', name: 'Barbell Squat', muscle: 'QUADS' },
    { id: 'custom_curls', name: 'My Special Curls', muscle: 'BICEPS' },
    { id: 'custom_unused', name: 'Old Test Move', muscle: 'TRICEPS' },
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
    expect(result.updatedExercises).toHaveLength(dummyExercises.length - 1);
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

  it('archives and unarchives exercises cleanly', () => {
    const archivedList = archiveExercise(dummyExercises, 'custom_curls');
    const target = archivedList.find((e) => e.id === 'custom_curls');
    expect(target?.archived).toBe(true);

    const unarchivedList = unarchiveExercise(archivedList, 'custom_curls');
    const target2 = unarchivedList.find((e) => e.id === 'custom_curls');
    expect(target2?.archived).toBe(false);
  });
});
