import React, { useState } from 'react';
import { Icon } from '../../../components/ui/Icon';
import { RP_PRINCIPLES_DATA } from '../../../data/rpPrinciplesData';
import { pickLang } from '../../../utils/i18n';

interface RpAutoregToolsProps {
    lang: 'en' | 'es';
}

type Score0to3 = 0 | 1 | 2 | 3;

const SCORES: Score0to3[] = [0, 1, 2, 3];

const MEV_TONE_CLASSES: Record<'amber' | 'zinc' | 'emerald' | 'red', string> = {
    amber: 'border-amber-400/70 bg-amber-500/[0.09] text-amber-200',
    zinc: 'border-zinc-400/70 bg-zinc-500/[0.1] text-zinc-200',
    emerald: 'border-emerald-400/70 bg-emerald-500/[0.09] text-emerald-200',
    red: 'border-red-400/70 bg-red-500/[0.09] text-red-200',
};

const MATRIX_TONE_CLASSES: Record<'primary' | 'emerald' | 'zinc' | 'red', string> = {
    primary: 'border-primary-500/40 bg-primary-500/15 text-primary-200',
    emerald: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-200',
    zinc: 'border-zinc-500/40 bg-zinc-500/15 text-zinc-200',
    red: 'border-red-500/40 bg-red-500/15 text-red-200',
};

export const RpAutoregTools: React.FC<RpAutoregToolsProps> = ({ lang }) => {
    const [rsmScores, setRsmScores] = useState<Record<'mmc' | 'pump' | 'disruption', Score0to3>>({
        mmc: 2,
        pump: 2,
        disruption: 1,
    });
    const [sorenessScore, setSorenessScore] = useState<Score0to3>(1);
    const [perfScore, setPerfScore] = useState<Score0to3>(1);
    const [fatigueScores, setFatigueScores] = useState<Record<'joint' | 'exertion' | 'unusedPerformance', Score0to3>>({
        joint: 0,
        exertion: 1,
        unusedPerformance: 1,
    });

    const { mevEstimator, setProgression, sfrCalculator } = RP_PRINCIPLES_DATA.autoregAlgorithms;

    const rsmTotal = rsmScores.mmc + rsmScores.pump + rsmScores.disruption;
    const mevBand =
        mevEstimator.bands.find((b) => rsmTotal >= b.min && rsmTotal <= b.max) || mevEstimator.bands[2];

    const progOutcome = setProgression.matrix[sorenessScore][perfScore];

    const fatigueTotal = fatigueScores.joint + fatigueScores.exertion + fatigueScores.unusedPerformance;
    const sfrRatio = fatigueTotal === 0 ? null : Number((rsmTotal / fatigueTotal).toFixed(2));
    const sfrVerdict =
        sfrRatio === null || sfrRatio >= 2
            ? { verdict: sfrCalculator.verdicts.high, tone: 'emerald' as const }
            : sfrRatio >= 1
              ? { verdict: sfrCalculator.verdicts.moderate, tone: 'amber' as const }
              : { verdict: sfrCalculator.verdicts.low, tone: 'red' as const };

    return (
        <div className="space-y-4">
            {/* Tool 1: RP MEV Stimulus Estimator / RSM (0–9) */}
            <section className="rounded-[10px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4 space-y-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Icon name="Target" size={18} className="text-primary-400 shrink-0" />
                            <h3 className="text-base font-extrabold text-[rgb(var(--text-primary))] text-balance">
                                {mevEstimator.title[lang]}
                            </h3>
                        </div>
                        <p className="text-sm leading-relaxed text-[rgb(var(--text-secondary))]">
                            {mevEstimator.subtitle[lang]}
                        </p>
                    </div>
                    <span className="shrink-0 rounded-[6px] border border-primary-500/35 bg-primary-500/15 px-3 py-1 text-sm font-black text-primary-300 tabular-nums">
                        {rsmTotal}/9
                    </span>
                </div>

                <div className="divide-y divide-[rgb(var(--border-subtle)/0.65)] border-t border-[rgb(var(--border-subtle)/0.65)]">
                    {mevEstimator.metrics.map((metric) => {
                        const key = metric.id as 'mmc' | 'pump' | 'disruption';
                        const value = rsmScores[key];
                        return (
                            <div key={metric.id} className="py-3.5 space-y-2.5">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                                    <div>
                                        <div className="text-sm font-bold text-[rgb(var(--text-primary))]">
                                            {metric.label[lang]}
                                        </div>
                                        <div className="text-xs text-[rgb(var(--text-secondary))]">
                                            {metric.prompt[lang]}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5" role="group" aria-label={metric.label[lang]}>
                                        {SCORES.map((scoreVal) => {
                                            const selected = value === scoreVal;
                                            return (
                                                <button
                                                    key={scoreVal}
                                                    type="button"
                                                    aria-pressed={selected}
                                                    data-testid={`mev-${metric.id}-${scoreVal}`}
                                                    onClick={() =>
                                                        setRsmScores((prev) => ({ ...prev, [key]: scoreVal }))
                                                    }
                                                    className={`h-10 w-10 rounded-[6px] text-sm font-black tabular-nums transition-colors ${
                                                        selected
                                                            ? 'bg-primary-500 text-zinc-950'
                                                            : 'border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-elevated)/0.65)] text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]'
                                                    }`}
                                                >
                                                    {scoreVal}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                                <p className="text-sm leading-relaxed text-[rgb(var(--text-primary)/0.88)]">
                                    {metric.levels[value][lang]}
                                </p>
                            </div>
                        );
                    })}
                </div>

                <div
                    data-testid="mev-result"
                    className={`rounded-r-[6px] border-l px-3.5 py-3 space-y-1 ${MEV_TONE_CLASSES[mevBand.tone]}`}
                >
                    <div className="flex items-center justify-between gap-2 text-sm font-extrabold">
                        <span>{mevBand.proximity[lang]}</span>
                        <span className="tabular-nums text-xs uppercase tracking-wider">
                            {pickLang(lang, { es: 'Banda', en: 'Band' })} {mevBand.rangeLabel}
                        </span>
                    </div>
                    <p className="text-sm leading-relaxed text-[rgb(var(--text-primary)/0.92)]">
                        {mevBand.recommendation[lang]}
                    </p>
                </div>
            </section>

            {/* Tool 2: RP Set Progression Algorithm (Table 2.3) */}
            <section className="rounded-[10px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4 space-y-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Icon name="TrendingUp" size={18} className="text-emerald-400 shrink-0" />
                        <h3 className="text-base font-extrabold text-[rgb(var(--text-primary))] text-balance">
                            {setProgression.title[lang]}
                        </h3>
                    </div>
                    <p className="text-sm leading-relaxed text-[rgb(var(--text-secondary))]">
                        {setProgression.subtitle[lang]}
                    </p>
                </div>

                <div className="divide-y divide-[rgb(var(--border-subtle)/0.65)] border-t border-[rgb(var(--border-subtle)/0.65)]">
                    <div className="py-3.5 space-y-2.5">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                            <span className="text-sm font-bold text-[rgb(var(--text-primary))]">
                                {pickLang(lang, { es: 'Agujetas (Soreness)', en: 'Soreness Score' })}
                            </span>
                            <div
                                className="flex items-center gap-1.5"
                                role="group"
                                aria-label={pickLang(lang, { es: 'Puntuación de agujetas', en: 'Soreness score' })}
                            >
                                {SCORES.map((val) => {
                                    const selected = sorenessScore === val;
                                    return (
                                        <button
                                            key={val}
                                            type="button"
                                            aria-pressed={selected}
                                            data-testid={`prog-soreness-${val}`}
                                            onClick={() => setSorenessScore(val)}
                                            className={`h-10 w-10 rounded-[6px] text-sm font-black tabular-nums transition-colors ${
                                                selected
                                                    ? 'bg-primary-500 text-zinc-950'
                                                    : 'border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-elevated)/0.65)] text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]'
                                            }`}
                                        >
                                            {val}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        <p className="text-sm leading-relaxed text-[rgb(var(--text-primary)/0.88)]">
                            {setProgression.sorenessLevels[sorenessScore][lang]}
                        </p>
                    </div>

                    <div className="py-3.5 space-y-2.5">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                            <span className="text-sm font-bold text-[rgb(var(--text-primary))]">
                                {pickLang(lang, { es: 'Rendimiento (Performance)', en: 'Performance Score' })}
                            </span>
                            <div
                                className="flex items-center gap-1.5"
                                role="group"
                                aria-label={pickLang(lang, {
                                    es: 'Puntuación de rendimiento',
                                    en: 'Performance score',
                                })}
                            >
                                {SCORES.map((val) => {
                                    const selected = perfScore === val;
                                    return (
                                        <button
                                            key={val}
                                            type="button"
                                            aria-pressed={selected}
                                            data-testid={`prog-perf-${val}`}
                                            onClick={() => setPerfScore(val)}
                                            className={`h-10 w-10 rounded-[6px] text-sm font-black tabular-nums transition-colors ${
                                                selected
                                                    ? 'bg-primary-500 text-zinc-950'
                                                    : 'border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-elevated)/0.65)] text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]'
                                            }`}
                                        >
                                            {val}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        <p className="text-sm leading-relaxed text-[rgb(var(--text-primary)/0.88)]">
                            {setProgression.performanceLevels[perfScore][lang]}
                        </p>
                    </div>
                </div>

                <div
                    data-testid="prog-result"
                    className={`rounded-[6px] border p-3.5 flex items-center justify-between gap-3 ${MATRIX_TONE_CLASSES[progOutcome.tone]}`}
                >
                    <div className="text-sm font-extrabold">{progOutcome.label[lang]}</div>
                    <span className="shrink-0 rounded-[4px] bg-[rgb(var(--surface-app)/0.8)] px-3 py-1 text-xs font-black tabular-nums">
                        {progOutcome.delta}
                    </span>
                </div>

                <ul className="space-y-2 pt-1">
                    {setProgression.plainSummary.map((line, idx) => (
                        <li
                            key={idx}
                            className="flex items-start gap-2.5 text-sm leading-relaxed text-[rgb(var(--text-secondary))]"
                        >
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-400" />
                            <span>{line[lang]}</span>
                        </li>
                    ))}
                </ul>
            </section>

            {/* Tool 3: SFR Calculator (RSM / Fatigue) */}
            <section className="rounded-[10px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4 space-y-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Icon name="BarChart2" size={18} className="text-amber-400 shrink-0" />
                            <h3 className="text-base font-extrabold text-[rgb(var(--text-primary))] text-balance">
                                {sfrCalculator.title[lang]}
                            </h3>
                        </div>
                        <p className="text-sm leading-relaxed text-[rgb(var(--text-secondary))]">
                            {sfrCalculator.subtitle[lang]}
                        </p>
                    </div>
                    <span className="shrink-0 rounded-[6px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-app)/0.75)] px-2.5 py-1 text-xs font-black text-[rgb(var(--text-primary))] tabular-nums">
                        RSM {rsmTotal} ÷ {fatigueTotal}
                    </span>
                </div>

                <div className="divide-y divide-[rgb(var(--border-subtle)/0.65)] border-t border-[rgb(var(--border-subtle)/0.65)]">
                    {sfrCalculator.fatigueMetrics.map((metric) => {
                        const key = metric.id as 'joint' | 'exertion' | 'unusedPerformance';
                        const value = fatigueScores[key];
                        return (
                            <div key={metric.id} className="py-3.5 space-y-2.5">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                                    <div>
                                        <div className="text-sm font-bold text-[rgb(var(--text-primary))]">
                                            {metric.label[lang]}
                                        </div>
                                        <div className="text-xs text-[rgb(var(--text-secondary))]">
                                            {metric.prompt[lang]}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5" role="group" aria-label={metric.label[lang]}>
                                        {SCORES.map((scoreVal) => {
                                            const selected = value === scoreVal;
                                            return (
                                                <button
                                                    key={scoreVal}
                                                    type="button"
                                                    aria-pressed={selected}
                                                    data-testid={`sfr-${metric.id}-${scoreVal}`}
                                                    onClick={() =>
                                                        setFatigueScores((prev) => ({ ...prev, [key]: scoreVal }))
                                                    }
                                                    className={`h-10 w-10 rounded-[6px] text-sm font-black tabular-nums transition-colors ${
                                                        selected
                                                            ? 'bg-amber-500 text-zinc-950'
                                                            : 'border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-elevated)/0.65)] text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]'
                                                    }`}
                                                >
                                                    {scoreVal}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                                <p className="text-sm leading-relaxed text-[rgb(var(--text-primary)/0.88)]">
                                    {metric.levels[value][lang]}
                                </p>
                            </div>
                        );
                    })}
                </div>

                <div
                    data-testid="sfr-result"
                    className={`rounded-r-[6px] border-l px-3.5 py-3 space-y-1 ${MEV_TONE_CLASSES[sfrVerdict.tone]}`}
                >
                    <div className="flex items-center justify-between gap-2 text-sm font-extrabold">
                        <span>{sfrVerdict.verdict.label[lang]}</span>
                        <span className="tabular-nums text-xs uppercase tracking-wider">
                            {sfrRatio === null
                                ? pickLang(lang, { es: 'SFR Máximo (Fatiga 0)', en: 'Max SFR (0 Fatigue)' })
                                : `SFR ${sfrRatio.toFixed(2)}`}
                        </span>
                    </div>
                    <p className="text-sm leading-relaxed text-[rgb(var(--text-primary)/0.92)]">
                        {sfrVerdict.verdict.advice[lang]}
                    </p>
                </div>

                <div className="border-t border-[rgb(var(--border-subtle)/0.65)] pt-3.5 space-y-2">
                    <div className="text-xs font-extrabold uppercase tracking-wider text-[rgb(var(--text-secondary))]">
                        {pickLang(lang, { es: 'Cómo Mejorar tu SFR', en: '4 Ways to Raise Exercise SFR' })}
                    </div>
                    <ul className="space-y-2.5">
                        {sfrCalculator.improveRules.map((rule, idx) => (
                            <li
                                key={idx}
                                className="flex items-start gap-2.5 text-sm leading-[1.55] text-[rgb(var(--text-secondary))]"
                            >
                                <Icon name="CheckCircle" size={16} className="mt-0.5 shrink-0 text-emerald-400" />
                                <span>{rule[lang]}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>
        </div>
    );
};
