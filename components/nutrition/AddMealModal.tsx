import { TRANSLATIONS } from '../../constants/translations';
import { pickLang } from '../../utils/i18n';
import React, { useMemo, useState } from 'react';
import { FoodEntry, CustomFood } from '../../types';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';
import { Sheet } from '../ui/Sheet';
import { ConfirmModal } from '../ui/ConfirmModal';
import { useApp } from '../../context/AppContext';
import { MEAL_TYPES, PRESET_DB, PORTION_MULTIPLIERS } from './addMeal/mealData';

interface AddMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (entry: FoodEntry) => void;
  lang: 'en' | 'es';
}


type ModalTab = 'quick' | 'myfoods' | 'manual';

const FoodCard: React.FC<{
  food: CustomFood | (typeof PRESET_DB)[number];
  onSelect: (food: CustomFood | (typeof PRESET_DB)[number]) => void;
  onToggleFav?: (id: string) => void;
  onDelete?: (id: string) => void;
  multiplier?: number;
  lang: 'en' | 'es';
}> = ({ food, onSelect, onToggleFav, onDelete, multiplier = 1, lang }) => {
  const calories = Math.round(food.calories * multiplier);
  const protein = Math.round(food.protein * multiplier);

  return (
    <div className="flex items-center gap-2 rounded-2xl p-3 gl-panel">
      <button onClick={() => onSelect(food)} className="min-h-11 min-w-0 flex-1 text-left">
        <p className="truncate text-sm font-semibold text-[rgb(var(--text-primary))]">{food.name}</p>
        <p className="mt-0.5 text-xs text-muted">
          <span className="text-[rgb(var(--text-secondary))]">{calories}</span> kcal
          {' · '}
          <span className="text-blue-700 dark:text-blue-400">{protein}g P</span>
          {food.servingSize && <span className="text-muted">{' · '}{food.servingSize}</span>}
        </p>
      </button>
      <div className="flex shrink-0 items-center gap-2">
        {onToggleFav && (
          <button
            onClick={() => onToggleFav(food.id)}
            aria-label={pickLang(lang, food.isFavorite ? { en: 'Remove from favorites', es: 'Quitar de favoritos' } : { en: 'Add to favorites', es: 'Agregar a favoritos' })}
            className={`flex h-11 w-11 items-center justify-center rounded-xl transition-colors ${food.isFavorite ? 'text-yellow-800 dark:text-yellow-400' : 'text-muted hover:text-[rgb(var(--text-primary))]'}`}
          >
            <Icon name="Star" size={14} fill={food.isFavorite ? 'currentColor' : 'none'} />
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(food.id)}
            aria-label={pickLang(lang, { en: `Delete ${food.name}`, es: `Eliminar ${food.name}` })}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-secondary transition-colors hover:text-red-700 dark:hover:text-red-400"
          >
            <Icon name="Trash2" size={13} />
          </button>
        )}
        <button
          onClick={() => onSelect(food)}
          aria-label={pickLang(lang, { en: `Add ${food.name}`, es: `Agregar ${food.name}` })}
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-raised text-secondary transition-colors hover:bg-surface-elevated"
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
  const [pendingFoodDelete, setPendingFoodDelete] = useState<CustomFood | null>(null);

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
    if (!canSubmitManual) return;

    const parsedCalories = Number(calories);
    const parsedProtein = protein.trim() ? Number(protein) : 0;
    const parsedCarbs = carbs.trim() ? Number(carbs) : 0;
    const parsedFat = fat.trim() ? Number(fat) : 0;
    const foodName = name.trim();

    onAdd(buildEntry(parsedCalories, parsedProtein, parsedCarbs, parsedFat, foodName));

    if (saveToMyFoods) {
      const newFood: CustomFood = {
        id: `cf_${Date.now()}`,
        name: foodName,
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
    const food = customFoods.find((item) => item.id === id);
    if (food) setPendingFoodDelete(food);
  };

  const confirmDeleteMyFood = () => {
    if (!pendingFoodDelete) return;
    setCustomFoods((prev) => prev.filter((food) => food.id !== pendingFoodDelete.id));
    setPendingFoodDelete(null);
  };

  const isNonNegativeFinite = (value: string) => value.trim() !== '' && Number.isFinite(Number(value)) && Number(value) >= 0;
  const isOptionalNonNegativeFinite = (value: string) => value.trim() === '' || isNonNegativeFinite(value);
  const canSubmitManual = !!name.trim() && isNonNegativeFinite(calories)
    && isOptionalNonNegativeFinite(protein)
    && isOptionalNonNegativeFinite(carbs)
    && isOptionalNonNegativeFinite(fat);

  return (
    <>
    <Sheet
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title={TRANSLATIONS[lang].copy.addMealModal.addFood}
      accent="primary"
    >
      <div className="space-y-4 px-5 pb-5">
        <div className="scroll-container flex gap-2 overflow-x-auto pb-0.5">
          {MEAL_TYPES.map((meal) => (
            <button
              key={meal.id}
              onClick={() => setMealType(meal.id as FoodEntry['mealType'])}
              aria-pressed={mealType === meal.id}
              className={`duration-fast ease-natural flex min-h-11 flex-shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                mealType === meal.id
                  ? 'border-border-strong bg-surface-elevated text-[rgb(var(--text-primary))]'
                  : 'border-border-subtle bg-surface-base text-muted'
              }`}
            >
              <Icon name={meal.icon as any} size={13} />
              <span>{pickLang(lang, meal)}</span>
            </button>
          ))}
        </div>

        <div className="seg-reference grid-cols-3">
          {([
            { id: 'quick', icon: 'Zap', label: TRANSLATIONS[lang].copy.addMealModal.quickAdd },
            { id: 'myfoods', icon: 'BookOpen', label: TRANSLATIONS[lang].copy.addMealModal.myFoods },
            { id: 'manual', icon: 'Edit3', label: TRANSLATIONS[lang].copy.addMealModal.manual },
          ] as { id: ModalTab; icon: string; label: string }[]).map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              aria-pressed={tab === item.id}
              className={`flex min-h-11 min-w-0 items-center justify-center gap-1 rounded-[10px] px-1 text-xs font-semibold transition-colors ${
                tab === item.id ? 'bg-surface-elevated text-[rgb(var(--text-primary))]' : 'text-muted'
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
              <span className="shrink-0 text-xs font-semibold tracking-normal text-muted">
                {TRANSLATIONS[lang].copy.addMealModal.portion}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PORTION_MULTIPLIERS.map((value) => (
                  <button
                    key={value}
                    onClick={() => setMultiplier(value)}
                    aria-pressed={multiplier === value}
                    className={`duration-fast ease-natural min-h-11 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      multiplier === value
                        ? 'border-border-strong bg-surface-elevated text-[rgb(var(--text-primary))]'
                        : 'border-border-subtle bg-surface-base text-muted'
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
                <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="search"
                  aria-label={TRANSLATIONS[lang].copy.addMealModal.searchFoods}
                  placeholder={TRANSLATIONS[lang].copy.addMealModal.searchFoods}
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="gl-input !pl-9"
                />
              </div>

              <div data-vaul-no-drag className="scroll-container max-h-[350px] space-y-1.5 overflow-y-auto pr-0.5">
                {filteredPresets.length === 0 && (
                  <p className="py-4 text-center text-sm text-muted">{TRANSLATIONS[lang].copy.addMealModal.noResults}</p>
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
                    <Icon name="UtensilsCrossed" size={28} className="mx-auto text-muted" />
                  </div>
                  <p className="text-sm font-medium text-muted">
                    {TRANSLATIONS[lang].copy.addMealModal.noSavedFoodsYet}
                  </p>
                  <p className="mx-auto max-w-[220px] text-xs text-muted">
                    {TRANSLATIONS[lang].copy.addMealModal.addAFoodManually}
                  </p>
                  <button
                    onClick={() => setTab('manual')}
                    className="gl-quiet mt-3 px-4"
                  >
                    {TRANSLATIONS[lang].copy.addMealModal.addManually}
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                      type="search"
                      aria-label={TRANSLATIONS[lang].copy.addMealModal.searchMyFoods}
                      placeholder={TRANSLATIONS[lang].copy.addMealModal.searchMyFoods}
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      className="gl-input !pl-9"
                    />
                  </div>
                  {sortedMyFoods.length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted">{TRANSLATIONS[lang].copy.addMealModal.noResults}</p>
                  ) : (
                    <div data-vaul-no-drag className="scroll-container max-h-[350px] space-y-1.5 overflow-y-auto pr-0.5">
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
                  <label htmlFor="food-name" className="mb-1 block px-1 text-xs font-semibold tracking-normal text-muted">
                    {TRANSLATIONS[lang].copy.addMealModal.foodName}
                  </label>
                  <input
                    id="food-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder={pickLang(lang, { en: 'e.g. Greek yogurt', es: 'Ej. yogur griego' })}
                    className="gl-input"
                  />
                </div>

                <div>
                  <label htmlFor="food-calories" className="mb-1 block px-1 text-xs font-semibold tracking-normal text-muted">
                    {TRANSLATIONS[lang].copy.addMealModal.caloriesKcal}
                  </label>
                  <input
                    id="food-calories"
                    value={calories}
                    onChange={(event) => setCalories(event.target.value)}
                    placeholder="0"
                    type="number"
                    inputMode="numeric"
                    className="gl-input"
                  />
                </div>

                <div>
                  <p className="mb-1 block px-1 text-xs font-semibold tracking-normal text-muted">
                    {TRANSLATIONS[lang].copy.addMealModal.macrosG}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      aria-label={TRANSLATIONS[lang].copy.addMealModal.protein}
                      value={protein}
                      onChange={(event) => setProtein(event.target.value)}
                      placeholder={TRANSLATIONS[lang].copy.addMealModal.protein}
                      type="number"
                      inputMode="decimal"
                      className="gl-input px-3 text-center"
                    />
                    <input
                      aria-label={pickLang(lang, { en: 'Carbs (g)', es: 'Carbohidratos (g)' })}
                      value={carbs}
                      onChange={(event) => setCarbs(event.target.value)}
                      placeholder={pickLang(lang, { en: 'Carbs', es: 'Carbos' })}
                      type="number"
                      inputMode="decimal"
                      className="gl-input px-3 text-center"
                    />
                    <input
                      aria-label={TRANSLATIONS[lang].copy.addMealModal.fat}
                      value={fat}
                      onChange={(event) => setFat(event.target.value)}
                      placeholder={TRANSLATIONS[lang].copy.addMealModal.fat}
                      type="number"
                      inputMode="decimal"
                      className="gl-input px-3 text-center"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="food-serving" className="mb-1 block px-1 text-xs font-semibold tracking-normal text-muted">
                    {TRANSLATIONS[lang].copy.addMealModal.servingSize}
                  </label>
                  <input
                    id="food-serving"
                    value={servingSize}
                    onChange={(event) => setServingSize(event.target.value)}
                    placeholder={pickLang(lang, { en: 'e.g. 100g, 1 cup', es: 'Ej. 100g, 1 taza' })}
                    className="gl-input"
                  />
                </div>

                <button
                  type="button"
                  role="checkbox"
                  aria-checked={saveToMyFoods}
                  onClick={() => setSaveToMyFoods(!saveToMyFoods)}
                  className="flex min-h-11 w-full items-center gap-3 rounded-xl border border-border-subtle bg-surface-raised p-3.5"
                >
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded-md border-2 transition-colors ${
                      saveToMyFoods ? 'border-primary-500 bg-primary-500' : 'border-border-strong'
                    }`}
                  >
                    {saveToMyFoods && <Icon name="Check" size={12} className="text-[rgb(var(--accent-ink))]" strokeWidth={3} />}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-[rgb(var(--text-primary))]">{TRANSLATIONS[lang].copy.addMealModal.saveToMyFoods}</p>
                    <p className="text-xs text-muted">
                      {TRANSLATIONS[lang].copy.addMealModal.addToYourPersonal}
                    </p>
                  </div>
                </button>
              </div>

              <Button onClick={handleSubmitManual} fullWidth disabled={!canSubmitManual} className="mt-2">
                {TRANSLATIONS[lang].copy.addMealModal.addFood}
              </Button>
            </div>
          )}
        </div>
      </div>
    </Sheet>
      <ConfirmModal
        isOpen={pendingFoodDelete !== null}
        title={pickLang(lang, { en: 'Delete saved food?', es: '¿Eliminar alimento guardado?' })}
        description={pickLang(lang, {
          en: `“${pendingFoodDelete?.name ?? ''}” will be removed from your saved foods.`,
          es: `“${pendingFoodDelete?.name ?? ''}” se eliminará de tus alimentos guardados.`,
        })}
        confirmText={pickLang(lang, { en: 'Delete', es: 'Eliminar' })}
        cancelText={pickLang(lang, { en: 'Cancel', es: 'Cancelar' })}
        variant="danger"
        onConfirm={confirmDeleteMyFood}
        onCancel={() => setPendingFoodDelete(null)}
      />
    </>
  );
};
