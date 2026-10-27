import { TRANSLATIONS } from '../../constants/translations';
import { pickLang } from '../../utils/i18n';
import React from 'react';
import { FoodEntry, NutritionLog, NutritionGoal, CardioSession } from '../../types';
import { Icon } from '../../components/ui/Icon';
import { MacroRing } from '../../components/nutrition/MacroRing';
import { MacroBar } from './MacroBar';
import { WaterTracker } from './WaterTracker';
import { MEAL_ORDER, MEAL_META, ACTIVITY_EMOJI } from './nutritionHelpers';
import { formatDistance, distanceUnitLabel, type DistanceUnit } from '../../utils/strongTraining';

const CARDIO_ACTIVITY_LABELS: Record<string, { en: string; es: string }> = {
    running: { en: 'Running', es: 'Correr' },
    cycling: { en: 'Cycling', es: 'Ciclismo' },
    walking: { en: 'Walking', es: 'Caminar' },
    swimming: { en: 'Swimming', es: 'Natación' },
    rowing: { en: 'Rowing', es: 'Remo' },
    elliptical: { en: 'Elliptical', es: 'Elíptica' },
    jump_rope: { en: 'Jump rope', es: 'Soga' },
    hiit: { en: 'HIIT', es: 'HIIT' },
    other: { en: 'Other', es: 'Otro' },
};

interface MacroTotals {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
}

interface Props {
    lang: 'en' | 'es';
    streak: number;
    todayMacros: MacroTotals;
    todayWater: number;
    todayCardio: CardioSession[];
    todayLog: NutritionLog;
    /** Display unit for cardio distances (stored values stay canonical km). */
    distanceUnit?: DistanceUnit;
    nutritionGoal: NutritionGoal;
    caloriesRemaining: number;
    caloriesBurned: number;
    expandedMeal: string | null;
    setExpandedMeal: (m: string | null) => void;
    onAddMeal: () => void;
    onAddCardio: () => void;
    onEditGoals: () => void;
    onAddWater: (ml: number) => void;
    onDeleteCardio: (id: string) => void;
    onEditEntry: (entry: FoodEntry) => void;
    onDeleteEntry: (id: string) => void;
}

/**
 * "Today" tab of NutriView: hero card with remaining calories + macro ring +
 * macro bars + water tracker + quick actions + per-meal expandable lists.
 * All state owned by the parent; this is a pure render shell.
 */
export const TodayTab: React.FC<Props> = ({
    lang,
    streak,
    todayMacros,
    todayWater,
    todayCardio,
    todayLog,
    distanceUnit = 'km',
    nutritionGoal,
    caloriesRemaining,
    caloriesBurned,
    expandedMeal,
    setExpandedMeal,
    onAddMeal,
    onAddCardio,
    onEditGoals,
    onAddWater,
    onDeleteCardio,
    onEditEntry,
    onDeleteEntry,
}) => {

    return (
        <div className="space-y-4 pt-1">
            {/* Hero card — calories + key metrics */}
            <div className="gl-panel p-4 sm:p-5">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        {streak > 1 && (
                            <p className="mb-1 text-xs font-semibold text-orange-700 dark:text-orange-400">🔥 {streak} {TRANSLATIONS[lang].copy.todayTab.dayStreak}</p>
                        )}
                        <div className={`text-4xl font-semibold tabular-nums leading-none ${caloriesRemaining < 0 ? 'text-orange-700 dark:text-orange-400' : caloriesRemaining < 200 ? 'text-yellow-800 dark:text-yellow-400' : 'text-[rgb(var(--text-primary))]'}`}>
                            {caloriesRemaining > 0 ? caloriesRemaining : Math.abs(caloriesRemaining)}
                        </div>
                        <p className="text-xs text-muted mt-1">
                            {caloriesRemaining >= 0
                                ? TRANSLATIONS[lang].copy.todayTab.kcalRemaining
                                : TRANSLATIONS[lang].copy.todayTab.kcalOverGoal}
                        </p>
                    </div>
                    <MacroRing
                        calories={todayMacros.calories}
                        goalCalories={nutritionGoal.calories}
                        protein={todayMacros.protein}
                        carbs={todayMacros.carbs}
                        fat={todayMacros.fat}
                        size={88}
                    />
                </div>

                {/* Macro bars */}
                <div className="flex gap-3">
                    <MacroBar value={todayMacros.protein} goal={nutritionGoal.protein} tone="protein" label={TRANSLATIONS[lang].copy.todayTab.protein} />
                    <MacroBar value={todayMacros.carbs} goal={nutritionGoal.carbs} tone="carbs" label={TRANSLATIONS[lang].copy.todayTab.carbs || pickLang(lang, { en: 'Carbs', es: 'Carbos' })} />
                    <MacroBar value={todayMacros.fat} goal={nutritionGoal.fat} tone="fat" label={TRANSLATIONS[lang].copy.todayTab.fat} />
                </div>

                {/* Cardio burned row */}
                {caloriesBurned > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                        <p className="text-xs text-secondary">
                            <span className="text-red-700 dark:text-red-400 font-semibold">+{caloriesBurned} kcal</span>{' '}
                            {TRANSLATIONS[lang].copy.todayTab.burnedFromCardioAdded}
                        </p>
                    </div>
                )}

                <button
                    onClick={onEditGoals}
                    className="mt-1 min-h-11 w-full py-2.5 text-center text-xs text-muted hover:text-[rgb(var(--text-primary))] transition-colors duration-fast ease-natural"
                >
                    {TRANSLATIONS[lang].copy.todayTab.editGoals} →
                </button>
            </div>

            {/* Water tracker */}
            <WaterTracker waterMl={todayWater} onAdd={onAddWater} lang={lang} />

            {/* Quick actions */}
            <div className="grid grid-cols-2 gap-2">
                <button
                    type="button"
                    onClick={onAddMeal}
                    aria-label={TRANSLATIONS[lang].copy.todayTab.addFoodEntry}
                    className="gl-primary min-h-[52px] text-sm"
                >
                    <Icon name="Plus" size={16} />
                    <span>{TRANSLATIONS[lang].copy.todayTab.addFood}</span>
                </button>
                <button
                    type="button"
                    onClick={onAddCardio}
                    aria-label={TRANSLATIONS[lang].copy.todayTab.logCardioSession}
                    className="gl-quiet min-h-[52px] text-sm"
                >
                    <Icon name="Flame" size={16} />
                    <span>{TRANSLATIONS[lang].copy.todayTab.logCardio}</span>
                </button>
            </div>

            {/* Today cardio summary */}
            {todayCardio.length > 0 && (
                <div className="gl-panel p-3">
                    <p className="text-xs font-semibold text-muted mb-2">
                        {TRANSLATIONS[lang].copy.todayTab.todaySCardio}
                    </p>
                    <div className="space-y-1.5">
                        {todayCardio.map((s) => (
                            <div key={s.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm">
                                    <span aria-hidden="true">{ACTIVITY_EMOJI[s.activityType] || '🏋️'}</span>
                                    <span className="text-secondary capitalize text-xs">
                                        {CARDIO_ACTIVITY_LABELS[s.activityType]?.[lang] || s.activityType.replace('_', ' ')} · {s.durationMin}min{s.distanceKm != null && s.distanceKm > 0 ? ` · ${formatDistance(s.distanceKm, distanceUnit, lang)} ${distanceUnitLabel(distanceUnit)}` : ''}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {s.caloriesBurned && <span className="text-xs font-semibold text-red-700 dark:text-red-400">~{s.caloriesBurned} kcal</span>}
                                        <button
                                            onClick={() => onDeleteCardio(s.id)}
                                            aria-label={TRANSLATIONS[lang].copy.todayTab.deleteCardioEntry}
                                            className="flex min-h-[44px] min-w-[44px] items-center justify-center text-muted hover:text-red-700 dark:hover:text-red-400 transition-colors duration-fast ease-natural"
                                        >
                                            <Icon name="X" size={12} />
                                        </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Meal Groups */}
            {MEAL_ORDER.map((mealType) => {
                const entries = todayLog.entries.filter((e) => e.mealType === mealType);
                if (entries.length === 0) return null;
                const meta = MEAL_META[mealType];
                const mealCals = entries.reduce((a, e) => a + e.calories, 0);
                const mealProt = entries.reduce((a, e) => a + e.protein, 0);
                const isExpanded = expandedMeal === mealType;
                return (
                    <div key={mealType} className="gl-panel overflow-hidden">
                        <button
                            onClick={() => setExpandedMeal(isExpanded ? null : mealType)}
                            aria-expanded={isExpanded}
                            className="min-h-11 w-full flex items-center justify-between p-4"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-xl" aria-hidden="true">{meta.emoji}</span>
                                <div className="text-left">
                                    <p className="font-bold text-[rgb(var(--text-primary))] text-sm">{pickLang(lang, meta)}</p>
                                    <p className="text-xs text-muted">{entries.length} {TRANSLATIONS[lang].copy.todayTab.items}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="text-right">
                                    <p className="text-sm font-bold text-[rgb(var(--text-secondary))]">{mealCals} kcal</p>
                                    <p className="text-xs text-blue-700 dark:text-blue-400">{Math.round(mealProt)}g P</p>
                                </div>
                                <Icon name={isExpanded ? 'ChevronUp' : 'ChevronDown'} size={16} className="text-muted" />
                            </div>
                        </button>
                        {isExpanded && (
                            <div className="border-t border-[rgb(var(--border-subtle))] divide-y divide-[rgb(var(--border-subtle))]">
                                {entries.map((entry) => (
                                    <div key={entry.id} className="flex items-center justify-between px-4 py-3">
                                        <div className="flex-1 min-w-0 pr-2">
                                            <p className="text-sm text-[rgb(var(--text-primary))] font-medium truncate">{entry.name}</p>
                                            <p className="text-xs text-muted mt-0.5">
                                                <span className="text-blue-700 dark:text-blue-400">{entry.protein}g P</span>{' · '}
                                                <span className="text-amber-800 dark:text-amber-400">{entry.carbs}g C</span>{' · '}
                                                <span className="text-pink-700 dark:text-pink-400">{entry.fat}g F</span>
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <span className="text-sm font-bold text-[rgb(var(--text-secondary))] mr-1">{entry.calories}</span>
                                            <button
                                                onClick={() => onEditEntry(entry)}
                                                aria-label={TRANSLATIONS[lang].copy.todayTab.editEntry}
                                                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center text-muted hover:text-[rgb(var(--text-primary))] transition-colors duration-fast ease-natural rounded-lg"
                                            >
                                                <Icon name="Pencil" size={14} />
                                            </button>
                                            <button
                                                onClick={() => onDeleteEntry(entry.id)}
                                                aria-label={TRANSLATIONS[lang].copy.todayTab.deleteEntry}
                                                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center text-muted hover:text-red-700 dark:hover:text-red-400 transition-colors duration-fast ease-natural rounded-lg"
                                            >
                                                <Icon name="Trash2" size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}

            {todayLog.entries.length === 0 && (
                <p className="py-6 text-center text-sm text-secondary">{TRANSLATIONS[lang].copy.todayTab.noFoodLoggedYet}</p>
            )}
        </div>
    );
};
