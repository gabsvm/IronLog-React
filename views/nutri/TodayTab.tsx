import React from 'react';
import { FoodEntry, NutritionLog, NutritionGoal, CardioSession } from '../../types';
import { Icon } from '../../components/ui/Icon';
import { MacroRing } from '../../components/nutrition/MacroRing';
import { MacroBar } from './MacroBar';
import { WaterTracker } from './WaterTracker';
import { MEAL_ORDER, MEAL_META, ACTIVITY_EMOJI } from './nutritionHelpers';

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
}) => {
    const l = (en: string, es: string) => (lang === 'en' ? en : es);

    return (
        <div className="space-y-3 pt-1">
            {/* Hero card — calories + key metrics */}
            <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-4">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">
                            {l('Today', 'Hoy')}
                            {streak > 1 && (
                                <span className="ml-2 text-orange-400">🔥 {streak} {l('day streak', 'días seguidos')}</span>
                            )}
                        </p>
                        <div className={`text-4xl font-black leading-none ${caloriesRemaining < 0 ? 'text-orange-400' : caloriesRemaining < 200 ? 'text-yellow-400' : 'text-white'}`}>
                            {caloriesRemaining > 0 ? caloriesRemaining : Math.abs(caloriesRemaining)}
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">
                            {caloriesRemaining >= 0
                                ? l('kcal remaining', 'kcal restantes')
                                : l('kcal over goal', 'kcal sobre la meta')}
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
                    <MacroBar value={todayMacros.protein} goal={nutritionGoal.protein} color="text-blue-400" label={l('Protein', 'Proteína')} />
                    <MacroBar value={todayMacros.carbs} goal={nutritionGoal.carbs} color="text-amber-400" label="Carbs" />
                    <MacroBar value={todayMacros.fat} goal={nutritionGoal.fat} color="text-pink-400" label={l('Fat', 'Grasa')} />
                </div>

                {/* Protein callout */}
                {proteinRemaining > 0 && (
                    <div className="mt-3 pt-3 border-t border-zinc-800 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                        <p className="text-[11px] text-zinc-400">
                            <span className="text-blue-400 font-bold">{Math.round(proteinRemaining)}g</span>{' '}
                            {l('protein to hit your goal', 'de proteína para llegar a tu meta')}
                        </p>
                    </div>
                )}

                {/* Cardio burned row */}
                {caloriesBurned > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                        <p className="text-[11px] text-zinc-400">
                            <span className="text-red-400 font-bold">+{caloriesBurned} kcal</span>{' '}
                            {l('burned from cardio — added to budget', 'quemadas en cardio — sumadas al presupuesto')}
                        </p>
                    </div>
                )}

                <button
                    onClick={onEditGoals}
                    className="mt-3 w-full text-center text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors duration-fast ease-natural"
                >
                    {l('Edit Goals', 'Editar Metas')} →
                </button>
            </div>

            {/* Water tracker */}
            <WaterTracker waterMl={todayWater} onAdd={onAddWater} lang={lang} />

            {/* Quick actions */}
            <div className="grid grid-cols-2 gap-2">
                <button
                    onClick={onAddMeal}
                    aria-label={l('Add food entry', 'Agregar entrada de comida')}
                    className="flex items-center justify-center gap-2 p-4 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 active:scale-95 transition-all duration-fast ease-natural"
                >
                    <div className="w-8 h-8 rounded-xl bg-green-500/15 flex items-center justify-center">
                        <Icon name="Plus" size={16} className="text-green-400" />
                    </div>
                    <span className="text-sm font-bold text-white">{l('Add Food', 'Agregar Comida')}</span>
                </button>
                <button
                    onClick={onAddCardio}
                    aria-label={l('Log cardio session', 'Registrar sesión de cardio')}
                    className="flex items-center justify-center gap-2 p-4 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 active:scale-95 transition-all duration-fast ease-natural"
                >
                    <div className="w-8 h-8 rounded-xl bg-red-500/15 flex items-center justify-center">
                        <Icon name="Flame" size={16} className="text-red-400" />
                    </div>
                    <span className="text-sm font-bold text-white">{l('Log Cardio', 'Cardio')}</span>
                </button>
            </div>

            {/* Today cardio summary */}
            {todayCardio.length > 0 && (
                <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-3">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">
                        {l("Today's Cardio", 'Cardio de Hoy')}
                    </p>
                    <div className="space-y-1.5">
                        {todayCardio.map((s) => (
                            <div key={s.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm">
                                    <span aria-hidden="true">{ACTIVITY_EMOJI[s.activityType] || '🏋️'}</span>
                                    <span className="text-zinc-300 capitalize text-xs">
                                        {s.activityType.replace('_', ' ')} · {s.durationMin}min
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {s.caloriesBurned && <span className="text-xs font-bold text-red-400">~{s.caloriesBurned} kcal</span>}
                                    <button
                                        onClick={() => onDeleteCardio(s.id)}
                                        aria-label={l('Delete cardio entry', 'Borrar entrada de cardio')}
                                        className="text-zinc-700 hover:text-red-500 transition-colors duration-fast ease-natural"
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
                    <div key={mealType} className="bg-zinc-900 rounded-3xl border border-zinc-800 overflow-hidden">
                        <button
                            onClick={() => setExpandedMeal(isExpanded ? null : mealType)}
                            aria-expanded={isExpanded}
                            className="w-full flex items-center justify-between p-4"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-xl" aria-hidden="true">{meta.emoji}</span>
                                <div className="text-left">
                                    <p className="font-bold text-white text-sm">{lang === 'en' ? meta.en : meta.es}</p>
                                    <p className="text-[10px] text-zinc-500">{entries.length} {l('items', 'alimentos')}</p>
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
                                            <p className="text-[10px] text-zinc-500 mt-0.5">
                                                <span className="text-blue-400">{entry.protein}g P</span>{' · '}
                                                <span className="text-amber-400">{entry.carbs}g C</span>{' · '}
                                                <span className="text-pink-400">{entry.fat}g F</span>
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <span className="text-sm font-bold text-zinc-300 mr-1">{entry.calories}</span>
                                            <button
                                                onClick={() => onEditEntry(entry)}
                                                aria-label={l('Edit entry', 'Editar entrada')}
                                                className="text-zinc-600 hover:text-zinc-300 transition-colors duration-fast ease-natural active:scale-90 p-2 rounded-lg"
                                            >
                                                <Icon name="Pencil" size={14} />
                                            </button>
                                            <button
                                                onClick={() => onDeleteEntry(entry.id)}
                                                aria-label={l('Delete entry', 'Borrar entrada')}
                                                className="text-zinc-700 hover:text-red-500 transition-colors duration-fast ease-natural active:scale-90 p-2 rounded-lg"
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
                    <p className="text-zinc-500 text-sm">{l('No food logged yet.', 'Sin comidas registradas.')}</p>
                    <p className="text-zinc-600 text-xs">{l('Tap "Add Food" to start.', 'Toca "Agregar Comida" para empezar.')}</p>
                </div>
            )}
        </div>
    );
};
