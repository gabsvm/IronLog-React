import React, { useState } from 'react';
import { Icon } from '../../../components/ui/Icon';
import { RP_PRINCIPLES_DATA, type RpTrainingAgeId } from '../../../data/rpPrinciplesData';
import { pickLang } from '../../../utils/i18n';

interface RpPrinciplesTabProps {
    lang: 'en' | 'es';
}

export const RpPrinciplesTab: React.FC<RpPrinciplesTabProps> = ({ lang }) => {
    const [openIds, setOpenIds] = useState<Record<string, boolean>>({ specificity: true });
    const [selectedAge, setSelectedAge] = useState<RpTrainingAgeId>('intermediate');

    const allExpanded = RP_PRINCIPLES_DATA.sevenPrinciples.every((p) => Boolean(openIds[p.id]));

    const togglePrinciple = (id: string) => {
        setOpenIds((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const toggleAll = () => {
        if (allExpanded) {
            setOpenIds({ specificity: true });
            return;
        }
        const next: Record<string, boolean> = {};
        for (const p of RP_PRINCIPLES_DATA.sevenPrinciples) {
            next[p.id] = true;
        }
        setOpenIds(next);
    };

    const currentAge =
        RP_PRINCIPLES_DATA.trainingAges.find((a) => a.id === selectedAge) || RP_PRINCIPLES_DATA.trainingAges[1];

    return (
        <>
            {/* 7 Scientific Principles Hierarchy */}
            <section className="space-y-2.5">
                <div className="flex items-center justify-between gap-2 px-1">
                    <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">
                        {pickLang(lang, {
                            es: 'Los 7 Principios Científicos (en orden de impacto)',
                            en: 'The 7 Scientific Principles (Ordered by Impact)',
                        })}
                    </h3>
                    <button
                        type="button"
                        onClick={toggleAll}
                        className="rounded-[4px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-300 hover:text-white transition-colors"
                    >
                        {allExpanded
                            ? pickLang(lang, { es: 'Contraer', en: 'Collapse' })
                            : pickLang(lang, { es: 'Ver todos', en: 'Expand all' })}
                    </button>
                </div>

                {RP_PRINCIPLES_DATA.sevenPrinciples.map((principle) => {
                    const isOpen = Boolean(openIds[principle.id]);
                    return (
                        <article
                            key={principle.id}
                            className="overflow-hidden rounded-[8px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))]"
                        >
                            <button
                                type="button"
                                aria-expanded={isOpen}
                                data-testid={`rp-principle-${principle.id}`}
                                onClick={() => togglePrinciple(principle.id)}
                                className="flex w-full items-start justify-between gap-3 p-4 text-left transition-colors hover:bg-[rgb(var(--surface-elevated)/0.6)]"
                            >
                                <div className="flex min-w-0 flex-1 items-start gap-3">
                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] border border-primary-500/30 bg-primary-500/15 text-primary-400">
                                        <Icon name={principle.icon} size={16} />
                                    </span>
                                    <div className="min-w-0 flex-1 space-y-0.5">
                                        <h4 className="text-sm font-black text-white leading-tight">
                                            {principle.name[lang]}
                                        </h4>
                                        <p className="text-[11px] leading-snug text-zinc-400">
                                            {principle.tagline[lang]}
                                        </p>
                                    </div>
                                </div>
                                <Icon
                                    name={isOpen ? 'ChevronUp' : 'ChevronDown'}
                                    size={16}
                                    className="mt-1 shrink-0 text-zinc-400"
                                />
                            </button>

                            {isOpen && (
                                <div className="border-t border-[rgb(var(--border-subtle))] px-4 py-3.5 space-y-3 bg-[rgb(var(--surface-app)/0.35)]">
                                    <p className="text-xs leading-relaxed text-[rgb(var(--text-secondary))]">
                                        {principle.summary[lang]}
                                    </p>

                                    <ul className="space-y-1.5">
                                        {principle.keyRules.map((rule, idx) => (
                                            <li
                                                key={idx}
                                                className="flex items-start gap-2 text-[11px] leading-relaxed text-zinc-300"
                                            >
                                                <Icon
                                                    name="CheckCircle"
                                                    size={13}
                                                    className="mt-0.5 shrink-0 text-emerald-400"
                                                />
                                                <span>{rule[lang]}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    {principle.pitfalls.map((pitfall, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-start gap-2 rounded-[6px] border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-[11px] leading-relaxed text-amber-200"
                                        >
                                            <Icon
                                                name="AlertTriangle"
                                                size={13}
                                                className="mt-0.5 shrink-0 text-amber-400"
                                            />
                                            <div>
                                                <strong className="uppercase tracking-wider text-amber-400">
                                                    {pickLang(lang, { es: 'Errores comunes:', en: 'Pitfalls:' })}
                                                </strong>{' '}
                                                {pitfall[lang]}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </article>
                    );
                })}
            </section>

            {/* Interactive Training Age Individualization Switcher */}
            <section className="rounded-[8px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4 space-y-3">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Icon name="BarChart3" size={16} className="text-primary-400" />
                        <h3 className="text-sm font-black text-white">
                            {pickLang(lang, {
                                es: 'Individualización por Nivel de Experiencia',
                                en: 'Training Age Individualization',
                            })}
                        </h3>
                    </div>
                    <p className="text-[11px] text-zinc-400">
                        {pickLang(lang, {
                            es: 'Seleccioná tu nivel actual para ver cómo cambian volumen, RIR, frecuencia y variación.',
                            en: 'Switch training age to see how volume, RIR floors, frequency, and variation evolve.',
                        })}
                    </p>
                </div>

                <div className="grid grid-cols-3 gap-1.5" role="group" aria-label={pickLang(lang, { es: 'Nivel de experiencia', en: 'Training age selector' })}>
                    {RP_PRINCIPLES_DATA.trainingAges.map((age) => {
                        const active = age.id === selectedAge;
                        return (
                            <button
                                key={age.id}
                                type="button"
                                aria-pressed={active}
                                data-testid={`rp-age-${age.id}`}
                                onClick={() => setSelectedAge(age.id)}
                                className={`rounded-[6px] px-2.5 py-2 text-[11px] font-black uppercase tracking-wider transition-colors ${
                                    active
                                        ? 'bg-primary-500 text-zinc-950 shadow-sm'
                                        : 'border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-app)/0.55)] text-zinc-400 hover:text-white'
                                }`}
                            >
                                {age.label[lang]}
                            </button>
                        );
                    })}
                </div>

                <div className="space-y-2 rounded-[6px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-app)/0.55)] p-3.5 text-xs">
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-primary-400">
                            {pickLang(lang, { es: 'Foco Principal', en: 'Primary Focus' })}
                        </span>
                        <p className="mt-0.5 leading-relaxed text-zinc-200">{currentAge.careerFocus[lang]}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        <div className="rounded-[4px] border border-[rgb(var(--border-subtle)/0.7)] bg-[rgb(var(--surface-raised))] p-2.5">
                            <div className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                                {pickLang(lang, { es: 'Rangos de Reps', en: 'Rep Ranges' })}
                            </div>
                            <p className="mt-0.5 text-[11px] leading-snug text-zinc-300">{currentAge.repRanges[lang]}</p>
                        </div>
                        <div className="rounded-[4px] border border-[rgb(var(--border-subtle)/0.7)] bg-[rgb(var(--surface-raised))] p-2.5">
                            <div className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                                {pickLang(lang, { es: 'Límite RIR', en: 'RIR Floor' })}
                            </div>
                            <p className="mt-0.5 text-[11px] leading-snug text-zinc-300">{currentAge.rirFloor[lang]}</p>
                        </div>
                        <div className="rounded-[4px] border border-[rgb(var(--border-subtle)/0.7)] bg-[rgb(var(--surface-raised))] p-2.5">
                            <div className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                                {pickLang(lang, { es: 'Frecuencia SRA', en: 'SRA Frequency' })}
                            </div>
                            <p className="mt-0.5 text-[11px] leading-snug text-zinc-300">{currentAge.frequency[lang]}</p>
                        </div>
                        <div className="rounded-[4px] border border-[rgb(var(--border-subtle)/0.7)] bg-[rgb(var(--surface-raised))] p-2.5">
                            <div className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                                {pickLang(lang, { es: 'Volumen y Bloques', en: 'Volume & Blocks' })}
                            </div>
                            <p className="mt-0.5 text-[11px] leading-snug text-zinc-300">
                                {currentAge.volumeAndMesos[lang]}
                            </p>
                        </div>
                    </div>

                    <div className="pt-1 text-[11px] leading-relaxed text-zinc-300">
                        <strong className="text-white">
                            {pickLang(lang, { es: 'Variación y Priorización:', en: 'Variation & Priority:' })}
                        </strong>{' '}
                        {currentAge.variationAndSpec[lang]}
                    </div>

                    <div className="rounded-[6px] border border-primary-500/25 bg-primary-500/10 px-3 py-2 text-[11px] leading-relaxed text-primary-200">
                        {currentAge.specialRule[lang]}
                    </div>
                </div>
            </section>

            {/* SRA Frequency-Deriving Algorithm */}
            <section className="rounded-[8px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4 space-y-2.5">
                <div className="flex items-center gap-2">
                    <Icon name="Repeat" size={16} className="text-primary-400" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-white">
                        {RP_PRINCIPLES_DATA.sraFrequencyAlgorithm.title[lang]}
                    </h3>
                </div>
                <ol className="space-y-2">
                    {RP_PRINCIPLES_DATA.sraFrequencyAlgorithm.steps.map((step, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs leading-relaxed text-[rgb(var(--text-secondary))]">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] bg-primary-500/15 text-[10px] font-black text-primary-400 tabular-nums">
                                {idx + 1}
                            </span>
                            <span>{step[lang]}</span>
                        </li>
                    ))}
                </ol>
            </section>

            {/* 3-Question Exercise Swap Audit */}
            <section className="rounded-[8px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4 space-y-2.5">
                <div className="flex items-center gap-2">
                    <Icon name="Shuffle" size={16} className="text-amber-400" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-white">
                        {RP_PRINCIPLES_DATA.exerciseSwapAudit.title[lang]}
                    </h3>
                </div>
                <ul className="space-y-2">
                    {RP_PRINCIPLES_DATA.exerciseSwapAudit.questions.map((q, idx) => (
                        <li key={idx} className="text-xs leading-relaxed text-[rgb(var(--text-secondary))]">
                            {q[lang]}
                        </li>
                    ))}
                </ul>
                <div className="rounded-[6px] border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-[11px] leading-relaxed text-emerald-200">
                    {RP_PRINCIPLES_DATA.exerciseSwapAudit.verdict[lang]}
                </div>
            </section>
        </>
    );
};
