// S7: language preference + lazy dictionary loading (moved out of AppProvider).
import { useCallback } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { isTranslationLoaded, loadTranslations } from '../../constants/translations';
import type { Lang } from '../../types';

export const useLanguage = () => {
    const [langStored, setLangStored] = useLocalStorage<Lang>('il_lang_v1', 'es');
    const lang: Lang = (langStored === 'en' || langStored === 'es') ? langStored : 'es';

    // The next language's dictionary is fetched first, so TRANSLATIONS[lang]
    // is always in memory when React renders with it.
    const setLang = useCallback((value: Lang | ((val: Lang) => Lang)) => {
        const next = typeof value === 'function' ? value(lang) : value;
        // Already in memory (always after the first switch): switch right away.
        if (isTranslationLoaded(next)) {
            setLangStored(next);
            return;
        }
        void loadTranslations(next).then(() => setLangStored(next));
    }, [lang, setLangStored]);

    return { lang, setLang };
};
