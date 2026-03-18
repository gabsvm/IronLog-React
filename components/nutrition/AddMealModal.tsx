import React, { useState } from 'react';
import { FoodEntry } from '../../types';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';

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

// Quick-add presets so users get value immediately
const PRESETS = [
  { name: 'Arroz cocido (100g)',   cal: 130, p: 3,  c: 28, f: 0 },
  { name: 'Pechuga pollo (100g)', cal: 165, p: 31, c: 0,  f: 4 },
  { name: 'Huevo entero',          cal: 78,  p: 6,  c: 1,  f: 5 },
  { name: 'Avena (40g)',           cal: 148, p: 5,  c: 27, f: 3 },
  { name: 'Yogur griego (150g)',   cal: 88,  p: 15, c: 4,  f: 1 },
  { name: 'Banana',                cal: 89,  p: 1,  c: 23, f: 0 },
  { name: 'Proteína whey (scoop)', cal: 120, p: 25, c: 3,  f: 2 },
  { name: 'Atún (lata 100g)',      cal: 100, p: 22, c: 0,  f: 1 },
];

export const AddMealModal: React.FC<AddMealModalProps> = ({ isOpen, onClose, onAdd, lang }) => {
  const [name, setName]         = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein]   = useState('');
  const [carbs, setCarbs]       = useState('');
  const [fat, setFat]           = useState('');
  const [mealType, setMealType] = useState<FoodEntry['mealType']>('lunch');

  const applyPreset = (p: typeof PRESETS[0]) => {
    setName(p.name);
    setCalories(String(p.cal));
    setProtein(String(p.p));
    setCarbs(String(p.c));
    setFat(String(p.f));
  };

  const handleSubmit = () => {
    if (!name || !calories) return;
    onAdd({
      id: `meal_${Date.now()}`,
      name,
      calories: Number(calories) || 0,
      protein:  Number(protein) || 0,
      carbs:    Number(carbs) || 0,
      fat:      Number(fat) || 0,
      mealType,
      timestamp: Date.now(),
    });
    // reset
    setName(''); setCalories(''); setProtein(''); setCarbs(''); setFat('');
    onClose();
  };

  if (!isOpen) return null;

  const t = {
    title:    lang === 'en' ? 'Add Food'        : 'Agregar Comida',
    name:     lang === 'en' ? 'Food name'        : 'Nombre del alimento',
    kcal:     lang === 'en' ? 'Calories (kcal)'  : 'Calorías (kcal)',
    protein:  lang === 'en' ? 'Protein (g)'      : 'Proteína (g)',
    carbs:    lang === 'en' ? 'Carbs (g)'         : 'Carbs (g)',
    fat:      lang === 'en' ? 'Fat (g)'           : 'Grasa (g)',
    presets:  lang === 'en' ? 'Quick Add'         : 'Agregar Rápido',
    add:      lang === 'en' ? 'Add'               : 'Agregar',
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end">
      <div className="w-full bg-zinc-900 rounded-t-3xl border-t border-zinc-800 p-6 pb-safe max-h-[90vh] overflow-y-auto scroll-container animate-spring-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">{t.title}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-800 text-zinc-400">
            <Icon name="X" size={16} />
          </button>
        </div>

        {/* Meal type selector */}
        <div className="flex gap-2 mb-5 overflow-x-auto scroll-container pb-1">
          {MEAL_TYPES.map(m => (
            <button key={m.id} onClick={() => setMealType(m.id as any)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold border transition-all
                ${mealType === m.id ? 'bg-white text-black border-transparent' : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
              <span>{m.icon}</span>
              <span>{lang === 'en' ? m.en : m.es}</span>
            </button>
          ))}
        </div>

        {/* Quick Presets */}
        <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">{t.presets}</p>
        <div className="flex gap-2 overflow-x-auto scroll-container pb-3 mb-4">
          {PRESETS.map(p => (
            <button key={p.name} onClick={() => applyPreset(p)}
              className="flex-shrink-0 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl px-3 py-2 text-left transition-all">
              <p className="text-xs font-semibold text-white whitespace-nowrap">{p.name}</p>
              <p className="text-[10px] text-zinc-500">{p.cal} kcal · {p.p}g P</p>
            </button>
          ))}
        </div>

        {/* Manual input */}
        <div className="space-y-3">
          <input value={name} onChange={e => setName(e.target.value)} placeholder={t.name}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-4 py-3 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-zinc-500" />
          <input value={calories} onChange={e => setCalories(e.target.value)} placeholder={t.kcal} type="number" inputMode="numeric"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-4 py-3 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-zinc-500" />
          <div className="grid grid-cols-3 gap-2">
            <input value={protein} onChange={e => setProtein(e.target.value)} placeholder={t.protein} type="number" inputMode="numeric"
              className="bg-zinc-800 border border-blue-500/30 rounded-2xl px-3 py-3 text-white placeholder-zinc-500 text-sm text-center focus:outline-none focus:border-blue-500" />
            <input value={carbs} onChange={e => setCarbs(e.target.value)} placeholder={t.carbs} type="number" inputMode="numeric"
              className="bg-zinc-800 border border-amber-500/30 rounded-2xl px-3 py-3 text-white placeholder-zinc-500 text-sm text-center focus:outline-none focus:border-amber-500" />
            <input value={fat} onChange={e => setFat(e.target.value)} placeholder={t.fat} type="number" inputMode="numeric"
              className="bg-zinc-800 border border-pink-500/30 rounded-2xl px-3 py-3 text-white placeholder-zinc-500 text-sm text-center focus:outline-none focus:border-pink-500" />
          </div>
        </div>

        <Button onClick={handleSubmit} fullWidth className="mt-5" disabled={!name || !calories}>
          {t.add}
        </Button>
      </div>
    </div>
  );
};