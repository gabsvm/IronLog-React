import React, { useMemo, useState } from 'react';
import { FoodEntry, CustomFood } from '../../types';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';
import { Sheet } from '../ui/Sheet';
import { useApp } from '../../context/AppContext';

interface AddMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (entry: FoodEntry) => void;
  lang: 'en' | 'es';
}

const MEAL_TYPES = [
  { id: 'breakfast', en: 'Breakfast', es: 'Desayuno', icon: 'Sunrise' },
  { id: 'lunch', en: 'Lunch', es: 'Almuerzo', icon: 'Sun' },
  { id: 'dinner', en: 'Dinner', es: 'Cena', icon: 'Moon' },
  { id: 'snack', en: 'Snack', es: 'Snack', icon: 'Apple' },
] as const;

const PRESET_DB: (CustomFood & { category: string })[] = [
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

const PORTION_MULTIPLIERS = [0.5, 1, 1.5, 2, 3];

type ModalTab = 'quick' | 'myfoods' | 'manual';

const FoodCard: React.FC<{
  food: CustomFood | (typeof PRESET_DB)[number];
  onSelect: (food: CustomFood | (typeof PRESET_DB)[number]) => void;
  onToggleFav?: (id: string) => void;
  onDelete?: (id: string) => void;
  multiplier?: number;
  lang: 'en' | 'es';
}> = ({ food, onSelect, onToggleFav, onDelete, multiplier = 1 }) => {
  const calories = Math.round(food.calories * multiplier);
  const protein = Math.round(food.protein * multiplier);

  return (
    <div className="flex items-center gap-3 rounded-2xl p-3 glass-card transition-all active:scale-[0.98]">
      <button onClick={() => onSelect(food)} className="min-w-0 flex-1 text-left">
        <p className="truncate text-sm font-semibold text-white">{food.name}</p>
        <p className="mt-0.5 text-[10px] text-zinc-500">
          <span className="text-zinc-300">{calories}</span> kcal
          {' · '}
          <span className="text-blue-400">{protein}g P</span>
          {food.servingSize && <span className="text-zinc-600">{' · '}{food.servingSize}</span>}
        </p>
      </button>
      <div className="flex shrink-0 items-center gap-1.5">
        {onToggleFav && (
          <button
            onClick={() => onToggleFav(food.id)}
            className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${food.isFavorite ? 'text-yellow-400' : 'text-zinc-600 hover:text-zinc-400'}`}
          >
            <Icon name="Star" size={14} fill={food.isFavorite ? 'currentColor' : 'none'} />
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(food.id)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-700 transition-colors hover:text-red-400"
          >
            <Icon name="Trash2" size={13} />
          </button>
        )}
        <button
          onClick={() => onSelect(food)}
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-700 text-zinc-300 transition-colors hover:bg-zinc-600"
        >
          <Icon name="Plus" size={14} />
        </button>
      </div>
    </div>
  );
};

export const AddMealModal: React.FC<AddMealModalProps> = ({ isOpen, onClose, onAdd, lang }) => {
  const { customFoods, setCustomFoods } = useApp();

  const [tab, setTab] = useState<ModalTab>('quick');
  const [mealType, setMealType] = useState<FoodEntry['mealType']>('lunch');
  const [multiplier, setMultiplier] = useState(1);
  const [search, setSearch] = useState('');
  const [saveToMyFoods, setSaveToMyFoods] = useState(false);
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [servingSize, setServingSize] = useState('');

  const l = (en: string, es: string) => (lang === 'en' ? en : es);

  const resetForm = () => {
    setName('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
    setServingSize('');
    setSaveToMyFoods(false);
  };

  const filteredPresets = useMemo(() => {
    if (!search.trim()) return PRESET_DB;
    const query = search.toLowerCase();
    return PRESET_DB.filter((food) => food.name.toLowerCase().includes(query));
  }, [search]);

  const filteredMyFoods = useMemo(() => {
    if (!search.trim()) return customFoods;
    const query = search.toLowerCase();
    return customFoods.filter((food) => food.name.toLowerCase().includes(query));
  }, [customFoods, search]);

  const sortedMyFoods = useMemo(
    () => [...filteredMyFoods].sort((a, b) => Number(b.isFavorite) - Number(a.isFavorite)),
    [filteredMyFoods],
  );

  const buildEntry = (entryCalories: number, entryProtein: number, entryCarbs: number, entryFat: number, entryName: string): FoodEntry => ({
    id: `meal_${Date.now()}_${Math.random()}`,
    name: multiplier !== 1 ? `${entryName} (x${multiplier})` : entryName,
    calories: Math.round(entryCalories * multiplier),
    protein: Math.round(entryProtein * multiplier),
    carbs: Math.round(entryCarbs * multiplier),
    fat: Math.round(entryFat * multiplier),
    mealType,
    timestamp: Date.now(),
  });

  const handleSelectPreset = (food: CustomFood | (typeof PRESET_DB)[number]) => {
    onAdd(buildEntry(food.calories, food.protein, food.carbs, food.fat, food.name));
    onClose();
  };

  const handleSubmitManual = () => {
    if (!name || !calories) return;

    const parsedCalories = Number(calories) || 0;
    const parsedProtein = Number(protein) || 0;
    const parsedCarbs = Number(carbs) || 0;
    const parsedFat = Number(fat) || 0;

    onAdd(buildEntry(parsedCalories, parsedProtein, parsedCarbs, parsedFat, name));

    if (saveToMyFoods) {
      const newFood: CustomFood = {
        id: `cf_${Date.now()}`,
        name,
        calories: parsedCalories,
        protein: parsedProtein,
        carbs: parsedCarbs,
        fat: parsedFat,
        servingSize: servingSize || undefined,
        isFavorite: false,
        createdAt: Date.now(),
      };
      setCustomFoods((prev) => [newFood, ...prev]);
    }

    resetForm();
    onClose();
  };

  const handleToggleFav = (id: string) => {
    setCustomFoods((prev) => prev.map((food) => (food.id === id ? { ...food, isFavorite: !food.isFavorite } : food)));
  };

  const handleDeleteMyFood = (id: string) => {
    setCustomFoods((prev) => prev.filter((food) => food.id !== id));
  };

  const canSubmitManual = !!name && !!calories;

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title={l('Add Food', 'Agregar Comida')}
      accent="primary"
    >
      <div className="space-y-4 px-5 pb-5">
        <div className="scroll-container flex gap-2 overflow-x-auto pb-0.5">
          {MEAL_TYPES.map((meal) => (
            <button
              key={meal.id}
              onClick={() => setMealType(meal.id as FoodEntry['mealType'])}
              className={`duration-fast ease-natural flex flex-shrink-0 items-center gap-1.5 rounded-2xl border px-3 py-2 text-xs font-bold transition-all active:scale-95 ${
                mealType === meal.id
                  ? 'border-transparent bg-primary-500 text-white shadow-[0_4px_12px] shadow-primary-500/30'
                  : 'border-zinc-700/50 bg-zinc-800 text-zinc-400'
              }`}
            >
              <Icon name={meal.icon as any} size={13} />
              <span>{lang === 'en' ? meal.en : meal.es}</span>
            </button>
          ))}
        </div>

        <div className="flex gap-1 rounded-2xl bg-zinc-800 p-1">
          {([
            { id: 'quick', icon: 'Zap', label: l('Quick Add', 'Rapido') },
            { id: 'myfoods', icon: 'BookOpen', label: l('My Foods', 'Mis Alimentos') },
            { id: 'manual', icon: 'Edit3', label: l('Manual', 'Manual') },
          ] as { id: ModalTab; icon: string; label: string }[]).map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`flex flex-1 items-center justify-center gap-1 rounded-xl py-2 text-[11px] font-bold transition-all ${
                tab === item.id ? 'bg-white font-black text-black' : 'text-zinc-500'
              }`}
            >
              <Icon name={item.icon as any} size={11} />
              {item.label}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {tab !== 'manual' && (
            <div className="flex items-center gap-2">
              <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                {l('Portion', 'Porcion')}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PORTION_MULTIPLIERS.map((value) => (
                  <button
                    key={value}
                    onClick={() => setMultiplier(value)}
                    className={`duration-fast ease-natural rounded-xl border px-3 py-1.5 text-xs font-bold transition-all active:scale-95 ${
                      multiplier === value
                        ? 'border-transparent bg-white text-black shadow-md'
                        : 'border-zinc-700/50 bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    x{value}
                  </button>
                ))}
              </div>
            </div>
          )}

          {tab === 'quick' && (
            <div className="space-y-4">
              <div className="relative">
                <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="search"
                  placeholder={l('Search foods...', 'Buscar alimentos...')}
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="glow-input-neon w-full rounded-2xl border border-zinc-700/50 bg-zinc-800 py-2.5 pl-9 pr-4 text-sm text-white placeholder-zinc-600 transition-all focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              <div className="scroll-container max-h-[350px] space-y-1.5 overflow-y-auto pr-0.5">
                {filteredPresets.length === 0 && (
                  <p className="py-4 text-center text-sm text-zinc-600">{l('No results', 'Sin resultados')}</p>
                )}
                {filteredPresets.map((food) => (
                  <FoodCard
                    key={food.id}
                    food={food}
                    onSelect={handleSelectPreset}
                    multiplier={multiplier}
                    lang={lang}
                  />
                ))}
              </div>
            </div>
          )}

          {tab === 'myfoods' && (
            <div className="space-y-4">
              {customFoods.length === 0 ? (
                <div className="space-y-2 py-10 text-center">
                  <div className="text-3xl">
                    <Icon name="UtensilsCrossed" size={28} className="mx-auto text-zinc-500" />
                  </div>
                  <p className="text-sm font-medium text-zinc-500">
                    {l('No saved foods yet.', 'Sin alimentos guardados aun.')}
                  </p>
                  <p className="mx-auto max-w-[220px] text-xs text-zinc-600">
                    {l(
                      'Add a food manually and save it to build your personal database.',
                      'Agrega un alimento manualmente y guardalo para crear tu base personal.',
                    )}
                  </p>
                  <button
                    onClick={() => setTab('manual')}
                    className="mt-3 rounded-xl bg-zinc-800 px-4 py-2 text-xs font-bold text-zinc-300 transition-transform active:scale-95"
                  >
                    {l('Add manually ->', 'Agregar manualmente ->')}
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="search"
                      placeholder={l('Search my foods...', 'Buscar mis alimentos...')}
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      className="glow-input-neon w-full rounded-2xl border border-zinc-700/50 bg-zinc-800 py-2.5 pl-9 pr-4 text-sm text-white placeholder-zinc-600 transition-all focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                  </div>
                  {sortedMyFoods.length === 0 ? (
                    <p className="py-4 text-center text-sm text-zinc-600">{l('No results', 'Sin resultados')}</p>
                  ) : (
                    <div className="scroll-container max-h-[350px] space-y-1.5 overflow-y-auto pr-0.5">
                      {sortedMyFoods.map((food) => (
                        <FoodCard
                          key={food.id}
                          food={food}
                          onSelect={handleSelectPreset}
                          onToggleFav={handleToggleFav}
                          onDelete={handleDeleteMyFood}
                          multiplier={multiplier}
                          lang={lang}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {tab === 'manual' && (
            <div className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block px-1 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    {l('Food name *', 'Nombre del alimento *')}
                  </label>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="e.g. Greek Yogurt"
                    className="glow-input-neon w-full rounded-2xl border border-zinc-700/50 bg-zinc-800 px-4 py-3 text-sm text-white placeholder-zinc-600 transition-all focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block px-1 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    {l('Calories (kcal) *', 'Calorias (kcal) *')}
                  </label>
                  <input
                    value={calories}
                    onChange={(event) => setCalories(event.target.value)}
                    placeholder="0"
                    type="number"
                    inputMode="numeric"
                    className="glow-input-neon w-full rounded-2xl border border-zinc-700/50 bg-zinc-800 px-4 py-3 text-sm text-white placeholder-zinc-600 transition-all focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block px-1 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    {l('Macros (g)', 'Macros (g)')}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      value={protein}
                      onChange={(event) => setProtein(event.target.value)}
                      placeholder={l('Protein', 'Proteina')}
                      type="number"
                      inputMode="decimal"
                      className="rounded-2xl border border-blue-500/30 bg-zinc-800 px-3 py-3 text-center text-sm text-white placeholder-zinc-600 transition-all focus:border-blue-500 focus:outline-none"
                    />
                    <input
                      value={carbs}
                      onChange={(event) => setCarbs(event.target.value)}
                      placeholder="Carbs"
                      type="number"
                      inputMode="decimal"
                      className="rounded-2xl border border-amber-500/30 bg-zinc-800 px-3 py-3 text-center text-sm text-white placeholder-zinc-600 transition-all focus:border-amber-500 focus:outline-none"
                    />
                    <input
                      value={fat}
                      onChange={(event) => setFat(event.target.value)}
                      placeholder={l('Fat', 'Grasa')}
                      type="number"
                      inputMode="decimal"
                      className="rounded-2xl border border-pink-500/30 bg-zinc-800 px-3 py-3 text-center text-sm text-white placeholder-zinc-600 transition-all focus:border-pink-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block px-1 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    {l('Serving size', 'Porcion')}
                  </label>
                  <input
                    value={servingSize}
                    onChange={(event) => setServingSize(event.target.value)}
                    placeholder="e.g. 100g, 1 cup"
                    className="glow-input-neon w-full rounded-2xl border border-zinc-700/50 bg-zinc-800 px-4 py-3 text-sm text-white placeholder-zinc-600 transition-all focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>

                <button
                  onClick={() => setSaveToMyFoods(!saveToMyFoods)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-zinc-700/50 bg-zinc-800/50 p-3.5 transition-all active:scale-[0.99]"
                >
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded-md border-2 transition-colors ${
                      saveToMyFoods ? 'border-green-500 bg-green-500' : 'border-zinc-600'
                    }`}
                  >
                    {saveToMyFoods && <Icon name="Check" size={12} className="text-white" strokeWidth={3} />}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-white">{l('Save to My Foods', 'Guardar en Mis Alimentos')}</p>
                    <p className="text-[10px] text-zinc-500">
                      {l('Add to your personal food database', 'Agregar a tu base de datos personal')}
                    </p>
                  </div>
                </button>
              </div>

              <Button onClick={handleSubmitManual} fullWidth disabled={!canSubmitManual} className="mt-2">
                {l('Add Food', 'Agregar Comida')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </Sheet>
  );
};
