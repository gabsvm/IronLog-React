import { TRANSLATIONS } from '../constants';
import type { Lang } from '../types';

/**
 * Display label for a slot muscle value. Valid MuscleGroup enums resolve via
 * TRANSLATIONS (no raw "CHEST"/"BACK" in Spanish UI); custom slotLabel text
 * passes through untouched.
 */
export const resolveMuscleLabel = (
    value: string | undefined | null,
    lang: Lang,
): string => {
    if (!value) return '';
    const map = TRANSLATIONS[lang]?.muscle as Record<string, string> | undefined;
    if (map && value in map) return map[value];
    return value;
};
