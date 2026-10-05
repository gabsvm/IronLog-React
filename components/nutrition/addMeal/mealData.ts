// U5: meal types, preset foods and portion multipliers, moved verbatim from components/nutrition/AddMealModal.tsx.
import { CustomFood } from '../../../types';

export const MEAL_TYPES = [
  { id: 'breakfast', en: 'Breakfast', es: 'Desayuno', icon: 'Sunrise' },
  { id: 'lunch', en: 'Lunch', es: 'Almuerzo', icon: 'Sun' },
  { id: 'dinner', en: 'Dinner', es: 'Cena', icon: 'Moon' },
  { id: 'snack', en: 'Snack', es: 'Snack', icon: 'Apple' },
] as const;

export const PRESET_DB: (CustomFood & { category: string })[] = [
  { id: 'p_chicken_150', name: 'Pechuga de pollo (150g)', calories: 248, protein: 47, carbs: 0, fat: 5, servingSize: '150g', category: 'protein', isFavorite: false, createdAt: 0 },
  { id: 'p_chicken_100', name: 'Pechuga de pollo (100g)', calories: 165, protein: 31, carbs: 0, fat: 4, servingSize: '100g', category: 'protein', isFavorite: false, createdAt: 0 },
  { id: 'p_whey', name: 'Proteina Whey (1 scoop)', calories: 120, protein: 25, carbs: 3, fat: 2, servingSize: '30g', category: 'protein', isFavorite: false, createdAt: 0 },
  { id: 'p_egg', name: 'Huevo entero', calories: 78, protein: 6, carbs: 1, fat: 5, servingSize: '1 u', category: 'protein', isFavorite: false, createdAt: 0 },
  { id: 'p_whites_3', name: 'Claras de huevo (3u)', calories: 51, protein: 11, carbs: 0, fat: 0, servingSize: '3u', category: 'protein', isFavorite: false, createdAt: 0 },
  { id: 'p_tuna', name: 'Atun al natural (100g)', calories: 100, protein: 22, carbs: 0, fat: 1, servingSize: '100g', category: 'protein', isFavorite: false, createdAt: 0 },
  { id: 'p_salmon', name: 'Salmon (100g)', calories: 208, protein: 20, carbs: 0, fat: 13, servingSize: '100g', category: 'protein', isFavorite: false, createdAt: 0 },
  { id: 'p_beef', name: 'Carne molida 90% (100g)', calories: 215, protein: 21, carbs: 0, fat: 14, servingSize: '100g', category: 'protein', isFavorite: false, createdAt: 0 },
  { id: 'p_greek_200', name: 'Yogur griego (200g)', calories: 117, protein: 20, carbs: 5, fat: 1, servingSize: '200g', category: 'protein', isFavorite: false, createdAt: 0 },
  { id: 'p_cottage', name: 'Queso cottage (150g)', calories: 120, protein: 18, carbs: 4, fat: 3, servingSize: '150g', category: 'protein', isFavorite: false, createdAt: 0 },
  { id: 'p_turkey', name: 'Pechuga de pavo (100g)', calories: 135, protein: 28, carbs: 0, fat: 3, servingSize: '100g', category: 'protein', isFavorite: false, createdAt: 0 },
  { id: 'c_rice_200', name: 'Arroz cocido (200g)', calories: 260, protein: 5, carbs: 57, fat: 0, servingSize: '200g', category: 'carbs', isFavorite: false, createdAt: 0 },
  { id: 'c_rice_100', name: 'Arroz cocido (100g)', calories: 130, protein: 3, carbs: 28, fat: 0, servingSize: '100g', category: 'carbs', isFavorite: false, createdAt: 0 },
  { id: 'c_oats_50', name: 'Avena seca (50g)', calories: 185, protein: 6, carbs: 33, fat: 3, servingSize: '50g', category: 'carbs', isFavorite: false, createdAt: 0 },
  { id: 'c_pasta_200', name: 'Pasta cocida (200g)', calories: 260, protein: 9, carbs: 52, fat: 1, servingSize: '200g', category: 'carbs', isFavorite: false, createdAt: 0 },
  { id: 'c_potato_200', name: 'Papa cocida (200g)', calories: 154, protein: 4, carbs: 35, fat: 0, servingSize: '200g', category: 'carbs', isFavorite: false, createdAt: 0 },
  { id: 'c_bread', name: 'Pan integral (1 rebanada)', calories: 70, protein: 3, carbs: 12, fat: 1, servingSize: '1 u', category: 'carbs', isFavorite: false, createdAt: 0 },
  { id: 'c_banana', name: 'Banana', calories: 89, protein: 1, carbs: 23, fat: 0, servingSize: '1 u', category: 'carbs', isFavorite: false, createdAt: 0 },
  { id: 'c_apple', name: 'Manzana', calories: 52, protein: 0, carbs: 14, fat: 0, servingSize: '1 u', category: 'carbs', isFavorite: false, createdAt: 0 },
  { id: 'c_sweet_potato', name: 'Batata (150g)', calories: 129, protein: 3, carbs: 30, fat: 0, servingSize: '150g', category: 'carbs', isFavorite: false, createdAt: 0 },
  { id: 'f_avocado', name: 'Palta / Aguacate (100g)', calories: 160, protein: 2, carbs: 9, fat: 15, servingSize: '100g', category: 'fats', isFavorite: false, createdAt: 0 },
  { id: 'f_peanutbutter', name: 'Mantequilla de mani (1 cda)', calories: 94, protein: 4, carbs: 3, fat: 8, servingSize: '16g', category: 'fats', isFavorite: false, createdAt: 0 },
  { id: 'f_almonds', name: 'Almendras (30g)', calories: 173, protein: 6, carbs: 6, fat: 15, servingSize: '30g', category: 'fats', isFavorite: false, createdAt: 0 },
  { id: 'f_olive_oil', name: 'Aceite de oliva (1 cda)', calories: 119, protein: 0, carbs: 0, fat: 14, servingSize: '14g', category: 'fats', isFavorite: false, createdAt: 0 },
  { id: 'f_cheese', name: 'Queso fresco (50g)', calories: 75, protein: 10, carbs: 0, fat: 4, servingSize: '50g', category: 'fats', isFavorite: false, createdAt: 0 },
  { id: 'm_milk_250', name: 'Leche descremada (250ml)', calories: 85, protein: 8, carbs: 12, fat: 0, servingSize: '250ml', category: 'mixed', isFavorite: false, createdAt: 0 },
  { id: 'm_granola', name: 'Granola (40g)', calories: 176, protein: 4, carbs: 29, fat: 5, servingSize: '40g', category: 'mixed', isFavorite: false, createdAt: 0 },
];

export const PORTION_MULTIPLIERS = [0.5, 1, 1.5, 2, 3];
