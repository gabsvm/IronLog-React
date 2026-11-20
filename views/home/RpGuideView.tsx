import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../../components/ui/Icon';
import {
    RP_GUIDE_DATA,
    RP_GUIDE_TABS,
    type RpFaqItem,
    type RpGuideTabId,
} from '../../data/rpGuideData';
import { RP_PRINCIPLES_DATA, type RpGlossaryTermDef } from '../../data/rpPrinciplesData';
import type { MesoCycle } from '../../types';
import { pickLang } from '../../utils/i18n';
import { RpPrinciplesTab } from './rpGuide/RpPrinciplesTab';
import { RpAutoregTools } from './rpGuide/RpAutoregTools';
import { RpSpecialCasesTab } from './rpGuide/RpSpecialCasesTab';

interface RpGuideViewProps {
    onClose: () => void;
    lang: 'en' | 'es';
    activeMeso?: MesoCycle | null;
}

const RATING_TONE_CLASSES: Record<'red' | 'amber' | 'zinc' | 'emerald' | 'primary', string> = {
    red: 'border-red-500/35 bg-red-500/[0.1] text-red-400',
    amber: 'border-amber-500/35 bg-amber-500/[0.1] text-amber-400',
    zinc: 'border-zinc-500/35 bg-zinc-500/[0.1] text-zinc-200',
    emerald: 'border-emerald-500/35 bg-emerald-500/[0.1] text-emerald-400',
    primary: 'border-primary-500/35 bg-primary-500/[0.1] text-primary-300',
};

const TIER_TONE_CLASSES: Record<'emerald' | 'amber' | 'primary', string> = {
    emerald: 'border-emerald-500/30 bg-emerald-500/[0.09] text-emerald-300',
    amber: 'border-amber-500/30 bg-amber-500/[0.09] text-amber-300',
    primary: 'border-primary-500/30 bg-primary-500/[0.09] text-primary-300',
};

const LANDMARK_TONE_CLASSES: Record<'zinc' | 'emerald' | 'primary' | 'red', string> = {
    zinc: 'border-zinc-500/30 bg-zinc-500/[0.09] text-[rgb(var(--text-primary))]',
    emerald: 'border-emerald-500/30 bg-emerald-500/[0.09] text-emerald-300',
    primary: 'border-primary-500/30 bg-primary-500/[0.09] text-primary-300',
    red: 'border-red-500/30 bg-red-500/[0.09] text-red-300',
};

export const RpGuideView: React.FC<RpGuideViewProps> = ({ onClose, lang, activeMeso }) => {
    const [activeTab, setActiveTab] = useState<RpGuideTabId>('phases');
    const [faqSearch, setFaqSearch] = useState('');
    const [openFaqIds, setOpenFaqIds] = useState<Record<string, boolean>>({});
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const handleSelectTab = (tabId: RpGuideTabId, buttonEl?: HTMLButtonElement | null) => {
        setActiveTab(tabId);
        buttonEl?.scrollIntoView?.({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        if (scrollRef.current) {
            scrollRef.current.scrollTop = 0;
        }
    };

    const toggleFaq = (id: string) => {
        setOpenFaqIds((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const filteredFaqs = useMemo<RpFaqItem[]>(() => {
        const q = faqSearch.trim().toLowerCase();
        if (!q) return RP_GUIDE_DATA.faqs;
        return RP_GUIDE_DATA.faqs.filter((item) => {
            const haystack = `${item.question[lang]} ${item.answer[lang]} ${item.category[lang]}`.toLowerCase();
            return haystack.includes(q);
        });
    }, [faqSearch, lang]);

    const filteredGlossary = useMemo<RpGlossaryTermDef[]>(() => {
        const q = faqSearch.trim().toLowerCase();
        if (!q) return RP_PRINCIPLES_DATA.glossary;
        return RP_PRINCIPLES_DATA.glossary.filter((item) => {
            const haystack = `${item.term[lang]} ${item.definition[lang]} ${item.category[lang]}`.toLowerCase();
            return haystack.includes(q);
        });
    }, [faqSearch, lang]);

    const totalWeeks = activeMeso ? activeMeso.targetWeeks || activeMeso.duration || 5 : null;
    const planLabel = activeMeso?.name || '';

    const content = (
        <div
            className="fixed inset-0 z-modal flex flex-col bg-[rgb(var(--surface-app))] text-[rgb(var(--text-primary))] animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
            aria-label={pickLang(lang, { es: 'Guía del Programa RP', en: 'RP Program Guide' })}
        >
            {/* Sticky Clinical Header — Single heading + week badge + single 44px Close */}
            <header className="shrink-0 border-b border-[rgb(var(--border-subtle)/0.8)] bg-[rgb(var(--surface-app)/0.98)] px-4 pt-safe">
                <div className="mx-auto flex min-h-[58px] w-full max-w-xl items-center gap-3 py-1">
                    <div className="min-w-0 flex-1">
                        <h2 className="truncate text-base font-black tracking-tight text-[rgb(var(--text-primary))] text-balance">
                            {pickLang(lang, { es: 'Guía del Programa', en: 'Program Guide' })}
                        </h2>
                    </div>
                    {activeMeso && totalWeeks && (
                        <div className="inline-flex shrink-0 items-center gap-1.5 rounded-[6px] border border-primary-500/35 bg-primary-500/15 px-2.5 py-1 text-xs font-bold text-primary-300 tabular-nums">
                            <span>W{activeMeso.week}/{totalWeeks}</span>
                            {planLabel && (
                                <span className="hidden sm:inline max-w-[140px] truncate text-[rgb(var(--text-secondary))]">
                                    · {planLabel}
                                </span>
                            )}
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label={pickLang(lang, { es: 'Cerrar guía', en: 'Close guide' })}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[8px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--surface-elevated))] transition-colors active:scale-95"
                    >
                        <Icon name="X" size={20} />
                    </button>
                </div>

                {/* Horizontal Tab Strip with right-edge scroll fade */}
                <div className="relative mx-auto w-full max-w-xl">
                    <nav
                        aria-label={pickLang(lang, { es: 'Secciones de la guía', en: 'Guide sections' })}
                        className="flex items-center gap-2 overflow-x-auto pb-3 pt-1 pr-10 no-scrollbar"
                    >
                        {RP_GUIDE_TABS.map((tab) => {
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    role="tab"
                                    aria-selected={isActive}
                                    data-testid={`rp-guide-tab-${tab.id}`}
                                    onClick={(e) => handleSelectTab(tab.id, e.currentTarget)}
                                    className={`flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-[6px] px-3.5 py-2 text-xs font-bold tracking-wide transition-colors ${
                                        isActive
                                            ? 'bg-[rgb(var(--text-primary))] text-[rgb(var(--surface-app))] font-extrabold shadow-sm'
                                            : 'border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]'
                                    }`}
                                >
                                    <Icon name={tab.icon} size={14} />
                                    <span>{tab.shortLabel[lang]}</span>
                                </button>
                            );
                        })}
                    </nav>
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[rgb(var(--surface-app))] to-transparent"
                    />
                </div>
            </header>

            {/* Main Scrollable Content */}
            <main
                ref={scrollRef}
                className="flex-1 overflow-y-auto scroll-container"
            >
                <div className="mx-auto w-full max-w-xl space-y-5 p-4 pb-[calc(var(--safe-area-bottom)+32px)]">
                    {activeTab === 'phases' && (
                        <>
                            <section className="rounded-r-[8px] border-l border-primary-400/75 bg-primary-500/[0.09] p-4 space-y-3">
                                <div className="flex items-center gap-2 text-primary-300">
                                    <Icon name="Target" size={18} className="shrink-0" />
                                    <h3 className="text-base font-extrabold text-[rgb(var(--text-primary))] text-balance">
                                        {RP_GUIDE_DATA.intro.purposeTitle[lang]}
                                    </h3>
                                </div>
                                <p className="text-[15px] leading-[1.62] text-pretty text-[rgb(var(--text-primary)/0.92)]">
                                    {RP_GUIDE_DATA.intro.purposeBody[lang]}
                                </p>
                                <div>
                                    <span className="inline-flex items-center gap-1.5 rounded-[6px] border border-primary-500/35 bg-[rgb(var(--surface-app)/0.65)] px-3 py-1.5 text-xs font-bold text-primary-300">
                                        <Icon name="Shield" size={13} />
                                        {RP_GUIDE_DATA.intro.experienceBadge[lang]}
                                    </span>
                                </div>
                                <p className="text-sm leading-[1.55] text-[rgb(var(--text-secondary))]">
                                    {RP_GUIDE_DATA.intro.experienceNote[lang]}
                                </p>
                            </section>

                            <section className="space-y-4">
                                {RP_GUIDE_DATA.mesocycles.map((meso) => (
                                    <article
                                        key={meso.number}
                                        className="rounded-[10px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4 space-y-3"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="space-y-0.5">
                                                <span className="text-xs font-extrabold uppercase tracking-wider text-primary-400">
                                                    {meso.code}
                                                </span>
                                                <h4 className="text-base font-extrabold text-[rgb(var(--text-primary))] text-balance">
                                                    {meso.title[lang]}
                                                </h4>
                                            </div>
                                            <span className="shrink-0 rounded-[6px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-elevated))] px-2.5 py-1 text-xs font-bold text-[rgb(var(--text-primary))] tabular-nums">
                                                {meso.duration[lang]}
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            <span className="rounded-[6px] bg-[rgb(var(--surface-elevated))] px-2.5 py-1 text-xs font-bold text-[rgb(var(--text-primary))] tabular-nums">
                                                {meso.repRange}
                                            </span>
                                            <span className="inline-flex items-center gap-1.5 rounded-[6px] bg-[rgb(var(--surface-elevated))] px-2.5 py-1 text-xs font-bold text-[rgb(var(--text-secondary))] tabular-nums">
                                                <Icon name="Clock" size={12} />
                                                {meso.restRange[lang]}
                                            </span>
                                        </div>

                                        <p className="text-[15px] leading-[1.62] text-pretty text-[rgb(var(--text-primary)/0.92)]">
                                            {meso.summary[lang]}
                                        </p>

                                        <div className="border-t border-[rgb(var(--border-subtle)/0.65)] pt-3 text-sm leading-[1.55] text-[rgb(var(--text-secondary))]">
                                            <strong className="font-bold text-[rgb(var(--text-primary))]">
                                                {pickLang(lang, { es: 'Clave:', en: 'Key:' })}
                                            </strong>{' '}
                                            {meso.keyFocus[lang]}
                                        </div>
                                    </article>
                                ))}
                            </section>

                            <div className="rounded-[10px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4 flex items-start gap-3 text-sm leading-[1.58] text-[rgb(var(--text-secondary))]">
                                <Icon name="Repeat" size={18} className="text-primary-400 shrink-0 mt-0.5" />
                                <p>{RP_GUIDE_DATA.macrocycleNote[lang]}</p>
                            </div>

                            {/* Volume Landmarks (MV / MEV / MAV / MRV) */}
                            <section className="rounded-[10px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4 space-y-4">
                                <div className="flex items-center gap-2">
                                    <Icon name="BarChart2" size={18} className="text-primary-400 shrink-0" />
                                    <h3 className="text-base font-extrabold text-[rgb(var(--text-primary))] text-balance">
                                        {pickLang(lang, {
                                            es: 'Hitos de Volumen (Volume Landmarks)',
                                            en: 'Volume Landmarks (MV · MEV · MAV · MRV)',
                                        })}
                                    </h3>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {RP_PRINCIPLES_DATA.volumeLandmarks.map((lm) => (
                                        <article
                                            key={lm.code}
                                            className={`rounded-[8px] border p-3.5 space-y-1.5 ${LANDMARK_TONE_CLASSES[lm.tone]}`}
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-base font-black tracking-tight">{lm.code}</span>
                                                <span className="text-xs font-bold uppercase tracking-wider opacity-95">
                                                    {lm.name[lang]}
                                                </span>
                                            </div>
                                            <p className="text-sm leading-[1.52] text-[rgb(var(--text-primary)/0.92)]">
                                                {lm.definition[lang]}
                                            </p>
                                            <p className="text-xs leading-relaxed text-[rgb(var(--text-secondary))]">
                                                {lm.typicalRange[lang]}
                                            </p>
                                        </article>
                                    ))}
                                </div>

                                <div className="rounded-r-[6px] border-l border-amber-400/70 bg-amber-500/[0.09] px-3.5 py-3 flex items-start gap-2.5 text-sm leading-[1.55] text-[rgb(var(--text-primary)/0.92)]">
                                    <Icon name="AlertTriangle" size={16} className="mt-0.5 shrink-0 text-amber-400" />
                                    <div>
                                        <strong className="font-bold text-amber-300">
                                            {RP_PRINCIPLES_DATA.mvMevGapWarning.title[lang]}:
                                        </strong>{' '}
                                        {RP_PRINCIPLES_DATA.mvMevGapWarning.body[lang]}
                                    </div>
                                </div>
                            </section>

                            {/* Phase Potentiation & Meso-to-Meso Calibration */}
                            <section className="rounded-[10px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4 space-y-4">
                                <div className="flex items-center gap-2">
                                    <Icon name="Layers" size={18} className="text-primary-400 shrink-0" />
                                    <h3 className="text-base font-extrabold text-[rgb(var(--text-primary))] text-balance">
                                        {RP_PRINCIPLES_DATA.phasePotentiation.mesoToMesoTitle[lang]}
                                    </h3>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 border-t border-[rgb(var(--border-subtle)/0.65)] pt-3.5">
                                    <div className="space-y-1">
                                        <div className="text-sm font-extrabold text-primary-300">
                                            {RP_PRINCIPLES_DATA.phasePotentiation.mesoLengthRule.title[lang]}
                                        </div>
                                        <p className="text-sm leading-[1.55] text-[rgb(var(--text-secondary))]">
                                            {RP_PRINCIPLES_DATA.phasePotentiation.mesoLengthRule.body[lang]}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-sm font-extrabold text-emerald-300">
                                            {RP_PRINCIPLES_DATA.phasePotentiation.microcycleRule.title[lang]}
                                        </div>
                                        <p className="text-sm leading-[1.55] text-[rgb(var(--text-secondary))]">
                                            {RP_PRINCIPLES_DATA.phasePotentiation.microcycleRule.body[lang]}
                                        </p>
                                    </div>
                                </div>

                                <div className="divide-y divide-[rgb(var(--border-subtle)/0.65)] border-t border-[rgb(var(--border-subtle)/0.65)]">
                                    {RP_PRINCIPLES_DATA.phasePotentiation.mesoToMesoProgression.map((scenario) => (
                                        <div key={scenario.title.en} className="py-3 space-y-1">
                                            <div className="text-sm font-extrabold text-[rgb(var(--text-primary))]">
                                                {scenario.title[lang]}
                                            </div>
                                            <p className="text-sm leading-[1.55] text-[rgb(var(--text-secondary))]">
                                                {scenario.body[lang]}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                <div className="rounded-r-[6px] border-l border-primary-400/70 bg-primary-500/[0.09] px-3.5 py-3 space-y-1">
                                    <div className="text-sm font-extrabold text-primary-300">
                                        {RP_PRINCIPLES_DATA.phasePotentiation.resensitizationBlock.title[lang]}
                                    </div>
                                    <p className="text-sm leading-[1.55] text-[rgb(var(--text-primary)/0.92)]">
                                        {RP_PRINCIPLES_DATA.phasePotentiation.resensitizationBlock.body[lang]}
                                    </p>
                                </div>
                            </section>
                        </>
                    )}

                    {activeTab === 'principles' && <RpPrinciplesTab lang={lang} />}

                    {activeTab === 'effort' && (
                        <>
                            <section className="space-y-3">
                                <h3 className="px-1 text-xs font-extrabold uppercase tracking-wider text-[rgb(var(--text-secondary))]">
                                    {pickLang(lang, { es: 'Sistema RIR ("Reps desde el fallo")', en: 'RIR System ("Reps From Failure")' })}
                                </h3>
                                {RP_GUIDE_DATA.rirLevels.map((lvl) => (
                                    <article
                                        key={lvl.code}
                                        className="rounded-[10px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4 space-y-2"
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2.5">
                                                <span className={`rounded-[6px] border px-2.5 py-1 text-xs font-black tabular-nums ${RATING_TONE_CLASSES[lvl.tone]}`}>
                                                    {lvl.code}
                                                </span>
                                                <span className="text-base font-extrabold text-[rgb(var(--text-primary))]">
                                                    {lvl.title[lang]}
                                                </span>
                                            </div>
                                            <span className="text-xs font-bold text-[rgb(var(--text-secondary))] tabular-nums">
                                                {lvl.rirLabel}
                                            </span>
                                        </div>
                                        <p className="text-[15px] leading-[1.6] text-[rgb(var(--text-primary)/0.9)]">
                                            {lvl.description[lang]}
                                        </p>
                                    </article>
                                ))}
                            </section>

                            <section className="rounded-r-[8px] border-l border-amber-400/75 bg-amber-500/[0.09] p-4 space-y-2">
                                <div className="flex items-center gap-2 text-amber-400">
                                    <Icon name="AlertTriangle" size={18} className="shrink-0" />
                                    <h4 className="text-base font-extrabold text-[rgb(var(--text-primary))]">
                                        {RP_GUIDE_DATA.techniqueRule.title[lang]}
                                    </h4>
                                </div>
                                <p className="text-[15px] leading-[1.62] text-[rgb(var(--text-primary)/0.92)]">
                                    {RP_GUIDE_DATA.techniqueRule.body[lang]}
                                </p>
                            </section>

                            <section className="rounded-[10px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4 space-y-3.5">
                                <div className="flex items-center gap-2">
                                    <Icon name="TrendingUp" size={18} className="text-primary-400 shrink-0" />
                                    <h4 className="text-base font-extrabold text-[rgb(var(--text-primary))] text-balance">
                                        {RP_GUIDE_DATA.loadCalibration.title[lang]}
                                    </h4>
                                </div>
                                <p className="text-[15px] leading-[1.62] text-[rgb(var(--text-primary)/0.9)]">
                                    {RP_GUIDE_DATA.loadCalibration.intro[lang]}
                                </p>
                                <p className="text-sm leading-[1.58] text-[rgb(var(--text-secondary))]">
                                    {RP_GUIDE_DATA.loadCalibration.firstSetRule[lang]}
                                </p>

                                <div className="divide-y divide-[rgb(var(--border-subtle)/0.65)] border-t border-[rgb(var(--border-subtle)/0.65)]">
                                    {RP_GUIDE_DATA.loadCalibration.bounds.map((row) => (
                                        <div key={row.phase.en} className="py-3 space-y-2">
                                            <div className="text-sm font-bold text-[rgb(var(--text-primary))]">
                                                {row.phase[lang]}
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-bold tabular-nums">
                                                <div className="rounded-[6px] bg-red-500/10 px-2.5 py-1.5 text-red-300">
                                                    {row.tooHeavy}
                                                </div>
                                                <div className="rounded-[6px] bg-emerald-500/10 px-2.5 py-1.5 text-emerald-300 sm:text-center">
                                                    {row.validRange}
                                                </div>
                                                <div className="rounded-[6px] bg-amber-500/10 px-2.5 py-1.5 text-amber-300 sm:text-right">
                                                    {row.tooLight}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-2.5 border-t border-[rgb(var(--border-subtle)/0.65)] pt-3 text-sm leading-[1.55] text-[rgb(var(--text-secondary))]">
                                    <p>{RP_GUIDE_DATA.loadCalibration.smallIncrementsNote[lang]}</p>
                                    <p>{RP_GUIDE_DATA.loadCalibration.bodyweightNote[lang]}</p>
                                </div>
                            </section>

                            {/* Effective Stimulus Ranges + ROM Limits */}
                            <section className="rounded-[10px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4 space-y-4">
                                <div className="flex items-center gap-2">
                                    <Icon name="Gauge" size={18} className="text-primary-400 shrink-0" />
                                    <h4 className="text-base font-extrabold text-[rgb(var(--text-primary))] text-balance">
                                        {pickLang(lang, {
                                            es: 'Rangos Efectivos de Estímulo (Evidencia RP)',
                                            en: 'Effective Hypertrophy Stimulus Ranges',
                                        })}
                                    </h4>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    {RP_PRINCIPLES_DATA.effectiveStimulusRanges.specs.map((spec) => (
                                        <div
                                            key={spec.label.en}
                                            className="rounded-[8px] border border-[rgb(var(--border-subtle)/0.7)] bg-[rgb(var(--surface-elevated)/0.35)] p-3 space-y-1"
                                        >
                                            <div className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--text-secondary))]">
                                                {spec.label[lang]}
                                            </div>
                                            <div className="text-base font-black text-[rgb(var(--text-primary))] tabular-nums">
                                                {spec.value}
                                            </div>
                                            <div className="text-xs leading-snug text-[rgb(var(--text-secondary))]">
                                                {spec.note[lang]}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="border-t border-[rgb(var(--border-subtle)/0.65)] pt-3.5 space-y-2">
                                    <div className="text-sm font-extrabold text-[rgb(var(--text-primary))]">
                                        {RP_PRINCIPLES_DATA.effectiveStimulusRanges.romRules.title[lang]}
                                    </div>
                                    <p className="text-[15px] leading-[1.6] text-[rgb(var(--text-primary)/0.9)]">
                                        {RP_PRINCIPLES_DATA.effectiveStimulusRanges.romRules.summary[lang]}
                                    </p>
                                    <ul className="space-y-2 pt-1">
                                        {RP_PRINCIPLES_DATA.effectiveStimulusRanges.romRules.limits.map((lim, idx) => (
                                            <li
                                                key={idx}
                                                className="text-sm leading-[1.55] text-[rgb(var(--text-secondary))]"
                                            >
                                                {lim[lang]}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </section>

                            {/* 25% / 50% / 25% Rep Distribution & Load vs Rep Progression */}
                            <section className="rounded-[10px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4 space-y-4">
                                <div className="flex items-center gap-2">
                                    <Icon name="BarChart3" size={18} className="text-emerald-400 shrink-0" />
                                    <h4 className="text-base font-extrabold text-[rgb(var(--text-primary))] text-balance">
                                        {pickLang(lang, {
                                            es: 'Reparto Óptimo de Repeticiones (25% / 50% / 25%)',
                                            en: 'Balanced Rep-Range Split (25% / 50% / 25%)',
                                        })}
                                    </h4>
                                </div>

                                <div className="space-y-2.5">
                                    {RP_PRINCIPLES_DATA.effectiveStimulusRanges.repDistribution.map((band) => (
                                        <article
                                            key={band.range}
                                            className={`rounded-[8px] border p-3.5 space-y-1.5 ${RATING_TONE_CLASSES[band.tone]}`}
                                        >
                                            <div className="flex items-center justify-between text-sm font-black tabular-nums">
                                                <span>{band.range}</span>
                                                <span>{band.share}</span>
                                            </div>
                                            <p className="text-sm leading-[1.55] text-[rgb(var(--text-primary)/0.92)]">
                                                {band.profile[lang]}
                                            </p>
                                            <p className="text-xs leading-relaxed text-[rgb(var(--text-secondary))]">
                                                {band.caution[lang]}
                                            </p>
                                        </article>
                                    ))}
                                </div>

                                <div className="border-t border-[rgb(var(--border-subtle)/0.65)] pt-3.5 space-y-1.5">
                                    <div className="text-sm font-extrabold text-[rgb(var(--text-primary))]">
                                        {RP_PRINCIPLES_DATA.effectiveStimulusRanges.loadVsRepRule.title[lang]}
                                    </div>
                                    <p className="text-sm leading-[1.58] text-[rgb(var(--text-secondary))]">
                                        {RP_PRINCIPLES_DATA.effectiveStimulusRanges.loadVsRepRule.body[lang]}
                                    </p>
                                </div>
                            </section>
                        </>
                    )}

                    {activeTab === 'autoreg' && (
                        <>
                            <section className="space-y-3">
                                <h3 className="px-1 text-xs font-extrabold uppercase tracking-wider text-[rgb(var(--text-secondary))]">
                                    {pickLang(lang, { es: 'Escala de Valoración Post-Sesión (MAV)', en: 'Post-Session Rating Scale (MAV)' })}
                                </h3>
                                {RP_GUIDE_DATA.ratingScale.map((item) => (
                                    <div
                                        key={item.score}
                                        className="rounded-[10px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4 flex items-start gap-3.5"
                                    >
                                        <span className={`flex h-10 w-12 shrink-0 items-center justify-center rounded-[6px] border text-base font-black tabular-nums ${RATING_TONE_CLASSES[item.tone]}`}>
                                            {item.score}
                                        </span>
                                        <div className="min-w-0 flex-1 space-y-1">
                                            <p className="text-sm font-extrabold text-[rgb(var(--text-primary))]">
                                                {item.meaning[lang]}
                                            </p>
                                            <p className="text-sm leading-[1.52] text-[rgb(var(--text-secondary))]">
                                                {item.action[lang]}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </section>

                            <RpAutoregTools lang={lang} />

                            <section className="space-y-3">
                                {RP_GUIDE_DATA.autoregNotes.map((note) => (
                                    <article
                                        key={note.title.en}
                                        className="rounded-[10px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4 space-y-1.5"
                                    >
                                        <h4 className="text-sm font-extrabold uppercase tracking-wide text-primary-400">
                                            {note.title[lang]}
                                        </h4>
                                        <p className="text-[15px] leading-[1.6] text-[rgb(var(--text-primary)/0.9)]">
                                            {note.body[lang]}
                                        </p>
                                    </article>
                                ))}
                            </section>
                        </>
                    )}

                    {activeTab === 'execution' && (
                        <>
                            <section className="rounded-[10px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4 space-y-4">
                                <div className="flex items-center gap-2">
                                    <Icon name="Flame" size={18} className="text-amber-400 shrink-0" />
                                    <h3 className="text-base font-extrabold text-[rgb(var(--text-primary))] text-balance">
                                        {pickLang(lang, { es: 'Calentamiento Progresivo (4 pasos)', en: 'Progressive Warm-up Ramp (4 Steps)' })}
                                    </h3>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    {RP_GUIDE_DATA.warmupSteps.map((step) => (
                                        <div
                                            key={step.step}
                                            className="rounded-[8px] border border-[rgb(var(--border-subtle)/0.7)] bg-[rgb(var(--surface-elevated)/0.35)] p-3 space-y-1"
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-xs font-extrabold uppercase tracking-wider text-primary-400">
                                                    #{step.step} · {step.load[lang]}
                                                </span>
                                                <span className="text-sm font-black text-[rgb(var(--text-primary))] tabular-nums">
                                                    {step.reps}
                                                </span>
                                            </div>
                                            <p className="text-sm leading-snug text-[rgb(var(--text-secondary))]">
                                                {step.purpose[lang]}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-sm leading-[1.55] text-[rgb(var(--text-secondary))]">
                                    {RP_GUIDE_DATA.warmupNote[lang]}
                                </p>
                            </section>

                            <section className="rounded-[10px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4 space-y-4">
                                <div className="flex items-center gap-2">
                                    <Icon name="Clock" size={18} className="text-primary-400 shrink-0" />
                                    <h3 className="text-base font-extrabold text-[rgb(var(--text-primary))] text-balance">
                                        {RP_GUIDE_DATA.restAndSupersets.standard.title[lang]}
                                    </h3>
                                </div>
                                <p className="text-[15px] leading-[1.62] text-[rgb(var(--text-primary)/0.9)]">
                                    {RP_GUIDE_DATA.restAndSupersets.standard.body[lang]}
                                </p>
                                <div className="border-t border-[rgb(var(--border-subtle)/0.65)] pt-3.5 space-y-1.5">
                                    <h4 className="text-sm font-extrabold text-amber-400">
                                        {RP_GUIDE_DATA.restAndSupersets.metabolite.title[lang]}
                                    </h4>
                                    <p className="text-[15px] leading-[1.62] text-[rgb(var(--text-primary)/0.9)]">
                                        {RP_GUIDE_DATA.restAndSupersets.metabolite.body[lang]}
                                    </p>
                                </div>
                            </section>

                            {/* 4-Point Inter-Set Rest Checklist */}
                            <section className="rounded-[10px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4 space-y-3.5">
                                <div className="flex items-center gap-2">
                                    <Icon name="CheckCircle" size={18} className="text-emerald-400 shrink-0" />
                                    <h3 className="text-base font-extrabold text-[rgb(var(--text-primary))] text-balance">
                                        {RP_PRINCIPLES_DATA.executionScience.restChecklistTitle[lang]}
                                    </h3>
                                </div>
                                <p className="text-sm leading-[1.55] text-[rgb(var(--text-secondary))]">
                                    {RP_PRINCIPLES_DATA.executionScience.restChecklistNote[lang]}
                                </p>
                                <ul className="space-y-2.5 border-t border-[rgb(var(--border-subtle)/0.65)] pt-3">
                                    {RP_PRINCIPLES_DATA.executionScience.restChecklist.map((pt, idx) => (
                                        <li key={idx} className="text-sm leading-[1.55] text-[rgb(var(--text-primary)/0.88)]">
                                            {pt[lang]}
                                        </li>
                                    ))}
                                </ul>
                            </section>

                            <section className="rounded-[10px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4 space-y-3.5">
                                <h3 className="text-base font-extrabold text-[rgb(var(--text-primary))] text-balance">
                                    {RP_GUIDE_DATA.restAndSupersets.exerciseSelectionTitle[lang]}
                                </h3>
                                <ul className="space-y-3">
                                    {RP_GUIDE_DATA.restAndSupersets.exerciseSelectionPoints.map((pt, idx) => (
                                        <li key={idx} className="flex items-start gap-2.5 text-sm leading-[1.58] text-[rgb(var(--text-secondary))]">
                                            <Icon name="CheckCircle" size={16} className="text-emerald-400 shrink-0 mt-1" />
                                            <span>{pt[lang]}</span>
                                        </li>
                                    ))}
                                </ul>
                            </section>

                            {/* 8 Overload Modalities & Set Counting (Tables 2.1 & 5.1) */}
                            <section className="rounded-[10px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4 space-y-3.5">
                                <div className="flex items-center gap-2">
                                    <Icon name="Zap" size={18} className="text-primary-400 shrink-0" />
                                    <h3 className="text-base font-extrabold text-[rgb(var(--text-primary))] text-balance">
                                        {RP_PRINCIPLES_DATA.executionScience.overloadModalitiesTitle[lang]}
                                    </h3>
                                </div>

                                <div className="divide-y divide-[rgb(var(--border-subtle)/0.65)] border-t border-[rgb(var(--border-subtle)/0.65)]">
                                    {RP_PRINCIPLES_DATA.executionScience.overloadModalities.map((mod) => (
                                        <article key={mod.id} className="py-3.5 space-y-2">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <h4 className="text-sm font-extrabold text-[rgb(var(--text-primary))]">
                                                    {mod.name[lang]}
                                                </h4>
                                                <span className="rounded-[5px] bg-primary-500/15 px-2.5 py-1 text-xs font-bold text-primary-300 tabular-nums">
                                                    {mod.setCountRule[lang]}
                                                </span>
                                            </div>
                                            <div className="text-xs font-bold text-[rgb(var(--text-secondary))] tabular-nums">
                                                {mod.loadAndRest[lang]}
                                            </div>
                                            <p className="text-sm leading-[1.55] text-emerald-200/95">
                                                <strong className="text-emerald-400">
                                                    {pickLang(lang, { es: 'Usar:', en: 'Use:' })}
                                                </strong>{' '}
                                                {mod.whenToUse[lang]}
                                            </p>
                                            <p className="text-sm leading-[1.55] text-amber-200/90">
                                                <strong className="text-amber-400">
                                                    {pickLang(lang, { es: 'Evitar:', en: 'Avoid:' })}
                                                </strong>{' '}
                                                {mod.whenToAvoid[lang]}
                                            </p>
                                        </article>
                                    ))}
                                </div>
                            </section>

                            <section className="rounded-r-[8px] border-l border-emerald-400/75 bg-emerald-500/[0.09] p-4 space-y-3">
                                <div className="flex items-center gap-2 text-emerald-400">
                                    <Icon name="Zap" size={18} className="shrink-0" />
                                    <h3 className="text-base font-extrabold text-[rgb(var(--text-primary))]">
                                        {RP_GUIDE_DATA.deload.title[lang]}
                                    </h3>
                                </div>
                                <ul className="space-y-3">
                                    {RP_GUIDE_DATA.deload.rules.map((rule, idx) => (
                                        <li key={idx} className="flex items-start gap-2.5 text-sm leading-[1.58] text-[rgb(var(--text-primary)/0.9)]">
                                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                                            <span>{rule[lang]}</span>
                                        </li>
                                    ))}
                                </ul>
                            </section>

                            {/* Complete Fatigue Management Toolbox */}
                            <section className="rounded-[10px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4 space-y-3">
                                <div className="flex items-center gap-2">
                                    <Icon name="Shield" size={18} className="text-primary-400 shrink-0" />
                                    <h3 className="text-base font-extrabold text-[rgb(var(--text-primary))] text-balance">
                                        {RP_PRINCIPLES_DATA.executionScience.fatigueToolbox.title[lang]}
                                    </h3>
                                </div>
                                <div className="divide-y divide-[rgb(var(--border-subtle)/0.65)] border-t border-[rgb(var(--border-subtle)/0.65)]">
                                    {[
                                        RP_PRINCIPLES_DATA.executionScience.fatigueToolbox.pulsatility,
                                        RP_PRINCIPLES_DATA.executionScience.fatigueToolbox.restDays,
                                        RP_PRINCIPLES_DATA.executionScience.fatigueToolbox.recoverySessions,
                                        RP_PRINCIPLES_DATA.executionScience.fatigueToolbox.deloadProtocolExtra,
                                        RP_PRINCIPLES_DATA.executionScience.fatigueToolbox.activeRest,
                                    ].map((block) => (
                                        <div key={block.title.en} className="py-3.5 space-y-1.5">
                                            <h4 className="text-sm font-extrabold text-primary-300">{block.title[lang]}</h4>
                                            <p className="text-sm leading-[1.58] text-[rgb(var(--text-secondary))]">
                                                {block.body[lang]}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </>
                    )}

                    {activeTab === 'nutrition' && (
                        <>
                            <section className="space-y-3">
                                <h3 className="px-1 text-xs font-extrabold uppercase tracking-wider text-[rgb(var(--text-secondary))]">
                                    {pickLang(lang, { es: 'Alineación Calórica por Mesociclo', en: 'Caloric Alignment by Phase' })}
                                </h3>
                                {RP_GUIDE_DATA.nutrition.caloricAlignment.map((item) => (
                                    <article
                                        key={item.goal.en}
                                        className="rounded-[10px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4 space-y-2"
                                    >
                                        <h4 className="text-base font-extrabold text-[rgb(var(--text-primary))]">
                                            {item.goal[lang]}
                                        </h4>
                                        <p className="text-[15px] leading-[1.6] text-[rgb(var(--text-primary)/0.9)]">
                                            {item.phasePlan[lang]}
                                        </p>
                                    </article>
                                ))}
                            </section>

                            {/* Volume Landmarks per Diet Phase */}
                            <section className="rounded-[10px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4 space-y-3.5">
                                <div className="flex items-center gap-2">
                                    <Icon name="TrendingUp" size={18} className="text-primary-400 shrink-0" />
                                    <h3 className="text-base font-extrabold text-[rgb(var(--text-primary))] text-balance">
                                        {RP_PRINCIPLES_DATA.dietAndCardioScience.dietPhasesTitle[lang]}
                                    </h3>
                                </div>
                                <div className="space-y-3">
                                    {RP_PRINCIPLES_DATA.dietAndCardioScience.dietPhases.map((dp) => (
                                        <article
                                            key={dp.phase.en}
                                            className={`rounded-[8px] border p-3.5 space-y-1.5 ${LANDMARK_TONE_CLASSES[dp.tone]}`}
                                        >
                                            <div className="text-sm font-black">{dp.phase[lang]}</div>
                                            <div className="text-xs font-bold uppercase tracking-wider opacity-95">
                                                {dp.landmarksShift[lang]}
                                            </div>
                                            <p className="text-sm leading-[1.55] text-[rgb(var(--text-primary)/0.92)]">
                                                {dp.strategy[lang]}
                                            </p>
                                        </article>
                                    ))}
                                </div>
                            </section>

                            <section className="rounded-[10px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4 space-y-3.5">
                                <div className="flex items-center gap-2">
                                    <Icon name="Scale" size={18} className="text-primary-400 shrink-0" />
                                    <h3 className="text-base font-extrabold text-[rgb(var(--text-primary))] text-balance">
                                        {RP_GUIDE_DATA.nutrition.dayTiersTitle[lang]}
                                    </h3>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                    {RP_GUIDE_DATA.nutrition.dayTiers.map((tier) => (
                                        <div
                                            key={tier.setsRange}
                                            className={`rounded-[8px] border p-3.5 space-y-1 ${TIER_TONE_CLASSES[tier.tone]}`}
                                        >
                                            <div className="text-xs font-extrabold uppercase tracking-wider">
                                                {tier.tier[lang]}
                                            </div>
                                            <div className="text-base font-black tabular-nums">{tier.setsRange}</div>
                                            <p className="text-sm leading-snug text-[rgb(var(--text-primary)/0.9)]">
                                                {tier.description[lang]}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section className="rounded-[10px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4 space-y-3.5">
                                <h3 className="text-base font-extrabold text-[rgb(var(--text-primary))] text-balance">
                                    {RP_GUIDE_DATA.nutrition.cardioTitle[lang]}
                                </h3>
                                <ol className="space-y-3">
                                    {RP_GUIDE_DATA.nutrition.cardioPriority.map((item, idx) => (
                                        <li key={idx} className="flex items-start gap-3 text-sm leading-[1.58] text-[rgb(var(--text-secondary))]">
                                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[5px] bg-primary-500/15 text-xs font-black text-primary-300 tabular-nums mt-0.5">
                                                {idx + 1}
                                            </span>
                                            <span>{item[lang]}</span>
                                        </li>
                                    ))}
                                </ol>
                            </section>

                            {/* NEAT & Scientific Cardio Rules */}
                            <section className="rounded-[10px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4 space-y-3.5">
                                <div className="flex items-center gap-2">
                                    <Icon name="Activity" size={18} className="text-emerald-400 shrink-0" />
                                    <h3 className="text-base font-extrabold text-[rgb(var(--text-primary))] text-balance">
                                        {RP_PRINCIPLES_DATA.dietAndCardioScience.neatAndCardioTitle[lang]}
                                    </h3>
                                </div>
                                <ul className="space-y-3">
                                    {RP_PRINCIPLES_DATA.dietAndCardioScience.neatAndCardioRules.map((rule, idx) => (
                                        <li
                                            key={idx}
                                            className="flex items-start gap-2.5 text-sm leading-[1.58] text-[rgb(var(--text-secondary))]"
                                        >
                                            <Icon name="CheckCircle" size={16} className="mt-1 shrink-0 text-emerald-400" />
                                            <span>{rule[lang]}</span>
                                        </li>
                                    ))}
                                </ul>
                            </section>

                            <section className="rounded-[10px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4 space-y-3.5">
                                <div className="flex items-center gap-2">
                                    <Icon name="Heart" size={18} className="text-primary-400 shrink-0" />
                                    <h3 className="text-base font-extrabold text-[rgb(var(--text-primary))] text-balance">
                                        {RP_GUIDE_DATA.nutrition.mixedSports.title[lang]}
                                    </h3>
                                </div>
                                <ul className="space-y-3">
                                    {RP_GUIDE_DATA.nutrition.mixedSports.points.map((pt, idx) => (
                                        <li key={idx} className="flex items-start gap-2.5 text-sm leading-[1.58] text-[rgb(var(--text-secondary))]">
                                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-400" />
                                            <span>{pt[lang]}</span>
                                        </li>
                                    ))}
                                </ul>

                                <div className="border-t border-[rgb(var(--border-subtle)/0.65)] pt-3.5 space-y-2.5">
                                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-[rgb(var(--text-secondary))]">
                                        {RP_PRINCIPLES_DATA.dietAndCardioScience.sportAndStrengthTitle[lang]}
                                    </h4>
                                    {RP_PRINCIPLES_DATA.dietAndCardioScience.sportAndStrengthNotes.map((note, idx) => (
                                        <p key={idx} className="text-sm leading-[1.58] text-[rgb(var(--text-secondary))]">
                                            {note[lang]}
                                        </p>
                                    ))}
                                </div>
                            </section>
                        </>
                    )}

                    {activeTab === 'special' && <RpSpecialCasesTab lang={lang} />}

                    {activeTab === 'faq' && (
                        <>
                            <div className="relative">
                                <Icon name="Search" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[rgb(var(--text-secondary))]" />
                                <input
                                    type="search"
                                    inputMode="search"
                                    value={faqSearch}
                                    onChange={(e) => setFaqSearch(e.target.value)}
                                    placeholder={pickLang(lang, { es: 'Buscar pregunta, término o acrónimo...', en: 'Search questions, terms, or acronyms...' })}
                                    aria-label={pickLang(lang, { es: 'Buscar en preguntas frecuentes', en: 'Search FAQ' })}
                                    className="min-h-[44px] w-full rounded-[8px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] py-3 pl-10 pr-4 text-sm font-medium text-[rgb(var(--text-primary))] outline-none placeholder-[rgb(var(--text-secondary))] focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                                />
                            </div>

                            {filteredFaqs.length === 0 && filteredGlossary.length === 0 ? (
                                <div className="rounded-[10px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-8 text-center text-sm text-[rgb(var(--text-secondary))]">
                                    {pickLang(lang, { es: 'No hay resultados que coincidan con tu búsqueda.', en: 'No matching questions or terms found.' })}
                                </div>
                            ) : (
                                <>
                                    {filteredFaqs.length > 0 && (
                                        <div className="space-y-3">
                                            {filteredFaqs.map((faq) => {
                                                const isOpen = !!openFaqIds[faq.id];
                                                return (
                                                    <article
                                                        key={faq.id}
                                                        className="overflow-hidden rounded-[10px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))]"
                                                    >
                                                        <button
                                                            type="button"
                                                            aria-expanded={isOpen}
                                                            onClick={() => toggleFaq(faq.id)}
                                                            className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition-colors hover:bg-[rgb(var(--surface-elevated)/0.45)]"
                                                        >
                                                            <div className="min-w-0 flex-1 space-y-1.5">
                                                                <span className="inline-block rounded-[4px] bg-[rgb(var(--surface-elevated))] px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-primary-400">
                                                                    {faq.category[lang]}
                                                                </span>
                                                                <h4 className="text-[15px] font-bold leading-snug text-[rgb(var(--text-primary))]">
                                                                    {faq.question[lang]}
                                                                </h4>
                                                            </div>
                                                            <Icon
                                                                name={isOpen ? 'ChevronUp' : 'ChevronDown'}
                                                                size={18}
                                                                className="shrink-0 text-[rgb(var(--text-secondary))]"
                                                            />
                                                        </button>
                                                        {isOpen && (
                                                            <div className="border-t border-[rgb(var(--border-subtle)/0.75)] px-4 py-3.5 text-sm leading-[1.6] text-[rgb(var(--text-primary)/0.9)]">
                                                                {faq.answer[lang]}
                                                            </div>
                                                        )}
                                                    </article>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {filteredGlossary.length > 0 && (
                                        <section className="space-y-3 pt-2">
                                            <div className="flex items-center gap-2 px-1">
                                                <Icon name="Info" size={16} className="text-primary-400" />
                                                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[rgb(var(--text-secondary))]">
                                                    {pickLang(lang, { es: 'Glosario Científico RP', en: 'RP Scientific Glossary' })}
                                                </h3>
                                            </div>
                                            <div className="grid grid-cols-1 gap-2.5">
                                                {filteredGlossary.map((entry) => (
                                                    <article
                                                        key={entry.id}
                                                        data-testid={`rp-glossary-${entry.id}`}
                                                        className="rounded-[10px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4 space-y-1.5"
                                                    >
                                                        <div className="flex items-center justify-between gap-2">
                                                            <h4 className="text-sm font-extrabold text-[rgb(var(--text-primary))]">
                                                                {entry.term[lang]}
                                                            </h4>
                                                            <span className="shrink-0 rounded-[4px] bg-[rgb(var(--surface-elevated))] px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-[rgb(var(--text-secondary))]">
                                                                {entry.category[lang]}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm leading-[1.55] text-[rgb(var(--text-secondary))]">
                                                            {entry.definition[lang]}
                                                        </p>
                                                    </article>
                                                ))}
                                            </div>
                                        </section>
                                    )}
                                </>
                            )}
                        </>
                    )}
                </div>
            </main>
        </div>
    );

    return typeof document !== 'undefined' ? createPortal(content, document.body) : content;
};
