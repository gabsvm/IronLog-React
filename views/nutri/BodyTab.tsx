import React from 'react';
import { BodyLog, NutritionGoal } from '../../types';
import { Icon } from '../../components/ui/Icon';

interface Props {
    lang: 'en' | 'es';
    latestWeight: BodyLog | null;
    weightTrend: BodyLog[];
    recentWeighIns: BodyLog[];
    nutritionGoal: NutritionGoal;
    todayCalories: number;
    tdee: number | null;
    bodyWeight?: number;
    bodyFat?: number;
    onLogWeight: () => void;
}

/**
 * "Body" tab of NutriView: current weight + TDEE balance card + computed
 * personal protein/water targets + last 30-day weight chart + recent weigh-ins.
 * Pure presentational — all data + handlers are passed in.
 */
export const BodyTab: React.FC<Props> = ({
    lang,
    latestWeight,
    weightTrend,
    recentWeighIns,
    nutritionGoal,
    todayCalories,
    tdee,
    bodyWeight,
    bodyFat,
    onLogWeight,
}) => {
    const l = (en: string, es: string) => (lang === 'en' ? en : es);

    return (
        <div className="space-y-3 pt-1">
            {/* Weight + TDEE hero */}
            <div className="glass-card rounded-3xl p-4">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">
                            {l('Body Weight', 'Peso Corporal')}
                        </p>
                        {latestWeight ? (
                            <>
                                <div className="text-4xl font-black text-white leading-none">{latestWeight.weight}</div>
                                <p className="text-xs text-zinc-500 mt-1">
                                    kg · {new Date(latestWeight.date).toLocaleDateString(lang === 'es' ? 'es-AR' : 'en-US', { month: 'short', day: 'numeric' })}
                                </p>
                                {latestWeight.bodyFat && (
                                    <p className="text-xs text-zinc-500">
                                        {latestWeight.bodyFat}% {l('body fat', 'grasa corporal')}
                                    </p>
                                )}
                            </>
                        ) : (
                            <p className="text-zinc-600 text-sm mt-1">{l('No data yet', 'Sin datos aún')}</p>
                        )}
                    </div>
                    <button
                        onClick={onLogWeight}
                        aria-label={l('Log body weight', 'Registrar peso corporal')}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-bold active:scale-95 transition-all duration-fast ease-natural hover:bg-zinc-700"
                    >
                        <Icon name="Plus" size={14} />
                        {l('Log', 'Registrar')}
                    </button>
                </div>

                {/* Mini weight chart */}
                {weightTrend.length > 1 && (() => {
                    const min = Math.min(...weightTrend.map((wl) => wl.weight)) - 1;
                    const max = Math.max(...weightTrend.map((wl) => wl.weight)) + 1;
                    const range = max - min || 1;
                    const points = weightTrend
                        .map((entry, i) => {
                            const x = (i / (weightTrend.length - 1)) * 100;
                            const y = 100 - ((entry.weight - min) / range) * 100;
                            return `${x},${y}`;
                        })
                        .join(' ');
                    return (
                        <div className="mt-3 pt-3 border-t border-zinc-800">
                            <p className="text-[10px] text-zinc-600 mb-2">{l('Last 30 days', 'Últimos 30 días')}</p>
                            <svg viewBox="0 0 100 40" className="w-full h-10" preserveAspectRatio="none" aria-hidden="true">
                                <polyline
                                    points={points}
                                    fill="none"
                                    stroke="currentColor"
                                    className="text-primary-500"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    vectorEffect="non-scaling-stroke"
                                />
                            </svg>
                        </div>
                    );
                })()}
            </div>

            {/* TDEE card */}
            <div className="glass-card rounded-3xl p-4">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">
                    {l('Energy Balance', 'Balance Energético')}
                </p>
                <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                        <p className="text-xl font-black text-white">{nutritionGoal.calories}</p>
                        <p className="text-[9px] text-zinc-500 uppercase">{l('Goal', 'Meta')}</p>
                    </div>
                    <div className="text-center">
                        <p className={`text-xl font-black ${todayCalories > nutritionGoal.calories ? 'text-orange-400' : 'text-green-400'}`}>
                            {todayCalories}
                        </p>
                        <p className="text-[9px] text-zinc-500 uppercase">{l('Eaten', 'Consumido')}</p>
                    </div>
                    {tdee && (
                        <div className="text-center">
                            <p className="text-xl font-black text-zinc-300">{tdee}</p>
                            <p className="text-[9px] text-zinc-500 uppercase">TDEE</p>
                        </div>
                    )}
                </div>
                {tdee && (
                    <div className="mt-3 pt-3 border-t border-zinc-800">
                        <p className="text-[11px] text-zinc-500 text-center">
                            {nutritionGoal.calories < tdee
                                ? `${l('Deficit', 'Déficit')} ${tdee - nutritionGoal.calories} kcal · ${l('Fat loss mode', 'Modo pérdida grasa')}`
                                : nutritionGoal.calories > tdee
                                    ? `${l('Surplus', 'Superávit')} ${nutritionGoal.calories - tdee} kcal · ${l('Building mode', 'Modo volumen')}`
                                    : l('Maintenance calories', 'Calorías de mantenimiento')}
                        </p>
                    </div>
                )}
            </div>

            {/* Personal targets */}
            {bodyWeight && (
                <div className="glass-card rounded-3xl p-4">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">
                        {l('Your Targets', 'Tus Objetivos')}
                    </p>
                    <div className="space-y-2">
                        {[
                            { id: 'min_protein', label: l('Min protein', 'Proteína mínima'), value: `${Math.round(bodyWeight * 1.8)}g`, color: 'text-blue-400' },
                            { id: 'opt_protein', label: l('Optimal protein', 'Proteína óptima'), value: `${Math.round(bodyWeight * 2.2)}g`, color: 'text-blue-300' },
                            { id: 'water', label: l('Daily water', 'Agua diaria'), value: `${Math.round(bodyWeight * 37)}ml`, color: 'text-sky-400' },
                            ...(bodyFat ? [{ id: 'body_fat', label: l('Body fat', 'Grasa corporal'), value: `${bodyFat}%`, color: 'text-zinc-300' }] : []),
                        ].map((item) => (
                            <div key={item.id} className="flex justify-between items-center py-1.5 border-b border-zinc-800/50 last:border-0">
                                <span className="text-xs text-zinc-500">{item.label}</span>
                                <span className={`text-sm font-bold ${item.color}`}>{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent weigh-ins */}
            {weightTrend.length > 0 && (
                <div className="glass-card rounded-3xl p-4">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">
                        {l('Recent Weigh-ins', 'Pesajes Recientes')}
                    </p>
                    <div className="space-y-1">
                        {recentWeighIns.map((entry) => (
                            <div key={entry.id} className="flex justify-between items-center py-1.5 border-b border-zinc-800/50 last:border-0">
                                <span className="text-xs text-zinc-500">
                                    {new Date(entry.date).toLocaleDateString(lang === 'es' ? 'es-AR' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                </span>
                                <div className="text-right">
                                    <span className="text-sm font-bold text-white">{entry.weight} kg</span>
                                    {entry.bodyFat && <span className="text-[10px] text-zinc-500 ml-2">{entry.bodyFat}% BF</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
