import React from 'react';
import { Icon } from '../ui/Icon';
import { getTranslated } from '../../utils';
import { toDisplay, unitLabel } from '../../utils/units';
import type { WeightUnit } from '../../types';
import type { PremiumInsights } from '../../utils/premiumInsights';

interface Props {
    insights: PremiumInsights;
    lang: 'es' | 'en';
    unit: WeightUnit;
    scope: 'plan' | 'history';
}

/** A presentation-only editorial summary: chart, delta and best set use real logs. */
export const PremiumTrendCard: React.FC<Props> = ({ insights, lang, unit, scope }) => {
    const { weeklyWorkingSets: counts, currentWeekSets, weekChangePct, bestSet } = insights;
    const isEs = lang === 'es';
    const max = Math.max(1, ...counts);
    const points = counts.map((value, index) => ({
        x: 25 + index * 96,
        y: 122 - (value / max) * 83,
    }));
    const line = points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x} ${point.y}`).join(' ');
    const area = `${line} L${points[3].x} 124 L${points[0].x} 124 Z`;
    const hasRecentWork = counts.some(Boolean);
    const deltaText = weekChangePct === null
        ? (isEs ? 'Sin semana previa comparable' : 'No comparable prior week')
        : `${weekChangePct > 0 ? '+' : ''}${weekChangePct}% ${isEs ? 'vs. 7 días anteriores' : 'vs. previous 7 days'}`;
    const bestText = bestSet
        ? `${getTranslated(bestSet.name, lang)} · ${toDisplay(bestSet.weight, unit)} ${unitLabel(unit).toLowerCase()} × ${bestSet.reps}`
        : (isEs ? 'Aún no hay series con peso registradas.' : 'No weighted sets recorded yet.');

    return (
        <section className="premium-theme-panel premium-theme-quiet relative mt-4 overflow-hidden p-4 sm:p-5" aria-label={isEs ? 'Tendencia reciente de entrenamiento' : 'Recent training trend'}>
            <div className="relative z-10 flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-xs font-semibold text-muted">{isEs ? 'Tu evolución · últimos 28 días' : 'Your progress · last 28 days'}</p>
                    <h3 className="mt-1 text-xl font-black tracking-[-0.045em] text-[rgb(var(--text-primary))]">
                        {isEs ? 'Series de trabajo' : 'Working sets'}
                    </h3>
                </div>
                <div className="shrink-0 rounded-full border border-primary-500/20 bg-primary-500/10 px-3 py-1.5 text-xs font-semibold text-[rgb(var(--text-primary))]">
                    <Icon name="TrendingUp" size={13} className="mr-1 inline text-primary-500" />
                    {currentWeekSets} {isEs ? 'últimos 7 días' : 'last 7 days'}
                </div>
            </div>
            {hasRecentWork ? (
                <div className="mt-3">
                    <svg className="h-auto w-full" viewBox="0 0 340 145" role="img" aria-label={`${isEs ? 'Series de trabajo por semana, de la más antigua a la actual' : 'Working sets by week, oldest to newest'}: ${counts.join(', ')}`}>
                        <defs>
                            <linearGradient id="premium-trend-fill" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="rgb(var(--primary-500))" stopOpacity=".25" />
                                <stop offset="100%" stopColor="rgb(var(--primary-500))" stopOpacity="0" />
                            </linearGradient>
                        </defs>
                        {[39, 80, 122].map(y => <line key={y} x1="15" y1={y} x2="325" y2={y} stroke="rgb(var(--border-strong))" strokeOpacity=".56" strokeDasharray="3 6" />)}
                        <path d={area} fill="url(#premium-trend-fill)" />
                        <path className="premium-trend-line" d={line} fill="none" stroke="rgb(var(--primary-500))" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                        {points.map((point, index) => (
                            <g key={index}>
                                <circle cx={point.x} cy={point.y} r="5" fill="rgb(var(--primary-500))" stroke="rgb(var(--surface-raised))" strokeWidth="2" />
                                <text x={point.x} y={Math.max(15, point.y - 12)} textAnchor="middle" fontSize="12" fontWeight="700" fill="rgb(var(--text-primary))">{counts[index]}</text>
                            </g>
                        ))}
                    </svg>
                    <div className="grid grid-cols-4 gap-1 text-center text-[11px] font-medium text-muted">
                        {(isEs ? ['−3 sem.', '−2 sem.', 'Anterior', 'Actual'] : ['−3 wks', '−2 wks', 'Previous', 'Current']).map(label => <span key={label}>{label}</span>)}
                    </div>
                    <p className="mt-3 text-xs font-medium text-muted">{deltaText}</p>
                </div>
            ) : (
                <p className="my-5 text-sm leading-relaxed text-muted">
                    {isEs ? 'Cuando registres series de trabajo, verás aquí su evolución semana a semana.' : 'Your weekly working-set trend will appear here after you log sessions.'}
                </p>
            )}
            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-[rgb(var(--border-subtle)/0.6)] bg-[rgb(var(--surface-base)/0.58)] p-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-500/10 text-primary-500">
                    <Icon name="Trophy" size={18} />
                </div>
                <div className="min-w-0">
                    <p className="text-xs font-semibold text-muted">
                        {scope === 'plan'
                            ? (isEs ? 'Mejor serie de fuerza del plan' : 'Best strength set in this plan')
                            : (isEs ? 'Mejor serie de fuerza registrada' : 'Best recorded strength set')}
                    </p>
                    <p className="mt-1 break-words text-sm font-bold text-[rgb(var(--text-primary))]">{bestText}</p>
                </div>
            </div>
        </section>
    );
};
