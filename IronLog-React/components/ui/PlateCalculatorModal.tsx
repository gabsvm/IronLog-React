
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../constants';
import { Button } from './Button';
import { Icon } from './Icon';
import { calculatePlates, STANDARD_PLATES } from '../../utils/plateMath';

interface PlateCalculatorModalProps {
    initialWeight: number;
    onClose: () => void;
}

export const PlateCalculatorModal: React.FC<PlateCalculatorModalProps> = ({ initialWeight, onClose }) => {
    const { lang } = useApp();
    const t = TRANSLATIONS[lang];
    const [weight, setWeight] = useState(initialWeight || 20);
    const [barWeight, setBarWeight] = useState(20);

    const { plates, remainder } = calculatePlates(weight, barWeight);

    return (
        <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl space-y-6" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-black text-zinc-900 dark:text-white uppercase flex items-center gap-2">
                        <Icon name="Dumbbell" size={24} /> {t.plateCalc.title}
                    </h3>
                    <button onClick={onClose} className="text-zinc-400"><Icon name="X" size={24} /></button>
                </div>

                {/* Controls */}
                <div className="space-y-4">
                    <div className="bg-zinc-100 dark:bg-zinc-800 p-2 rounded-xl flex items-center justify-between">
                         <button onClick={() => setWeight(w => Math.max(barWeight, w - 2.5))} className="w-12 h-12 rounded-lg bg-white dark:bg-zinc-700 flex items-center justify-center shadow-sm">
                             <Icon name="Minus" size={20} />
                         </button>
                         <div className="text-center">
                             <input 
                                type="number" 
                                value={weight} 
                                onChange={(e) => setWeight(Number(e.target.value))}
                                className="bg-transparent text-3xl font-black text-center w-32 outline-none"
                             />
                             <div className="text-[10px] font-bold text-zinc-400 uppercase">{t.plateCalc.totalWeight}</div>
                         </div>
                         <button onClick={() => setWeight(w => w + 2.5)} className="w-12 h-12 rounded-lg bg-white dark:bg-zinc-700 flex items-center justify-center shadow-sm">
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
                         {t.plateCalc.loadPerSide}: <span className="text-zinc-900 dark:text-white text-lg">{(weight - barWeight)/2} kg</span>
                     </p>
                     
                     <div className="flex flex-wrap justify-center gap-2">
                        {Array.from(new Set(plates.map(p => p.weight))).sort((a,b) => b-a).map(w => {
                            const count = plates.filter(p => p.weight === w).length;
                            return (
                                <div key={w} className="bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-lg text-xs font-bold text-zinc-600 dark:text-zinc-300">
                                    {count}x {w}kg
                                </div>
                            )
                        })}
                     </div>
                     
                     {remainder > 0 && (
                         <div className="text-center text-xs text-red-500 font-bold bg-red-50 dark:bg-red-900/10 py-2 rounded-lg">
                             {t.plateCalc.cannotLoad} ({remainder.toFixed(1)}kg left)
                         </div>
                     )}
                </div>

                <Button fullWidth onClick={onClose}>{t.close}</Button>
            </div>
        </div>
    );
};
