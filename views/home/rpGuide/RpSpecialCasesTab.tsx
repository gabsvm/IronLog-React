import React, { useState } from 'react';
import { Icon } from '../../../components/ui/Icon';
import { RP_PRINCIPLES_DATA } from '../../../data/rpPrinciplesData';
import { pickLang } from '../../../utils/i18n';

interface RpSpecialCasesTabProps {
    lang: 'en' | 'es';
}

type SpecialSectionFilter = 'all' | 'troubleshooting' | 'specialization' | 'time' | 'injury';

const FILTER_OPTIONS: { id: SpecialSectionFilter; label: { es: string; en: string } }[] = [
    { id: 'all', label: { es: 'Todo', en: 'All' } },
    { id: 'troubleshooting', label: { es: 'Estancamiento', en: 'Stalls' } },
    { id: 'specialization', label: { es: 'Especializ.', en: 'Specialize' } },
    { id: 'time', label: { es: 'Poco Tiempo', en: 'Low Time' } },
    { id: 'injury', label: { es: 'Lesiones', en: 'Injury' } },
];

export const RpSpecialCasesTab: React.FC<RpSpecialCasesTabProps> = ({ lang }) => {
    const [filter, setFilter] = useState<SpecialSectionFilter>('all');
    const sc = RP_PRINCIPLES_DATA.specialCases;

    const showTroubleshooting = filter === 'all' || filter === 'troubleshooting';
    const showSpecialization = filter === 'all' || filter === 'specialization';
    const showTime = filter === 'all' || filter === 'time';
    const showInjury = filter === 'all' || filter === 'injury';

    return (
        <>
            {/* Sub-filter Pills */}
            <div
                className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar"
                role="group"
                aria-label={pickLang(lang, { es: 'Filtrar casos especiales', en: 'Filter special cases' })}
            >
                {FILTER_OPTIONS.map((opt) => {
                    const active = filter === opt.id;
                    return (
                        <button
                            key={opt.id}
                            type="button"
                            aria-pressed={active}
                            data-testid={`rp-special-filter-${opt.id}`}
                            onClick={() => setFilter(opt.id)}
                            className={`shrink-0 rounded-[4px] px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider transition-colors ${
                                active
                                    ? 'bg-primary-500 text-zinc-950'
                                    : 'border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] text-zinc-400 hover:text-white'
                            }`}
                        >
                            {opt.label[lang]}
                        </button>
                    );
                })}
            </div>

            {showTroubleshooting && (
                <>
                    <section className="rounded-[8px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4 space-y-2.5">
                        <div className="flex items-center gap-2">
                            <Icon name="Search" size={16} className="text-primary-400" />
                            <h3 className="text-sm font-black text-white">{sc.troubleshootingTitle[lang]}</h3>
                        </div>
                        <ul className="space-y-2">
                            {sc.troubleshooting.map((item, idx) => (
                                <li
                                    key={idx}
                                    className="text-xs leading-relaxed text-[rgb(var(--text-secondary))]"
                                >
                                    {item[lang]}
                                </li>
                            ))}
                        </ul>
                    </section>

                    <section className="rounded-[8px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4 space-y-2.5">
                        <div className="flex items-center gap-2">
                            <Icon name="BarChart2" size={16} className="text-emerald-400" />
                            <h3 className="text-xs font-black uppercase tracking-wider text-white">
                                {sc.measuringProgressTitle[lang]}
                            </h3>
                        </div>
                        <ul className="space-y-2">
                            {sc.measuringProgressPoints.map((pt, idx) => (
                                <li
                                    key={idx}
                                    className="flex items-start gap-2 text-xs leading-relaxed text-[rgb(var(--text-secondary))]"
                                >
                                    <Icon name="CheckCircle" size={13} className="mt-0.5 shrink-0 text-emerald-400" />
                                    <span>{pt[lang]}</span>
                                </li>
                            ))}
                        </ul>
                    </section>
                </>
            )}

            {showSpecialization && (
                <section className="rounded-[8px] border border-primary-500/25 bg-primary-500/10 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-primary-300">
                        <Icon name="Star" size={16} />
                        <h3 className="text-xs font-black uppercase tracking-wider">{sc.specializationTitle[lang]}</h3>
                    </div>
                    <p className="text-xs leading-relaxed text-[rgb(var(--text-secondary))]">
                        {sc.specializationBody[lang]}
                    </p>
                </section>
            )}

            {showTime && (
                <section className="rounded-[8px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4 space-y-2.5">
                    <div className="flex items-center gap-2">
                        <Icon name="Clock" size={16} className="text-amber-400" />
                        <h3 className="text-sm font-black text-white">{sc.timeCrunchedTitle[lang]}</h3>
                    </div>
                    <ul className="space-y-2">
                        {sc.timeCrunched.map((tip, idx) => (
                            <li key={idx} className="text-xs leading-relaxed text-[rgb(var(--text-secondary))]">
                                {tip[lang]}
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {showInjury && (
                <>
                    <section className="rounded-[8px] border border-amber-500/30 bg-amber-500/10 p-4 space-y-2.5">
                        <div className="flex items-center gap-2 text-amber-400">
                            <Icon name="Shield" size={16} />
                            <h3 className="text-sm font-black">{sc.lowInjuryRiskTitle[lang]}</h3>
                        </div>
                        <p className="text-[11px] leading-relaxed text-zinc-300">{sc.lowInjuryRiskIntro[lang]}</p>
                        <ul className="space-y-1.5">
                            {sc.lowInjuryRisk.map((rule, idx) => (
                                <li key={idx} className="text-xs leading-relaxed text-[rgb(var(--text-secondary))]">
                                    {rule[lang]}
                                </li>
                            ))}
                        </ul>
                    </section>

                    <section className="rounded-[8px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4 space-y-3">
                        <div className="flex items-center gap-2">
                            <Icon name="RotateCcw" size={16} className="text-emerald-400" />
                            <h3 className="text-sm font-black text-white">{sc.postInjuryTitle[lang]}</h3>
                        </div>

                        <div className="rounded-[6px] border border-red-500/30 bg-red-500/10 px-3 py-2 flex items-start gap-2 text-[11px] leading-relaxed text-red-200">
                            <Icon name="AlertTriangle" size={14} className="mt-0.5 shrink-0 text-red-400" />
                            <span>{sc.postInjuryDisclaimer[lang]}</span>
                        </div>

                        <div className="space-y-2">
                            {sc.postInjuryPhases.map((step) => (
                                <article
                                    key={step.phase}
                                    className="rounded-[6px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-app)/0.55)] p-3 flex items-start gap-2.5"
                                >
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[4px] bg-emerald-500/15 text-[11px] font-black text-emerald-400 tabular-nums">
                                        {step.phase}
                                    </span>
                                    <div className="space-y-0.5">
                                        <h4 className="text-xs font-black text-white">{step.title[lang]}</h4>
                                        <p className="text-[11px] leading-relaxed text-zinc-300">{step.body[lang]}</p>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>
                </>
            )}
        </>
    );
};
