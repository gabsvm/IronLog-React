import { pickLang } from '../../utils/i18n';
import React from 'react';
import { BodyLog, NutritionGoal, WeightUnit } from '../../types';
import { Icon } from '../../components/ui/Icon';
import { TRANSLATIONS } from '../../constants';
import { WATER_GOAL_ML } from './nutritionHelpers';
import { toDisplay, unitLabel } from '../../utils/units';

interface Props {
    lang: 'en' | 'es';
    latestWeight: BodyLog | null;
    weightTrend: BodyLog[];
    recentWeighIns: BodyLog[];
    nutritionGoal: NutritionGoal;
    todayCalories: number;
    tdee: number | null;
    bodyWeight?: number;
    bodyFat?: number;
    onLogWeight: () => void;
    unit?: WeightUnit;
    /** Strong-parity measurements surface (needs AppProvider): injected by NutriView, absent in isolated tests. */
    measurements?: React.ReactNode;
}

/**
 * "Body" tab of NutriView: current weight + TDEE balance card + computed
 * personal protein/water targets + last 30-day weight chart + recent weigh-ins.
 * Pure presentational — all data + handlers are passed in.
 */
export const BodyTab: React.FC<Props> = ({
    lang,
    latestWeight,
    weightTrend,
    recentWeighIns,
    nutritionGoal,
    todayCalories,
    tdee,
    bodyWeight,
    bodyFat,
    onLogWeight,
    unit = 'kg',
    measurements,
}) => {
    const weightSuffix = unitLabel(unit).toLowerCase();

    return (
        <div className="space-y-3 pt-1">
            {/* Weight + TDEE hero */}
            <div className="gl-panel p-4 sm:p-5">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <p className="text-xs font-semibold tracking-normal text-muted mb-1">
                            {TRANSLATIONS[lang].copy.bodyTab.bodyWeight}
                        </p>
                        {latestWeight ? (
                            <>
                                <div className="text-4xl font-semibold tabular-nums text-[rgb(var(--text-primary))] leading-none">{toDisplay(latestWeight.weight, unit)}</div>
                                <p className="text-xs text-muted mt-1">
                                    {weightSuffix} · {new Date(latestWeight.date).toLocaleDateString(pickLang(lang, { es: 'es-AR', en: 'en-US' }), { month: 'short', day: 'numeric' })}
                                </p>
                                {latestWeight.bodyFat && (
                                    <p className="text-xs text-muted">
                                        {latestWeight.bodyFat}% {TRANSLATIONS[lang].copy.bodyTab.bodyFat}
                                    </p>
                                )}
                            </>
                        ) : (
                            <p className="text-muted text-sm mt-1">{TRANSLATIONS[lang].copy.bodyTab.noDataYet}</p>
                        )}
                    </div>
                    <button
                        onClick={onLogWeight}
                        aria-label={TRANSLATIONS[lang].copy.bodyTab.logBodyWeight}
                        className="gl-quiet px-3.5"
                    >
                        <Icon name="Plus" size={14} />
                        {TRANSLATIONS[lang].copy.bodyTab.log}
                    </button>
                </div>

                {(() => {
                    if (!latestWeight) return null;
                    const daysSince = Math.floor((Date.now() - new Date(latestWeight.date).getTime()) / 86400000);
                    if (daysSince <= 14) return null;
                    return (
                        <p className="mt-3 flex items-center gap-1.5 text-xs text-amber-800 dark:text-amber-400">
                            <Icon name="AlertTriangle" size={14} className="shrink-0" />
                            {TRANSLATIONS[lang].staleWeighIn.replace('{days}', String(daysSince))}
                        </p>
                    );
                })()}

                {/* Mini weight chart */}
                {weightTrend.length > 1 && (() => {
                    const min = Math.min(...weightTrend.map((wl) => wl.weight)) - 1;
                    const max = Math.max(...weightTrend.map((wl) => wl.weight)) + 1;
                    const range = max - min || 1;
                    const points = weightTrend
                        .map((entry, i) => {
                            const x = (i / (weightTrend.length - 1)) * 100;
                            const y = 100 - ((entry.weight - min) / range) * 100;
                            return `${x},${y}`;
                        })
                        .join(' ');
                    return (
                        <div className="mt-3 pt-3 border-t border-[rgb(var(--border-subtle))]">
                            <p className="text-xs text-muted mb-2">{TRANSLATIONS[lang].copy.bodyTab.last30Days}</p>
                            <svg viewBox="0 0 100 40" className="w-full h-16" preserveAspectRatio="none" role="img" aria-label={`${TRANSLATIONS[lang].copy.bodyTab.last30Days}: ${weightTrend.length} ${pickLang(lang, { es: 'registros', en: 'entries' })}` }>
                                <polyline
                                    points={points}
                                    fill="none"
                                    stroke="currentColor"
                                    className="text-primary-500"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    vectorEffect="non-scaling-stroke"
                                />
                            </svg>
                        </div>
                    );
                })()}
            </div>

            {/* TDEE card */}
            <div className="gl-panel p-4">
                <p className="text-sm font-bold tracking-tight text-[rgb(var(--text-primary))] mb-3">
                    {TRANSLATIONS[lang].copy.bodyTab.energyBalance}
                </p>
                <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                        <p className="text-xl font-semibold tabular-nums text-[rgb(var(--text-primary))]">{nutritionGoal.calories}</p>
                        <p className="text-xs font-semibold text-muted">{TRANSLATIONS[lang].copy.bodyTab.goal}</p>
                    </div>
                    <div className="text-center">
                        <p className={`text-xl font-semibold tabular-nums ${todayCalories > nutritionGoal.calories ? 'text-orange-700 dark:text-orange-400' : 'text-green-700 dark:text-green-400'}`}>
                            {todayCalories}
                        </p>
                        <p className="text-xs font-semibold text-muted">{TRANSLATIONS[lang].copy.bodyTab.eaten}</p>
                    </div>
                    {tdee && (
                        <div className="text-center">
                            <p className="text-xl font-semibold tabular-nums text-secondary">{tdee}</p>
                            <p className="text-xs font-semibold text-muted">{TRANSLATIONS[lang].copy.bodyTab.tdeeEst}</p>
                        </div>
                    )}
                </div>
                {tdee && (
                    <div className="mt-3 pt-3 border-t border-border-subtle">
                        <p className="text-xs text-muted text-center">
                            {nutritionGoal.calories < tdee
                                ? `${TRANSLATIONS[lang].copy.bodyTab.deficit} ${tdee - nutritionGoal.calories} kcal · ${TRANSLATIONS[lang].copy.bodyTab.fatLossMode}`
                                : nutritionGoal.calories > tdee
                                    ? `${TRANSLATIONS[lang].copy.bodyTab.surplus} ${nutritionGoal.calories - tdee} kcal · ${TRANSLATIONS[lang].copy.bodyTab.buildingMode}`
                                    : TRANSLATIONS[lang].copy.bodyTab.maintenanceCalories}
                        </p>
                    </div>
                )}
            </div>

            {/* Personal targets: same goal source as Today, then weight-based guidance */}
            {bodyWeight && (() => {
                const t = TRANSLATIONS[lang];
                const groups = [
                    {
                        id: 'goal',
                        label: t.bodyYourGoal,
                        items: [
                            { id: 'goal_protein', label: t.bodyGoalProtein, value: `${nutritionGoal.protein}g`, color: 'text-blue-700 dark:text-blue-400' },
                            { id: 'goal_water', label: t.bodyGoalWater, value: `${WATER_GOAL_ML}ml`, color: 'text-sky-700 dark:text-sky-400' },
                        ],
                    },
                    {
                        id: 'recommended',
                        label: t.bodyRecommended,
                        items: [
                            { id: 'min_protein', label: TRANSLATIONS[lang].copy.bodyTab.minProtein, value: `${Math.round(bodyWeight * 1.8)}g`, color: 'text-blue-700 dark:text-blue-400' },
                            { id: 'opt_protein', label: TRANSLATIONS[lang].copy.bodyTab.optimalProtein, value: `${Math.round(bodyWeight * 2.2)}g`, color: 'text-blue-700 dark:text-blue-300' },
                            { id: 'water', label: TRANSLATIONS[lang].copy.bodyTab.dailyWater, value: `${Math.round(bodyWeight * 37)}ml`, color: 'text-sky-700 dark:text-sky-400' },
                            ...(bodyFat ? [{ id: 'body_fat', label: TRANSLATIONS[lang].copy.bodyTab.bodyFat2, value: `${bodyFat}%`, color: 'text-secondary' }] : []),
                        ],
                    },
                ];
                return (
                    <div className="gl-panel p-4">
                        <p className="text-sm font-bold tracking-tight text-[rgb(var(--text-primary))] mb-3">
                            {TRANSLATIONS[lang].copy.bodyTab.yourTargets}
                        </p>
                        {groups.map(group => (
                            <div key={group.id} className="mb-2 last:mb-0">
                                <p className="text-xs font-semibold text-muted mt-3 first:mt-0 mb-2">
                                    {group.label}
                                </p>
                                <div className="space-y-2">
                                    {group.items.map((item) => (
                                        <div key={item.id} className="flex justify-between items-center py-1.5 border-b border-border-subtle/50 last:border-0">
                                            <span className="text-xs text-muted">{item.label}</span>
                                            <span className={`text-sm font-bold ${item.color}`}>{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                );
            })()}

            {/* Recent weigh-ins */}
            {weightTrend.length > 0 && (
                <div className="gl-panel p-4">
                    <p className="text-sm font-bold tracking-tight text-[rgb(var(--text-primary))] mb-3">
                        {TRANSLATIONS[lang].copy.bodyTab.recentWeighIns}
                    </p>
                    <div className="space-y-1">
                        {recentWeighIns.map((entry) => (
                            <div key={entry.id} className="flex justify-between items-center py-1.5 border-b border-border-subtle/50 last:border-0">
                                <span className="text-xs text-muted">
                                    {new Date(entry.date).toLocaleDateString(pickLang(lang, { es: 'es-AR', en: 'en-US' }), { weekday: 'short', month: 'short', day: 'numeric' })}
                                </span>
                                <div className="text-right">
                                    <span className="text-sm font-bold text-[rgb(var(--text-primary))]">{toDisplay(entry.weight, unit)} {weightSuffix}</span>
                                    {entry.bodyFat && <span className="text-xs text-muted ml-2">{entry.bodyFat}% BF</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Strong parity: full measurements (weight, fat, calories, girths) */}
            {measurements}
        </div>
    );
};
