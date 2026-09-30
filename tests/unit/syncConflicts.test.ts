import { describe, it, expect } from 'vitest';
import {
    buildSectionSyncMeta,
    detectConflictSections,
    mergeSectionSyncMeta,
    serializeMeso,
    deserializeMeso,
} from '../../services/syncHelpers';
import { SectionSyncMeta } from '../../types';

describe('syncHelpers & conflict resolution', () => {
    it('builds section sync metadata with timestamp for each section', () => {
        const meta = buildSectionSyncMeta(['program', 'logs'], 1700000000);
        expect(meta).toEqual({
            program: 1700000000,
            logs: 1700000000,
        });
    });

    it('returns empty object when no sections provided', () => {
        expect(buildSectionSyncMeta([], 1700000000)).toEqual({});
        expect(buildSectionSyncMeta(undefined, 1700000000)).toEqual({});
    });

    it('detects conflicting sections where cloud timestamp is newer than local', () => {
        const localMeta: SectionSyncMeta = {
            program: 1000,
            logs: 2000,
            exercises: 1500,
        };

        const cloudMeta: SectionSyncMeta = {
            program: 1200, // newer in cloud -> conflict/pending
            logs: 1800,    // older in cloud -> not conflict
            exercises: 1500, // equal -> not conflict
            userProfile: 3000, // brand new section in cloud -> conflict/pending
        };

        const conflicts = detectConflictSections(localMeta, cloudMeta);
        expect(conflicts).toContain('program');
        expect(conflicts).toContain('userProfile');
        expect(conflicts).not.toContain('logs');
        expect(conflicts).not.toContain('exercises');
    });

    it('merges section sync metadata taking the maximum timestamp for each section', () => {
        const localMeta: SectionSyncMeta = {
            program: 1000,
            logs: 2500,
        };
        const cloudMeta: SectionSyncMeta = {
            program: 1200,
            logs: 2000,
            exercises: 3000,
        };

        const merged = mergeSectionSyncMeta(localMeta, cloudMeta);
        expect(merged).toEqual({
            program: 1200,
            logs: 2500,
            exercises: 3000,
        });
    });

    it('correctly serializes and deserializes meso plan between 2D array and Firestore map format', () => {
        const originalMeso = {
            id: 'meso_1',
            name: 'Test Meso',
            plan: [
                ['ex_1', 'ex_2'],
                ['ex_3'],
            ],
        };

        const serialized = serializeMeso(originalMeso);
        expect(serialized.plan).toEqual({
            '0': ['ex_1', 'ex_2'],
            '1': ['ex_3'],
        });

        const deserialized = deserializeMeso(serialized);
        expect(deserialized.plan).toEqual(originalMeso.plan);
    });
});
