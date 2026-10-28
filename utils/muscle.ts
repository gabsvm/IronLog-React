import { TRANSLATIONS } from '../constants';
import type { Lang } from '../types';
import { pickLang } from './i18n';

const SLOT_LABEL_MAP: Record<string, { es: string; en: string }> = {
    TRUNK: { es: 'Abdomen', en: 'Abs / Core' },
    PUSH: { es: 'Empuje', en: 'Push' },
    PULL: { es: 'Tirón', en: 'Pull' },
    LEGS: { es: 'Piernas', en: 'Legs' },
    ARMS: { es: 'Brazos', en: 'Arms' },
    UPPER: { es: 'Torso', en: 'Upper' },
    LOWER: { es: 'Pierna', en: 'Lower' },
};

/**
 * Display label for a slot muscle value. Valid MuscleGroup enums resolve via
 * TRANSLATIONS (no raw "CHEST"/"BACK" in Spanish UI); custom slotLabel text
 * passes through untouched, with known slot/category keys translated.
 */
export const resolveMuscleLabel = (
    value: string | undefined | null,
    lang: Lang,
): string => {
    if (!value) return '';
    const upper = value.toUpperCase();
    if (upper in SLOT_LABEL_MAP) {
        return pickLang(lang, SLOT_LABEL_MAP[upper]);
    }
    const map = TRANSLATIONS[lang]?.muscle as Record<string, string> | undefined;
    if (map && value in map) return map[value];
    if (map && upper in map) return map[upper];
    return value;
};
