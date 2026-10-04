import { describe, it, expect } from 'vitest';
import type { ExerciseDef } from '../../types';
import {
    IMPORTED_MESO_ID,
    addImportKeys,
    buildImportLogs,
    buildTrainingCsv,
    detectCsvFormat,
    matchParsedExerciseNames,
    normalizeExerciseName,
    parseHevyCsv,
    parseStrongCsv,
    parseTrainingCsv,
    readImportKeys,
    splitFreshSessions,
} from '../../services/trainingCsv';
import { parseCsv } from '../../utils/csv';
import { db } from '../../utils/db';

const LIB: ExerciseDef[] = [
    { id: 'bp_bar', name: { en: 'Barbell Bench Press', es: 'Press Banca Barra' }, muscle: 'CHEST' },
    { id: 'ohp', name: { en: 'Overhead Press', es: 'Press Militar' }, muscle: 'SHOULDERS' },
];

const HEVY = [
    'title,start_time,end_time,description,exercise_title,superset_id,exercise_notes,set_index,set_type,weight_kg,reps,distance_km,duration_seconds,rpe',
    '"Morning Push","2026-09-20 08:00:00","2026-09-20 09:00:00","Felt strong","Barbell Bench Press","","",0,normal,60,8,,,8',
    '"Morning Push","2026-09-20 08:00:00","2026-09-20 09:00:00","Felt strong","Barbell Bench Press","","",1,normal,60,8,,,9',
    '"Morning Push","2026-09-20 08:00:00","2026-09-20 09:00:00","Felt strong","Overhead Press","","tough",0,warmup,20,10,,,6',
    '"Morning Push","2026-09-20 08:00:00","2026-09-20 09:00:00","Felt strong","Overhead Press","","tough",1,normal,30,8,,,7',
].join('\n');

const HEVY_LB = [
    'title,start_time,end_time,description,exercise_title,superset_id,exercise_notes,set_index,set_type,weight_lbs,reps,distance_km,duration_seconds,rpe',
    '"LB Day","2026-09-22 08:00:00","2026-09-22 08:30:00","","Barbell Bench Press","","",0,normal,135,5,,,8',
].join('\n');

const STRONG = [
    'Date,Workout Name,Exercise Name,Set Order,Weight,Reps,Distance,Seconds,Notes,Workout Notes,RPE',
    '2026-09-21 18:00:00,Evening Pull,Deadlift,1,100,5,,,,"",8',
    '2026-09-21 18:00:00,Evening Pull,Deadlift,2,100,5,,,hook grip,,9',
    '2026-09-21 18:00:00,Evening Pull,"Row, Barbell",1,60,10,,,,"",7',
].join('\n');

describe('Q12: training CSV', () => {
    it('detects Hevy, Strong and unknown headers', () => {
        expect(detectCsvFormat(parseCsv(HEVY)[0]!)).toBe('hevy');
        expect(detectCsvFormat(parseCsv(STRONG)[0]!)).toBe('strong');
        expect(detectCsvFormat(['foo', 'bar'])).toBeNull();
        expect(() => parseTrainingCsv('foo,bar\n1,2')).toThrow('unknown-format');
        expect(() => parseTrainingCsv('\n')).toThrow('empty');
    });

    it('parses Hevy sessions with types, RPE and notes', () => {
        const parsed = parseHevyCsv(HEVY);
        expect(parsed.source).toBe('hevy');
        expect(parsed.skippedRows).toBe(0);
        expect(parsed.sessions).toHaveLength(1);
        const [session] = parsed.sessions;
        expect(session!.title).toBe('Morning Push');
        expect(session!.note).toBe('Felt strong');
        expect(session!.endTime - session!.startTime).toBe(3600000);
        expect(session!.exercises.map((e) => e.name)).toEqual(['Barbell Bench Press', 'Overhead Press']);
        expect(session!.setCount).toBe(4);
        const bench = session!.exercises[0]!;
        expect(bench.sets[0]).toMatchObject({ index: 0, type: 'regular', weightKg: 60, reps: 8, rpe: 8 });
        const ohp = session!.exercises[1]!;
        expect(ohp.sets[0]).toMatchObject({ type: 'warmup', weightKg: 20 });
        expect(ohp.notes).toEqual(['tough']);
        expect(session!.key).toMatch(/^hevy:\d+:morning push:2x4$/);
        expect(parsed.dateRange).toEqual({ min: session!.startTime, max: session!.startTime });
    });

    it('converts Hevy weight_lbs to canonical kg', () => {
        const parsed = parseHevyCsv(HEVY_LB);
        expect(parsed.sessions[0]!.exercises[0]!.sets[0]!.weightKg).toBe(61.235);
    });

    it('skips Hevy rows with bad dates or no exercise', () => {
        const bad = [
            'title,start_time,end_time,description,exercise_title,superset_id,exercise_notes,set_index,set_type,weight_kg,reps,distance_km,duration_seconds,rpe',
            '"X","not a date","2026-09-20 09:00:00","","Barbell Bench Press","","",0,normal,60,8,,,8',
            '"X","2026-09-20 08:00:00","2026-09-20 09:00:00","","","","",0,normal,60,8,,,8',
        ].join('\n');
        const parsed = parseHevyCsv(bad);
        expect(parsed.sessions).toHaveLength(0);
        expect(parsed.skippedRows).toBe(2);
    });

    it('parses Strong sessions grouped by date + workout', () => {
        const parsed = parseStrongCsv(STRONG, 'kg');
        expect(parsed.sessions).toHaveLength(1);
        const [session] = parsed.sessions;
        expect(session!.title).toBe('Evening Pull');
        expect(session!.startTime).toBe(session!.endTime);
        expect(session!.exercises.map((e) => e.name)).toEqual(['Deadlift', 'Row, Barbell']);
        expect(session!.exercises[0]!.sets.map((s) => s.weightKg)).toEqual([100, 100]);
        expect(session!.exercises[0]!.sets[1]!.rpe).toBe(9);
        expect(session!.exercises[0]!.notes).toEqual(['hook grip']);
        expect(session!.key).toMatch(/^strong:\d+:evening pull:2x3$/);
    });

    it('interprets Strong weights in the caller-provided unit', () => {
        const asKg = parseStrongCsv(STRONG, 'kg');
        expect(asKg.sessions[0]!.exercises[0]!.sets[0]!.weightKg).toBe(100);
        const asLb = parseStrongCsv(STRONG, 'lb');
        expect(asLb.sessions[0]!.exercises[0]!.sets[0]!.weightKg).toBe(45.3592);
    });

    it('normalizes names across case, accents and punctuation', () => {
        expect(normalizeExerciseName('Press Banca Barra')).toBe('press banca barra');
        expect(normalizeExerciseName('  Press-Banca!  (Barra) ')).toBe('press banca barra');
        expect(normalizeExerciseName('Extensión de Cuádriceps')).toBe('extension de cuadriceps');
    });

    it('matches parsed names against the library in both languages', () => {
        const matches = matchParsedExerciseNames(
            ['Barbell Bench Press', 'Press Militar', 'Some Unknown Lift'],
            LIB
        );
        expect(matches[0]!.matched?.id).toBe('bp_bar');
        expect(matches[1]!.matched?.id).toBe('ohp');
        expect(matches[2]!.matched).toBeNull();
    });

    it('builds imported logs on the reserved mesoId with completed sets', () => {
        const parsed = parseHevyCsv(HEVY);
        const { logs, newExercises } = buildImportLogs(
            parsed.sessions,
            {
                'Barbell Bench Press': { kind: 'existing', exerciseId: 'bp_bar' },
                'Overhead Press': { kind: 'create', muscle: 'SHOULDERS' },
            },
            LIB,
            1700000000000
        );
        expect(logs).toHaveLength(1);
        const [log] = logs;
        expect(log!.mesoId).toBe(IMPORTED_MESO_ID);
        expect(log!.mesoId).toBeLessThan(0);
        expect(log!.week).toBe(-1);
        expect(log!.dayIdx).toBe(-1);
        expect(log!.importedFrom).toBe('hevy');
        expect(log!.importKey).toBe(parsed.sessions[0]!.key);
        expect(log!.duration).toBe(3600);
        expect(log!.exercises[0]!.id).toBe('bp_bar');
        expect(log!.exercises[0]!.muscle).toBe('CHEST');
        expect(log!.exercises[0]!.sets[0]).toMatchObject({ weight: '60', reps: '8', rpe: '8', completed: true, type: 'regular' });
        expect(newExercises).toHaveLength(1);
        expect(newExercises[0]).toMatchObject({ name: 'Overhead Press', muscle: 'SHOULDERS', isCustom: true });
        expect(log!.exercises[1]!.id).toBe(newExercises[0]!.id);
    });

    it('throws on missing or unknown mapping decisions', () => {
        const parsed = parseHevyCsv(HEVY);
        expect(() => buildImportLogs(parsed.sessions, {}, LIB)).toThrow('missing-mapping');
        expect(() =>
            buildImportLogs(
                parsed.sessions,
                {
                    'Barbell Bench Press': { kind: 'existing', exerciseId: 'nope' },
                    'Overhead Press': { kind: 'create', muscle: 'SHOULDERS' },
                },
                LIB
            )
        ).toThrow('unknown-exercise');
    });

    it('splits fresh vs already-imported sessions by key', () => {
        const parsed = parseHevyCsv(HEVY);
        expect(splitFreshSessions(parsed.sessions, new Set())).toEqual({ fresh: parsed.sessions, skippedCount: 0 });
        const keys = new Set(parsed.sessions.map((s) => s.key));
        expect(splitFreshSessions(parsed.sessions, keys)).toEqual({ fresh: [], skippedCount: 1 });
    });

    it('persists import keys across reads (idempotent reimport)', async () => {
        await db.del('il_csv_import_keys_v1');
        expect(await readImportKeys()).toEqual([]);
        await addImportKeys(['a', 'b']);
        await addImportKeys(['b', 'c']);
        expect(await readImportKeys()).toEqual(['a', 'b', 'c']);
    });

    it('exports one row per completed set with the unit in the header', () => {
        const csv = buildTrainingCsv(
            [
                {
                    id: 1, dayIdx: 0, name: 'Push', startTime: Date.parse('2026-09-20T08:00:00'),
                    endTime: Date.parse('2026-09-20T09:00:00'), duration: 3600, mesoId: 5, week: 1,
                    exercises: [
                        {
                            id: 'bp_bar', name: { en: 'Barbell Bench Press', es: 'Press Banca' },
                            muscle: 'CHEST', instanceId: 11, note: 'felt, strong',
                            sets: [
                                { id: 1, weight: '60', reps: '8', rpe: '8', completed: true, type: 'regular' },
                                { id: 2, weight: '60', reps: '8', rpe: '', completed: false, type: 'regular' },
                            ],
                        },
                    ],
                } as any,
                {
                    id: 2, dayIdx: 1, name: 'Skipped', startTime: 1, endTime: 1, duration: 0,
                    mesoId: 5, week: 1, skipped: true, exercises: [],
                } as any,
            ],
            'kg'
        );
        const rows = parseCsv(csv);
        expect(rows[0]).toEqual(['Date', 'Session', 'Exercise', 'Muscle', 'Set', 'Type', 'Weight(kg)', 'Reps', 'RIR', 'Notes']);
        // Completed set only; skipped log and incomplete set excluded.
        expect(rows).toHaveLength(2);
        expect(rows[1]).toEqual(['2026-09-20', 'Push', 'Barbell Bench Press', 'CHEST', '1', 'regular', '60', '8', '8', 'felt, strong']);
    });

    it('exports weights converted to lb with dot decimals', () => {
        const csv = buildTrainingCsv(
            [
                {
                    id: 1, dayIdx: 0, name: 'Push', startTime: 1000, endTime: 2000, duration: 1,
                    mesoId: -100, week: -1,
                    exercises: [
                        {
                            id: 'x', name: 'Press', muscle: 'CHEST', instanceId: 1,
                            sets: [{ id: 1, weight: '61.235', reps: '5', rpe: '', completed: true, type: 'regular' }],
                        },
                    ],
                } as any,
            ],
            'lb'
        );
        const rows = parseCsv(csv);
        expect(rows[0]![6]).toBe('Weight(lb)');
        expect(rows[1]![6]).toBe('135');
    });
});
