// S7: translations are split per language and only the ACTIVE language is
// loaded (one lazy chunk each, precached as critical by the service worker).
// TRANSLATIONS keeps its synchronous shape — TRANSLATIONS[lang].x — because
// index.tsx awaits loadTranslations(bootLanguage()) before the first render,
// and AppContext's setLang loads the next language before switching to it.
import type { TranslationDict } from './translations.en';

export type { TranslationDict };
type SupportedLang = 'en' | 'es';

const LOADERS: Record<SupportedLang, () => Promise<TranslationDict>> = {
    en: () => import('./translations.en').then((m) => m.EN),
    es: () => import('./translations.es').then((m) => m.ES),
};

/** Language registry, filled by loadTranslations (never read before boot). */
export const TRANSLATIONS = {} as Record<SupportedLang, TranslationDict>;

export const isTranslationLoaded = (lang: SupportedLang): boolean => Boolean(TRANSLATIONS[lang]);

/** Loads one language into TRANSLATIONS (idempotent; concurrent calls share the load). */
const inflight: Partial<Record<SupportedLang, Promise<void>>> = {};
export const loadTranslations = (lang: SupportedLang): Promise<void> => {
    if (TRANSLATIONS[lang]) return Promise.resolve();
    if (!inflight[lang]) {
        inflight[lang] = LOADERS[lang]()
            .then((dict) => {
                TRANSLATIONS[lang] = dict;
            })
            .finally(() => {
                delete inflight[lang];
            });
    }
    return inflight[lang]!;
};

/**
 * The language AppContext will start with: the stored choice (useLocalStorage
 * keeps it JSON-encoded under il_lang_v1), else Spanish — same default.
 */
export const bootLanguage = (storage: Pick<Storage, 'getItem'> | undefined = typeof window !== 'undefined' ? window.localStorage : undefined): SupportedLang => {
    try {
        const raw = storage?.getItem('il_lang_v1');
        const parsed = raw ? JSON.parse(raw) : null;
        if (parsed === 'en' || parsed === 'es') return parsed;
    } catch {
        // Unreadable storage: fall through to the default.
    }
    return 'es';
};
