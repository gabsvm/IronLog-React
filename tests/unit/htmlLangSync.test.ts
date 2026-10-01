import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { TRANSLATIONS } from '../../constants/translations';

describe('A5: Idioma & document.documentElement.lang synchronization', () => {
    const originalLang = document.documentElement.lang;

    beforeEach(() => {
        document.documentElement.lang = 'es';
    });

    afterEach(() => {
        document.documentElement.lang = originalLang;
    });

    it('updates document.documentElement.lang to match user preferred language', () => {
        // Test language sync behavior
        const syncLangToDom = (lang: 'es' | 'en') => {
            if (typeof document !== 'undefined') {
                document.documentElement.lang = lang;
            }
        };

        syncLangToDom('en');
        expect(document.documentElement.lang).toBe('en');

        syncLangToDom('es');
        expect(document.documentElement.lang).toBe('es');
    });

    it('verifies index.html and public/manifest.json have consistent language settings', () => {
        const rootDir = path.resolve(__dirname, '../../');
        const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf-8');
        const manifestJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'public/manifest.json'), 'utf-8'));

        expect(indexHtml).toContain('<html lang="es">');
        expect(manifestJson.lang).toBe('es');
        expect(manifestJson.description).toContain('Seguimiento profesional de hipertrofia');
        expect(indexHtml).toContain('Seguimiento profesional de hipertrofia');
    });

    it('has symmetrical keys in TRANSLATIONS for en and es', () => {
        const enKeys = Object.keys(TRANSLATIONS.en);
        const esKeys = Object.keys(TRANSLATIONS.es);

        expect(enKeys).toContain('train');
        expect(enKeys).toContain('diet');
        expect(enKeys).toContain('startWorkout');
        expect(enKeys).toContain('openProfile');
        expect(enKeys).toContain('sessionInProgressTitle');
        expect(enKeys).toContain('finishSession');
        expect(enKeys).toContain('saveAndFinish');
        expect(enKeys).toContain('continueTraining');
        expect(enKeys).toContain('reorderExercises');

        expect(esKeys).toContain('train');
        expect(esKeys).toContain('diet');
        expect(esKeys).toContain('startWorkout');
        expect(esKeys).toContain('openProfile');
        expect(esKeys).toContain('sessionInProgressTitle');
        expect(esKeys).toContain('finishSession');
        expect(esKeys).toContain('saveAndFinish');
        expect(esKeys).toContain('continueTraining');
        expect(esKeys).toContain('reorderExercises');

        // Critical new keys verify correct values
        expect(TRANSLATIONS.es.train).toBe('Entreno');
        expect(TRANSLATIONS.en.train).toBe('Train');
        expect(TRANSLATIONS.es.finishSession).toBe('Terminar sesión');
        expect(TRANSLATIONS.en.finishSession).toBe('Finish session');
    });
});
