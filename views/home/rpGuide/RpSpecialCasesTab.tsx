import React, { useState } from 'react';
import { Icon } from '../../../components/ui/Icon';
import { RP_PRINCIPLES_DATA } from '../../../data/rpPrinciplesData';
import { pickLang } from '../../../utils/i18n';

interface RpSpecialCasesTabProps {
    lang: 'en' | 'es';
}

type SpecialSectionFilter = 'all' | 'troubleshooting' | 'specialization' | 'time' | 'injury' | 'members';

const FILTER_OPTIONS: { id: SpecialSectionFilter; label: { es: string; en: string } }[] = [
    { id: 'all', label: { es: 'Todo', en: 'All' } },
    { id: 'troubleshooting', label: { es: 'Estancamiento', en: 'Stalls' } },
    { id: 'specialization', label: { es: 'Especializ.', en: 'Specialize' } },
    { id: 'time', label: { es: 'Poco Tiempo', en: 'Low Time' } },
    { id: 'injury', label: { es: 'Lesiones', en: 'Injury' } },
    { id: 'members', label: { es: 'Pro RP', en: 'Members RP' } },
];

export const RpSpecialCasesTab: React.FC<RpSpecialCasesTabProps> = ({ lang }) => {
    const [filter, setFilter] = useState<SpecialSectionFilter>('all');
    const sc = RP_PRINCIPLES_DATA.specialCases;

    const showTroubleshooting = filter === 'all' || filter === 'troubleshooting';
    const showSpecialization = filter === 'all' || filter === 'specialization';
    const showTime = filter === 'all' || filter === 'time';
    const showInjury = filter === 'all' || filter === 'injury';
    const showMembers = filter === 'all' || filter === 'members';

    return (
        <>
            {/* Sub-filter Pills with right-edge scroll fade */}
            <div className="relative">
                <div
                    className="flex items-center gap-2 overflow-x-auto pb-1 pr-8 no-scrollbar"
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
                                onClick={(e) => {
                                    setFilter(opt.id);
                                    e.currentTarget.scrollIntoView?.({
                                        behavior: 'smooth',
                                        inline: 'center',
                                        block: 'nearest',
                                    });
                                }}
                                className={`min-h-[40px] shrink-0 rounded-[6px] px-3.5 py-2 text-xs font-extrabold uppercase tracking-wider transition-colors ${
                                    active
                                        ? 'bg-primary-500 text-zinc-950'
                                        : 'border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]'
                                }`}
                            >
                                {opt.label[lang]}
                            </button>
                        );
                    })}
                </div>
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[rgb(var(--surface-app))] to-transparent"
                />
            </div>

            {showTroubleshooting && (
                <>
                    <section className="rounded-[10px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4 space-y-3.5">
                        <div className="flex items-center gap-2">
                            <Icon name="Search" size={18} className="text-primary-400 shrink-0" />
                            <h3 className="text-base font-extrabold text-[rgb(var(--text-primary))] text-balance">
                                {sc.troubleshootingTitle[lang]}
                            </h3>
                        </div>
                        <ul className="space-y-3">
                            {sc.troubleshooting.map((item, idx) => (
                                <li
                                    key={idx}
                                    className="text-sm leading-[1.58] text-[rgb(var(--text-primary)/0.88)]"
                                >
                                    {item[lang]}
                                </li>
                            ))}
                        </ul>
                    </section>

                    <section className="rounded-[10px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4 space-y-3.5">
                        <div className="flex items-center gap-2">
                            <Icon name="BarChart2" size={18} className="text-emerald-400 shrink-0" />
                            <h3 className="text-base font-extrabold text-[rgb(var(--text-primary))] text-balance">
                                {sc.measuringProgressTitle[lang]}
                            </h3>
                        </div>
                        <ul className="space-y-3">
                            {sc.measuringProgressPoints.map((pt, idx) => (
                                <li
                                    key={idx}
                                    className="flex items-start gap-2.5 text-sm leading-[1.58] text-[rgb(var(--text-secondary))]"
                                >
                                    <Icon name="CheckCircle" size={16} className="mt-1 shrink-0 text-emerald-400" />
                                    <span>{pt[lang]}</span>
                                </li>
                            ))}
                        </ul>
                    </section>
                </>
            )}

            {showSpecialization && (
                <section className="rounded-r-[8px] border-l border-primary-400/75 bg-primary-500/[0.09] p-4 space-y-2">
                    <div className="flex items-center gap-2 text-primary-300">
                        <Icon name="Star" size={18} className="shrink-0" />
                        <h3 className="text-base font-extrabold text-[rgb(var(--text-primary))] text-balance">
                            {sc.specializationTitle[lang]}
                        </h3>
                    </div>
                    <p className="text-[15px] leading-[1.62] text-pretty text-[rgb(var(--text-primary)/0.92)]">
                        {sc.specializationBody[lang]}
                    </p>
                </section>
            )}

            {showTime && (
                <section className="rounded-[10px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4 space-y-3.5">
                    <div className="flex items-center gap-2">
                        <Icon name="Clock" size={18} className="text-amber-400 shrink-0" />
                        <h3 className="text-base font-extrabold text-[rgb(var(--text-primary))] text-balance">
                            {sc.timeCrunchedTitle[lang]}
                        </h3>
                    </div>
                    <ul className="space-y-3">
                        {sc.timeCrunched.map((tip, idx) => (
                            <li
                                key={idx}
                                className="text-sm leading-[1.58] text-[rgb(var(--text-primary)/0.88)]"
                            >
                                {tip[lang]}
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {showInjury && (
                <>
                    <section className="rounded-[10px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4 space-y-3.5">
                        <div className="flex items-center gap-2 text-amber-400">
                            <Icon name="Shield" size={18} className="shrink-0" />
                            <h3 className="text-base font-extrabold text-[rgb(var(--text-primary))] text-balance">
                                {sc.lowInjuryRiskTitle[lang]}
                            </h3>
                        </div>
                        <p className="text-[15px] leading-[1.6] text-[rgb(var(--text-secondary))]">
                            {sc.lowInjuryRiskIntro[lang]}
                        </p>
                        <ul className="space-y-2.5 border-t border-[rgb(var(--border-subtle)/0.65)] pt-3.5">
                            {sc.lowInjuryRisk.map((rule, idx) => (
                                <li
                                    key={idx}
                                    className="text-sm leading-[1.58] text-[rgb(var(--text-primary)/0.88)]"
                                >
                                    {rule[lang]}
                                </li>
                            ))}
                        </ul>
                    </section>

                    <section className="rounded-[10px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4 space-y-4">
                        <div className="flex items-center gap-2">
                            <Icon name="RotateCcw" size={18} className="text-emerald-400 shrink-0" />
                            <h3 className="text-base font-extrabold text-[rgb(var(--text-primary))] text-balance">
                                {sc.postInjuryTitle[lang]}
                            </h3>
                        </div>

                        <div className="rounded-r-[6px] border-l border-red-400/75 bg-red-500/[0.09] px-3.5 py-3 flex items-start gap-2.5 text-sm leading-[1.55] text-[rgb(var(--text-primary)/0.92)]">
                            <Icon name="AlertTriangle" size={16} className="mt-0.5 shrink-0 text-red-400" />
                            <span>{sc.postInjuryDisclaimer[lang]}</span>
                        </div>

                        <div className="divide-y divide-[rgb(var(--border-subtle)/0.65)] border-t border-[rgb(var(--border-subtle)/0.65)]">
                            {sc.postInjuryPhases.map((step) => (
                                <article
                                    key={step.phase}
                                    className="py-3.5 flex items-start gap-3"
                                >
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[5px] bg-emerald-500/15 text-xs font-black text-emerald-300 tabular-nums mt-0.5">
                                        {step.phase}
                                    </span>
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-extrabold text-[rgb(var(--text-primary))]">
                                            {step.title[lang]}
                                        </h4>
                                        <p className="text-sm leading-[1.55] text-[rgb(var(--text-secondary))]">
                                            {step.body[lang]}
                                        </p>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>
                </>
            )}

            {showMembers && Array.isArray(sc.membersModules) && (
                <section
                    data-testid="rp-members-modules"
                    className="rounded-[10px] border border-primary-500/25 bg-[rgb(var(--surface-raised))] p-4 space-y-3.5"
                >
                    <div className="flex items-center gap-2">
                        <Icon name="Crown" size={18} className="text-primary-400 shrink-0" />
                        <h3 className="text-base font-extrabold text-[rgb(var(--text-primary))] text-balance">
                            {sc.membersModulesTitle[lang]}
                        </h3>
                    </div>
                    <div className="space-y-3">
                        {sc.membersModules.map((mod) => (
                            <article
                                key={mod.id}
                                className="rounded-[8px] border border-[rgb(var(--border-subtle)/0.8)] bg-[rgb(var(--surface-app)/0.6)] p-3.5 space-y-1.5"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <h4 className="text-sm font-extrabold text-[rgb(var(--text-primary))]">
                                        {mod.title[lang]}
                                    </h4>
                                    <span className="shrink-0 rounded-[4px] border border-primary-500/30 bg-primary-500/15 px-2 py-0.5 text-[11px] font-black uppercase tracking-wider text-primary-300">
                                        {mod.badge[lang]}
                                    </span>
                                </div>
                                <p className="text-sm leading-[1.58] text-[rgb(var(--text-secondary))]">
                                    {mod.body[lang]}
                                </p>
                            </article>
                        ))}
                    </div>
                </section>
            )}
        </>
    );
};
