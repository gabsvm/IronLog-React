import React, { useState } from 'react';
import { Icon } from '../../../components/ui/Icon';
import { RP_PRINCIPLES_DATA, type RpTrainingAgeId } from '../../../data/rpPrinciplesData';
import { pickLang } from '../../../utils/i18n';

interface RpPrinciplesTabProps {
    lang: 'en' | 'es';
}

function renderLeadInText(text: string): React.ReactNode {
    const colonIdx = text.indexOf(':');
    if (colonIdx > 0 && colonIdx <= 48) {
        const prefix = text.slice(0, colonIdx + 1);
        const rest = text.slice(colonIdx + 1);
        return (
            <>
                <strong className="font-bold text-[rgb(var(--text-primary))]">{prefix}</strong>
                {rest}
            </>
        );
    }
    return text;
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
            <section className="space-y-3">
                <div className="flex items-center justify-between gap-2 px-1">
                    <div className="flex items-center gap-2 min-w-0">
                        <h3 className="text-xs font-extrabold uppercase tracking-wider text-[rgb(var(--text-secondary))] whitespace-nowrap">
                            {pickLang(lang, {
                                es: '7 Principios',
                                en: '7 Principles',
                            })}
                        </h3>
                        <span className="shrink-0 rounded-[4px] bg-primary-500/15 px-2 py-0.5 text-xs font-bold text-primary-300 tabular-nums">
                            1 → 7
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={toggleAll}
                        className="inline-flex min-h-[36px] shrink-0 items-center whitespace-nowrap rounded-[6px] border border-[rgb(var(--border-strong))] bg-[rgb(var(--surface-raised))] px-3 py-1.5 text-xs font-bold text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--surface-elevated))] transition-colors"
                    >
                        {allExpanded
                            ? pickLang(lang, { es: 'Contraer', en: 'Collapse' })
                            : pickLang(lang, { es: 'Expandir todos', en: 'Expand all' })}
                    </button>
                </div>

                {RP_PRINCIPLES_DATA.sevenPrinciples.map((principle) => {
                    const isOpen = Boolean(openIds[principle.id]);
                    const rankStr = String(principle.rank).padStart(2, '0');
                    return (
                        <article
                            key={principle.id}
                            className="overflow-hidden rounded-[10px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))]"
                        >
                            <button
                                type="button"
                                aria-expanded={isOpen}
                                data-testid={`rp-principle-${principle.id}`}
                                onClick={() => togglePrinciple(principle.id)}
                                className="flex w-full items-start justify-between gap-3 p-4 text-left transition-colors hover:bg-[rgb(var(--surface-elevated)/0.45)]"
                            >
                                <div className="flex min-w-0 flex-1 items-start gap-3">
                                    <span className="pt-0.5 shrink-0 font-mono text-sm font-extrabold text-primary-400 tabular-nums">
                                        {rankStr}
                                    </span>
                                    <div className="min-w-0 flex-1 space-y-1">
                                        <h4 className="text-base font-extrabold leading-snug text-[rgb(var(--text-primary))] text-balance">
                                            {principle.name[lang]}
                                        </h4>
                                        <p className="text-sm leading-relaxed text-[rgb(var(--text-secondary))]">
                                            {principle.tagline[lang]}
                                        </p>
                                    </div>
                                </div>
                                <Icon
                                    name={isOpen ? 'ChevronUp' : 'ChevronDown'}
                                    size={18}
                                    className="mt-1 shrink-0 text-[rgb(var(--text-secondary))]"
                                />
                            </button>

                            {isOpen && (
                                <div className="border-t border-[rgb(var(--border-subtle)/0.75)] p-4 space-y-4">
                                    <p className="text-[15px] leading-[1.62] text-pretty text-[rgb(var(--text-primary)/0.92)]">
                                        {principle.summary[lang]}
                                    </p>

                                    <ul className="space-y-3">
                                        {principle.keyRules.map((rule, idx) => (
                                            <li
                                                key={idx}
                                                className="flex items-start gap-2.5 text-sm leading-[1.55] text-[rgb(var(--text-secondary))]"
                                            >
                                                <Icon
                                                    name="CheckCircle"
                                                    size={16}
                                                    className="mt-1 shrink-0 text-emerald-400"
                                                />
                                                <span>{renderLeadInText(rule[lang])}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    {principle.pitfalls.map((pitfall, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-start gap-2.5 rounded-r-[6px] border-l border-amber-400/70 bg-amber-500/[0.09] px-3.5 py-3 text-sm leading-[1.55] text-[rgb(var(--text-primary)/0.92)]"
                                        >
                                            <Icon
                                                name="AlertTriangle"
                                                size={16}
                                                className="mt-0.5 shrink-0 text-amber-400"
                                            />
                                            <div>
                                                <strong className="font-bold text-amber-300">
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
            <section className="rounded-[10px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4 space-y-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Icon name="BarChart3" size={18} className="text-primary-400 shrink-0" />
                        <h3 className="text-base font-extrabold text-[rgb(var(--text-primary))] text-balance">
                            {pickLang(lang, {
                                es: 'Individualización por Nivel de Experiencia',
                                en: 'Training Age Individualization',
                            })}
                        </h3>
                    </div>
                    <p className="text-sm leading-relaxed text-[rgb(var(--text-secondary))]">
                        {pickLang(lang, {
                            es: 'Seleccioná tu nivel actual para ver cómo cambian volumen, RIR, frecuencia y variación.',
                            en: 'Switch training age to see how volume, RIR floors, frequency, and variation evolve.',
                        })}
                    </p>
                </div>

                <div
                    className="grid grid-cols-3 gap-2"
                    role="group"
                    aria-label={pickLang(lang, { es: 'Nivel de experiencia', en: 'Training age selector' })}
                >
                    {RP_PRINCIPLES_DATA.trainingAges.map((age) => {
                        const active = age.id === selectedAge;
                        return (
                            <button
                                key={age.id}
                                type="button"
                                aria-pressed={active}
                                data-testid={`rp-age-${age.id}`}
                                onClick={() => setSelectedAge(age.id)}
                                className={`min-h-[40px] rounded-[6px] px-3 py-2 text-xs font-extrabold uppercase tracking-wider transition-colors ${
                                    active
                                        ? 'bg-primary-500 text-zinc-950 shadow-sm'
                                        : 'border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-elevated)/0.65)] text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]'
                                }`}
                            >
                                {age.label[lang]}
                            </button>
                        );
                    })}
                </div>

                <div className="border-t border-[rgb(var(--border-subtle)/0.75)] pt-4 space-y-4">
                    <div className="space-y-1">
                        <div className="text-xs font-extrabold uppercase tracking-wider text-primary-400">
                            {pickLang(lang, { es: 'Foco Principal', en: 'Primary Focus' })}
                        </div>
                        <p className="text-[15px] leading-[1.6] text-[rgb(var(--text-primary)/0.92)]">
                            {currentAge.careerFocus[lang]}
                        </p>
                    </div>

                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-[rgb(var(--border-subtle)/0.55)] pt-3.5">
                        <div className="space-y-1">
                            <dt className="text-xs font-extrabold uppercase tracking-wider text-[rgb(var(--text-muted))]">
                                {pickLang(lang, { es: 'Rangos de Reps', en: 'Rep Ranges' })}
                            </dt>
                            <dd className="text-sm leading-[1.55] text-[rgb(var(--text-secondary))]">
                                {currentAge.repRanges[lang]}
                            </dd>
                        </div>
                        <div className="space-y-1">
                            <dt className="text-xs font-extrabold uppercase tracking-wider text-[rgb(var(--text-muted))]">
                                {pickLang(lang, { es: 'Límite RIR', en: 'RIR Floor' })}
                            </dt>
                            <dd className="text-sm leading-[1.55] text-[rgb(var(--text-secondary))]">
                                {currentAge.rirFloor[lang]}
                            </dd>
                        </div>
                        <div className="space-y-1">
                            <dt className="text-xs font-extrabold uppercase tracking-wider text-[rgb(var(--text-muted))]">
                                {pickLang(lang, { es: 'Frecuencia SRA', en: 'SRA Frequency' })}
                            </dt>
                            <dd className="text-sm leading-[1.55] text-[rgb(var(--text-secondary))]">
                                {currentAge.frequency[lang]}
                            </dd>
                        </div>
                        <div className="space-y-1">
                            <dt className="text-xs font-extrabold uppercase tracking-wider text-[rgb(var(--text-muted))]">
                                {pickLang(lang, { es: 'Volumen y Bloques', en: 'Volume & Blocks' })}
                            </dt>
                            <dd className="text-sm leading-[1.55] text-[rgb(var(--text-secondary))]">
                                {currentAge.volumeAndMesos[lang]}
                            </dd>
                        </div>
                    </dl>

                    <div className="border-t border-[rgb(var(--border-subtle)/0.55)] pt-3.5 text-sm leading-[1.55] text-[rgb(var(--text-secondary))]">
                        <strong className="font-bold text-[rgb(var(--text-primary))]">
                            {pickLang(lang, { es: 'Variación y Priorización:', en: 'Variation & Priority:' })}
                        </strong>{' '}
                        {currentAge.variationAndSpec[lang]}
                    </div>

                    <div className="rounded-r-[6px] border-l border-primary-400/70 bg-primary-500/[0.09] px-3.5 py-3 text-sm leading-[1.55] text-[rgb(var(--text-primary)/0.92)]">
                        {currentAge.specialRule[lang]}
                    </div>
                </div>
            </section>

            {/* SRA Frequency-Deriving Algorithm */}
            <section className="rounded-[10px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4 space-y-3.5">
                <div className="flex items-center gap-2">
                    <Icon name="Repeat" size={18} className="text-primary-400 shrink-0" />
                    <h3 className="text-base font-extrabold text-[rgb(var(--text-primary))] text-balance">
                        {RP_PRINCIPLES_DATA.sraFrequencyAlgorithm.title[lang]}
                    </h3>
                </div>
                <ol className="space-y-3">
                    {RP_PRINCIPLES_DATA.sraFrequencyAlgorithm.steps.map((step, idx) => (
                        <li
                            key={idx}
                            className="flex items-start gap-3 text-sm leading-[1.55] text-[rgb(var(--text-secondary))]"
                        >
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[5px] bg-primary-500/15 text-xs font-black text-primary-300 tabular-nums mt-0.5">
                                {idx + 1}
                            </span>
                            <span>{step[lang]}</span>
                        </li>
                    ))}
                </ol>
            </section>

            {/* 3-Question Exercise Swap Audit */}
            <section className="rounded-[10px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4 space-y-3.5">
                <div className="flex items-center gap-2">
                    <Icon name="Shuffle" size={18} className="text-amber-400 shrink-0" />
                    <h3 className="text-base font-extrabold text-[rgb(var(--text-primary))] text-balance">
                        {RP_PRINCIPLES_DATA.exerciseSwapAudit.title[lang]}
                    </h3>
                </div>
                <ul className="space-y-3">
                    {RP_PRINCIPLES_DATA.exerciseSwapAudit.questions.map((q, idx) => (
                        <li
                            key={idx}
                            className="text-sm leading-[1.55] text-[rgb(var(--text-secondary))]"
                        >
                            {q[lang]}
                        </li>
                    ))}
                </ul>
                <div className="rounded-r-[6px] border-l border-emerald-400/70 bg-emerald-500/[0.09] px-3.5 py-3 text-sm leading-[1.55] text-[rgb(var(--text-primary)/0.92)]">
                    {RP_PRINCIPLES_DATA.exerciseSwapAudit.verdict[lang]}
                </div>
            </section>
        </>
    );
};
