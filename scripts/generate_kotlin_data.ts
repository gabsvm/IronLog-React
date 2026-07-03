import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DEFAULT_LIBRARY } from '../data/defaultLibrary.js';
import { CROSSFIT_EXERCISES, CALISTHENICS_EXERCISES } from '../data/disciplineExercises.js';
import { NATURAL_HYPERTROPHY_TEMPLATES } from '../data/naturalHypertrophy.js';
import { TWO_BLOCK_PROTOCOLS, TWO_BLOCK_PHILOSOPHY } from '../data/twoBlockMass.js';

// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Combine all exercises into one list
const allExercises = [
    ...DEFAULT_LIBRARY,
    ...CROSSFIT_EXERCISES,
    ...CALISTHENICS_EXERCISES
];

// Helper to normalize localized names (make string into {en: str, es: str})
const normalizeLocalizedText = (text: any): { en: string; es: string } => {
    if (!text) return { en: "", es: "" };
    if (typeof text === 'string') {
        return { en: text, es: text };
    }
    return {
        en: text.en || "",
        es: text.es || text.en || ""
    };
};

// Normalize names and instructions in exercises
const exercisesNormalized = allExercises.map(ex => ({
    ...ex,
    name: normalizeLocalizedText(ex.name),
    instructions: ex.instructions ? normalizeLocalizedText(ex.instructions) : undefined
}));

// Normalize templates (names, dayNames, slot labels)
const templatesNormalized = NATURAL_HYPERTROPHY_TEMPLATES.map(t => ({
    ...t,
    title: normalizeLocalizedText(t.title),
    description: normalizeLocalizedText(t.description),
    program: t.program.map(d => ({
        ...d,
        dayName: normalizeLocalizedText(d.dayName)
    }))
}));

const twoBlockNormalized = TWO_BLOCK_PROTOCOLS.map(p => ({
    ...p,
    name: normalizeLocalizedText(p.name),
    short: normalizeLocalizedText(p.short),
    long: normalizeLocalizedText(p.long),
    keyRules: {
        en: p.keyRules.en || [],
        es: p.keyRules.es || []
    },
    schedule: p.schedule.map(w => ({
        ...w,
        days: w.days.map(d => ({
            ...d,
            label: d.label ? normalizeLocalizedText(d.label) : undefined,
            note: d.note ? normalizeLocalizedText(d.note) : undefined
        }))
    }))
}));

const outputDir = path.resolve(__dirname, '../ironlog-kmp/composeApp/src/commonMain/kotlin/com/gainslab/ironlog/model');
fs.mkdirSync(outputDir, { recursive: true });

// Helper to escape string for Kotlin triple quotes
const toKotlinTripleQuoteString = (obj: any): string => {
    const jsonStr = JSON.stringify(obj, null, 2);
    // Escape '$' as '${'$'}' so Kotlin doesn't treat it as string interpolation
    return jsonStr.replace(/\$/g, "${'$'}");
};

const ktContent = `package com.gainslab.ironlog.model

object StaticData {
    val EXERCISES_JSON = """${toKotlinTripleQuoteString(exercisesNormalized)}"""
    
    val TEMPLATES_JSON = """${toKotlinTripleQuoteString(templatesNormalized)}"""
    
    val TWO_BLOCK_PROTOCOLS_JSON = """${toKotlinTripleQuoteString(twoBlockNormalized)}"""
    
    val TWO_BLOCK_PHILOSOPHY_JSON = """${toKotlinTripleQuoteString(TWO_BLOCK_PHILOSOPHY)}"""
}
`;

fs.writeFileSync(path.join(outputDir, 'StaticData.kt'), ktContent);
console.log('Kotlin static data generated successfully at StaticData.kt!');
