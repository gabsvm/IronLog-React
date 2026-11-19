import { GlobalTemplate } from '../../types';
import { pickLang } from '../../utils/i18n';

export type TemplateSchool = 'ALL' | 'RP' | 'NH' | 'DS' | 'PC' | 'CALISTHENICS' | 'CUSTOM';

export interface SchoolConfig {
    id: TemplateSchool;
    shortLabel: { en: string; es: string };
    fullTitle: { en: string; es: string };
    tagline: { en: string; es: string };
}

export const SCHOOLS: SchoolConfig[] = [
    {
        id: 'ALL',
        shortLabel: { en: 'ALL', es: 'TODAS' },
        fullTitle: { en: 'All Schools & Creators', es: 'Todas las Escuelas y Creadores' },
        tagline: { en: 'Explore every training methodology and system', es: 'Explora todos los sistemas y metodologías' },
    },
    {
        id: 'RP',
        shortLabel: { en: 'RP · DR. MIKE', es: 'RP · DR. MIKE' },
        fullTitle: { en: 'Renaissance Periodization · Dr. Mike Israetel', es: 'Renaissance Periodization · Dr. Mike Israetel' },
        tagline: { en: 'Scientific volume progression (MEV/MAV/MRV) and RIR cycling', es: 'Ciencia de volumen hipertrófico y RIR progresivo' },
    },
    {
        id: 'NH',
        shortLabel: { en: 'NATURAL HYPERTROPHY', es: 'NATURAL HYPERTROPHY' },
        fullTitle: { en: 'Natural Hypertrophy', es: 'Natural Hypertrophy' },
        tagline: { en: 'Pure natural bodybuilding, giant sets, neck & intensity rotation', es: 'Culturismo natural puro, series gigantes y rotación de intensidad' },
    },
    {
        id: 'DS',
        shortLabel: { en: 'DAVID SHAUGHNESSY', es: 'DAVID SHAUGHNESSY' },
        fullTitle: { en: 'David Shaughnessy & Tristan Jacobs', es: 'David Shaughnessy y Tristan Jacobs (TJ)' },
        tagline: { en: 'Extreme ROM, weighted stretch, high tension & Sunday arms', es: 'Rango de movimiento extremo, estiramiento bajo carga y brazos de domingo' },
    },
    {
        id: 'PC',
        shortLabel: { en: 'PAUL CARTER', es: 'PAUL CARTER' },
        fullTitle: { en: 'Paul Carter', es: 'Paul Carter' },
        tagline: { en: 'Biomechanics, lengthened position tension & ramp sets', es: 'Biomecánica, tensión en alargamiento y rampas pesadas' },
    },
    {
        id: 'CALISTHENICS',
        shortLabel: { en: 'CALISTHENICS', es: 'CALISTENIA' },
        fullTitle: { en: 'Calisthenics & Bodyweight', es: 'Calistenia y Peso Corporal' },
        tagline: { en: 'Relative strength, levers, handstands & explosive control', es: 'Fuerza relativa, palancas, pino y control corporal' },
    },
    {
        id: 'CUSTOM',
        shortLabel: { en: 'MY TEMPLATES', es: 'MIS PLANTILLAS' },
        fullTitle: { en: 'Custom / Saved Routines', es: 'Plantillas Personalizadas' },
        tagline: { en: 'Your personal created and saved routines', es: 'Tus rutinas personales creadas y guardadas' },
    },
];

export type FilterCategory = 'ALL' | 'WHOLE_BODY' | 'UPPER_LOWER' | 'PPL' | 'SPECIALIZATION' | 'CUSTOM';

export const CATEGORIES: { id: FilterCategory; label: { en: string; es: string } }[] = [
    { id: 'ALL', label: { en: 'ALL', es: 'TODAS' } },
    { id: 'WHOLE_BODY', label: { en: 'WHOLE BODY', es: 'CUERPO COMPLETO' } },
    { id: 'UPPER_LOWER', label: { en: 'UPPER / LOWER', es: 'TORSO / PIERNA' } },
    { id: 'PPL', label: { en: 'PUSH / PULL / LEGS', es: 'PUSH / PULL / LEGS' } },
    { id: 'SPECIALIZATION', label: { en: 'SPECIALIZATION', es: 'ESPECIALIZACIÓN' } },
    { id: 'CUSTOM', label: { en: 'CUSTOM', es: 'PERSONALIZADAS' } },
];

export const getTemplateSchool = (tpl: GlobalTemplate): TemplateSchool => {
    if (tpl.scope === 'personal') return 'CUSTOM';
    const id = tpl.id.toLowerCase();
    if (
        id.includes('david_shaughnessy') ||
        id.startsWith('ds_') ||
        id.includes('silverback')
    ) {
        return 'DS';
    }
    if (
        id.startsWith('nh_') ||
        id === 'toji_fushiguro' ||
        id === 'tokita' ||
        id === 'wizard' ||
        id === 'gsr' ||
        id.includes('golden_six')
    ) {
        return 'NH';
    }
    if (id === 'ji3' || id.startsWith('pc_')) {
        return 'PC';
    }
    if (id.startsWith('cal_')) {
        return 'CALISTHENICS';
    }
    if (
        id.startsWith('rp_') ||
        id === 'full_body' ||
        id === 'male_physique' ||
        id === 'hyp_1' ||
        id === 'hyp_2' ||
        id === 'metabolite' ||
        id === 'resensitization'
    ) {
        return 'RP';
    }
    return 'RP';
};

export const getTemplateAuthor = (tpl: GlobalTemplate, ts: any): string => {
    if (tpl.scope === 'personal') return ts.myTemplates || 'Custom';
    const school = getTemplateSchool(tpl);
    switch (school) {
        case 'DS':
            return 'David Shaughnessy & TJ';
        case 'NH':
            return 'Natural Hypertrophy';
        case 'PC':
            return 'Paul Carter';
        case 'CALISTHENICS':
            return ts.calisthenics || 'Calisthenics';
        case 'RP':
        default:
            return 'Dr. Mike Israetel (RP)';
    }
};

export const getTemplateCategory = (tpl: GlobalTemplate): FilterCategory => {
    if (tpl.scope === 'personal') return 'CUSTOM';
    const id = tpl.id.toLowerCase();
    const title = (tpl.title?.en || '').toLowerCase();
    if (id === 'full_body' || id === 'nh_toji' || id === 'nh_guts') {
        return 'SPECIALIZATION';
    }
    if (
        id === 'nh_ult_beginner' ||
        id === 'nh_ult_novice' ||
        id === 'nh_baki' ||
        id === 'nh_silver_era' ||
        id === 'nh_superman' ||
        id === 'nh_kinobody' ||
        (id !== 'full_body' && id.includes('full_body')) ||
        id.includes('whole_body') ||
        id.startsWith('rp_fb_') ||
        title.includes('full body') ||
        title.includes('whole body') ||
        id === 'nh_full_body' ||
        id === 'nh_ultimate_full_body' ||
        id === 'gsr' ||
        id.includes('golden_six') ||
        id.includes('silverback')
    ) {
        return 'WHOLE_BODY';
    }
    if (
        id === 'nh_ult_bridge' ||
        id === 'nh_ult_intermediate' ||
        id === 'nh_ult_advanced' ||
        id === 'nh_gentleman_split' ||
        id === 'nh_apollonian' ||
        id === 'nh_alex_eubank' ||
        id === 'nh_bald_omni_hybrid' ||
        id === 'nh_kratos' ||
        id === 'tokita' ||
        id === 'ji3' ||
        id.includes('upper_lower') ||
        id.startsWith('rp_ul_') ||
        title.includes('upper') ||
        title.includes('torso') ||
        id === 'nh_upper_lower'
    ) {
        return 'UPPER_LOWER';
    }
    if (id.includes('ppl') || id.includes('push') || id.includes('pull') || title.includes('push pull') || id === 'nh_pure_bodybuilding_phase1' || id === 'cal_beginner') {
        return 'PPL';
    }
    return 'SPECIALIZATION';
};

export const getCategoryOverline = (tpl: GlobalTemplate, lang: string): string => {
    if (tpl.scope === 'personal') return pickLang(lang, { es: 'PLANTILLA GUARDADA', en: 'SAVED TEMPLATE' });
    const school = getTemplateSchool(tpl);
    const cat = getTemplateCategory(tpl);

    let prefix = 'RP · ';
    if (school === 'NH') prefix = 'NH · ';
    else if (school === 'DS') prefix = 'SHAUGHNESSY · ';
    else if (school === 'PC') prefix = 'CARTER · ';
    else if (school === 'CALISTHENICS') prefix = 'CALISTENIA · ';

    switch (cat) {
        case 'WHOLE_BODY':
            return `${prefix}${pickLang(lang, { es: 'CUERPO COMPLETO', en: 'WHOLE BODY' })}`;
        case 'UPPER_LOWER':
            return `${prefix}${pickLang(lang, { es: 'TORSO / PIERNA', en: 'UPPER / LOWER' })}`;
        case 'PPL':
            return `${prefix}PUSH / PULL / LEGS`;
        case 'CUSTOM':
            return pickLang(lang, { es: 'PERSONALIZADA', en: 'CUSTOM' });
        case 'SPECIALIZATION':
        default:
            return `${prefix}${pickLang(lang, { es: 'ESPECIALIZACIÓN', en: 'HYPERTROPHY FOCUS' })}`;
    }
};
