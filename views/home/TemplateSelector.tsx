import React, { Suspense, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../../components/ui/Icon';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { GlobalTemplate } from '../../types';
import { getTranslated } from '../../utils';
import { pickLang } from '../../utils/i18n';

const ProgramDetailView = React.lazy(() =>
    import('../../components/programs/ProgramDetailView').then((module) => ({ default: module.ProgramDetailView }))
);

interface Props {
    onClose: () => void;
    onSelectTemplate: (tpl: GlobalTemplate) => void;
    onCreateCustom: () => void;
    templates: GlobalTemplate[];
    t: any;
    lang: string;
    onSelectProgram?: (programId: string) => void;
    inline?: boolean;
}

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

type FilterCategory = 'ALL' | 'WHOLE_BODY' | 'UPPER_LOWER' | 'PPL' | 'SPECIALIZATION' | 'CUSTOM';

const CATEGORIES: { id: FilterCategory; label: { en: string; es: string } }[] = [
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

const getTemplateAuthor = (tpl: GlobalTemplate, ts: any): string => {
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

const getTemplateCategory = (tpl: GlobalTemplate): FilterCategory => {
    if (tpl.scope === 'personal') return 'CUSTOM';
    const id = tpl.id.toLowerCase();
    const title = (tpl.title?.en || '').toLowerCase();
    if (
        id.includes('full_body') ||
        id.includes('whole_body') ||
        id.startsWith('rp_fb_') ||
        title.includes('full body') ||
        title.includes('whole body') ||
        id === 'nh_full_body' ||
        id === 'nh_ultimate_full_body'
    ) {
        return 'WHOLE_BODY';
    }
    if (id.includes('upper_lower') || id.includes('ul') || title.includes('upper') || title.includes('torso') || id === 'nh_upper_lower') {
        return 'UPPER_LOWER';
    }
    if (id.includes('ppl') || id.includes('push') || id.includes('pull') || title.includes('push pull') || id === 'nh_pure_bodybuilding_phase1') {
        return 'PPL';
    }
    return 'SPECIALIZATION';
};

const getCategoryOverline = (tpl: GlobalTemplate, lang: string): string => {
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

export const TemplateSelector: React.FC<Props> = ({
    onClose,
    onSelectTemplate,
    onCreateCustom,
    templates,
    t,
    lang,
    onSelectProgram,
    inline = false,
}) => {
    const [showKongDetail, setShowKongDetail] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSchool, setSelectedSchool] = useState<TemplateSchool>('ALL');
    const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('ALL');
    const [showCategoryChips, setShowCategoryChips] = useState(false);
    const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
    const [pendingConfirm, setPendingConfirm] = useState<GlobalTemplate | null>(null);

    const ts = t.templateSelector;

    const toggleSection = (schoolId: string) => {
        setCollapsedSections((prev) => ({
            ...prev,
            [schoolId]: !prev[schoolId],
        }));
    };

    const filteredTemplates = useMemo(() => {
        return templates.filter((tpl) => {
            if (selectedSchool !== 'ALL') {
                const school = getTemplateSchool(tpl);
                if (school !== selectedSchool) return false;
            }
            if (selectedCategory !== 'ALL') {
                const cat = getTemplateCategory(tpl);
                if (cat !== selectedCategory) return false;
            }
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const titleEn = (tpl.title?.en || '').toLowerCase();
                const titleEs = (tpl.title?.es || '').toLowerCase();
                const descEn = (tpl.description?.en || '').toLowerCase();
                const descEs = (tpl.description?.es || '').toLowerCase();
                const author = getTemplateAuthor(tpl, ts).toLowerCase();
                if (!titleEn.includes(q) && !titleEs.includes(q) && !descEn.includes(q) && !descEs.includes(q) && !author.includes(q)) {
                    return false;
                }
            }
            return true;
        });
    }, [templates, selectedSchool, selectedCategory, searchQuery, ts]);

    // Grouping by school
    const groupedBySchool = useMemo(() => {
        const order: TemplateSchool[] = ['RP', 'NH', 'DS', 'PC', 'CALISTHENICS', 'CUSTOM'];
        const map = new Map<TemplateSchool, GlobalTemplate[]>();
        for (const school of order) {
            map.set(school, []);
        }
        for (const tpl of filteredTemplates) {
            const school = getTemplateSchool(tpl);
            if (!map.has(school)) {
                map.set(school, []);
            }
            map.get(school)!.push(tpl);
        }
        return order
            .map((school) => ({
                school,
                config: SCHOOLS.find((s) => s.id === school)!,
                templates: map.get(school) || [],
            }))
            .filter((g) => g.templates.length > 0);
    }, [filteredTemplates]);

    // Render individual template card
    const renderTemplateCard = (tpl: GlobalTemplate) => {
        const overline = getCategoryOverline(tpl, lang);
        const title = getTranslated(tpl.title, lang as any);
        const desc = tpl.description ? getTranslated(tpl.description, lang as any) : '';
        const daysCount = tpl.program?.length || 0;
        return (
            <button
                key={tpl.id}
                type="button"
                onClick={() => setPendingConfirm(tpl)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3.5 bg-surface-app hover:bg-surface-raised transition-colors text-left"
            >
                <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 truncate">
                        {overline}
                    </p>
                    <h3 className="text-[15px] font-bold text-white leading-snug mt-0.5 truncate">
                        {title}
                    </h3>
                    {desc && (
                        <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5 font-normal">
                            {desc}
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {tpl.isPro && (
                        <span className="rounded-[4px] bg-yellow-500/20 border border-yellow-500/30 px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-yellow-500">
                            PRO
                        </span>
                    )}
                    <span className="rounded-[4px] bg-surface-elevated border border-border-subtle px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-zinc-200">
                        {daysCount}/{pickLang(lang, { es: 'SEM', en: 'WEEK' })}
                    </span>
                    <Icon name="ChevronRight" size={16} className="text-zinc-500" />
                </div>
            </button>
        );
    };

    const selector = (
        <div
            className={
                inline
                    ? 'flex flex-col bg-surface-app text-white'
                    : 'fixed inset-0 z-modal flex flex-col bg-surface-app text-white'
            }
            role={inline ? 'region' : 'dialog'}
            aria-modal={inline ? undefined : 'true'}
            aria-label={pickLang(lang, { es: 'Plantillas', en: 'Templates' })}
        >
            {/* Top Header */}
            <header className={`shrink-0 border-b border-border-subtle bg-surface-app px-4 ${inline ? '' : 'pt-safe'}`}>
                <div className="mx-auto flex h-16 w-full max-w-xl items-center justify-between gap-4">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-500">
                            {ts.trainingPlan}
                        </p>
                        <h2 className="text-[22px] font-black tracking-tight text-white">
                            {pickLang(lang, { es: 'Plantillas', en: 'Templates' })}
                        </h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onCreateCustom}
                            aria-label={ts.designTitle || 'New'}
                            title={ts.designTitle || 'New'}
                            className="bg-primary-500 text-zinc-950 rounded-[4px] h-8 px-2.5 flex items-center justify-center gap-1 text-xs font-extrabold uppercase tracking-wider hover:bg-primary-400 active:scale-95 transition-transform"
                        >
                            <Icon name="Plus" size={16} strokeWidth={2.5} />
                            {inline && <span>{pickLang(lang, { es: 'Crear', en: 'New' })}</span>}
                        </button>
                        {!inline && (
                            <button
                                type="button"
                                onClick={onClose}
                                aria-label={ts.close || t.close || 'Close'}
                                title={ts.close || t.close || 'Close'}
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[4px] border border-border-subtle bg-surface-raised text-zinc-400 hover:text-white active:scale-95 transition-colors"
                            >
                                <Icon name="X" size={18} />
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* Search Input Row */}
            <div className="shrink-0 border-b border-border-subtle/40 bg-surface-app px-4 pt-3 pb-2">
                <div className="mx-auto w-full max-w-xl">
                    <div className="flex items-center rounded-[4px] border border-border-subtle bg-surface-raised px-3 py-2 text-[14px] text-white">
                        <Icon name="Search" size={16} className="text-zinc-500 mr-2 shrink-0" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={pickLang(lang, { es: 'Buscar rutinas, creador o foco...', en: 'Search routines, creator or focus...' })}
                            className="w-full bg-transparent text-[14px] text-white placeholder:text-zinc-500 outline-none"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="text-zinc-500 hover:text-zinc-300"
                                aria-label="Clear search"
                            >
                                <Icon name="X" size={14} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* School / Creator Chips Bar */}
            <div className="shrink-0 border-b border-border-subtle/40 bg-surface-app px-4 pt-2.5 pb-2">
                <div className="mx-auto w-full max-w-xl">
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                        {SCHOOLS.map((school) => {
                            const isSelected = selectedSchool === school.id;
                            const label = school.shortLabel[lang as 'en' | 'es'] || school.shortLabel.es;
                            return (
                                <button
                                    key={school.id}
                                    type="button"
                                    onClick={() => setSelectedSchool(school.id)}
                                    className={`shrink-0 rounded-[4px] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                                        isSelected
                                            ? 'bg-white text-zinc-950 font-black shadow-sm'
                                            : 'bg-surface-raised border border-border-subtle text-zinc-400 hover:text-white'
                                    }`}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Split Category Filter Row (Collapsible) */}
            <div className="shrink-0 bg-surface-app px-4 py-2">
                <div className="mx-auto w-full max-w-xl space-y-2">
                    <button
                        type="button"
                        onClick={() => setShowCategoryChips((prev) => !prev)}
                        className="w-full rounded-[4px] border border-border-subtle bg-surface-raised px-3 py-1.5 flex items-center justify-between text-[12px] font-semibold text-zinc-300 hover:bg-surface-elevated transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <Icon name="Filter" size={13} className="text-zinc-400" />
                            <span>{pickLang(lang, { es: 'Filtro por tipo de split', en: 'Filter by split type' })}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="rounded-[3px] bg-surface-elevated border border-border-subtle px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-primary-400">
                                {selectedCategory === 'ALL'
                                    ? pickLang(lang, { es: 'TODOS', en: 'ALL' })
                                    : (CATEGORIES.find((c) => c.id === selectedCategory)?.label[lang as 'en' | 'es'] || selectedCategory)}
                            </span>
                            <Icon name={showCategoryChips ? 'ChevronUp' : 'ChevronDown'} size={14} className="text-zinc-500" />
                        </div>
                    </button>

                    {showCategoryChips && (
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                            {CATEGORIES.map((cat) => {
                                const isSelected = selectedCategory === cat.id;
                                return (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => setSelectedCategory(cat.id)}
                                        className={`shrink-0 rounded-[4px] px-2 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                                            isSelected
                                                ? 'bg-primary-500 text-zinc-950 font-black'
                                                : 'bg-surface-raised border border-border-subtle text-zinc-400 hover:text-white'
                                        }`}
                                    >
                                        {cat.label[lang as 'en' | 'es'] || cat.id}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* List of Templates (Grouped or Filtered) */}
            <div className={inline ? '' : 'flex-1 min-h-0 overflow-y-auto scroll-container'}>
                <div className="mx-auto w-full max-w-xl pb-[calc(var(--safe-area-bottom)+2rem)]">
                    {filteredTemplates.length === 0 ? (
                        <div className="py-12 text-center text-xs text-zinc-500 font-semibold border-t border-b border-border-subtle">
                            {pickLang(lang, { es: 'No se encontraron plantillas', en: 'No templates found' })}
                        </div>
                    ) : selectedSchool === 'ALL' ? (
                        /* Grouped by School with Collapsible Section Headers */
                        <div className="space-y-4 pt-1">
                            {groupedBySchool.map((group) => {
                                const isCollapsed = !!collapsedSections[group.school];
                                const fullTitle = group.config.fullTitle[lang as 'en' | 'es'] || group.config.fullTitle.es;
                                const tagline = group.config.tagline[lang as 'en' | 'es'] || group.config.tagline.es;
                                return (
                                    <div key={group.school} className="border-t border-b border-border-subtle bg-surface-raised/40">
                                        {/* School Section Header */}
                                        <button
                                            type="button"
                                            onClick={() => toggleSection(group.school)}
                                            className="w-full flex items-center justify-between gap-3 px-4 py-2.5 bg-surface-raised hover:bg-surface-elevated transition-colors text-left"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="h-2 w-2 rounded-full bg-primary-500 shrink-0" />
                                                    <h4 className="text-[12px] font-black uppercase tracking-wider text-white truncate">
                                                        {fullTitle}
                                                    </h4>
                                                    <span className="rounded-[4px] bg-surface-elevated border border-border-subtle px-1.5 py-0.2 text-[10px] font-extrabold text-primary-400 shrink-0">
                                                        {group.templates.length}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-zinc-400 mt-0.5 truncate font-normal">
                                                    {tagline}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1 text-zinc-400">
                                                <Icon name={isCollapsed ? 'ChevronDown' : 'ChevronUp'} size={16} />
                                            </div>
                                        </button>

                                        {/* Templates inside this school */}
                                        {!isCollapsed && (
                                            <div className="divide-y divide-border-subtle border-t border-border-subtle bg-surface-app">
                                                {group.templates.map(renderTemplateCard)}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        /* Single Selected School View */
                        <div className="border-t border-b border-border-subtle">
                            {/* School Banner Header */}
                            {(() => {
                                const activeConf = SCHOOLS.find((s) => s.id === selectedSchool);
                                if (!activeConf) return null;
                                return (
                                    <div className="bg-surface-raised/70 px-4 py-3 border-b border-border-subtle">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-[13px] font-black uppercase tracking-wide text-white">
                                                {activeConf.fullTitle[lang as 'en' | 'es'] || activeConf.fullTitle.es}
                                            </h4>
                                            <span className="rounded-[4px] bg-primary-500/10 border border-primary-500/30 px-2 py-0.5 text-[10px] font-extrabold text-primary-400">
                                                {filteredTemplates.length} {pickLang(lang, { es: 'rutinas', en: 'routines' })}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-zinc-400 mt-1">
                                            {activeConf.tagline[lang as 'en' | 'es'] || activeConf.tagline.es}
                                        </p>
                                    </div>
                                );
                            })()}
                            <div className="divide-y divide-border-subtle">
                                {filteredTemplates.map(renderTemplateCard)}
                            </div>
                        </div>
                    )}

                    {/* Design from Scratch Action */}
                    <div className="px-4 py-3">
                        <button
                            type="button"
                            onClick={onCreateCustom}
                            className="flex w-full items-center justify-between rounded-[4px] border border-dashed border-border-subtle bg-surface-raised/60 px-3 py-3 text-left hover:bg-surface-raised transition-colors group"
                        >
                            <div className="flex items-center gap-2.5">
                                <div className="flex h-8 w-8 items-center justify-center rounded-[4px] bg-primary-500/10 text-primary-500">
                                    <Icon name="Plus" size={16} />
                                </div>
                                <div>
                                    <span className="text-[13px] font-bold text-white group-hover:text-primary-400 transition-colors">
                                        {ts.designTitle}
                                    </span>
                                    <p className="text-[11px] text-zinc-400">
                                        {ts.designDesc}
                                    </p>
                                </div>
                            </div>
                            <Icon name="ChevronRight" size={16} className="text-zinc-500" />
                        </button>
                    </div>

                    {/* Programs Section (KONG) */}
                    <div className="px-4 py-3 border-t border-border-subtle mt-2">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-500">
                                {ts.programs}
                            </p>
                            <span className="rounded-[4px] bg-primary-500/10 border border-primary-500/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-primary-400">
                                {ts.fullSystem}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowKongDetail(true)}
                            className="w-full rounded-[4px] border border-border-subtle bg-surface-raised p-3.5 text-left hover:border-primary-500/40 transition-colors"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-base font-black text-white">KONG · SAVAGE SIZE</p>
                                    <p className="text-xs font-bold text-primary-400 mt-0.5">Alexander Bromley</p>
                                </div>
                                <span className="rounded-[4px] bg-primary-500 px-2.5 py-1 text-[11px] font-black text-zinc-950 uppercase tracking-wider">
                                    {ts.viewProgram}
                                </span>
                            </div>
                            <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                                12 {ts.weeks} · 4 {ts.days} · 3 {ts.blocks}
                            </p>
                        </button>
                    </div>
                </div>
            </div>

            {/* Template Selection Confirmation Modal */}
            {pendingConfirm && (
                <ConfirmModal
                    isOpen={!!pendingConfirm}
                    title={pickLang(lang, { es: '¿Iniciar plantilla?', en: 'Start Template?' })}
                    description={
                        pendingConfirm
                            ? `${getTranslated(pendingConfirm.title, lang as any)}\n\n${pickLang(lang, {
                                  es: '¿Deseas cargar esta rutina y comenzar el mesociclo?',
                                  en: 'Do you want to load this routine and start the mesocycle?',
                              })}`
                            : ''
                    }
                    confirmText={pickLang(lang, { es: 'Iniciar', en: 'Start' })}
                    cancelText={pickLang(lang, { es: 'Cancelar', en: 'Cancel' })}
                    onConfirm={() => {
                        const tpl = pendingConfirm;
                        setPendingConfirm(null);
                        onSelectTemplate(tpl);
                    }}
                    onCancel={() => setPendingConfirm(null)}
                />
            )}

            {showKongDetail && (
                <Suspense fallback={null}>
                    <ProgramDetailView
                        lang={lang as 'en' | 'es'}
                        onBack={() => setShowKongDetail(false)}
                        onStart={() => {
                            setShowKongDetail(false);
                            onSelectProgram?.('kong_4day');
                        }}
                    />
                </Suspense>
            )}
        </div>
    );

    if (inline || typeof document === 'undefined') return selector;
    return createPortal(selector, document.body);
};
