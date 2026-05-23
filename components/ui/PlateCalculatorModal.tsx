import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../constants';
import { Button } from './Button';
import { Icon } from './Icon';
import { Sheet } from './Sheet';
import { calculatePlates, STANDARD_PLATES } from '../../utils/plateMath';

interface PlateCalculatorModalProps {
    initialWeight: number;
    onClose: () => void;
}

export const PlateCalculatorModal: React.FC<PlateCalculatorModalProps> = ({ initialWeight, onClose }) => {
    const { lang, config, setConfig } = useApp();
    const t = TRANSLATIONS[lang];
    const [weight, setWeight] = useState(initialWeight || 20);
    const [barWeight, setBarWeight] = useState(20);
    const [showInventory, setShowInventory] = useState(false);

    const inventory = config.plateInventory || {};
    const { plates, remainder } = calculatePlates(weight, barWeight, inventory);

    const updateInventory = (plateWeight: number, change: number) => {
        const current = inventory[plateWeight] || 0;
        const next = Math.max(0, current + change);
        setConfig({ plateInventory: { ...inventory, [plateWeight]: next } });
    };

    return (
        <Sheet
            open={true}
            onOpenChange={(o) => { if (!o) onClose(); }}
            title={t.plateCalc.title}
            accent="zinc"
            footer={<Button fullWidth onClick={onClose}>{t.close}</Button>}
        >
            <div className="p-5 space-y-6">
                <div className="flex justify-end">
                    <button
                        onClick={() => setShowInventory(!showInventory)}
                        aria-pressed={showInventory}
                        aria-label={showInventory ? 'Hide plate inventory' : 'Show plate inventory'}
                        className={`p-2 rounded-full transition-colors duration-fast ease-natural ${showInventory ? 'text-blue-500 bg-blue-500/10 hover:bg-blue-500/20' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                    >
                        <Icon name="Settings" size={20} />
                    </button>
                </div>

                {showInventory ? (
                    <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-base">
                        <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest bg-zinc-100 dark:bg-zinc-800/50 p-3 rounded-lg flex items-start gap-2">
                            <Icon name="Info" size={16} className="shrink-0 text-blue-400" />
                            {lang === 'es' ? 'La calculadora solo usará los discos que realmente tengas disponibles.' : 'The calculator will only use the plates you actually own.'}
                        </div>
                        {STANDARD_PLATES.map(p => {
                            const qty = inventory[p.weight] || 0;
                            return (
                                <div key={p.weight} className="flex justify-between items-center bg-zinc-100 dark:bg-zinc-800/80 p-2 rounded-xl border border-transparent hover:border-zinc-700 transition-colors duration-fast">
                                    <div className="flex items-center gap-3 w-20">
                                        <div className={`w-3 h-8 shadow-sm rounded-[2px] ${p.color}`}></div>
                                        <span className="font-black text-zinc-900 dark:text-white">{p.weight}</span>
                                    </div>
                                    <div className="flex items-center gap-4 bg-white dark:bg-zinc-900 rounded-lg p-1.5 px-4 shadow-sm">
                                        <button
                                            onClick={() => updateInventory(p.weight, -2)}
                                            aria-label={`Remove 2 of ${p.weight}kg plates`}
                                            className="text-red-500 font-black p-1 active:scale-90 hover:opacity-80 transition-transform duration-fast"
                                        >
                                            <Icon name="Minus" size={16} />
                                        </button>
                                        <span className="font-mono font-black text-lg w-6 text-center text-zinc-800 dark:text-zinc-200">{qty}</span>
                                        <button
                                            onClick={() => updateInventory(p.weight, 2)}
                                            aria-label={`Add 2 of ${p.weight}kg plates`}
                                            className="text-green-500 font-black p-1 active:scale-90 hover:opacity-80 transition-transform duration-fast"
                                        >
                                            <Icon name="Plus" size={16} />
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-base">
                        {/* Controls */}
                        <div className="space-y-4">
                            <div className="bg-zinc-100 dark:bg-zinc-800 p-2 rounded-xl flex items-center justify-between">
                                <button
                                    onClick={() => setWeight(w => Math.max(barWeight, w - 2.5))}
                                    aria-label="Decrease weight by 2.5"
                                    className="w-12 h-12 rounded-lg bg-white dark:bg-zinc-700 flex items-center justify-center shadow-sm"
                                >
                                    <Icon name="Minus" size={20} />
                                </button>
                                <div className="text-center">
                                    <input
                                        type="number"
                                        value={weight}
                                        onChange={(e) => setWeight(Number(e.target.value))}
                                        aria-label="Total target weight"
                                        className="bg-transparent text-3xl font-black text-center w-32 outline-none"
                                    />
                                    <div className="text-[10px] font-bold text-zinc-400 uppercase">{t.plateCalc.totalWeight}</div>
                                </div>
                                <button
                                    onClick={() => setWeight(w => w + 2.5)}
                                    aria-label="Increase weight by 2.5"
                                    className="w-12 h-12 rounded-lg bg-white dark:bg-zinc-700 flex items-center justify-center shadow-sm"
                                >
                                    <Icon name="Plus" size={20} />
                                </button>
                            </div>

                            <div className="flex justify-center gap-4 text-xs font-bold text-zinc-500">
                                <button onClick={() => setBarWeight(20)} className={`px-3 py-1 rounded-full ${barWeight === 20 ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900' : 'bg-zinc-100 dark:bg-zinc-800'}`}>{t.plateCalc.bar}: 20kg</button>
                                <button onClick={() => setBarWeight(15)} className={`px-3 py-1 rounded-full ${barWeight === 15 ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900' : 'bg-zinc-100 dark:bg-zinc-800'}`}>{t.plateCalc.bar}: 15kg</button>
                            </div>
                        </div>

                        {/* Visualization */}
                        <div className="h-32 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-white/5 flex items-center justify-center relative overflow-hidden">
                            {/* Barbell Line */}
                            <div className="absolute w-full h-4 bg-zinc-300 dark:bg-zinc-700 z-0"></div>

                            {/* Barbell Sleeve Stop */}
                            <div className="absolute left-4 h-12 w-2 bg-zinc-400 z-10 rounded-sm"></div>

                            {/* Plates */}
                            <div className="flex items-center gap-0.5 z-20 ml-8">
                                {plates.length === 0 ? (
                                    <span className="text-xs text-zinc-400 font-bold bg-white dark:bg-zinc-900 px-2 py-1 rounded absolute top-2 left-1/2 -translate-x-1/2">{t.plateCalc.empty}</span>
                                ) : (
                                    plates.map((plate, i) => (
                                        <div
                                            key={i}
                                            className={`w-4 ${plate.heightClass} ${plate.color} rounded-sm border-l border-black/10 shadow-sm relative group`}
                                        >
                                            <span className="hidden group-hover:block absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[9px] px-1 rounded font-bold whitespace-nowrap">
                                                {plate.weight}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Text Summary */}
                        <div className="space-y-2">
                            <p className="text-center text-sm font-bold text-zinc-600 dark:text-zinc-300">
                                {t.plateCalc.loadPerSide}: <span className="text-zinc-900 dark:text-white text-lg">{(weight - barWeight) / 2} kg</span>
                            </p>

                            <div className="flex flex-wrap justify-center gap-2">
                                {Array.from(new Set(plates.map(p => p.weight))).sort((a, b) => b - a).map(w => {
                                    const count = plates.filter(p => p.weight === w).length;
                                    return (
                                        <div key={w} className="bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-lg text-xs font-bold text-zinc-600 dark:text-zinc-300">
                                            {count}x {w}kg
                                        </div>
                                    )
                                })}
                            </div>

                            {remainder > 0 && (
                                <div className="text-center text-xs text-red-500 font-bold bg-red-50 dark:bg-red-900/10 py-2 rounded-lg border border-red-500/20">
                                    {t.plateCalc.cannotLoad} ({remainder.toFixed(1)}kg) - {lang === 'es' ? 'Faltan discos' : 'Inventory shortage'}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </Sheet>
    );
};
