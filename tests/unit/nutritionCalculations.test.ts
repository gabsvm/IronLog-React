import { describe, it, expect } from 'vitest';
import { sumMacros, calcTDEE, calcStreak } from '../../views/nutri/nutritionHelpers';
import { FoodEntry, NutritionLog } from '../../types';
import { todayLocalDateKey, addLocalDays } from '../../utils/localDate';

describe('nutrition calculations & streak', () => {
    it('sums macros correctly from food entries', () => {
        const entries: FoodEntry[] = [
            { id: '1', name: 'Oats', mealType: 'breakfast', timestamp: 1000, calories: 350, protein: 12, carbs: 60, fat: 5 },
            { id: '2', name: 'Whey', mealType: 'breakfast', timestamp: 1001, calories: 120, protein: 24, carbs: 2, fat: 1 },
            { id: '3', name: 'Chicken', mealType: 'lunch', timestamp: 1002, calories: 300, protein: 50, carbs: 0, fat: 10 },
        ];

        const totals = sumMacros(entries);
        expect(totals.calories).toBe(770);
        expect(totals.protein).toBe(86);
        expect(totals.carbs).toBe(62);
        expect(totals.fat).toBe(16);
    });

    it('calculates TDEE using Mifflin-St Jeor formula with activity multiplier', () => {
        const maleProfile = {
            bodyWeight: 80,
            height: 180,
            age: 30,
            gender: 'male',
            activityLevel: 'moderate', // 1.55
        };

        // BMR = 10 * 80 + 6.25 * 180 - 5 * 30 + 5 = 800 + 1125 - 150 + 5 = 1780
        // TDEE = round(1780 * 1.55) = 2759
        expect(calcTDEE(maleProfile)).toBe(2759);

        const femaleProfile = {
            bodyWeight: 60,
            height: 165,
            age: 25,
            gender: 'female',
            activityLevel: 'sedentary', // 1.2
        };
        // BMR = 10 * 60 + 6.25 * 165 - 5 * 25 - 161 = 600 + 1031.25 - 125 - 161 = 1345.25
        // TDEE = round(1345.25 * 1.2) = 1614
        expect(calcTDEE(femaleProfile)).toBe(1614);
    });

    it('returns null if profile is missing required TDEE inputs', () => {
        expect(calcTDEE(null)).toBeNull();
        expect(calcTDEE({ bodyWeight: 75 })).toBeNull();
    });

    it('calculates consecutive streak correctly when today is already logged', () => {
        const today = todayLocalDateKey();
        const yesterday = addLocalDays(today, -1);
        const twoDaysAgo = addLocalDays(today, -2);

        const logs: NutritionLog[] = [
            { date: today, waterMl: 1000, entries: [{ id: '1', name: 'Meal', mealType: 'lunch', timestamp: 1000, calories: 500, protein: 30, carbs: 50, fat: 15 }] },
            { date: yesterday, waterMl: 2000, entries: [{ id: '2', name: 'Meal', mealType: 'lunch', timestamp: 2000, calories: 500, protein: 30, carbs: 50, fat: 15 }] },
            { date: twoDaysAgo, waterMl: 1500, entries: [{ id: '3', name: 'Meal', mealType: 'lunch', timestamp: 3000, calories: 500, protein: 30, carbs: 50, fat: 15 }] },
        ];

        expect(calcStreak(logs)).toBe(3);
    });

    it('tolerates today not logged yet if yesterday is logged (streak continues)', () => {
        const today = todayLocalDateKey();
        const yesterday = addLocalDays(today, -1);
        const twoDaysAgo = addLocalDays(today, -2);

        const logs: NutritionLog[] = [
            { date: yesterday, waterMl: 2000, entries: [{ id: '2', name: 'Meal', mealType: 'lunch', timestamp: 2000, calories: 500, protein: 30, carbs: 50, fat: 15 }] },
            { date: twoDaysAgo, waterMl: 1500, entries: [{ id: '3', name: 'Meal', mealType: 'lunch', timestamp: 3000, calories: 500, protein: 30, carbs: 50, fat: 15 }] },
        ];

        expect(calcStreak(logs)).toBe(2);
    });

    it('breaks streak when a day is missing', () => {
        const today = todayLocalDateKey();
        const twoDaysAgo = addLocalDays(today, -2); // missed yesterday!

        const logs: NutritionLog[] = [
            { date: today, waterMl: 1000, entries: [{ id: '1', name: 'Meal', mealType: 'lunch', timestamp: 1000, calories: 500, protein: 30, carbs: 50, fat: 15 }] },
            { date: twoDaysAgo, waterMl: 1500, entries: [{ id: '3', name: 'Meal', mealType: 'lunch', timestamp: 3000, calories: 500, protein: 30, carbs: 50, fat: 15 }] },
        ];

        expect(calcStreak(logs)).toBe(1);
    });
});
