import { NutritionLog, FoodEntry } from '../../types';

export const todayStr = () => new Date().toISOString().split('T')[0];

export const getTodayLog = (logs: NutritionLog[]): NutritionLog => {
    const today = todayStr();
    return logs.find((l) => l.date === today) || { date: today, entries: [], waterMl: 0 };
};

export const sumMacros = (entries: FoodEntry[]) =>
    entries.reduce(
        (acc, e) => ({
            calories: acc.calories + e.calories,
            protein: acc.protein + e.protein,
            carbs: acc.carbs + e.carbs,
            fat: acc.fat + e.fat,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );

export const MEAL_ORDER = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

export const MEAL_META: Record<string, { emoji: string; en: string; es: string; color: string }> = {
    breakfast: { emoji: '🌅', en: 'Breakfast', es: 'Desayuno', color: 'text-amber-400' },
    lunch: { emoji: '☀️', en: 'Lunch', es: 'Almuerzo', color: 'text-yellow-400' },
    dinner: { emoji: '🌙', en: 'Dinner', es: 'Cena', color: 'text-blue-400' },
    snack: { emoji: '🍎', en: 'Snack', es: 'Snack', color: 'text-green-400' },
};

export const ACTIVITY_EMOJI: Record<string, string> = {
    running: '🏃', cycling: '🚴', walking: '🚶', swimming: '🏊',
    rowing: '🚣', elliptical: '⚙️', jump_rope: '🪢', hiit: '⚡', other: '🏋️',
};

export const WATER_GOAL_ML = 2500;
export const WATER_PRESETS = [200, 300, 500];

/**
 * Consecutive-day streak of nutrition logging.
 * Tolerant: today counts even if not logged yet.
 */
export const calcStreak = (logs: NutritionLog[]): number => {
    const loggedDates = new Set(logs.filter((l) => l.entries.length > 0).map((l) => l.date));
    const today = todayStr();
    const startOffset = loggedDates.has(today) ? 0 : 1;
    let streak = 0;
    const d = new Date();
    for (let i = startOffset; i < 365; i++) {
        const check = new Date(d);
        check.setDate(d.getDate() - i);
        if (!loggedDates.has(check.toISOString().split('T')[0])) break;
        streak++;
    }
    return streak;
};

/**
 * Mifflin-St Jeor TDEE estimation. Returns null if profile lacks the inputs.
 */
export const calcTDEE = (profile: any): number | null => {
    if (!profile?.bodyWeight || !profile?.height || !profile?.age) return null;
    const w = profile.bodyWeight;
    const h = profile.height;
    const a = profile.age;
    const isMale = profile.gender !== 'female';
    const bmr = isMale ? 10 * w + 6.25 * h - 5 * a + 5 : 10 * w + 6.25 * h - 5 * a - 161;
    const multipliers: Record<string, number> = {
        sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9,
    };
    return Math.round(bmr * (multipliers[profile.activityLevel || 'moderate'] ?? 1.55));
};
