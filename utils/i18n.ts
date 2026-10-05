// S8: small i18n helpers so components never branch on the language with
// inline ternaries (see scripts/count-lang-ternaries.mjs).
import type { Lang } from '../types';

/**
 * Picks the value for the current language from a bilingual pair — bundled
 * bilingual DATA ({ es, en } names in data/), locale tags, etc. Any language
 * other than the two supported ones falls back to English, exactly like the
 * inline ternaries it replaces. UI copy belongs in TRANSLATIONS, not here.
 */
export const pickLang = <T>(lang: Lang | string, values: { es: T; en: T }): T =>
    Object.prototype.hasOwnProperty.call(values, lang) ? values[lang as Lang] : values.en;

/** The other supported language (bilingual search matches both names). */
export const otherLang = (lang: Lang | string): Lang => pickLang<Lang>(lang, { es: 'en', en: 'es' });

/**
 * Fills `{name}` placeholders in a TRANSLATIONS string:
 * formatMessage('Week {n}', { n: 3 }) → 'Week 3'. Unknown placeholders stay.
 */
export const formatMessage = (template: string, values: Record<string, string | number>): string =>
    template.replace(/\{(\w+)\}/g, (match, name: string) =>
        Object.prototype.hasOwnProperty.call(values, name) ? String(values[name]) : match);
