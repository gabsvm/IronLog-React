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

type FilterCategory = 'ALL' | 'WHOLE_BODY' | 'UPPER_LOWER' | 'PPL' | 'SPECIALIZATION' | 'CUSTOM';

const CATEGORIES: { id: FilterCategory; label: { en: string; es: string } }[] = [
    { id: 'ALL', label: { en: 'ALL', es: 'TODAS' } },
    { id: 'WHOLE_BODY', label: { en: 'WHOLE BODY', es: 'CUERPO COMPLETO' } },
    { id: 'UPPER_LOWER', label: { en: 'UPPER / LOWER', es: 'TORSO / PIERNA' } },
    { id: 'PPL', label: { en: 'PUSH / PULL / LEGS', es: 'PUSH / PULL / LEGS' } },
    { id: 'SPECIALIZATION', label: { en: 'SPECIALIZATION', es: 'ESPECIALIZACIÓN' } },
    { id: 'CUSTOM', label: { en: 'CUSTOM', es: 'PERSONALIZADAS' } },
];

const getTemplateAuthor = (tpl: GlobalTemplate, ts: any): string => {
    if (tpl.scope === 'personal') return ts.myTemplates || 'Custom';
    const id = tpl.id;
    if (id.startsWith('nh_') || id === 'toji_fushiguro' || id === 'tokita') return 'Natural Hypertrophy';
    if (id === 'ji3') return 'Paul Carter';
    if (id === 'full_body') return 'Dr. Mike Israetel (RP)';
    if (id.startsWith('cal_')) return ts.calisthenics || 'Calisthenics';
    return ts.baseSpecials || 'Specials';
};

const getTemplateCategory = (tpl: GlobalTemplate): FilterCategory => {
    if (tpl.scope === 'personal') return 'CUSTOM';
    const id = tpl.id.toLowerCase();
    const title = (tpl.title?.en || '').toLowerCase();
    if (
        id.includes('full_body') ||
        id.includes('whole_body') ||
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
    const cat = getTemplateCategory(tpl);
    switch (cat) {
        case 'WHOLE_BODY':
            return `MALE, ${pickLang(lang, { es: 'CUERPO COMPLETO', en: 'WHOLE BODY' })}`;
        case 'UPPER_LOWER':
            return `MALE, ${pickLang(lang, { es: 'TORSO / PIERNA', en: 'UPPER / LOWER' })}`;
        case 'PPL':
            return `MALE, PUSH / PULL / LEGS`;
        case 'CUSTOM':
            return pickLang(lang, { es: 'PERSONALIZADA', en: 'CUSTOM' });
        case 'SPECIALIZATION':
        default:
            return `MALE, ${pickLang(lang, { es: 'HIPERTROFIA', en: 'HYPERTROPHY FOCUS' })}`;
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
    const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('ALL');
    const [showFilterChips, setShowFilterChips] = useState(true);
    const [pendingConfirm, setPendingConfirm] = useState<GlobalTemplate | null>(null);

    const ts = t.templateSelector;

    const filteredTemplates = useMemo(() => {
        return templates.filter((tpl) => {
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
    }, [templates, selectedCategory, searchQuery, ts]);

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
                            placeholder={pickLang(lang, { es: 'Buscar', en: 'Search' })}
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

            {/* Filters Bar Row */}
            <div className="shrink-0 bg-surface-app px-4 py-2">
                <div className="mx-auto w-full max-w-xl space-y-2">
                    <button
                        type="button"
                        onClick={() => setShowFilterChips((prev) => !prev)}
                        className="w-full rounded-[4px] border border-border-subtle bg-surface-raised px-3 py-2 flex items-center justify-between text-[13px] font-semibold text-zinc-300 hover:bg-surface-elevated transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <svg
                                width={15}
                                height={15}
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="shrink-0 text-zinc-400"
                                aria-hidden="true"
                            >
                                <line x1="4" y1="6" x2="20" y2="6" />
                                <line x1="7" y1="12" x2="17" y2="12" />
                                <line x1="10" y1="18" x2="14" y2="18" />
                            </svg>
                            <span>{pickLang(lang, { es: 'Filtros', en: 'Filters' })}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="rounded-[3px] bg-surface-elevated border border-border-subtle px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-primary-400">
                                {selectedCategory === 'ALL'
                                    ? pickLang(lang, { es: 'TODAS', en: 'ALL' })
                                    : (CATEGORIES.find((c) => c.id === selectedCategory)?.label[lang as 'en' | 'es'] || selectedCategory)}
                            </span>
                            <Icon name={showFilterChips ? 'ChevronUp' : 'ChevronDown'} size={14} className="text-zinc-500" />
                        </div>
                    </button>

                    {showFilterChips && (
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                            {CATEGORIES.map((cat) => {
                                const isSelected = selectedCategory === cat.id;
                                return (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => setSelectedCategory(cat.id)}
                                        className={`shrink-0 rounded-[4px] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                                            isSelected
                                                ? 'bg-white text-zinc-950 font-black'
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

            {/* Flat List of Templates */}
            <div className="flex-1 overflow-y-auto scroll-container">
                <div className="mx-auto w-full max-w-xl pb-[calc(var(--safe-area-bottom)+2rem)]">
                    <div className="divide-y divide-border-subtle border-t border-b border-border-subtle">
                        {filteredTemplates.length === 0 ? (
                            <div className="py-12 text-center text-xs text-zinc-500 font-semibold">
                                {pickLang(lang, { es: 'No se encontraron plantillas', en: 'No templates found' })}
                            </div>
                        ) : (
                            filteredTemplates.map((tpl) => {
                                const overline = getCategoryOverline(tpl, lang);
                                const title = getTranslated(tpl.title, lang as any);
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
                            })
                        )}
                    </div>

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
