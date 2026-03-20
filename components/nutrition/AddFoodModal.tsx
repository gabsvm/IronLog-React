
import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../ui/Modal';
import { Icon } from '../ui/Icon';
import { FOOD_DATABASE, FoodItem } from '../../data/foodDatabase';

interface AddFoodModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (data: { calories: number; protein: number; carbs: number; fats: number }) => void;
}

type TabMode = 'search' | 'manual';

export const AddFoodModal: React.FC<AddFoodModalProps> = ({ isOpen, onClose, onAdd }) => {
    const { lang } = useApp();
    const [tab, setTab] = useState<TabMode>('search');
    const [query, setQuery] = useState('');
    const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
    const [servings, setServings] = useState('1');

    // Manual entry state
    const [calories, setCalories] = useState('');
    const [protein, setProtein] = useState('');
    const [carbs, setCarbs] = useState('');
    const [fats, setFats] = useState('');

    const searchRef = useRef<HTMLInputElement>(null);

    const results = useMemo(() => {
        if (!query || query.length < 2) return [];
        const q = query.toLowerCase().trim();
        return FOOD_DATABASE.filter(f => {
            const name = lang === 'es' ? f.name.es : f.name.en;
            const other = lang === 'es' ? f.name.en : f.name.es;
            return name.toLowerCase().includes(q) || other.toLowerCase().includes(q);
        }).slice(0, 15);
    }, [query, lang]);

    const scaledMacros = useMemo(() => {
        if (!selectedFood) return null;
        const s = Math.max(0.5, parseFloat(servings) || 1);
        return {
            calories: Math.round(selectedFood.calories * s),
            protein: Math.round(selectedFood.protein * s * 10) / 10,
            carbs: Math.round(selectedFood.carbs * s * 10) / 10,
            fats: Math.round(selectedFood.fats * s * 10) / 10,
        };
    }, [selectedFood, servings]);

    const handleSelectFood = (food: FoodItem) => {
        setSelectedFood(food);
        setQuery(lang === 'es' ? food.name.es : food.name.en);
        setServings('1');
    };

    const handleSubmitSearch = () => {
        if (!scaledMacros) return;
        onAdd(scaledMacros);
        reset();
    };

    const handleSubmitManual = () => {
        onAdd({
            calories: Number(calories) || 0,
            protein: Number(protein) || 0,
            carbs: Number(carbs) || 0,
            fats: Number(fats) || 0,
        });
        reset();
    };

    const reset = () => {
        setQuery('');
        setSelectedFood(null);
        setServings('1');
        setCalories('');
        setProtein('');
        setCarbs('');
        setFats('');
        onClose();
    };

    const canSubmit = tab === 'search' ? !!scaledMacros : (!!calories || !!protein);

    const tabStyle = (active: boolean) =>
        `flex-1 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
            active
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
        }`;

    return (
        <Modal
            isOpen={isOpen}
            onClose={reset}
            title={lang === 'es' ? 'Agregar Comida' : 'Add Food'}
            footer={
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={reset}
                        className="flex-1 py-3.5 rounded-2xl font-bold text-sm text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 transition-all active:scale-95"
                    >
                        {lang === 'es' ? 'Cancelar' : 'Cancel'}
                    </button>
                    <button
                        type="button"
                        onClick={tab === 'search' ? handleSubmitSearch : handleSubmitManual}
                        disabled={!canSubmit}
                        className="flex-1 py-3.5 rounded-2xl font-black text-sm text-white bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/30 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {lang === 'es' ? 'Guardar' : 'Save'}
                    </button>
                </div>
            }
        >
            {/* Tab Switcher */}
            <div className="flex bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-2xl mb-6">
                <button className={tabStyle(tab === 'search')} onClick={() => setTab('search')}>
                    <span className="flex items-center justify-center gap-1.5">
                        <Icon name="Search" size={12} />
                        {lang === 'es' ? 'Buscar' : 'Search'}
                    </span>
                </button>
                <button className={tabStyle(tab === 'manual')} onClick={() => setTab('manual')}>
                    <span className="flex items-center justify-center gap-1.5">
                        <Icon name="Edit3" size={12} />
                        {lang === 'es' ? 'Manual' : 'Manual'}
                    </span>
                </button>
            </div>

            {tab === 'search' ? (
                <div className="space-y-4">
                    {/* Search Input */}
                    <div className="relative">
                        <Icon
                            name="Search"
                            size={16}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
                        />
                        <input
                            ref={searchRef}
                            type="text"
                            value={query}
                            onChange={e => {
                                setQuery(e.target.value);
                                setSelectedFood(null);
                            }}
                            placeholder={lang === 'es' ? 'Buscar "arroz", "pollo", "banana"...' : 'Search "rice", "chicken", "banana"...'}
                            className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded-2xl pl-10 pr-4 py-4 text-sm font-medium text-zinc-900 dark:text-white focus:border-orange-500 outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                            autoFocus
                        />
                        {query.length > 0 && (
                            <button
                                onClick={() => { setQuery(''); setSelectedFood(null); }}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-white"
                            >
                                <Icon name="X" size={14} />
                            </button>
                        )}
                    </div>

                    {/* Search Results */}
                    {!selectedFood && results.length > 0 && (
                        <div className="border border-zinc-200 dark:border-white/10 rounded-2xl overflow-hidden">
                            {results.map((food, idx) => (
                                <button
                                    key={food.id}
                                    onClick={() => handleSelectFood(food)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-orange-500/5 dark:hover:bg-orange-500/10 transition-colors active:scale-[0.99] ${idx < results.length - 1 ? 'border-b border-zinc-100 dark:border-white/5' : ''}`}
                                >
                                    <span className="text-2xl flex-shrink-0 w-9 text-center">{food.emoji}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-sm text-zinc-900 dark:text-white truncate">
                                            {lang === 'es' ? food.name.es : food.name.en}
                                        </div>
                                        <div className="text-[10px] text-zinc-400">
                                            {food.serving} · {food.calories} kcal · {food.protein}g prot
                                        </div>
                                    </div>
                                    <Icon name="ChevronRight" size={14} className="text-zinc-300 flex-shrink-0" />
                                </button>
                            ))}
                        </div>
                    )}

                    {/* No results */}
                    {!selectedFood && query.length >= 2 && results.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <Icon name="Search" size={32} className="text-zinc-300 dark:text-zinc-700 mb-3" />
                            <p className="text-sm font-bold text-zinc-400 dark:text-zinc-600">
                                {lang === 'es' ? 'No encontrado' : 'Not found'}
                            </p>
                            <button
                                onClick={() => setTab('manual')}
                                className="mt-2 text-xs text-orange-500 font-bold hover:text-orange-600"
                            >
                                {lang === 'es' ? 'Ingresar manualmente →' : 'Enter manually →'}
                            </button>
                        </div>
                    )}

                    {/* Empty prompt */}
                    {!selectedFood && query.length < 2 && (
                        <div className="flex flex-col gap-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 px-1">
                                {lang === 'es' ? 'Sugerencias' : 'Suggestions'}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {['🍗 Pollo', '🍚 Arroz', '🥩 Carne', '🥚 Huevo', '🫘 Lentejas', '🍌 Banana', '🥑 Palta', '🐟 Atún'].map(s => (
                                    <button
                                        key={s}
                                        onClick={() => setQuery(s.split(' ')[1])}
                                        className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-orange-500/10 dark:hover:bg-orange-500/10 border border-zinc-200 dark:border-white/10 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-300 transition-all active:scale-95"
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Selected food – quick adjust servings */}
                    {selectedFood && (
                        <div className="bg-gradient-to-br from-orange-500/5 to-orange-500/0 border border-orange-500/20 rounded-2xl p-5 space-y-4">
                            <div className="flex items-center gap-3">
                                <span className="text-3xl">{selectedFood.emoji}</span>
                                <div>
                                    <p className="font-black text-zinc-900 dark:text-white leading-tight">
                                        {lang === 'es' ? selectedFood.name.es : selectedFood.name.en}
                                    </p>
                                    <p className="text-[10px] text-zinc-400 mt-0.5">{selectedFood.serving} = 1 porción</p>
                                </div>
                                <button
                                    onClick={() => { setSelectedFood(null); setQuery(''); }}
                                    className="ml-auto text-zinc-300 hover:text-zinc-600 dark:hover:text-white"
                                >
                                    <Icon name="X" size={16} />
                                </button>
                            </div>

                            {/* Serving multiplier */}
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-2">
                                    {lang === 'es' ? 'Porciones' : 'Servings'}
                                </label>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setServings(s => String(Math.max(0.5, (parseFloat(s) || 1) - 0.5)))}
                                        className="w-10 h-10 rounded-xl bg-zinc-200 dark:bg-zinc-700 font-black text-lg flex items-center justify-center hover:bg-zinc-300 dark:hover:bg-zinc-600 active:scale-90 transition-all"
                                    >−</button>
                                    <input
                                        type="number"
                                        value={servings}
                                        onChange={e => setServings(e.target.value)}
                                        className="flex-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-center text-2xl font-black text-zinc-900 dark:text-white outline-none focus:border-orange-500"
                                        step="0.5"
                                        min="0.5"
                                    />
                                    <button
                                        onClick={() => setServings(s => String((parseFloat(s) || 1) + 0.5))}
                                        className="w-10 h-10 rounded-xl bg-zinc-200 dark:bg-zinc-700 font-black text-lg flex items-center justify-center hover:bg-zinc-300 dark:hover:bg-zinc-600 active:scale-90 transition-all"
                                    >+</button>
                                </div>
                            </div>

                            {/* Macro preview */}
                            {scaledMacros && (
                                <div className="grid grid-cols-4 gap-2">
                                    <MacroPill label={lang === 'es' ? 'Kcal' : 'Kcal'} value={scaledMacros.calories} color="text-orange-500" bgColor="bg-orange-500/10" unit="" />
                                    <MacroPill label={lang === 'es' ? 'Prot' : 'Prot'} value={scaledMacros.protein} color="text-red-500" bgColor="bg-red-500/10" unit="g" />
                                    <MacroPill label={lang === 'es' ? 'Carb' : 'Carb'} value={scaledMacros.carbs} color="text-blue-500" bgColor="bg-blue-500/10" unit="g" />
                                    <MacroPill label={lang === 'es' ? 'Grasa' : 'Fat'} value={scaledMacros.fats} color="text-yellow-500" bgColor="bg-yellow-500/10" unit="g" />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                /* Manual Entry */
                <div className="space-y-5">
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-2 px-1">
                            {lang === 'es' ? 'Calorías' : 'Calories'}
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                inputMode="decimal"
                                value={calories}
                                onChange={e => setCalories(e.target.value)}
                                placeholder="0"
                                className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded-2xl px-6 pr-16 py-5 text-3xl font-black text-zinc-900 dark:text-white focus:border-orange-500 outline-none transition-all placeholder:text-zinc-300 dark:placeholder:text-zinc-600"
                                autoFocus
                            />
                            <div className="absolute right-5 top-1/2 -translate-y-1/2 text-orange-500/70 font-black uppercase tracking-tighter text-xs bg-orange-500/10 px-2 py-1 rounded-lg">kcal</div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-3 px-1">
                            Macros
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                            <MacroInput label={lang === 'es' ? 'Prot' : 'Prot'} value={protein} onChange={setProtein} borderColor="border-red-400 focus:border-red-500" accentColor="text-red-500" />
                            <MacroInput label={lang === 'es' ? 'Carb' : 'Carb'} value={carbs} onChange={setCarbs} borderColor="border-blue-400 focus:border-blue-500" accentColor="text-blue-500" />
                            <MacroInput label={lang === 'es' ? 'Grasa' : 'Fat'} value={fats} onChange={setFats} borderColor="border-yellow-400 focus:border-yellow-500" accentColor="text-yellow-500" />
                        </div>
                    </div>
                </div>
            )}
        </Modal>
    );
};

const MacroPill: React.FC<{ label: string; value: number; color: string; bgColor: string; unit: string }> = ({ label, value, color, bgColor, unit }) => (
    <div className={`${bgColor} rounded-xl p-2.5 text-center`}>
        <div className={`text-lg font-black ${color} leading-none`}>{value}{unit}</div>
        <div className="text-[9px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mt-1">{label}</div>
    </div>
);

const MacroInput: React.FC<{ label: string; value: string; onChange: (v: string) => void; borderColor: string; accentColor: string }> = ({ label, value, onChange, borderColor, accentColor }) => (
    <div className="space-y-2">
        <label className={`block text-[10px] font-black uppercase tracking-widest ${accentColor} text-center`}>{label} <span className="opacity-60">(g)</span></label>
        <input
            type="number"
            inputMode="decimal"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder="0"
            className={`w-full bg-white dark:bg-zinc-800 border-2 ${borderColor} rounded-2xl px-3 py-4 text-center text-xl font-black text-zinc-900 dark:text-white outline-none transition-all placeholder:text-zinc-300 dark:placeholder:text-zinc-600`}
        />
    </div>
);
