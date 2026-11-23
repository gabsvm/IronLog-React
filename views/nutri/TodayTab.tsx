import { TRANSLATIONS } from '../../constants/translations';
import { pickLang } from '../../utils/i18n';
import React, { useMemo } from 'react';
import { BodyLog, CardioSession, FoodEntry, NutritionGoal, NutritionLog, ProgramDay } from '../../types';
import { Icon } from '../../components/ui/Icon';
import { MacroRing } from '../../components/nutrition/MacroRing';
import { MacroBar } from './MacroBar';
import { WaterTracker } from './WaterTracker';
import { MEAL_ORDER, MEAL_META, ACTIVITY_EMOJI } from './nutritionHelpers';
import { computeRpDietRecommendation, evaluateCardioInterference, type RpDietPhase } from '../../utils/rpDietEngine';

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
    nutritionGoal: NutritionGoal;
    caloriesRemaining: number;
    caloriesBurned: number;
    proteinRemaining: number;
    expandedMeal: string | null;
    setExpandedMeal: (m: string | null) => void;
    onAddMeal: () => void;
    onAddCardio: () => void;
    onEditGoals: () => void;
    onAddWater: (ml: number) => void;
    onDeleteCardio: (id: string) => void;
    onEditEntry: (entry: FoodEntry) => void;
    onDeleteEntry: (id: string) => void;
    bodyLogs?: BodyLog[];
    upcomingDay?: ProgramDay;
    onUpdateNutritionGoal?: (next: NutritionGoal) => void;
    onUpdateSteps?: (steps: number) => void;
    onToggleTrainingDay?: (isTraining: boolean) => void;
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
    nutritionGoal,
    caloriesRemaining,
    caloriesBurned,
    proteinRemaining,
    expandedMeal,
    setExpandedMeal,
    onAddMeal,
    onAddCardio,
    onEditGoals,
    onAddWater,
    onDeleteCardio,
    onEditEntry,
    onDeleteEntry,
    bodyLogs,
    upcomingDay,
    onUpdateNutritionGoal,
    onUpdateSteps,
    onToggleTrainingDay,
}) => {
    const dietRec = useMemo(
        () => computeRpDietRecommendation({ goal: nutritionGoal, bodyLogs: bodyLogs || [] }),
        [nutritionGoal, bodyLogs],
    );
    const cardioReport = useMemo(
        () =>
            evaluateCardioInterference({
                stepsToday: todayLog.steps ?? 0,
                stepsTarget: nutritionGoal.dailyStepsTarget ?? 9000,
                todayCardio,
                upcomingDay,
            }),
        [todayLog.steps, nutritionGoal.dailyStepsTarget, todayCardio, upcomingDay],
    );
    const isTrainingDay = todayLog.isTrainingDay ?? true;
    const dayTargets = isTrainingDay ? dietRec.trainingDayMacros : dietRec.restDayMacros;
    const PHASE_OPTIONS: { id: RpDietPhase; label: { es: string; en: string } }[] = [
        { id: 'cut', label: { es: 'Cut', en: 'Cut' } },
        { id: 'maintenance', label: { es: 'Mant.', en: 'Maint.' } },
        { id: 'bulk', label: { es: 'Bulk', en: 'Bulk' } },
    ];

    return (
        <div className="space-y-4 pt-1">
            {/* Hero card — calories + key metrics */}
            <div className="premium-theme-panel rounded-[8px] bg-surface-raised border border-border-subtle p-4 sm:p-5">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">
                            {TRANSLATIONS[lang].copy.todayTab.today}
                            {streak > 1 && (
                                <span className="ml-2 text-orange-400">🔥 {streak} {TRANSLATIONS[lang].copy.todayTab.dayStreak}</span>
                            )}
                        </p>
                        <div className={`text-4xl font-black leading-none ${caloriesRemaining < 0 ? 'text-orange-400' : caloriesRemaining < 200 ? 'text-yellow-400' : 'text-white'}`}>
                            {caloriesRemaining > 0 ? caloriesRemaining : Math.abs(caloriesRemaining)}
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">
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
                    <MacroBar value={todayMacros.protein} goal={nutritionGoal.protein} color="text-blue-400" label={TRANSLATIONS[lang].copy.todayTab.protein} />
                    <MacroBar value={todayMacros.carbs} goal={nutritionGoal.carbs} color="text-amber-400" label={TRANSLATIONS[lang].copy.todayTab.carbs || pickLang(lang, { en: 'Carbs', es: 'Carbos' })} />
                    <MacroBar value={todayMacros.fat} goal={nutritionGoal.fat} color="text-pink-400" label={TRANSLATIONS[lang].copy.todayTab.fat} />
                </div>

                {/* Protein callout */}
                {proteinRemaining > 0 && (
                    <div className="mt-3 pt-3 border-t border-zinc-800 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                        <p className="text-[11px] text-zinc-400">
                            <span className="text-blue-400 font-bold">{Math.round(proteinRemaining)}g</span>{' '}
                            {TRANSLATIONS[lang].copy.todayTab.proteinToHitYour}
                        </p>
                    </div>
                )}

                {/* Cardio burned row */}
                {caloriesBurned > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                        <p className="text-[11px] text-zinc-400">
                            <span className="text-red-400 font-bold">+{caloriesBurned} kcal</span>{' '}
                            {TRANSLATIONS[lang].copy.todayTab.burnedFromCardioAdded}
                        </p>
                    </div>
                )}

                <button
                    onClick={onEditGoals}
                    className="mt-1 w-full py-2.5 text-center text-xs text-muted hover:text-zinc-400 transition-colors duration-fast ease-natural rounded-[4px]"
                >
                    {TRANSLATIONS[lang].copy.todayTab.editGoals} →
                </button>
            </div>

            {/* Water tracker */}
            <WaterTracker waterMl={todayWater} onAdd={onAddWater} lang={lang} />

            {/* RP Diet 2.0 Phase & Peri-Workout Carb Cycling */}
            <div
                data-testid="rp-diet-phase-card"
                className="premium-theme-panel rounded-[8px] border border-border-subtle bg-surface-raised p-4 space-y-3"
            >
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <Icon name="TrendingUp" size={14} className="text-primary-400" />
                        <span className="text-xs font-black uppercase tracking-wider text-white">
                            {pickLang(lang, { es: 'RP Diet 2.0 · Ritmo & Carbos', en: 'RP Diet 2.0 · Rate & Carbs' })}
                        </span>
                    </div>
                    <span className="rounded-[4px] border border-border-subtle bg-surface-base px-2 py-0.5 text-xs font-bold text-primary-300 tabular-nums">
                        {dietRec.weeklyRatePct !== null
                            ? `${dietRec.weeklyRatePct > 0 ? '+' : ''}${dietRec.weeklyRatePct}%/sem`
                            : `${dietRec.targetRateRange.minPct}%..${dietRec.targetRateRange.maxPct}%`}
                    </span>
                </div>

                <div className="grid grid-cols-3 gap-1.5" role="group" aria-label={pickLang(lang, { es: 'Fase nutricional', en: 'Diet phase' })}>
                    {PHASE_OPTIONS.map((opt) => {
                        const active = dietRec.phase === opt.id;
                        return (
                            <button
                                key={opt.id}
                                type="button"
                                aria-pressed={active}
                                data-testid={`rp-diet-phase-${opt.id}`}
                                onClick={() =>
                                    onUpdateNutritionGoal?.({
                                        ...nutritionGoal,
                                        phase: opt.id,
                                        phaseStartDate: nutritionGoal.phaseStartDate || new Date().toISOString().slice(0, 10),
                                    })
                                }
                                className={`min-h-8 rounded-[5px] border px-2 py-1 text-xs font-extrabold uppercase tracking-wider transition-colors ${
                                    active
                                        ? 'border-primary-500 bg-primary-500 text-zinc-950'
                                        : 'border-border-subtle bg-surface-base text-zinc-300 hover:text-white'
                                }`}
                            >
                                {opt.label[lang]}
                            </button>
                        );
                    })}
                </div>

                {dietRec.dietBreakRecommended && (
                    <div className="rounded-[6px] border border-amber-500/35 bg-amber-500/10 px-3 py-2 flex items-center gap-2 text-xs font-bold text-amber-300">
                        <Icon name="AlertTriangle" size={14} className="shrink-0" />
                        <span>
                            {pickLang(lang, {
                                es: `Semana ${dietRec.weeksInPhase} en déficit: recomendado Diet Break (1–2 sem mantenimiento).`,
                                en: `Week ${dietRec.weeksInPhase} cutting: consider a 1–2 week Diet Break at maintenance.`,
                            })}
                        </span>
                    </div>
                )}

                <div className="flex items-center justify-between gap-2 rounded-[6px] border border-border-subtle bg-surface-base px-3 py-2">
                    <div className="text-xs text-zinc-300">
                        <span className="font-bold text-white">
                            {isTrainingDay
                                ? pickLang(lang, { es: 'Día de entreno', en: 'Training day' })
                                : pickLang(lang, { es: 'Día de descanso', en: 'Rest day' })}
                        </span>
                        <span className="ml-2 font-mono text-amber-300 tabular-nums">
                            {`${dayTargets.calories} kcal · ${dayTargets.carbs}g C`}
                        </span>
                    </div>
                    <button
                        type="button"
                        data-testid="toggle-training-day-carbs"
                        onClick={() => onToggleTrainingDay?.(!isTrainingDay)}
                        className="shrink-0 rounded-[5px] border border-border-subtle bg-surface-raised px-2.5 py-1 text-xs font-bold text-zinc-200 hover:text-white"
                    >
                        {isTrainingDay
                            ? pickLang(lang, { es: 'Pasar a Descanso', en: 'Switch to Rest' })
                            : pickLang(lang, { es: 'Pasar a Entreno', en: 'Switch to Training' })}
                    </button>
                </div>

                {dietRec.suggestedCalorieDelta !== 0 && onUpdateNutritionGoal && (
                    <div className="flex items-center justify-between gap-2 text-xs text-zinc-300">
                        <span>
                            {pickLang(lang, {
                                es: `Ajuste sugerido según promedio móvil (${dietRec.avgCurrentWeightKg ?? '--'} kg):`,
                                en: `Moving-average adjustment (${dietRec.avgCurrentWeightKg ?? '--'} kg):`,
                            })}
                        </span>
                        <button
                            type="button"
                            onClick={() =>
                                onUpdateNutritionGoal({
                                    ...nutritionGoal,
                                    calories: Math.max(1200, nutritionGoal.calories + dietRec.suggestedCalorieDelta),
                                })
                            }
                            className="shrink-0 rounded-[5px] bg-primary-500/15 border border-primary-500/35 px-2.5 py-1 font-extrabold text-primary-300 hover:bg-primary-500/25 tabular-nums"
                        >
                            {`${dietRec.suggestedCalorieDelta > 0 ? '+' : ''}${dietRec.suggestedCalorieDelta} kcal`}
                        </button>
                    </div>
                )}
            </div>

            {/* Cardio & NEAT Steps tracker */}
            <div
                data-testid="rp-neat-card"
                className="premium-theme-panel rounded-[8px] border border-border-subtle bg-surface-raised p-4 space-y-2.5"
            >
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <Icon name="Footprints" size={14} className="text-emerald-400" />
                        <span className="text-xs font-black uppercase tracking-wider text-white">
                            {pickLang(lang, { es: 'NEAT Pasos & Interferencia', en: 'NEAT Steps & Interference' })}
                        </span>
                    </div>
                    <span className="text-xs font-bold text-emerald-300 tabular-nums">
                        {`${cardioReport.stepsToday.toLocaleString()} / ${cardioReport.stepsTarget.toLocaleString()}`}
                    </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-surface-base overflow-hidden">
                    <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                        style={{ width: `${cardioReport.stepsPct}%` }}
                    />
                </div>
                <div className="flex items-center justify-between gap-2">
                    <p className={`text-xs leading-snug ${cardioReport.interferenceWarning ? 'text-amber-300 font-bold' : 'text-zinc-300'}`}>
                        {cardioReport.recommendation[lang]}
                    </p>
                    <button
                        type="button"
                        data-testid="add-neat-steps-btn"
                        onClick={() => onUpdateSteps?.(cardioReport.stepsToday + 2000)}
                        className="shrink-0 rounded-[5px] border border-emerald-500/35 bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20"
                    >
                        +2,000
                    </button>
                </div>
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-2 gap-2">
                <button
                    onClick={onAddMeal}
                    aria-label={TRANSLATIONS[lang].copy.todayTab.addFoodEntry}
                    className="premium-theme-panel rounded-[8px] expressive-press flex min-h-[56px] items-center justify-center gap-2 p-3 hover:border-primary-500/25"
                >
                    <div className="w-8 h-8 rounded-[6px] bg-green-500/15 flex items-center justify-center">
                        <Icon name="Plus" size={16} className="text-green-400" />
                    </div>
                    <span className="text-sm font-bold text-white">{TRANSLATIONS[lang].copy.todayTab.addFood}</span>
                </button>
                <button
                    onClick={onAddCardio}
                    aria-label={TRANSLATIONS[lang].copy.todayTab.logCardioSession}
                    className="premium-theme-panel rounded-[8px] expressive-press flex min-h-[56px] items-center justify-center gap-2 p-3 hover:border-primary-500/25"
                >
                    <div className="w-8 h-8 rounded-[6px] bg-red-500/15 flex items-center justify-center">
                        <Icon name="Flame" size={16} className="text-red-400" />
                    </div>
                    <span className="text-sm font-bold text-white">{TRANSLATIONS[lang].copy.todayTab.logCardio}</span>
                </button>
            </div>

            {/* Today cardio summary */}
            {todayCardio.length > 0 && (
                <div className="premium-theme-panel rounded-[8px] p-3">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">
                        {TRANSLATIONS[lang].copy.todayTab.todaySCardio}
                    </p>
                    <div className="space-y-1.5">
                        {todayCardio.map((s) => (
                            <div key={s.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm">
                                    <span aria-hidden="true">{ACTIVITY_EMOJI[s.activityType] || '🏋️'}</span>
                                    <span className="text-zinc-300 capitalize text-xs">
                                        {CARDIO_ACTIVITY_LABELS[s.activityType]?.[lang] || s.activityType.replace('_', ' ')} · {s.durationMin}min
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {s.caloriesBurned && <span className="text-xs font-bold text-red-400">~{s.caloriesBurned} kcal</span>}
                                    <button
                                        onClick={() => onDeleteCardio(s.id)}
                                        aria-label={TRANSLATIONS[lang].copy.todayTab.deleteCardioEntry}
                                        className="p-1.5 -m-1 text-zinc-700 hover:text-red-500 transition-colors duration-fast ease-natural rounded-[4px]"
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
                    <div key={mealType} className="premium-theme-panel rounded-[8px] overflow-hidden">
                        <button
                            onClick={() => setExpandedMeal(isExpanded ? null : mealType)}
                            aria-expanded={isExpanded}
                            className="expressive-press w-full flex items-center justify-between p-4"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-xl" aria-hidden="true">{meta.emoji}</span>
                                <div className="text-left">
                                    <p className="font-bold text-white text-sm">{pickLang(lang, meta)}</p>
                                    <p className="text-xs text-muted">{entries.length} {TRANSLATIONS[lang].copy.todayTab.items}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="text-right">
                                    <p className="text-sm font-bold text-zinc-300">{mealCals} kcal</p>
                                    <p className="text-[10px] text-blue-400">{Math.round(mealProt)}g P</p>
                                </div>
                                <Icon name={isExpanded ? 'ChevronUp' : 'ChevronDown'} size={16} className="text-zinc-600" />
                            </div>
                        </button>
                        {isExpanded && (
                            <div className="border-t border-zinc-800 divide-y divide-zinc-800/70">
                                {entries.map((entry) => (
                                    <div key={entry.id} className="flex items-center justify-between px-4 py-3">
                                        <div className="flex-1 min-w-0 pr-2">
                                            <p className="text-sm text-white font-medium truncate">{entry.name}</p>
                                            <p className="text-xs text-muted mt-0.5">
                                                <span className="text-blue-400">{entry.protein}g P</span>{' · '}
                                                <span className="text-amber-400">{entry.carbs}g C</span>{' · '}
                                                <span className="text-pink-400">{entry.fat}g F</span>
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <span className="text-sm font-bold text-zinc-300 mr-1">{entry.calories}</span>
                                            <button
                                                onClick={() => onEditEntry(entry)}
                                                aria-label={TRANSLATIONS[lang].copy.todayTab.editEntry}
                                                className="text-zinc-600 hover:text-zinc-300 transition-colors duration-fast ease-natural active:scale-90 p-2 rounded-[4px]"
                                            >
                                                <Icon name="Pencil" size={14} />
                                            </button>
                                            <button
                                                onClick={() => onDeleteEntry(entry.id)}
                                                aria-label={TRANSLATIONS[lang].copy.todayTab.deleteEntry}
                                                className="text-zinc-700 hover:text-red-500 transition-colors duration-fast ease-natural active:scale-90 p-2 rounded-[4px]"
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
                <div className="text-center py-8 space-y-2">
                    <div className="text-4xl" aria-hidden="true">🥗</div>
                    <p className="text-zinc-500 text-sm">{TRANSLATIONS[lang].copy.todayTab.noFoodLoggedYet}</p>
                    <p className="text-zinc-600 text-xs">{TRANSLATIONS[lang].copy.todayTab.tapAddFoodTo}</p>
                </div>
            )}
        </div>
    );
};
