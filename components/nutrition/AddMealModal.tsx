import React, { useState, useRef, useCallback, useMemo } from 'react';
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
  { id: 'breakfast', en: 'Breakfast', es: 'Desayuno', icon: '🌅' },
  { id: 'lunch',     en: 'Lunch',     es: 'Almuerzo', icon: '☀️' },
  { id: 'dinner',    en: 'Dinner',    es: 'Cena',     icon: '🌙' },
  { id: 'snack',     en: 'Snack',     es: 'Snack',    icon: '🍎' },
] as const;

const PRESET_DB: (CustomFood & { category: string })[] = [
  // Proteins
  { id: 'p_chicken_150', name: 'Pechuga de pollo (150g)',   calories: 248, protein: 47, carbs: 0,  fat: 5,  servingSize: '150g', category: 'protein', isFavorite: false, createdAt: 0 },
  { id: 'p_chicken_100', name: 'Pechuga de pollo (100g)',   calories: 165, protein: 31, carbs: 0,  fat: 4,  servingSize: '100g', category: 'protein', isFavorite: false, createdAt: 0 },
  { id: 'p_whey',        name: 'Proteína Whey (1 scoop)',    calories: 120, protein: 25, carbs: 3,  fat: 2,  servingSize: '30g',  category: 'protein', isFavorite: false, createdAt: 0 },
  { id: 'p_egg',         name: 'Huevo entero',               calories: 78,  protein: 6,  carbs: 1,  fat: 5,  servingSize: '1 u',  category: 'protein', isFavorite: false, createdAt: 0 },
  { id: 'p_whites_3',    name: 'Claras de huevo (3u)',       calories: 51,  protein: 11, carbs: 0,  fat: 0,  servingSize: '3u',   category: 'protein', isFavorite: false, createdAt: 0 },
  { id: 'p_tuna',        name: 'Atún al natural (100g)',     calories: 100, protein: 22, carbs: 0,  fat: 1,  servingSize: '100g', category: 'protein', isFavorite: false, createdAt: 0 },
  { id: 'p_salmon',      name: 'Salmón (100g)',              calories: 208, protein: 20, carbs: 0,  fat: 13, servingSize: '100g', category: 'protein', isFavorite: false, createdAt: 0 },
  { id: 'p_beef',        name: 'Carne molida 90% (100g)',    calories: 215, protein: 21, carbs: 0,  fat: 14, servingSize: '100g', category: 'protein', isFavorite: false, createdAt: 0 },
  { id: 'p_greek_200',   name: 'Yogur griego (200g)',        calories: 117, protein: 20, carbs: 5,  fat: 1,  servingSize: '200g', category: 'protein', isFavorite: false, createdAt: 0 },
  { id: 'p_cottage',     name: 'Queso cottage (150g)',       calories: 120, protein: 18, carbs: 4,  fat: 3,  servingSize: '150g', category: 'protein', isFavorite: false, createdAt: 0 },
  { id: 'p_turkey',      name: 'Pechuga de pavo (100g)',     calories: 135, protein: 28, carbs: 0,  fat: 3,  servingSize: '100g', category: 'protein', isFavorite: false, createdAt: 0 },
  // Carbs
  { id: 'c_rice_200',    name: 'Arroz cocido (200g)',        calories: 260, protein: 5,  carbs: 57, fat: 0,  servingSize: '200g', category: 'carbs', isFavorite: false, createdAt: 0 },
  { id: 'c_rice_100',    name: 'Arroz cocido (100g)',        calories: 130, protein: 3,  carbs: 28, fat: 0,  servingSize: '100g', category: 'carbs', isFavorite: false, createdAt: 0 },
  { id: 'c_oats_50',     name: 'Avena seca (50g)',           calories: 185, protein: 6,  carbs: 33, fat: 3,  servingSize: '50g',  category: 'carbs', isFavorite: false, createdAt: 0 },
  { id: 'c_pasta_200',   name: 'Pasta cocida (200g)',        calories: 260, protein: 9,  carbs: 52, fat: 1,  servingSize: '200g', category: 'carbs', isFavorite: false, createdAt: 0 },
  { id: 'c_potato_200',  name: 'Papa cocida (200g)',         calories: 154, protein: 4,  carbs: 35, fat: 0,  servingSize: '200g', category: 'carbs', isFavorite: false, createdAt: 0 },
  { id: 'c_bread',       name: 'Pan integral (1 rebanada)', calories: 70,  protein: 3,  carbs: 12, fat: 1,  servingSize: '1 u',  category: 'carbs', isFavorite: false, createdAt: 0 },
  { id: 'c_banana',      name: 'Banana',                    calories: 89,  protein: 1,  carbs: 23, fat: 0,  servingSize: '1 u',  category: 'carbs', isFavorite: false, createdAt: 0 },
  { id: 'c_apple',       name: 'Manzana',                   calories: 52,  protein: 0,  carbs: 14, fat: 0,  servingSize: '1 u',  category: 'carbs', isFavorite: false, createdAt: 0 },
  { id: 'c_sweet_potato',name: 'Batata (150g)',              calories: 129, protein: 3,  carbs: 30, fat: 0,  servingSize: '150g', category: 'carbs', isFavorite: false, createdAt: 0 },
  // Fats
  { id: 'f_avocado',     name: 'Palta / Aguacate (100g)',   calories: 160, protein: 2,  carbs: 9,  fat: 15, servingSize: '100g', category: 'fats', isFavorite: false, createdAt: 0 },
  { id: 'f_peanutbutter',name: 'Mantequilla de maní (1 cda)', calories: 94, protein: 4, carbs: 3,  fat: 8,  servingSize: '16g',  category: 'fats', isFavorite: false, createdAt: 0 },
  { id: 'f_almonds',     name: 'Almendras (30g)',            calories: 173, protein: 6,  carbs: 6,  fat: 15, servingSize: '30g',  category: 'fats', isFavorite: false, createdAt: 0 },
  { id: 'f_olive_oil',   name: 'Aceite de oliva (1 cda)',   calories: 119, protein: 0,  carbs: 0,  fat: 14, servingSize: '14g',  category: 'fats', isFavorite: false, createdAt: 0 },
  { id: 'f_cheese',      name: 'Queso fresco (50g)',         calories: 75,  protein: 10, carbs: 0,  fat: 4,  servingSize: '50g',  category: 'fats', isFavorite: false, createdAt: 0 },
  // Mixed
  { id: 'm_milk_250',    name: 'Leche descremada (250ml)',   calories: 85,  protein: 8,  carbs: 12, fat: 0,  servingSize: '250ml',category: 'mixed', isFavorite: false, createdAt: 0 },
  { id: 'm_granola',     name: 'Granola (40g)',              calories: 176, protein: 4,  carbs: 29, fat: 5,  servingSize: '40g',  category: 'mixed', isFavorite: false, createdAt: 0 },
];

const PORTION_MULTIPLIERS = [0.5, 1, 1.5, 2, 3];

type ModalTab = 'quick' | 'myfoods' | 'manual';

// ─── SCANNER BUTTON ─────────────────────────────────────────────────
const ScannerButton: React.FC<{
  onScanned: (food: Partial<CustomFood>) => void;
  lang: 'en' | 'es';
}> = ({ onScanned, lang }) => {
  const [scanning, setScanning] = useState(false);
  const [error, setError]       = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setScanning(true);
    setError('');
    try {
      const { scanNutritionLabel } = await import('../../services/nutritionScanner');
      const result = await scanNutritionLabel(file);
      onScanned(result);
    } catch (e: any) {
      setError(lang === 'en'
        ? 'Could not read label. Try a clearer photo.'
        : 'No se pudo leer la etiqueta. Intentá con una foto más clara.');
      console.error('Nutrition scan error:', e);
    } finally {
      setScanning(false);
    }
  }, [onScanned, lang]);

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={scanning}
        className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl border-2 border-dashed border-zinc-700/50 hover:border-zinc-400 bg-zinc-900 active:scale-[0.98] transition-all disabled:opacity-50"
      >
        {scanning ? (
          <>
            <Icon name="RefreshCw" size={20} className="text-zinc-400 animate-spin" />
            <span className="text-sm font-bold text-zinc-400">
              {lang === 'en' ? 'Analyzing label…' : 'Analizando etiqueta…'}
            </span>
          </>
        ) : (
          <>
            <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
              <Icon name="Camera" size={20} className="text-primary-400" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-white">
                {lang === 'en' ? 'Scan Nutrition Label' : 'Escanear Etiqueta Nutricional'}
              </p>
              <p className="text-[10px] text-zinc-500">
                {lang === 'en' ? 'Take a photo — AI fills the fields' : 'Sacá una foto — la IA completa los campos'}
              </p>
            </div>
          </>
        )}
      </button>
      {error && (
        <p className="text-xs text-red-400 text-center">{error}</p>
      )}
    </div>
  );
};

// ─── FOOD CARD (reusable) ──────────────────────────────────────────
const FoodCard: React.FC<{
  food: CustomFood | (typeof PRESET_DB[0]);
  onSelect: (food: CustomFood | (typeof PRESET_DB[0])) => void;
  onToggleFav?: (id: string) => void;
  onDelete?: (id: string) => void;
  multiplier?: number;
  lang: 'en' | 'es';
}> = ({ food, onSelect, onToggleFav, onDelete, multiplier = 1, lang }) => {
  const cal  = Math.round(food.calories * multiplier);
  const prot = Math.round(food.protein  * multiplier);
  return (
    <div className="flex items-center gap-3 p-3 rounded-2xl glass-card active:scale-[0.98] transition-all">
      <button onClick={() => onSelect(food)} className="flex-1 text-left min-w-0">
        <p className="text-sm font-semibold text-white truncate">{food.name}</p>
        <p className="text-[10px] text-zinc-500 mt-0.5">
          <span className="text-zinc-300">{cal}</span> kcal
          {' · '}
          <span className="text-blue-400">{prot}g P</span>
          {food.servingSize && <span className="text-zinc-600"> · {food.servingSize}</span>}
        </p>
      </button>
      <div className="flex items-center gap-1.5 shrink-0">
        {onToggleFav && (
          <button
            onClick={() => onToggleFav(food.id)}
            className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${food.isFavorite ? 'text-yellow-400' : 'text-zinc-600 hover:text-zinc-400'}`}
          >
            <Icon name="Star" size={14} fill={food.isFavorite ? 'currentColor' : 'none'} />
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(food.id)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-700 hover:text-red-400 transition-colors"
          >
            <Icon name="Trash2" size={13} />
          </button>
        )}
        <button
          onClick={() => onSelect(food)}
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-zinc-700 text-zinc-300 hover:bg-zinc-600 transition-colors"
        >
          <Icon name="Plus" size={14} />
        </button>
      </div>
    </div>
  );
};

export const AddMealModal: React.FC<AddMealModalProps> = ({ isOpen, onClose, onAdd, lang }) => {
  const { customFoods, setCustomFoods } = useApp();

  const [tab, setTab]               = useState<ModalTab>('quick');
  const [mealType, setMealType]     = useState<FoodEntry['mealType']>('lunch');
  const [multiplier, setMultiplier] = useState(1);
  const [search, setSearch]         = useState('');
  const [saveToMyFoods, setSaveToMyFoods] = useState(false);

  // Manual / scanned form state
  const [name, setName]         = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein]   = useState('');
  const [carbs, setCarbs]       = useState('');
  const [fat, setFat]           = useState('');
  const [servingSize, setServingSize] = useState('');

  const l = (en: string, es: string) => lang === 'en' ? en : es;

  const resetForm = () => {
    setName(''); setCalories(''); setProtein(''); setCarbs(''); setFat(''); setServingSize('');
    setSaveToMyFoods(false);
  };

  const filteredPresets = useMemo(() => {
    if (!search.trim()) return PRESET_DB;
    const q = search.toLowerCase();
    return PRESET_DB.filter(p => p.name.toLowerCase().includes(q));
  }, [search]);

  const filteredMyFoods = useMemo(() => {
    if (!search.trim()) return customFoods;
    const q = search.toLowerCase();
    return customFoods.filter(f => f.name.toLowerCase().includes(q));
  }, [customFoods, search]);

  const sortedMyFoods = useMemo(() =>
    [...filteredMyFoods].sort((a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0)),
  [filteredMyFoods]);

  const buildEntry = (cal: number, prot: number, carb: number, f: number, n: string): FoodEntry => ({
    id: `meal_${Date.now()}_${Math.random()}`,
    name: multiplier !== 1 ? `${n} (×${multiplier})` : n,
    calories: Math.round(cal * multiplier),
    protein:  Math.round(prot * multiplier),
    carbs:    Math.round(carb * multiplier),
    fat:      Math.round(f * multiplier),
    mealType,
    timestamp: Date.now(),
  });

  const handleSelectPreset = (food: (typeof PRESET_DB[0]) | CustomFood) => {
    onAdd(buildEntry(food.calories, food.protein, food.carbs, food.fat, food.name));
    onClose();
  };

  const handleSubmitManual = () => {
    if (!name || !calories) return;
    const cal  = Number(calories) || 0;
    const prot = Number(protein) || 0;
    const carb = Number(carbs) || 0;
    const f    = Number(fat) || 0;

    onAdd(buildEntry(cal, prot, carb, f, name));

    if (saveToMyFoods) {
      const newFood: CustomFood = {
        id: `cf_${Date.now()}`,
        name,
        calories: cal,
        protein: prot,
        carbs: carb,
        fat: f,
        servingSize: servingSize || undefined,
        isFavorite: false,
        createdAt: Date.now(),
      };
      setCustomFoods(prev => [newFood, ...prev]);
    }

    resetForm();
    onClose();
  };

  const handleScanned = (scanned: Partial<CustomFood>) => {
    if (scanned.name)     setName(scanned.name);
    if (scanned.calories) setCalories(String(scanned.calories));
    if (scanned.protein)  setProtein(String(scanned.protein));
    if (scanned.carbs)    setCarbs(String(scanned.carbs));
    if (scanned.fat)      setFat(String(scanned.fat));
    if (scanned.servingSize) setServingSize(scanned.servingSize);
    setTab('manual');
    setSaveToMyFoods(true);
  };

  const handleToggleFav = (id: string) => {
    setCustomFoods(prev => prev.map(f => f.id === id ? { ...f, isFavorite: !f.isFavorite } : f));
  };

  const handleDeleteMyFood = (id: string) => {
    setCustomFoods(prev => prev.filter(f => f.id !== id));
  };

  const canSubmitManual = !!name && !!calories;

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title={l('Add Food', 'Agregar Comida')}
      accent="primary"
    >
      <div className="px-5 pb-5 space-y-4">
        {/* Meal type chips */}
        <div className="flex gap-2 overflow-x-auto scroll-container pb-0.5">
          {MEAL_TYPES.map(m => (
            <button
              key={m.id}
              onClick={() => setMealType(m.id as any)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold border transition-all active:scale-95 duration-fast ease-natural ${
                mealType === m.id
                  ? 'bg-primary-500 text-white border-transparent shadow-[0_4px_12px] shadow-primary-500/30'
                  : 'bg-zinc-800 text-zinc-400 border-zinc-700/50'
              }`}
            >
              <span aria-hidden="true">{m.icon}</span>
              <span>{lang === 'en' ? m.en : m.es}</span>
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex bg-zinc-800 p-1 rounded-2xl gap-1">
          {([
            { id: 'quick',   icon: 'Zap',      label: l('Quick Add', 'Rápido') },
            { id: 'myfoods', icon: 'BookOpen',  label: l('My Foods', 'Mis Alimentos') },
            { id: 'manual',  icon: 'Edit3',     label: l('Manual', 'Manual') },
          ] as { id: ModalTab; icon: string; label: string }[]).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-[11px] font-bold transition-all ${
                tab === t.id ? 'bg-white text-black font-black' : 'text-zinc-500'
              }`}
            >
              <Icon name={t.icon as any} size={11} />
              {t.label}
            </button>
          ))}
        </div>

        {/* tab contents */}
        <div className="space-y-4">
          {/* Portion selector for catalog tabs */}
          {tab !== 'manual' && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider shrink-0">
                {l('Portion', 'Porción')}
              </span>
              <div className="flex gap-1.5 flex-wrap">
                {PORTION_MULTIPLIERS.map(m => (
                  <button
                    key={m}
                    onClick={() => setMultiplier(m)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 duration-fast ease-natural ${
                      multiplier === m
                        ? 'bg-white text-black border-transparent shadow-md'
                        : 'bg-zinc-800 border-zinc-700/50 text-zinc-400'
                    }`}
                  >
                    ×{m}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Add */}
          {tab === 'quick' && (
            <div className="space-y-4">
              <div className="relative">
                <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="search"
                  placeholder={l('Search foods…', 'Buscar alimentos…')}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700/50 rounded-2xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all glow-input-neon"
                />
              </div>

              <ScannerButton onScanned={handleScanned} lang={lang} />

              <div className="space-y-1.5 max-h-[350px] overflow-y-auto scroll-container pr-0.5">
                {filteredPresets.length === 0 && (
                  <p className="text-center text-zinc-600 text-sm py-4">{l('No results', 'Sin resultados')}</p>
                )}
                {filteredPresets.map(food => (
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

          {/* My Foods */}
          {tab === 'myfoods' && (
            <div className="space-y-4">
              {customFoods.length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <div className="text-3xl">🥗</div>
                  <p className="text-zinc-500 text-sm font-medium">
                    {l('No saved foods yet.', 'Sin alimentos guardados aún.')}
                  </p>
                  <p className="text-zinc-600 text-xs max-w-[220px] mx-auto">
                    {l('Add a food manually and check "Save to My Foods" to build your personal database.', 'Agregá un alimento manualmente y marcá "Guardar en Mis Alimentos" para crear tu base de datos personal.')}
                  </p>
                  <button
                    onClick={() => setTab('manual')}
                    className="mt-3 px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-bold active:scale-95 transition-transform"
                  >
                    {l('Add manually →', 'Agregar manualmente →')}
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="search"
                      placeholder={l('Search my foods…', 'Buscar mis alimentos…')}
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700/50 rounded-2xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all glow-input-neon"
                    />
                  </div>
                  {sortedMyFoods.length === 0 ? (
                    <p className="text-center text-zinc-600 text-sm py-4">{l('No results', 'Sin resultados')}</p>
                  ) : (
                    <div className="space-y-1.5 max-h-[350px] overflow-y-auto scroll-container pr-0.5">
                      {sortedMyFoods.map(food => (
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

          {/* Manual / Scan form */}
          {tab === 'manual' && (
            <div className="space-y-4">
              <ScannerButton onScanned={handleScanned} lang={lang} />

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-zinc-700/50"></div>
                <span className="flex-shrink mx-4 text-zinc-500 text-[10px] font-black uppercase tracking-wider">
                  {l('or enter manually', 'o ingresar manualmente')}
                </span>
                <div className="flex-grow border-t border-zinc-700/50"></div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1 px-1">{l('Food name *', 'Nombre del alimento *')}</label>
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Greek Yogurt"
                    className="w-full bg-zinc-800 border border-zinc-700/50 rounded-2xl px-4 py-3 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all glow-input-neon"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1 px-1">{l('Calories (kcal) *', 'Calorías (kcal) *')}</label>
                  <input
                    value={calories}
                    onChange={e => setCalories(e.target.value)}
                    placeholder="0"
                    type="number"
                    inputMode="numeric"
                    className="w-full bg-zinc-800 border border-zinc-700/50 rounded-2xl px-4 py-3 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all glow-input-neon"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1 px-1">{l('Macros (g)', 'Macros (g)')}</label>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      value={protein}
                      onChange={e => setProtein(e.target.value)}
                      placeholder={l('Protein', 'Proteína')}
                      type="number"
                      inputMode="decimal"
                      className="bg-zinc-800 border border-blue-500/30 focus:border-blue-500 rounded-2xl px-3 py-3 text-white placeholder-zinc-600 text-sm text-center focus:outline-none transition-all"
                    />
                    <input
                      value={carbs}
                      onChange={e => setCarbs(e.target.value)}
                      placeholder="Carbs"
                      type="number"
                      inputMode="decimal"
                      className="bg-zinc-800 border border-amber-500/30 focus:border-amber-500 rounded-2xl px-3 py-3 text-white placeholder-zinc-600 text-sm text-center focus:outline-none transition-all"
                    />
                    <input
                      value={fat}
                      onChange={e => setFat(e.target.value)}
                      placeholder={l('Fat', 'Grasa')}
                      type="number"
                      inputMode="decimal"
                      className="bg-zinc-800 border border-pink-500/30 focus:border-pink-500 rounded-2xl px-3 py-3 text-white placeholder-zinc-600 text-sm text-center focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1 px-1">{l('Serving size', 'Porción')}</label>
                  <input
                    value={servingSize}
                    onChange={e => setServingSize(e.target.value)}
                    placeholder="e.g. 100g, 1 cup"
                    className="w-full bg-zinc-800 border border-zinc-700/50 rounded-2xl px-4 py-3 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all glow-input-neon"
                  />
                </div>

                <button
                  onClick={() => setSaveToMyFoods(!saveToMyFoods)}
                  className="flex items-center gap-3 w-full p-3.5 rounded-2xl bg-zinc-800/50 border border-zinc-700/50 active:scale-[0.99] transition-all"
                >
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                    saveToMyFoods ? 'bg-green-500 border-green-500' : 'border-zinc-600'
                  }`}>
                    {saveToMyFoods && <Icon name="Check" size={12} className="text-white" strokeWidth={3} />}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-white">{l('Save to My Foods', 'Guardar en Mis Alimentos')}</p>
                    <p className="text-[10px] text-zinc-500">{l('Add to your personal food database', 'Agregar a tu base de datos personal')}</p>
                  </div>
                </button>
              </div>

              <Button
                onClick={handleSubmitManual}
                fullWidth
                disabled={!canSubmitManual}
                className="mt-2"
              >
                {l('Add Food', 'Agregar Comida')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </Sheet>
  );
};
