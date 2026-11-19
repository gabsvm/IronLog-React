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
    red: 'border-red-500/30 bg-red-500/10 text-red-400',
    amber: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
    zinc: 'border-zinc-500/30 bg-zinc-500/10 text-zinc-300',
    emerald: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
    primary: 'border-primary-500/30 bg-primary-500/10 text-primary-400',
};

const TIER_TONE_CLASSES: Record<'emerald' | 'amber' | 'primary', string> = {
    emerald: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-400',
    amber: 'border-amber-500/25 bg-amber-500/10 text-amber-400',
    primary: 'border-primary-500/25 bg-primary-500/10 text-primary-400',
};

const LANDMARK_TONE_CLASSES: Record<'zinc' | 'emerald' | 'primary' | 'red', string> = {
    zinc: 'border-zinc-500/30 bg-zinc-500/10 text-zinc-300',
    emerald: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    primary: 'border-primary-500/30 bg-primary-500/10 text-primary-300',
    red: 'border-red-500/30 bg-red-500/10 text-red-300',
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

    const handleSelectTab = (tabId: RpGuideTabId) => {
        setActiveTab(tabId);
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
            {/* Sticky Clinical Header */}
            <header className="shrink-0 border-b border-[rgb(var(--border-subtle)/0.75)] bg-[rgb(var(--surface-app)/0.98)] px-4 pt-safe">
                <div className="mx-auto flex h-14 w-full max-w-xl items-center gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label={pickLang(lang, { es: 'Volver', en: 'Back' })}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[6px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] text-[rgb(var(--text-secondary))] transition-transform active:scale-95"
                    >
                        <Icon name="ChevronLeft" size={20} />
                    </button>
                    <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary-500">
                            RP PERIODIZATION · MPT + PRINCIPLES
                        </p>
                        <h2 className="truncate text-sm font-black uppercase tracking-tight">
                            {pickLang(lang, { es: 'Guía del Programa', en: 'Program Guide' })}
                        </h2>
                    </div>
                    {activeMeso && totalWeeks && (
                        <div className="hidden sm:flex items-center gap-1.5 rounded-[4px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-300 tabular-nums">
                            <span className="text-primary-400">W{activeMeso.week}/{totalWeeks}</span>
                            {planLabel && <span className="max-w-[140px] truncate text-zinc-400">· {planLabel}</span>}
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label={pickLang(lang, { es: 'Cerrar guía', en: 'Close guide' })}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[6px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] text-zinc-400 hover:text-white transition-colors active:scale-95"
                    >
                        <Icon name="X" size={18} />
                    </button>
                </div>

                {/* Horizontal Tab Strip */}
                <nav
                    aria-label={pickLang(lang, { es: 'Secciones de la guía', en: 'Guide sections' })}
                    className="mx-auto flex w-full max-w-xl items-center gap-1.5 overflow-x-auto pb-2.5 pt-1 no-scrollbar"
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
                                onClick={() => handleSelectTab(tab.id)}
                                className={`flex shrink-0 items-center gap-1.5 rounded-[4px] px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                                    isActive
                                        ? 'bg-white text-zinc-950 font-black shadow-sm'
                                        : 'border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] text-zinc-400 hover:text-white'
                                }`}
                            >
                                <Icon name={tab.icon} size={13} />
                                <span>{tab.shortLabel[lang]}</span>
                            </button>
                        );
                    })}
                </nav>
            </header>

            {/* Main Scrollable Content */}
            <main
                ref={scrollRef}
                className="flex-1 overflow-y-auto scroll-container"
            >
                <div className="mx-auto w-full max-w-xl space-y-4 p-4 pb-[calc(var(--safe-area-bottom)+28px)]">
                    {activeTab === 'phases' && (
                        <>
                            <section className="rounded-[8px] border border-primary-500/25 bg-primary-500/10 p-4 space-y-2">
                                <div className="flex items-center gap-2 text-primary-400">
                                    <Icon name="Target" size={16} />
                                    <h3 className="text-xs font-black uppercase tracking-wider">
                                        {RP_GUIDE_DATA.intro.purposeTitle[lang]}
                                    </h3>
                                </div>
                                <p className="text-xs leading-relaxed text-[rgb(var(--text-secondary))]">
                                    {RP_GUIDE_DATA.intro.purposeBody[lang]}
                                </p>
                                <div className="pt-1">
                                    <span className="inline-flex items-center gap-1.5 rounded-[4px] border border-primary-500/30 bg-[rgb(var(--surface-app)/0.6)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-300">
                                        <Icon name="Shield" size={11} />
                                        {RP_GUIDE_DATA.intro.experienceBadge[lang]}
                                    </span>
                                </div>
                                <p className="text-[11px] leading-relaxed text-zinc-400">
                                    {RP_GUIDE_DATA.intro.experienceNote[lang]}
                                </p>
                            </section>

                            <section className="space-y-3">
                                {RP_GUIDE_DATA.mesocycles.map((meso) => (
                                    <article
                                        key={meso.number}
                                        className="rounded-[8px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4 space-y-2.5"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <span className="text-[10px] font-black uppercase tracking-[0.16em] text-primary-500">
                                                    {meso.code}
                                                </span>
                                                <h4 className="text-sm font-black text-white">
                                                    {meso.title[lang]}
                                                </h4>
                                            </div>
                                            <span className="shrink-0 rounded-[4px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-elevated))] px-2 py-0.5 text-[10px] font-bold text-zinc-300 tabular-nums">
                                                {meso.duration[lang]}
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap gap-1.5">
                                            <span className="rounded-[4px] bg-[rgb(var(--surface-elevated))] px-2 py-0.5 text-[10px] font-bold text-zinc-300 tabular-nums">
                                                {meso.repRange}
                                            </span>
                                            <span className="rounded-[4px] bg-[rgb(var(--surface-elevated))] px-2 py-0.5 text-[10px] font-bold text-zinc-400 tabular-nums">
                                                <Icon name="Clock" size={10} className="inline mr-1 -mt-0.5" />
                                                {meso.restRange[lang]}
                                            </span>
                                        </div>

                                        <p className="text-xs leading-relaxed text-[rgb(var(--text-secondary))]">
                                            {meso.summary[lang]}
                                        </p>

                                        <div className="rounded-[6px] border border-[rgb(var(--border-subtle)/0.6)] bg-[rgb(var(--surface-app)/0.5)] px-3 py-2 text-[11px] leading-relaxed text-zinc-400">
                                            <strong className="text-zinc-200">{pickLang(lang, { es: 'Clave:', en: 'Key:' })}</strong>{' '}
                                            {meso.keyFocus[lang]}
                                        </div>
                                    </article>
                                ))}
                            </section>

                            <div className="rounded-[8px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-3.5 flex items-start gap-2.5 text-xs leading-relaxed text-zinc-400">
                                <Icon name="Repeat" size={16} className="text-primary-400 shrink-0 mt-0.5" />
                                <p>{RP_GUIDE_DATA.macrocycleNote[lang]}</p>
                            </div>

                            {/* Volume Landmarks (MV / MEV / MAV / MRV) */}
                            <section className="rounded-[8px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4 space-y-3">
                                <div className="flex items-center gap-2">
                                    <Icon name="BarChart2" size={16} className="text-primary-400" />
                                    <h3 className="text-xs font-black uppercase tracking-wider text-white">
                                        {pickLang(lang, {
                                            es: 'Hitos de Volumen (Volume Landmarks)',
                                            en: 'Volume Landmarks (MV · MEV · MAV · MRV)',
                                        })}
                                    </h3>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    {RP_PRINCIPLES_DATA.volumeLandmarks.map((lm) => (
                                        <article
                                            key={lm.code}
                                            className={`rounded-[6px] border p-3 space-y-1 ${LANDMARK_TONE_CLASSES[lm.tone]}`}
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-sm font-black tracking-tight">{lm.code}</span>
                                                <span className="text-[10px] font-bold uppercase tracking-wider opacity-90">
                                                    {lm.name[lang]}
                                                </span>
                                            </div>
                                            <p className="text-[11px] leading-snug text-zinc-200">{lm.definition[lang]}</p>
                                            <p className="text-[10px] leading-snug text-zinc-400">{lm.typicalRange[lang]}</p>
                                        </article>
                                    ))}
                                </div>

                                <div className="rounded-[6px] border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 flex items-start gap-2 text-[11px] leading-relaxed text-amber-200">
                                    <Icon name="AlertTriangle" size={14} className="mt-0.5 shrink-0 text-amber-400" />
                                    <div>
                                        <strong className="text-amber-300">
                                            {RP_PRINCIPLES_DATA.mvMevGapWarning.title[lang]}:
                                        </strong>{' '}
                                        {RP_PRINCIPLES_DATA.mvMevGapWarning.body[lang]}
                                    </div>
                                </div>
                            </section>

                            {/* Phase Potentiation & Meso-to-Meso Calibration */}
                            <section className="rounded-[8px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4 space-y-3">
                                <div className="flex items-center gap-2">
                                    <Icon name="Layers" size={16} className="text-primary-400" />
                                    <h3 className="text-xs font-black uppercase tracking-wider text-white">
                                        {RP_PRINCIPLES_DATA.phasePotentiation.mesoToMesoTitle[lang]}
                                    </h3>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    <div className="rounded-[6px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-app)/0.5)] p-3 space-y-1">
                                        <div className="text-xs font-bold text-primary-300">
                                            {RP_PRINCIPLES_DATA.phasePotentiation.mesoLengthRule.title[lang]}
                                        </div>
                                        <p className="text-[11px] leading-relaxed text-zinc-300">
                                            {RP_PRINCIPLES_DATA.phasePotentiation.mesoLengthRule.body[lang]}
                                        </p>
                                    </div>
                                    <div className="rounded-[6px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-app)/0.5)] p-3 space-y-1">
                                        <div className="text-xs font-bold text-emerald-300">
                                            {RP_PRINCIPLES_DATA.phasePotentiation.microcycleRule.title[lang]}
                                        </div>
                                        <p className="text-[11px] leading-relaxed text-zinc-300">
                                            {RP_PRINCIPLES_DATA.phasePotentiation.microcycleRule.body[lang]}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    {RP_PRINCIPLES_DATA.phasePotentiation.mesoToMesoProgression.map((scenario) => (
                                        <div
                                            key={scenario.title.en}
                                            className="rounded-[6px] border border-[rgb(var(--border-subtle)/0.7)] bg-[rgb(var(--surface-app)/0.45)] p-3 space-y-1"
                                        >
                                            <div className="text-xs font-bold text-white">{scenario.title[lang]}</div>
                                            <p className="text-[11px] leading-relaxed text-zinc-400">
                                                {scenario.body[lang]}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                <div className="rounded-[6px] border border-primary-500/25 bg-primary-500/10 p-3 space-y-1">
                                    <div className="text-xs font-black text-primary-300">
                                        {RP_PRINCIPLES_DATA.phasePotentiation.resensitizationBlock.title[lang]}
                                    </div>
                                    <p className="text-[11px] leading-relaxed text-zinc-200">
                                        {RP_PRINCIPLES_DATA.phasePotentiation.resensitizationBlock.body[lang]}
                                    </p>
                                </div>
                            </section>
                        </>
                    )}

                    {activeTab === 'principles' && <RpPrinciplesTab lang={lang} />}

                    {activeTab === 'effort' && (
                        <>
                            <section className="space-y-2.5">
                                <h3 className="px-1 text-xs font-black uppercase tracking-wider text-zinc-400">
                                    {pickLang(lang, { es: 'Sistema RIR ("Reps desde el fallo")', en: 'RIR System ("Reps From Failure")' })}
                                </h3>
                                {RP_GUIDE_DATA.rirLevels.map((lvl) => (
                                    <article
                                        key={lvl.code}
                                        className="rounded-[8px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4 space-y-1.5"
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <span className={`rounded-[4px] border px-2 py-0.5 text-[11px] font-black tabular-nums ${RATING_TONE_CLASSES[lvl.tone]}`}>
                                                    {lvl.code}
                                                </span>
                                                <span className="text-sm font-black text-white">{lvl.title[lang]}</span>
                                            </div>
                                            <span className="text-[11px] font-bold text-zinc-400 tabular-nums">{lvl.rirLabel}</span>
                                        </div>
                                        <p className="text-xs leading-relaxed text-[rgb(var(--text-secondary))]">
                                            {lvl.description[lang]}
                                        </p>
                                    </article>
                                ))}
                            </section>

                            <section className="rounded-[8px] border border-amber-500/30 bg-amber-500/10 p-4 space-y-1.5">
                                <div className="flex items-center gap-2 text-amber-400">
                                    <Icon name="AlertTriangle" size={16} />
                                    <h4 className="text-xs font-black uppercase tracking-wider">
                                        {RP_GUIDE_DATA.techniqueRule.title[lang]}
                                    </h4>
                                </div>
                                <p className="text-xs leading-relaxed text-[rgb(var(--text-secondary))]">
                                    {RP_GUIDE_DATA.techniqueRule.body[lang]}
                                </p>
                            </section>

                            <section className="rounded-[8px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4 space-y-3">
                                <div className="flex items-center gap-2">
                                    <Icon name="TrendingUp" size={16} className="text-primary-400" />
                                    <h4 className="text-sm font-black text-white">
                                        {RP_GUIDE_DATA.loadCalibration.title[lang]}
                                    </h4>
                                </div>
                                <p className="text-xs leading-relaxed text-[rgb(var(--text-secondary))]">
                                    {RP_GUIDE_DATA.loadCalibration.intro[lang]}
                                </p>
                                <p className="text-xs leading-relaxed text-zinc-300">
                                    {RP_GUIDE_DATA.loadCalibration.firstSetRule[lang]}
                                </p>

                                <div className="space-y-2 pt-1">
                                    {RP_GUIDE_DATA.loadCalibration.bounds.map((row) => (
                                        <div
                                            key={row.phase.en}
                                            className="rounded-[6px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-app)/0.55)] p-3 space-y-1.5"
                                        >
                                            <div className="text-xs font-bold text-white">{row.phase[lang]}</div>
                                            <div className="grid grid-cols-3 gap-1.5 text-[10px] font-bold tabular-nums">
                                                <div className="rounded-[4px] bg-red-500/10 px-2 py-1 text-red-300">
                                                    {row.tooHeavy}
                                                </div>
                                                <div className="rounded-[4px] bg-emerald-500/10 px-2 py-1 text-emerald-300 text-center">
                                                    {row.validRange}
                                                </div>
                                                <div className="rounded-[4px] bg-amber-500/10 px-2 py-1 text-amber-300 text-right">
                                                    {row.tooLight}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-2 pt-1 text-[11px] leading-relaxed text-zinc-400">
                                    <p>{RP_GUIDE_DATA.loadCalibration.smallIncrementsNote[lang]}</p>
                                    <p>{RP_GUIDE_DATA.loadCalibration.bodyweightNote[lang]}</p>
                                </div>
                            </section>

                            {/* Effective Stimulus Ranges + ROM Limits */}
                            <section className="rounded-[8px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4 space-y-3">
                                <div className="flex items-center gap-2">
                                    <Icon name="Gauge" size={16} className="text-primary-400" />
                                    <h4 className="text-xs font-black uppercase tracking-wider text-white">
                                        {pickLang(lang, {
                                            es: 'Rangos Efectivos de Estímulo (Evidencia RP)',
                                            en: 'Effective Hypertrophy Stimulus Ranges',
                                        })}
                                    </h4>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    {RP_PRINCIPLES_DATA.effectiveStimulusRanges.specs.map((spec) => (
                                        <div
                                            key={spec.label.en}
                                            className="rounded-[6px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-app)/0.55)] p-2.5 space-y-0.5"
                                        >
                                            <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                                                {spec.label[lang]}
                                            </div>
                                            <div className="text-sm font-black text-white tabular-nums">{spec.value}</div>
                                            <div className="text-[10px] leading-snug text-zinc-400">{spec.note[lang]}</div>
                                        </div>
                                    ))}
                                </div>

                                <div className="rounded-[6px] border border-[rgb(var(--border-subtle)/0.7)] bg-[rgb(var(--surface-app)/0.45)] p-3 space-y-1.5">
                                    <div className="text-xs font-bold text-white">
                                        {RP_PRINCIPLES_DATA.effectiveStimulusRanges.romRules.title[lang]}
                                    </div>
                                    <p className="text-[11px] leading-relaxed text-zinc-300">
                                        {RP_PRINCIPLES_DATA.effectiveStimulusRanges.romRules.summary[lang]}
                                    </p>
                                    <ul className="space-y-1 pt-0.5">
                                        {RP_PRINCIPLES_DATA.effectiveStimulusRanges.romRules.limits.map((lim, idx) => (
                                            <li key={idx} className="text-[11px] leading-snug text-zinc-400">
                                                {lim[lang]}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </section>

                            {/* 25% / 50% / 25% Rep Distribution & Load vs Rep Progression */}
                            <section className="rounded-[8px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4 space-y-3">
                                <div className="flex items-center gap-2">
                                    <Icon name="BarChart3" size={16} className="text-emerald-400" />
                                    <h4 className="text-xs font-black uppercase tracking-wider text-white">
                                        {pickLang(lang, {
                                            es: 'Reparto Óptimo de Repeticiones (25% / 50% / 25%)',
                                            en: 'Balanced Rep-Range Split (25% / 50% / 25%)',
                                        })}
                                    </h4>
                                </div>

                                <div className="space-y-2">
                                    {RP_PRINCIPLES_DATA.effectiveStimulusRanges.repDistribution.map((band) => (
                                        <article
                                            key={band.range}
                                            className={`rounded-[6px] border p-3 space-y-1 ${RATING_TONE_CLASSES[band.tone]}`}
                                        >
                                            <div className="flex items-center justify-between text-xs font-black tabular-nums">
                                                <span>{band.range}</span>
                                                <span>{band.share}</span>
                                            </div>
                                            <p className="text-[11px] leading-relaxed text-zinc-200">{band.profile[lang]}</p>
                                            <p className="text-[10px] leading-snug text-zinc-400">{band.caution[lang]}</p>
                                        </article>
                                    ))}
                                </div>

                                <div className="rounded-[6px] border border-[rgb(var(--border-subtle)/0.7)] bg-[rgb(var(--surface-app)/0.5)] p-3 space-y-1">
                                    <div className="text-xs font-bold text-white">
                                        {RP_PRINCIPLES_DATA.effectiveStimulusRanges.loadVsRepRule.title[lang]}
                                    </div>
                                    <p className="text-[11px] leading-relaxed text-zinc-400">
                                        {RP_PRINCIPLES_DATA.effectiveStimulusRanges.loadVsRepRule.body[lang]}
                                    </p>
                                </div>
                            </section>
                        </>
                    )}

                    {activeTab === 'autoreg' && (
                        <>
                            <section className="space-y-2.5">
                                <h3 className="px-1 text-xs font-black uppercase tracking-wider text-zinc-400">
                                    {pickLang(lang, { es: 'Escala de Valoración Post-Sesión (MAV)', en: 'Post-Session Rating Scale (MAV)' })}
                                </h3>
                                {RP_GUIDE_DATA.ratingScale.map((item) => (
                                    <div
                                        key={item.score}
                                        className="rounded-[8px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-3.5 flex items-start gap-3"
                                    >
                                        <span className={`flex h-9 w-11 shrink-0 items-center justify-center rounded-[6px] border text-sm font-black tabular-nums ${RATING_TONE_CLASSES[item.tone]}`}>
                                            {item.score}
                                        </span>
                                        <div className="min-w-0 flex-1 space-y-1">
                                            <p className="text-xs font-bold text-white">{item.meaning[lang]}</p>
                                            <p className="text-[11px] leading-relaxed text-zinc-400">{item.action[lang]}</p>
                                        </div>
                                    </div>
                                ))}
                            </section>

                            <RpAutoregTools lang={lang} />

                            <section className="space-y-2.5">
                                {RP_GUIDE_DATA.autoregNotes.map((note) => (
                                    <article
                                        key={note.title.en}
                                        className="rounded-[8px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4 space-y-1"
                                    >
                                        <h4 className="text-xs font-black uppercase tracking-wider text-primary-400">
                                            {note.title[lang]}
                                        </h4>
                                        <p className="text-xs leading-relaxed text-[rgb(var(--text-secondary))]">
                                            {note.body[lang]}
                                        </p>
                                    </article>
                                ))}
                            </section>
                        </>
                    )}

                    {activeTab === 'execution' && (
                        <>
                            <section className="rounded-[8px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4 space-y-3">
                                <div className="flex items-center gap-2">
                                    <Icon name="Flame" size={16} className="text-amber-400" />
                                    <h3 className="text-sm font-black text-white">
                                        {pickLang(lang, { es: 'Calentamiento Progresivo (4 pasos)', en: 'Progressive Warm-up Ramp (4 Steps)' })}
                                    </h3>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {RP_GUIDE_DATA.warmupSteps.map((step) => (
                                        <div
                                            key={step.step}
                                            className="rounded-[6px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-app)/0.55)] p-3 space-y-1"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-black uppercase tracking-wider text-primary-400">
                                                    #{step.step} · {step.load[lang]}
                                                </span>
                                                <span className="text-[11px] font-black text-white tabular-nums">{step.reps}</span>
                                            </div>
                                            <p className="text-[11px] leading-snug text-zinc-400">{step.purpose[lang]}</p>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-[11px] leading-relaxed text-zinc-400">
                                    {RP_GUIDE_DATA.warmupNote[lang]}
                                </p>
                            </section>

                            <section className="rounded-[8px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4 space-y-3">
                                <div className="flex items-center gap-2">
                                    <Icon name="Clock" size={16} className="text-primary-400" />
                                    <h3 className="text-sm font-black text-white">
                                        {RP_GUIDE_DATA.restAndSupersets.standard.title[lang]}
                                    </h3>
                                </div>
                                <p className="text-xs leading-relaxed text-[rgb(var(--text-secondary))]">
                                    {RP_GUIDE_DATA.restAndSupersets.standard.body[lang]}
                                </p>
                                <div className="border-t border-[rgb(var(--border-subtle))] pt-3 space-y-1.5">
                                    <h4 className="text-xs font-black text-amber-400">
                                        {RP_GUIDE_DATA.restAndSupersets.metabolite.title[lang]}
                                    </h4>
                                    <p className="text-xs leading-relaxed text-[rgb(var(--text-secondary))]">
                                        {RP_GUIDE_DATA.restAndSupersets.metabolite.body[lang]}
                                    </p>
                                </div>
                            </section>

                            {/* 4-Point Inter-Set Rest Checklist */}
                            <section className="rounded-[8px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4 space-y-2.5">
                                <div className="flex items-center gap-2">
                                    <Icon name="CheckCircle" size={16} className="text-emerald-400" />
                                    <h3 className="text-xs font-black uppercase tracking-wider text-white">
                                        {RP_PRINCIPLES_DATA.executionScience.restChecklistTitle[lang]}
                                    </h3>
                                </div>
                                <p className="text-[11px] leading-relaxed text-zinc-400">
                                    {RP_PRINCIPLES_DATA.executionScience.restChecklistNote[lang]}
                                </p>
                                <ul className="space-y-1.5">
                                    {RP_PRINCIPLES_DATA.executionScience.restChecklist.map((pt, idx) => (
                                        <li key={idx} className="text-xs leading-relaxed text-[rgb(var(--text-secondary))]">
                                            {pt[lang]}
                                        </li>
                                    ))}
                                </ul>
                            </section>

                            <section className="rounded-[8px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4 space-y-2.5">
                                <h3 className="text-xs font-black uppercase tracking-wider text-white">
                                    {RP_GUIDE_DATA.restAndSupersets.exerciseSelectionTitle[lang]}
                                </h3>
                                <ul className="space-y-2">
                                    {RP_GUIDE_DATA.restAndSupersets.exerciseSelectionPoints.map((pt, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-xs leading-relaxed text-[rgb(var(--text-secondary))]">
                                            <Icon name="CheckCircle" size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                                            <span>{pt[lang]}</span>
                                        </li>
                                    ))}
                                </ul>
                            </section>

                            {/* 8 Overload Modalities & Set Counting (Tables 2.1 & 5.1) */}
                            <section className="rounded-[8px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4 space-y-3">
                                <div className="flex items-center gap-2">
                                    <Icon name="Zap" size={16} className="text-primary-400" />
                                    <h3 className="text-xs font-black uppercase tracking-wider text-white">
                                        {RP_PRINCIPLES_DATA.executionScience.overloadModalitiesTitle[lang]}
                                    </h3>
                                </div>

                                <div className="space-y-2.5">
                                    {RP_PRINCIPLES_DATA.executionScience.overloadModalities.map((mod) => (
                                        <article
                                            key={mod.id}
                                            className="rounded-[6px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-app)/0.5)] p-3 space-y-1.5"
                                        >
                                            <div className="flex flex-wrap items-center justify-between gap-1.5">
                                                <h4 className="text-xs font-black text-white">{mod.name[lang]}</h4>
                                                <span className="rounded-[4px] bg-primary-500/15 px-2 py-0.5 text-[10px] font-bold text-primary-300 tabular-nums">
                                                    {mod.setCountRule[lang]}
                                                </span>
                                            </div>
                                            <div className="text-[10px] font-bold text-zinc-400 tabular-nums">
                                                {mod.loadAndRest[lang]}
                                            </div>
                                            <p className="text-[11px] leading-snug text-emerald-200/90">
                                                <strong className="text-emerald-400">
                                                    {pickLang(lang, { es: 'Usar:', en: 'Use:' })}
                                                </strong>{' '}
                                                {mod.whenToUse[lang]}
                                            </p>
                                            <p className="text-[11px] leading-snug text-amber-200/85">
                                                <strong className="text-amber-400">
                                                    {pickLang(lang, { es: 'Evitar:', en: 'Avoid:' })}
                                                </strong>{' '}
                                                {mod.whenToAvoid[lang]}
                                            </p>
                                        </article>
                                    ))}
                                </div>
                            </section>

                            <section className="rounded-[8px] border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-2.5">
                                <div className="flex items-center gap-2 text-emerald-400">
                                    <Icon name="Zap" size={16} />
                                    <h3 className="text-sm font-black uppercase tracking-tight">
                                        {RP_GUIDE_DATA.deload.title[lang]}
                                    </h3>
                                </div>
                                <ul className="space-y-2">
                                    {RP_GUIDE_DATA.deload.rules.map((rule, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-xs leading-relaxed text-[rgb(var(--text-secondary))]">
                                            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                                            <span>{rule[lang]}</span>
                                        </li>
                                    ))}
                                </ul>
                            </section>

                            {/* Complete Fatigue Management Toolbox */}
                            <section className="rounded-[8px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4 space-y-2.5">
                                <div className="flex items-center gap-2">
                                    <Icon name="Shield" size={16} className="text-primary-400" />
                                    <h3 className="text-xs font-black uppercase tracking-wider text-white">
                                        {RP_PRINCIPLES_DATA.executionScience.fatigueToolbox.title[lang]}
                                    </h3>
                                </div>
                                {[
                                    RP_PRINCIPLES_DATA.executionScience.fatigueToolbox.pulsatility,
                                    RP_PRINCIPLES_DATA.executionScience.fatigueToolbox.restDays,
                                    RP_PRINCIPLES_DATA.executionScience.fatigueToolbox.recoverySessions,
                                    RP_PRINCIPLES_DATA.executionScience.fatigueToolbox.deloadProtocolExtra,
                                    RP_PRINCIPLES_DATA.executionScience.fatigueToolbox.activeRest,
                                ].map((block) => (
                                    <div
                                        key={block.title.en}
                                        className="rounded-[6px] border border-[rgb(var(--border-subtle)/0.7)] bg-[rgb(var(--surface-app)/0.5)] p-3 space-y-1"
                                    >
                                        <h4 className="text-xs font-bold text-primary-300">{block.title[lang]}</h4>
                                        <p className="text-[11px] leading-relaxed text-zinc-300">{block.body[lang]}</p>
                                    </div>
                                ))}
                            </section>
                        </>
                    )}

                    {activeTab === 'nutrition' && (
                        <>
                            <section className="space-y-2.5">
                                <h3 className="px-1 text-xs font-black uppercase tracking-wider text-zinc-400">
                                    {pickLang(lang, { es: 'Alineación Calórica por Mesociclo', en: 'Caloric Alignment by Phase' })}
                                </h3>
                                {RP_GUIDE_DATA.nutrition.caloricAlignment.map((item) => (
                                    <article
                                        key={item.goal.en}
                                        className="rounded-[8px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4 space-y-1.5"
                                    >
                                        <h4 className="text-sm font-black text-white">{item.goal[lang]}</h4>
                                        <p className="text-xs leading-relaxed text-[rgb(var(--text-secondary))]">
                                            {item.phasePlan[lang]}
                                        </p>
                                    </article>
                                ))}
                            </section>

                            {/* Volume Landmarks per Diet Phase */}
                            <section className="rounded-[8px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4 space-y-2.5">
                                <div className="flex items-center gap-2">
                                    <Icon name="TrendingUp" size={16} className="text-primary-400" />
                                    <h3 className="text-xs font-black uppercase tracking-wider text-white">
                                        {RP_PRINCIPLES_DATA.dietAndCardioScience.dietPhasesTitle[lang]}
                                    </h3>
                                </div>
                                <div className="space-y-2">
                                    {RP_PRINCIPLES_DATA.dietAndCardioScience.dietPhases.map((dp) => (
                                        <article
                                            key={dp.phase.en}
                                            className={`rounded-[6px] border p-3 space-y-1 ${LANDMARK_TONE_CLASSES[dp.tone]}`}
                                        >
                                            <div className="text-xs font-black">{dp.phase[lang]}</div>
                                            <div className="text-[10px] font-bold uppercase tracking-wider opacity-90">
                                                {dp.landmarksShift[lang]}
                                            </div>
                                            <p className="text-[11px] leading-relaxed text-zinc-200">{dp.strategy[lang]}</p>
                                        </article>
                                    ))}
                                </div>
                            </section>

                            <section className="rounded-[8px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4 space-y-3">
                                <div className="flex items-center gap-2">
                                    <Icon name="Scale" size={16} className="text-primary-400" />
                                    <h3 className="text-xs font-black uppercase tracking-wider text-white">
                                        {RP_GUIDE_DATA.nutrition.dayTiersTitle[lang]}
                                    </h3>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    {RP_GUIDE_DATA.nutrition.dayTiers.map((tier) => (
                                        <div
                                            key={tier.setsRange}
                                            className={`rounded-[6px] border p-3 space-y-1 ${TIER_TONE_CLASSES[tier.tone]}`}
                                        >
                                            <div className="text-xs font-black uppercase">{tier.tier[lang]}</div>
                                            <div className="text-sm font-black tabular-nums">{tier.setsRange}</div>
                                            <p className="text-[11px] leading-snug text-zinc-300">{tier.description[lang]}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section className="rounded-[8px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4 space-y-2.5">
                                <h3 className="text-xs font-black uppercase tracking-wider text-white">
                                    {RP_GUIDE_DATA.nutrition.cardioTitle[lang]}
                                </h3>
                                <ol className="space-y-2">
                                    {RP_GUIDE_DATA.nutrition.cardioPriority.map((item, idx) => (
                                        <li key={idx} className="flex items-start gap-2.5 text-xs leading-relaxed text-[rgb(var(--text-secondary))]">
                                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] bg-primary-500/15 text-[10px] font-black text-primary-400 tabular-nums">
                                                {idx + 1}
                                            </span>
                                            <span>{item[lang]}</span>
                                        </li>
                                    ))}
                                </ol>
                            </section>

                            {/* NEAT & Scientific Cardio Rules */}
                            <section className="rounded-[8px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4 space-y-2.5">
                                <div className="flex items-center gap-2">
                                    <Icon name="Activity" size={16} className="text-emerald-400" />
                                    <h3 className="text-xs font-black uppercase tracking-wider text-white">
                                        {RP_PRINCIPLES_DATA.dietAndCardioScience.neatAndCardioTitle[lang]}
                                    </h3>
                                </div>
                                <ul className="space-y-2">
                                    {RP_PRINCIPLES_DATA.dietAndCardioScience.neatAndCardioRules.map((rule, idx) => (
                                        <li
                                            key={idx}
                                            className="flex items-start gap-2 text-xs leading-relaxed text-[rgb(var(--text-secondary))]"
                                        >
                                            <Icon name="CheckCircle" size={13} className="mt-0.5 shrink-0 text-emerald-400" />
                                            <span>{rule[lang]}</span>
                                        </li>
                                    ))}
                                </ul>
                            </section>

                            <section className="rounded-[8px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4 space-y-2.5">
                                <div className="flex items-center gap-2">
                                    <Icon name="Heart" size={16} className="text-primary-400" />
                                    <h3 className="text-xs font-black uppercase tracking-wider text-white">
                                        {RP_GUIDE_DATA.nutrition.mixedSports.title[lang]}
                                    </h3>
                                </div>
                                <ul className="space-y-2">
                                    {RP_GUIDE_DATA.nutrition.mixedSports.points.map((pt, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-xs leading-relaxed text-[rgb(var(--text-secondary))]">
                                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-500" />
                                            <span>{pt[lang]}</span>
                                        </li>
                                    ))}
                                </ul>

                                <div className="border-t border-[rgb(var(--border-subtle))] pt-3 space-y-2">
                                    <h4 className="text-xs font-black uppercase tracking-wider text-zinc-300">
                                        {RP_PRINCIPLES_DATA.dietAndCardioScience.sportAndStrengthTitle[lang]}
                                    </h4>
                                    {RP_PRINCIPLES_DATA.dietAndCardioScience.sportAndStrengthNotes.map((note, idx) => (
                                        <p key={idx} className="text-[11px] leading-relaxed text-zinc-400">
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
                                <Icon name="Search" size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                                <input
                                    type="search"
                                    inputMode="search"
                                    value={faqSearch}
                                    onChange={(e) => setFaqSearch(e.target.value)}
                                    placeholder={pickLang(lang, { es: 'Buscar pregunta, término o acrónimo...', en: 'Search questions, terms, or acronyms...' })}
                                    aria-label={pickLang(lang, { es: 'Buscar en preguntas frecuentes', en: 'Search FAQ' })}
                                    className="w-full rounded-[6px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] py-2.5 pl-10 pr-4 text-xs font-medium text-white outline-none placeholder-zinc-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                                />
                            </div>

                            {filteredFaqs.length === 0 && filteredGlossary.length === 0 ? (
                                <div className="rounded-[8px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-8 text-center text-xs text-zinc-500">
                                    {pickLang(lang, { es: 'No hay resultados que coincidan con tu búsqueda.', en: 'No matching questions or terms found.' })}
                                </div>
                            ) : (
                                <>
                                    {filteredFaqs.length > 0 && (
                                        <div className="space-y-2.5">
                                            {filteredFaqs.map((faq) => {
                                                const isOpen = !!openFaqIds[faq.id];
                                                return (
                                                    <article
                                                        key={faq.id}
                                                        className="overflow-hidden rounded-[8px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))]"
                                                    >
                                                        <button
                                                            type="button"
                                                            aria-expanded={isOpen}
                                                            onClick={() => toggleFaq(faq.id)}
                                                            className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[rgb(var(--surface-elevated)/0.6)]"
                                                        >
                                                            <div className="min-w-0 flex-1 space-y-1">
                                                                <span className="inline-block rounded-[3px] bg-[rgb(var(--surface-elevated))] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-primary-400">
                                                                    {faq.category[lang]}
                                                                </span>
                                                                <h4 className="text-xs font-bold leading-snug text-white">
                                                                    {faq.question[lang]}
                                                                </h4>
                                                            </div>
                                                            <Icon
                                                                name={isOpen ? 'ChevronUp' : 'ChevronDown'}
                                                                size={16}
                                                                className="shrink-0 text-zinc-400"
                                                            />
                                                        </button>
                                                        {isOpen && (
                                                            <div className="border-t border-[rgb(var(--border-subtle))] px-4 py-3 text-xs leading-relaxed text-[rgb(var(--text-secondary))]">
                                                                {faq.answer[lang]}
                                                            </div>
                                                        )}
                                                    </article>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {filteredGlossary.length > 0 && (
                                        <section className="space-y-2.5 pt-2">
                                            <div className="flex items-center gap-2 px-1">
                                                <Icon name="Info" size={14} className="text-primary-400" />
                                                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">
                                                    {pickLang(lang, { es: 'Glosario Científico RP', en: 'RP Scientific Glossary' })}
                                                </h3>
                                            </div>
                                            <div className="grid grid-cols-1 gap-2">
                                                {filteredGlossary.map((entry) => (
                                                    <article
                                                        key={entry.id}
                                                        data-testid={`rp-glossary-${entry.id}`}
                                                        className="rounded-[8px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-3.5 space-y-1"
                                                    >
                                                        <div className="flex items-center justify-between gap-2">
                                                            <h4 className="text-xs font-black text-white">{entry.term[lang]}</h4>
                                                            <span className="shrink-0 rounded-[3px] bg-[rgb(var(--surface-elevated))] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-zinc-400">
                                                                {entry.category[lang]}
                                                            </span>
                                                        </div>
                                                        <p className="text-[11px] leading-relaxed text-zinc-300">
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
