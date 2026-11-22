import type { EquipmentType, ExerciseDef, Lang, MuscleGroup } from '../types';
import { getTranslated } from '../utils';
import { pickLang } from './i18n';

export interface EquipmentMeta {
    id: EquipmentType;
    label: { es: string; en: string };
}

export const ALL_EQUIPMENT_TYPES: readonly EquipmentMeta[] = [
    { id: 'machine', label: { es: 'Máquina', en: 'Machine' } },
    { id: 'barbell', label: { es: 'Barra', en: 'Barbell' } },
    { id: 'smith_machine', label: { es: 'Smith / Multipower', en: 'Smith machine' } },
    { id: 'dumbbell', label: { es: 'Mancuerna', en: 'Dumbbell' } },
    { id: 'cable', label: { es: 'Polea / Cable', en: 'Cable' } },
    { id: 'freemotion', label: { es: 'Freemotion', en: 'Freemotion' } },
    { id: 'bodyweight', label: { es: 'Peso corporal', en: 'Bodyweight' } },
    { id: 'bodyweight_loadable', label: { es: 'Peso corporal lastrado', en: 'Bodyweight loadable' } },
    { id: 'machine_assistance', label: { es: 'Máquina asistida', en: 'Machine assistance' } },
] as const;

export const ALL_EQUIPMENT_IDS: EquipmentType[] = ALL_EQUIPMENT_TYPES.map((e) => e.id);

export function getEquipmentLabel(equipment: EquipmentType, lang: Lang): string {
    const found = ALL_EQUIPMENT_TYPES.find((item) => item.id === equipment);
    if (!found) return equipment;
    return pickLang(lang, found.label);
}

/**
 * Infers one of the 9 RP equipment taxonomies from explicit metadata, bodyweight flag,
 * or exercise name/id tokens so existing library entries work seamlessly without manual migration.
 */
export function inferExerciseEquipment(ex: Pick<ExerciseDef, 'id' | 'name' | 'equipment' | 'isBodyweight'>): EquipmentType {
    if (ex.equipment && ALL_EQUIPMENT_IDS.includes(ex.equipment)) {
        return ex.equipment;
    }

    const nameEn = typeof ex.name === 'object' ? (ex.name.en || '') : (ex.name || '');
    const nameEs = typeof ex.name === 'object' ? (ex.name.es || '') : '';
    const token = `${ex.id || ''} ${nameEn} ${nameEs}`.toLowerCase();

    if (/assisted|asistid|gravitron/.test(token)) {
        return 'machine_assistance';
    }
    if (/(weighted|lastrad|loadable)/.test(token) && (ex.isBodyweight || /dip|fond|pull[- ]?up|chin[- ]?up|dominad|push[- ]?up|flexion/.test(token))) {
        return 'bodyweight_loadable';
    }
    if (/smith|multipower/.test(token)) {
        return 'smith_machine';
    }
    if (/freemotion/.test(token)) {
        return 'freemotion';
    }
    if (/(cable|polea|pulldown|jal[oó]n|pushdown|face[- ]?pull|crossover|cruce|rope)/.test(token)) {
        return 'cable';
    }
    if (/(dumbbell|mancuerna|_db\b|\bdb\b|arnold|hammer)/.test(token)) {
        return 'dumbbell';
    }
    if (/(machine|m[aá]quina|pec deck|peck deck|hack|leg press|prensa|leg ext|leg curl|femoral|converg|pendulum|p[eé]ndulo|seated calf|calf raise machine|hammer strength|chest supported|preacher mach)/.test(token)) {
        return 'machine';
    }
    if (ex.isBodyweight || /(pull[- ]?up|chin[- ]?up|dominad|push[- ]?up|flexi[oó]n|dip|fondo|plank|plancha|crunch|leg raise|knee raise|nordic|sissy|invert|hanging|ab wheel)/.test(token)) {
        return /dip|fond|pull[- ]?up|chin[- ]?up|dominad/.test(token) ? 'bodyweight_loadable' : 'bodyweight';
    }
    if (/(barbell|barra|bench press|press banca|squat|sentadilla|deadlift|peso muerto|rdl|rumano|hip thrust|ez\b|t[- ]?bar|good morning|buenos d[ií]as|skull|rompecr[aá]neos|overhead press|militar)/.test(token)) {
        return 'barbell';
    }
    return 'machine';
}

const COMPOUND_BONUS_RE = /(press|row|remo|squat|sentadilla|deadlift|peso muerto|pulldown|jal[oó]n|pull[- ]?up|chin[- ]?up|dominad|dip|lunge|zancada|hip thrust)/i;

/**
 * Scores & ranks candidate exercises for a muscle group, honoring user equipment preferences first
 * and avoiding duplicates already selected in the day/exclude list.
 */
export function recommendExercisesForMuscle(
    exercises: readonly ExerciseDef[],
    muscle: MuscleGroup | string,
    preferredEquipment?: readonly EquipmentType[] | null,
    excludeIds: readonly string[] = [],
    lang: Lang = 'en',
): ExerciseDef[] {
    const excludeSet = new Set(excludeIds);
    const hasPref = Array.isArray(preferredEquipment) && preferredEquipment.length > 0;
    const prefSet = hasPref ? new Set(preferredEquipment) : null;

    const candidates = exercises.filter((ex) => {
        if (!ex || ex.archived || ex.mergedInto) return false;
        if (ex.id.startsWith('cf_') || ex.id.startsWith('cal_') || ex.source === 'nilsson_bw') return false;
        if (excludeSet.has(ex.id)) return false;
        return ex.muscle === muscle;
    });

    return candidates
        .map((ex) => {
            const eq = inferExerciseEquipment(ex);
            const name = String(getTranslated(ex.name, lang) || ex.id);
            let score = 0;
            if (!prefSet || prefSet.has(eq)) score += 100;
            if (COMPOUND_BONUS_RE.test(name)) score += 25;
            if (ex.videoId) score += 5;
            if (ex.isCustom) score += 2;
            return { ex, score, name };
        })
        .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
        .map((item) => item.ex);
}
