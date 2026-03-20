
// Curated food database – bilingual (ES/EN), macros per typical serving
export interface FoodItem {
    id: string;
    name: { en: string; es: string };
    serving: string; // e.g. "100g", "1 cup"
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    emoji: string;
    category: 'grain' | 'protein' | 'dairy' | 'fruit' | 'vegetable' | 'fat' | 'legume' | 'snack' | 'drink';
}

export const FOOD_DATABASE: FoodItem[] = [
    // ── GRAINS / CEREALS ──────────────────────────────────────────────
    { id: 'rice_white', name: { en: 'White Rice (cooked)', es: 'Arroz Blanco (cocido)' }, serving: '100g', calories: 130, protein: 2.7, carbs: 28, fats: 0.3, emoji: '🍚', category: 'grain' },
    { id: 'rice_brown', name: { en: 'Brown Rice (cooked)', es: 'Arroz Integral (cocido)' }, serving: '100g', calories: 112, protein: 2.6, carbs: 23, fats: 0.9, emoji: '🍚', category: 'grain' },
    { id: 'oats', name: { en: 'Rolled Oats', es: 'Avena' }, serving: '40g (dry)', calories: 148, protein: 5.4, carbs: 26, fats: 2.6, emoji: '🥣', category: 'grain' },
    { id: 'pasta_cooked', name: { en: 'Pasta (cooked)', es: 'Pasta (cocida)' }, serving: '100g', calories: 131, protein: 5, carbs: 25, fats: 1.1, emoji: '🍝', category: 'grain' },
    { id: 'bread_white', name: { en: 'White Bread', es: 'Pan Blanco' }, serving: '1 slice (30g)', calories: 79, protein: 2.7, carbs: 15, fats: 1, emoji: '🍞', category: 'grain' },
    { id: 'bread_whole', name: { en: 'Whole Wheat Bread', es: 'Pan Integral' }, serving: '1 slice (30g)', calories: 69, protein: 3.5, carbs: 12, fats: 1, emoji: '🍞', category: 'grain' },
    { id: 'tortilla_corn', name: { en: 'Corn Tortilla', es: 'Tortilla de Maíz' }, serving: '1 unit (28g)', calories: 58, protein: 1.5, carbs: 12, fats: 0.6, emoji: '🫓', category: 'grain' },
    { id: 'tortilla_flour', name: { en: 'Flour Tortilla', es: 'Tortilla de Harina' }, serving: '1 unit (45g)', calories: 146, protein: 3.8, carbs: 24, fats: 4, emoji: '🫓', category: 'grain' },
    { id: 'quinoa', name: { en: 'Quinoa (cooked)', es: 'Quinoa (cocida)' }, serving: '100g', calories: 120, protein: 4.4, carbs: 21, fats: 1.9, emoji: '🌾', category: 'grain' },
    { id: 'potato', name: { en: 'Potato (boiled)', es: 'Papa / Patata (hervida)' }, serving: '150g', calories: 116, protein: 2.5, carbs: 26, fats: 0.1, emoji: '🥔', category: 'grain' },
    { id: 'sweet_potato', name: { en: 'Sweet Potato', es: 'Camote / Batata' }, serving: '100g', calories: 86, protein: 1.6, carbs: 20, fats: 0.1, emoji: '🍠', category: 'grain' },
    { id: 'corn', name: { en: 'Corn (boiled)', es: 'Choclo / Maíz' }, serving: '100g', calories: 96, protein: 3.4, carbs: 21, fats: 1.5, emoji: '🌽', category: 'grain' },
    { id: 'arepa', name: { en: 'Arepa', es: 'Arepa' }, serving: '1 unit (100g)', calories: 200, protein: 4, carbs: 38, fats: 3, emoji: '🫓', category: 'grain' },

    // ── PROTEINS ──────────────────────────────────────────────────────
    { id: 'chicken_breast', name: { en: 'Chicken Breast (cooked)', es: 'Pechuga de Pollo (cocida)' }, serving: '100g', calories: 165, protein: 31, carbs: 0, fats: 3.6, emoji: '🍗', category: 'protein' },
    { id: 'chicken_thigh', name: { en: 'Chicken Thigh (cooked)', es: 'Muslo de Pollo (cocido)' }, serving: '100g', calories: 209, protein: 26, carbs: 0, fats: 11, emoji: '🍗', category: 'protein' },
    { id: 'beef_lean', name: { en: 'Lean Ground Beef (90%)', es: 'Carne Molida Magra (90%)' }, serving: '100g', calories: 176, protein: 25, carbs: 0, fats: 8, emoji: '🥩', category: 'protein' },
    { id: 'beef_steak', name: { en: 'Beef Steak', es: 'Bife / Churrasco' }, serving: '100g', calories: 187, protein: 26, carbs: 0, fats: 9, emoji: '🥩', category: 'protein' },
    { id: 'salmon', name: { en: 'Salmon', es: 'Salmón' }, serving: '100g', calories: 208, protein: 20, carbs: 0, fats: 13, emoji: '🐟', category: 'protein' },
    { id: 'tuna_can', name: { en: 'Canned Tuna', es: 'Atún en Lata' }, serving: '1 can (85g)', calories: 100, protein: 22, carbs: 0, fats: 1, emoji: '🐟', category: 'protein' },
    { id: 'tilapia', name: { en: 'Tilapia (cooked)', es: 'Tilapia (cocida)' }, serving: '100g', calories: 128, protein: 26, carbs: 0, fats: 3, emoji: '🐟', category: 'protein' },
    { id: 'eggs', name: { en: 'Whole Egg', es: 'Huevo Entero' }, serving: '1 unit (50g)', calories: 72, protein: 6.3, carbs: 0.4, fats: 5, emoji: '🥚', category: 'protein' },
    { id: 'egg_whites', name: { en: 'Egg Whites', es: 'Claras de Huevo' }, serving: '100ml', calories: 52, protein: 10.9, carbs: 0.7, fats: 0.2, emoji: '🥚', category: 'protein' },
    { id: 'shrimp', name: { en: 'Shrimp (cooked)', es: 'Camarones (cocidos)' }, serving: '100g', calories: 99, protein: 24, carbs: 0.2, fats: 0.3, emoji: '🦐', category: 'protein' },
    { id: 'pork_loin', name: { en: 'Pork Loin', es: 'Lomo de Cerdo' }, serving: '100g', calories: 143, protein: 26, carbs: 0, fats: 4, emoji: '🥩', category: 'protein' },
    { id: 'turkey_breast', name: { en: 'Turkey Breast', es: 'Pechuga de Pavo' }, serving: '100g', calories: 135, protein: 30, carbs: 0, fats: 1, emoji: '🦃', category: 'protein' },
    { id: 'whey_protein', name: { en: 'Whey Protein', es: 'Proteína de Suero' }, serving: '1 scoop (30g)', calories: 120, protein: 24, carbs: 3, fats: 1.5, emoji: '🧃', category: 'protein' },

    // ── DAIRY ─────────────────────────────────────────────────────────
    { id: 'greek_yogurt', name: { en: 'Greek Yogurt (0% fat)', es: 'Yogur Griego (0% grasa)' }, serving: '100g', calories: 59, protein: 10, carbs: 3.6, fats: 0.4, emoji: '🥛', category: 'dairy' },
    { id: 'cottage_cheese', name: { en: 'Cottage Cheese', es: 'Queso Cottage' }, serving: '100g', calories: 98, protein: 11, carbs: 3.4, fats: 4.3, emoji: '🧀', category: 'dairy' },
    { id: 'milk_skim', name: { en: 'Skim Milk', es: 'Leche Descremada' }, serving: '240ml', calories: 83, protein: 8.3, carbs: 12, fats: 0.2, emoji: '🥛', category: 'dairy' },
    { id: 'milk_whole', name: { en: 'Whole Milk', es: 'Leche Entera' }, serving: '240ml', calories: 149, protein: 8, carbs: 12, fats: 8, emoji: '🥛', category: 'dairy' },
    { id: 'cheese_mozzarella', name: { en: 'Mozzarella Cheese', es: 'Queso Mozzarella' }, serving: '30g', calories: 85, protein: 6.3, carbs: 0.6, fats: 6.3, emoji: '🧀', category: 'dairy' },
    { id: 'cheese_cheddar', name: { en: 'Cheddar Cheese', es: 'Queso Cheddar' }, serving: '30g', calories: 113, protein: 7, carbs: 0.4, fats: 9.3, emoji: '🧀', category: 'dairy' },

    // ── LEGUMES ───────────────────────────────────────────────────────
    { id: 'black_beans', name: { en: 'Black Beans (cooked)', es: 'Frijoles Negros (cocidos)' }, serving: '100g', calories: 132, protein: 8.9, carbs: 24, fats: 0.5, emoji: '🫘', category: 'legume' },
    { id: 'lentils', name: { en: 'Lentils (cooked)', es: 'Lentejas (cocidas)' }, serving: '100g', calories: 116, protein: 9, carbs: 20, fats: 0.4, emoji: '🫘', category: 'legume' },
    { id: 'chickpeas', name: { en: 'Chickpeas (cooked)', es: 'Garbanzos (cocidos)' }, serving: '100g', calories: 164, protein: 8.9, carbs: 27, fats: 2.6, emoji: '🫘', category: 'legume' },
    { id: 'kidney_beans', name: { en: 'Kidney Beans (cooked)', es: 'Frijoles Rojos (cocidos)' }, serving: '100g', calories: 127, protein: 8.7, carbs: 22, fats: 0.5, emoji: '🫘', category: 'legume' },
    { id: 'edamame', name: { en: 'Edamame', es: 'Edamame' }, serving: '100g', calories: 121, protein: 11, carbs: 8.9, fats: 5.2, emoji: '🫛', category: 'legume' },
    { id: 'peanut_butter', name: { en: 'Peanut Butter', es: 'Mantequilla de Maní' }, serving: '2 tbsp (32g)', calories: 191, protein: 7.1, carbs: 6.3, fats: 16, emoji: '🥜', category: 'fat' },

    // ── FRUITS ────────────────────────────────────────────────────────
    { id: 'banana', name: { en: 'Banana', es: 'Banana / Guineo' }, serving: '1 medium (118g)', calories: 105, protein: 1.3, carbs: 27, fats: 0.4, emoji: '🍌', category: 'fruit' },
    { id: 'apple', name: { en: 'Apple', es: 'Manzana' }, serving: '1 medium (182g)', calories: 95, protein: 0.5, carbs: 25, fats: 0.3, emoji: '🍎', category: 'fruit' },
    { id: 'avocado', name: { en: 'Avocado', es: 'Aguacate / Palta' }, serving: '½ unit (68g)', calories: 114, protein: 1.3, carbs: 6, fats: 10.5, emoji: '🥑', category: 'fruit' },
    { id: 'strawberries', name: { en: 'Strawberries', es: 'Frutillas / Fresas' }, serving: '100g', calories: 32, protein: 0.7, carbs: 7.7, fats: 0.3, emoji: '🍓', category: 'fruit' },
    { id: 'mango', name: { en: 'Mango', es: 'Mango' }, serving: '100g', calories: 60, protein: 0.8, carbs: 15, fats: 0.4, emoji: '🥭', category: 'fruit' },
    { id: 'blueberries', name: { en: 'Blueberries', es: 'Arándanos' }, serving: '100g', calories: 57, protein: 0.7, carbs: 14, fats: 0.3, emoji: '🫐', category: 'fruit' },
    { id: 'orange', name: { en: 'Orange', es: 'Naranja' }, serving: '1 unit (131g)', calories: 62, protein: 1.2, carbs: 15, fats: 0.2, emoji: '🍊', category: 'fruit' },
    { id: 'grapes', name: { en: 'Grapes', es: 'Uvas' }, serving: '100g', calories: 69, protein: 0.7, carbs: 18, fats: 0.2, emoji: '🍇', category: 'fruit' },

    // ── VEGETABLES ────────────────────────────────────────────────────
    { id: 'broccoli', name: { en: 'Broccoli', es: 'Brócoli' }, serving: '100g', calories: 34, protein: 2.8, carbs: 7, fats: 0.4, emoji: '🥦', category: 'vegetable' },
    { id: 'spinach', name: { en: 'Spinach', es: 'Espinaca' }, serving: '100g', calories: 23, protein: 2.9, carbs: 3.6, fats: 0.4, emoji: '🥬', category: 'vegetable' },
    { id: 'lettuce', name: { en: 'Lettuce', es: 'Lechuga' }, serving: '100g', calories: 15, protein: 1.4, carbs: 2.9, fats: 0.2, emoji: '🥬', category: 'vegetable' },
    { id: 'tomato', name: { en: 'Tomato', es: 'Tomate' }, serving: '1 medium (123g)', calories: 22, protein: 1.1, carbs: 4.8, fats: 0.2, emoji: '🍅', category: 'vegetable' },
    { id: 'carrot', name: { en: 'Carrot', es: 'Zanahoria' }, serving: '100g', calories: 41, protein: 0.9, carbs: 10, fats: 0.2, emoji: '🥕', category: 'vegetable' },
    { id: 'cucumber', name: { en: 'Cucumber', es: 'Pepino' }, serving: '100g', calories: 15, protein: 0.7, carbs: 3.6, fats: 0.1, emoji: '🥒', category: 'vegetable' },
    { id: 'bell_pepper', name: { en: 'Bell Pepper', es: 'Morrón / Pimiento' }, serving: '1 unit (119g)', calories: 31, protein: 1, carbs: 7.5, fats: 0.3, emoji: '🫑', category: 'vegetable' },
    { id: 'zucchini', name: { en: 'Zucchini', es: 'Zucchini / Calabacín' }, serving: '100g', calories: 17, protein: 1.2, carbs: 3.1, fats: 0.3, emoji: '🥒', category: 'vegetable' },
    { id: 'onion', name: { en: 'Onion', es: 'Cebolla' }, serving: '100g', calories: 40, protein: 1.1, carbs: 9.3, fats: 0.1, emoji: '🧅', category: 'vegetable' },

    // ── FATS / OILS ───────────────────────────────────────────────────
    { id: 'olive_oil', name: { en: 'Olive Oil', es: 'Aceite de Oliva' }, serving: '1 tbsp (14g)', calories: 119, protein: 0, carbs: 0, fats: 13.5, emoji: '🫒', category: 'fat' },
    { id: 'almonds', name: { en: 'Almonds', es: 'Almendras' }, serving: '30g (handful)', calories: 174, protein: 6.3, carbs: 6, fats: 15, emoji: '🌰', category: 'fat' },
    { id: 'walnuts', name: { en: 'Walnuts', es: 'Nueces' }, serving: '30g', calories: 196, protein: 4.6, carbs: 4, fats: 19.6, emoji: '🌰', category: 'fat' },
    { id: 'peanuts', name: { en: 'Peanuts', es: 'Maní / Cacahuetes' }, serving: '30g', calories: 170, protein: 7.7, carbs: 6.1, fats: 14.6, emoji: '🥜', category: 'fat' },
    { id: 'butter', name: { en: 'Butter', es: 'Mantequilla' }, serving: '1 tbsp (14g)', calories: 102, protein: 0.1, carbs: 0, fats: 11.5, emoji: '🧈', category: 'fat' },

    // ── SNACKS & FAST FOOD ────────────────────────────────────────────
    { id: 'pizza_slice', name: { en: 'Pizza Slice (cheese)', es: 'Porción de Pizza (queso)' }, serving: '1 slice (107g)', calories: 285, protein: 12, carbs: 36, fats: 10, emoji: '🍕', category: 'snack' },
    { id: 'burger', name: { en: 'Cheeseburger', es: 'Hamburguesa con Queso' }, serving: '1 unit (160g)', calories: 400, protein: 25, carbs: 30, fats: 20, emoji: '🍔', category: 'snack' },
    { id: 'fries', name: { en: 'French Fries', es: 'Papas Fritas' }, serving: '100g (medium)', calories: 312, protein: 3.4, carbs: 41, fats: 15, emoji: '🍟', category: 'snack' },
    { id: 'dark_chocolate', name: { en: 'Dark Chocolate (70%)', es: 'Chocolate Negro (70%)' }, serving: '30g', calories: 167, protein: 2.5, carbs: 13, fats: 12, emoji: '🍫', category: 'snack' },
    { id: 'granola_bar', name: { en: 'Granola Bar', es: 'Barra de Granola' }, serving: '1 bar (47g)', calories: 190, protein: 4, carbs: 29, fats: 7, emoji: '🍫', category: 'snack' },
    { id: 'protein_bar', name: { en: 'Protein Bar', es: 'Barra Proteica' }, serving: '1 bar (60g)', calories: 220, protein: 20, carbs: 22, fats: 7, emoji: '🍫', category: 'snack' },
    { id: 'rice_cake', name: { en: 'Rice Cakes', es: 'Tortas de Arroz' }, serving: '2 units (18g)', calories: 70, protein: 1.4, carbs: 14.5, fats: 0.5, emoji: '⚪', category: 'snack' },

    // ── DRINKS ────────────────────────────────────────────────────────
    { id: 'orange_juice', name: { en: 'Orange Juice', es: 'Jugo de Naranja' }, serving: '240ml', calories: 112, protein: 1.7, carbs: 26, fats: 0.5, emoji: '🍊', category: 'drink' },
    { id: 'whole_milk_d', name: { en: 'Whole Milk', es: 'Leche Entera' }, serving: '240ml', calories: 149, protein: 8, carbs: 12, fats: 8, emoji: '🥛', category: 'drink' },
    { id: 'sports_drink', name: { en: 'Sports Drink (Gatorade)', es: 'Bebida Deportiva (Gatorade)' }, serving: '500ml', calories: 130, protein: 0, carbs: 35, fats: 0, emoji: '💧', category: 'drink' },

    // ── POPULAR LATIN DISHES ──────────────────────────────────────────
    { id: 'empanada', name: { en: 'Empanada (baked, beef)', es: 'Empanada (horneada, carne)' }, serving: '1 unit (90g)', calories: 260, protein: 12, carbs: 28, fats: 11, emoji: '🥟', category: 'snack' },
    { id: 'asado_steak', name: { en: 'Grilled Steak (Asado)', es: 'Asado / Bife de Chorizo' }, serving: '150g', calories: 280, protein: 39, carbs: 0, fats: 14, emoji: '🥩', category: 'protein' },
    { id: 'milanesa', name: { en: 'Breaded Cutlet (Milanesa)', es: 'Milanesa de Carne' }, serving: '120g', calories: 330, protein: 28, carbs: 18, fats: 15, emoji: '🍖', category: 'protein' },
    { id: 'guiso', name: { en: 'Bean Stew (Guiso)', es: 'Guiso de Lentejas' }, serving: '250g', calories: 280, protein: 14, carbs: 38, fats: 7, emoji: '🍲', category: 'legume' },
    { id: 'medialunas', name: { en: 'Croissant', es: 'Medialunas' }, serving: '2 units (80g)', calories: 290, protein: 6, carbs: 36, fats: 14, emoji: '🥐', category: 'snack' },
    { id: 'dulce_leche', name: { en: 'Dulce de Leche', es: 'Dulce de Leche' }, serving: '2 tbsp (40g)', calories: 120, protein: 2.8, carbs: 24, fats: 2, emoji: '🍯', category: 'snack' },
];

export function searchFoods(query: string, lang: 'en' | 'es'): FoodItem[] {
    if (!query || query.length < 2) return [];
    const q = query.toLowerCase().trim();
    return FOOD_DATABASE
        .filter(f => {
            const name = lang === 'es' ? f.name.es : f.name.en;
            const otherName = lang === 'es' ? f.name.en : f.name.es;
            return name.toLowerCase().includes(q) || otherName.toLowerCase().includes(q);
        })
        .slice(0, 12);
}
