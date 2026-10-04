import { describe, it, expect } from 'vitest';
import type { ExerciseDef } from '../../types';
import {
    aggregateExerciseFrequency,
    exerciseIdGroup,
    exerciseSearchNames,
    isSelectorVisible,
    matchesExerciseQuery,
    mergeExercises,
    normalizeExerciseName,
    resolveExerciseId,
    suggestDuplicatePairs,
    unmergeExercise,
} from '../../utils/exerciseLibrary';

const def = (id: string, name: ExerciseDef['name'], extra: Partial<ExerciseDef> = {}): ExerciseDef => ({
    id,
    name,
    muscle: 'CHEST',
    ...extra,
});

const LIB: ExerciseDef[] = [
    def('bp_bar', { en: 'Barbell Bench Press', es: 'Press Banca Barra' }),
    def('custom_1', 'Press Banca', { isCustom: true }),
    def('ohp', { en: 'Overhead Press', es: 'Press Militar' }),
];

describe('Q14: exercise library search + merge', () => {
    it('normalizes across case, accents and punctuation', () => {
        expect(normalizeExerciseName('Press Banca Barra')).toBe('press banca barra');
        expect(normalizeExerciseName('Extensión de Cuádriceps')).toBe('extension de cuadriceps');
        expect(normalizeExerciseName('  Row, Barbell! ')).toBe('row barbell');
    });

    it('matches queries in both languages, accent-insensitive', () => {
        const bench = LIB[0]!;
        expect(matchesExerciseQuery(bench, '')).toBe(true);
        expect(matchesExerciseQuery(bench, 'bench')).toBe(true);
        expect(matchesExerciseQuery(bench, 'BANCA')).toBe(true);
        expect(matchesExerciseQuery(bench, 'press banca')).toBe(true);
        expect(matchesExerciseQuery(bench, 'sentadilla')).toBe(false);
        const ext = def('leg_ext', { en: 'Leg Extension', es: 'Extensiones de Cuádriceps' });
        expect(matchesExerciseQuery(ext, 'cuadriceps')).toBe(true);
        expect(matchesExerciseQuery(ext, 'extension')).toBe(true);
    });

    it('matches curated aliases and per-exercise aliases', () => {
        const bench = LIB[0]!;
        // Curated: "press banca" / "bench press" short forms resolve to bp_bar.
        expect(matchesExerciseQuery(bench, 'press banca')).toBe(true);
        expect(matchesExerciseQuery(bench, 'bench press')).toBe(true);
        const withAlias = def('x', 'Something Else', { aliases: ['my pet name'] });
        expect(matchesExerciseQuery(withAlias, 'pet name')).toBe(true);
        expect(exerciseSearchNames(bench)).toContain('Press Banca Barra');
    });

    it('resolves merged ids through chains, guarding cycles', () => {
        const lib: ExerciseDef[] = [
            def('a', 'A', { mergedInto: 'b' }),
            def('b', 'B', { mergedInto: 'c' }),
            def('c', 'C'),
            def('x', 'X', { mergedInto: 'y' }),
            def('y', 'Y', { mergedInto: 'x' }),
        ];
        expect(resolveExerciseId(lib, 'a')).toBe('c');
        expect(resolveExerciseId(lib, 'b')).toBe('c');
        expect(resolveExerciseId(lib, 'c')).toBe('c');
        expect(resolveExerciseId(lib, 'unknown')).toBe('unknown');
        // Cycle: returns without hanging.
        expect(['x', 'y']).toContain(resolveExerciseId(lib, 'x'));
    });

    it('groups an id with everything merged into it', () => {
        const lib: ExerciseDef[] = [
            def('a', 'A', { mergedInto: 'b' }),
            def('b', 'B'),
            def('c', 'C', { mergedInto: 'b' }),
            def('d', 'D'),
        ];
        expect(exerciseIdGroup(lib, 'b').sort()).toEqual(['a', 'b', 'c']);
        expect(exerciseIdGroup(lib, 'a').sort()).toEqual(['a', 'b', 'c']);
        expect(exerciseIdGroup(lib, 'd')).toEqual(['d']);
    });

    it('merges onto the canonical target and refuses self/cycle/unknown merges', () => {
        const lib: ExerciseDef[] = [def('a', 'A'), def('b', 'B', { mergedInto: 'c' }), def('c', 'C')];
        const merged = mergeExercises(lib, 'a', 'b');
        expect(merged.find((e) => e.id === 'a')!.mergedInto).toBe('c');
        // Original untouched.
        expect(lib.find((e) => e.id === 'a')!.mergedInto).toBeUndefined();
        expect(mergeExercises(lib, 'a', 'a')).toBe(lib);
        expect(mergeExercises(lib, 'a', 'zzz')).toBe(lib);
        expect(mergeExercises(lib, 'zzz', 'a')).toBe(lib);
    });

    it('refuses merges that would create a cycle', () => {
        const lib: ExerciseDef[] = [def('a', 'A', { mergedInto: 'b' }), def('b', 'B')];
        expect(mergeExercises(lib, 'b', 'a')).toBe(lib);
    });

    it('unmerges by dropping mergedInto', () => {
        const lib: ExerciseDef[] = [def('a', 'A', { mergedInto: 'b' }), def('b', 'B')];
        const next = unmergeExercise(lib, 'a');
        expect(next.find((e) => e.id === 'a')!).not.toHaveProperty('mergedInto');
        expect(resolveExerciseId(next, 'a')).toBe('a');
        expect(unmergeExercise(lib, 'b')).toEqual(lib);
    });

    it('suggests duplicates by shared normalized name, preferring built-ins as target', () => {
        const pairs = suggestDuplicatePairs(LIB);
        // "Press Banca" (custom) shares its normalized name with bp_bar's alias.
        expect(pairs).toContainEqual({ sourceId: 'custom_1', targetId: 'bp_bar', reason: 'shared-alias' });
        // Already-merged pairs are not suggested.
        const merged = mergeExercises(LIB, 'custom_1', 'bp_bar');
        expect(suggestDuplicatePairs(merged)).toEqual([]);
    });

    it('lists the canonical id first in a group', () => {
        const lib = mergeExercises(LIB, 'custom_1', 'bp_bar');
        expect(exerciseIdGroup(lib, 'custom_1')[0]).toBe('bp_bar');
        expect(exerciseIdGroup(lib, 'custom_1').sort()).toEqual(['bp_bar', 'custom_1']);
    });

    it('aggregates per-exercise counts under canonical ids', () => {
        const lib = mergeExercises(LIB, 'custom_1', 'bp_bar');
        const totals = Object.fromEntries(aggregateExerciseFrequency(
            { custom_1: 2, bp_bar: 3, ohp: 1, ghost: 4 },
            lib,
        ));
        expect(totals).toEqual({ bp_bar: 5, ohp: 1, ghost: 4 });
    });

    it('hides merged defs from selectors', () => {
        const lib = mergeExercises(LIB, 'custom_1', 'bp_bar');
        expect(lib.map(isSelectorVisible)).toEqual([true, false, true]);
    });
});
