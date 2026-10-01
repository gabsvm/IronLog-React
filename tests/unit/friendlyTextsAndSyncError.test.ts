import { describe, it, expect } from 'vitest';
import { TRANSLATIONS } from '../../constants';
import { DirtySyncSection } from '../../types';

describe('U5: Friendly text, sync sections, and error handling', () => {
    const ALL_SYNC_SECTIONS: DirtySyncSection[] = [
        'program',
        'activeMeso',
        'exercises',
        'logs',
        'config',
        'rpFeedback',
        'userProfile',
        'nutritionLogs',
        'cardioSessions',
        'nutritionGoal',
        'bodyLogs',
        'macroGoals',
        'customFoods',
        'personalTemplates'
    ];

    it('defines friendly translations for all DirtySyncSection keys in both Spanish and English', () => {
        for (const lang of ['es', 'en'] as const) {
            const t = TRANSLATIONS[lang] as any;
            expect(t.syncSections).toBeDefined();

            for (const section of ALL_SYNC_SECTIONS) {
                const label = t.syncSections[section];
                expect(label).toBeDefined();
                expect(typeof label).toBe('string');
                expect(label.length).toBeGreaterThan(0);
                // Ensure label is not raw camelCase identifier
                if (section === 'activeMeso') {
                    expect(label).not.toBe('activeMeso');
                }
                if (section === 'nutritionLogs') {
                    expect(label).not.toBe('nutritionLogs');
                }
            }
        }
    });

    it('provides friendly labels when mapping sync sections for modals and settings', () => {
        const sections: DirtySyncSection[] = ['activeMeso', 'nutritionLogs', 'exercises'];
        
        const mappedEs = sections.map(sec => ((TRANSLATIONS.es as any).syncSections?.[sec]) || sec);
        expect(mappedEs).toEqual(['Mesociclo Activo', 'Registros de Nutrición', 'Biblioteca de Ejercicios']);

        const mappedEn = sections.map(sec => ((TRANSLATIONS.en as any).syncSections?.[sec]) || sec);
        expect(mappedEn).toEqual(['Active Mesocycle', 'Nutrition Logs', 'Exercise Library']);
    });

    it('has translated setTypes and smartWarmup tutorial strings', () => {
        expect((TRANSLATIONS.es.tutorial as any).setTypesTitle).toBe('Tipos de Serie');
        expect((TRANSLATIONS.en.tutorial as any).setTypesTitle).toBe('Set Types');
        expect((TRANSLATIONS.es.tutorial as any).setTypesText).toContain('tipo de serie');
        expect((TRANSLATIONS.en.tutorial as any).setTypesText).toContain('set type');
        expect((TRANSLATIONS.es.tutorial as any).smartWarmupText).toContain('Calentamiento');
        expect((TRANSLATIONS.en.tutorial as any).smartWarmupText).toContain('Warmup');
    });

    it('has undo and force sync feedback messages defined', () => {
        expect((TRANSLATIONS.es as any).undo).toBe('Deshacer');
        expect((TRANSLATIONS.en as any).undo).toBe('Undo');
        expect((TRANSLATIONS.es as any).forceSyncSuccess).toBeDefined();
        expect((TRANSLATIONS.en as any).forceSyncError).toBeDefined();
        expect((TRANSLATIONS.es as any).forceSyncTitle).toBe('Forzar Sincronización');
        expect((TRANSLATIONS.en as any).forceSyncTitle).toBe('Force Sync');
    });
});
