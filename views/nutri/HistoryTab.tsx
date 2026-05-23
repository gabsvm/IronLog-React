import React from 'react';
import { NutritionGoal } from '../../types';

export interface DaySummary {
    date: string;
    label: string;
    shortDate: string;
    isToday: boolean;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
}

interface Props {
    lang: 'en' | 'es';
    last14Days: DaySummary[];
    historyDayList: DaySummary[];
    nutritionGoal: NutritionGoal;
}

/**
 * "History" tab of NutriView: 14-day averages, calories bar chart, protein
 * bar chart, per-day log list. Pure presentational — all derivations come
 * from the parent memos.
 */
export const HistoryTab: React.FC<Props> = ({ lang, last14Days, historyDayList, nutritionGoal }) => {
    const l = (en: string, es: string) => (lang === 'en' ? en : es);

    const tracked = last14Days.filter((d) => d.calories > 0);
    const avgCal = tracked.length > 0 ? Math.round(tracked.reduce((a, d) => a + d.calories, 0) / tracked.length) : 0;
    const avgProt = tracked.length > 0 ? Math.round(tracked.reduce((a, d) => a + d.protein, 0) / tracked.length) : 0;

    return (
        <div className="space-y-3 pt-1">
            {/* Weekly averages */}
            {tracked.length > 0 && (
                <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-4">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">
                        {l('14-Day Average', 'Promedio 14 Días')} · {tracked.length} {l('days tracked', 'días registrados')}
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-2xl font-black text-white">{avgCal}</p>
                            <p className="text-[10px] text-zinc-500 uppercase">kcal/día</p>
                            <p className={`text-[10px] mt-1 ${avgCal > nutritionGoal.calories ? 'text-orange-400' : 'text-green-400'}`}>
                                {avgCal > nutritionGoal.calories ? '+' : ''}{avgCal - nutritionGoal.calories} vs {l('goal', 'meta')}
                            </p>
                        </div>
                        <div>
                            <p className="text-2xl font-black text-blue-400">{avgProt}g</p>
                            <p className="text-[10px] text-zinc-500 uppercase">{l('avg protein', 'proteína prom.')}</p>
                            <p className={`text-[10px] mt-1 ${avgProt >= nutritionGoal.protein ? 'text-green-400' : 'text-zinc-500'}`}>
                                {avgProt >= nutritionGoal.protein ? '✓ ' : ''}{l('goal', 'meta')} {nutritionGoal.protein}g
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Calories chart */}
            <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-4">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">
                    {l('Calories — Last 14 Days', 'Calorías — 14 Días')}
                </p>
                <div className="flex items-end gap-1 h-24">
                    {last14Days.map((day) => {
                        const pct = Math.min(day.calories / Math.max(nutritionGoal.calories, 1), 1.15);
                        const over = day.calories > nutritionGoal.calories;
                        return (
                            <div key={day.date} className="flex-1 flex flex-col items-center gap-0.5">
                                {day.calories > 0 && (
                                    <span className="text-[7px] text-zinc-600 leading-none">
                                        {day.calories > 999 ? `${(day.calories / 1000).toFixed(1)}k` : day.calories}
                                    </span>
                                )}
                                <div
                                    className={`w-full rounded-t transition-all duration-slow ease-natural ${day.isToday ? 'bg-red-500' : over ? 'bg-orange-500/70' : 'bg-zinc-700'}`}
                                    style={{ height: `${Math.max(pct * 80, day.calories > 0 ? 4 : 0)}px` }}
                                />
                                <span className={`text-[7px] leading-none ${day.isToday ? 'text-red-400 font-bold' : 'text-zinc-600'}`}>
                                    {day.shortDate}
                                </span>
                            </div>
                        );
                    })}
                </div>
                <div className="mt-2 flex items-center gap-3 text-[9px] text-zinc-600">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-500 inline-block" />{l('Today', 'Hoy')}</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-orange-500/70 inline-block" />{l('Over goal', 'Sobre meta')}</span>
                    <span className="ml-auto">{l('Goal', 'Meta')}: {nutritionGoal.calories} kcal</span>
                </div>
            </div>

            {/* Protein chart */}
            <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-4">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">
                    {l('Protein — Last 14 Days', 'Proteína — 14 Días')}
                </p>
                <div className="flex items-end gap-1 h-20">
                    {last14Days.map((day) => {
                        const pct = Math.min(day.protein / Math.max(nutritionGoal.protein, 1), 1.2);
                        return (
                            <div key={day.date} className="flex-1 flex flex-col items-center gap-0.5">
                                <div
                                    className={`w-full rounded-t transition-all duration-slow ease-natural ${day.isToday ? 'bg-blue-500' : day.protein >= nutritionGoal.protein ? 'bg-blue-600/70' : 'bg-zinc-700'}`}
                                    style={{ height: `${Math.max(pct * 68, day.protein > 0 ? 3 : 0)}px` }}
                                />
                                <span className={`text-[7px] leading-none ${day.isToday ? 'text-blue-400 font-bold' : 'text-zinc-600'}`}>
                                    {day.shortDate}
                                </span>
                            </div>
                        );
                    })}
                </div>
                <p className="text-[9px] text-zinc-600 mt-2 text-right">{l('Goal', 'Meta')}: {nutritionGoal.protein}g</p>
            </div>

            {/* Day log list */}
            {historyDayList.map((day) => (
                <div key={day.date} className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4">
                    <div className="flex justify-between items-center mb-2">
                        <div>
                            <span className={`text-sm font-bold ${day.isToday ? 'text-red-400' : 'text-white'}`}>
                                {day.isToday ? l('Today', 'Hoy') : day.label}
                            </span>
                            <span className="text-xs text-zinc-600 ml-2">{day.date}</span>
                        </div>
                        <div className="text-right">
                            <span className={`text-sm font-bold ${day.calories > nutritionGoal.calories ? 'text-orange-400' : 'text-zinc-300'}`}>
                                {day.calories} kcal
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-3 text-xs">
                        <span className="text-blue-400 font-medium">{Math.round(day.protein)}g P</span>
                        <span className="text-amber-400 font-medium">{Math.round(day.carbs)}g C</span>
                        <span className="text-pink-400 font-medium">{Math.round(day.fat)}g F</span>
                    </div>
                    {/* Mini progress bar for protein */}
                    <div className="mt-2 h-1 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full ${day.protein >= nutritionGoal.protein ? 'bg-blue-500' : 'bg-blue-800'}`}
                            style={{ width: `${Math.min(100, (day.protein / nutritionGoal.protein) * 100)}%` }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
};
