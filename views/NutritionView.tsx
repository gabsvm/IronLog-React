
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Icon } from '../components/ui/Icon';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { DailyNutrition, BodyLog, MacroGoals } from '../types';
import { Line } from 'react-chartjs-2';
import { ChartOptions } from 'chart.js';
import { TutorialOverlay } from '../components/ui/TutorialOverlay';

import { AddFoodModal } from '../components/nutrition/AddFoodModal';
import { LogWeightModal } from '../components/nutrition/LogWeightModal';
import { GoalSetupModal } from '../components/nutrition/GoalSetupModal';

export const NutritionView: React.FC = () => {
    const { 
        lang, 
        theme, 
        nutritionLogs, 
        setNutritionLogs, 
        bodyLogs, 
        setBodyLogs, 
        macroGoals, 
        setMacroGoals,
        userProfile,
        setUserProfile,
        tutorialProgress,
        markTutorialSeen,
    } = useApp();

    const nutritionTutorialSteps = [
        {
            targetId: 'nutrition-calorie-ring',
            title: lang === 'es' ? '🔥 Tu Progreso Calórico' : '🔥 Your Calorie Progress',
            text: lang === 'es'
                ? 'Este anillo muestra las calorías consumidas vs tu objetivo diario. Configura tus metas con el ícono de ajustes arriba.'
                : 'This ring shows calories consumed vs your daily goal. Set your targets with the settings icon above.',
        },
        {
            targetId: 'nutrition-macros',
            title: lang === 'es' ? '⚡ Macronutrientes' : '⚡ Macronutrients',
            text: lang === 'es'
                ? 'Proteínas, carbohidratos y grasas. Cada barra muestra tu progreso hacia la meta. Las proteínas son clave para preservar músculo.'
                : 'Protein, carbs and fat. Each bar shows progress toward your goal. Protein is key to preserving muscle.',
        },
        {
            targetId: 'nutrition-quick-add',
            title: lang === 'es' ? '➕ Registro Rápido' : '➕ Quick Log',
            text: lang === 'es'
                ? 'Toca "Agregar Comida" para buscar alimentos de la base de datos o ingresar macros manualmente. Toca "Registrar Peso" para tu evolución corporal.'
                : 'Tap "Add Food" to search our food database or enter macros manually. Tap "Log Weight" to track your body composition.',
        },
        {
            targetId: 'nutrition-water',
            title: lang === 'es' ? '💧 Hidratación' : '💧 Hydration',
            text: lang === 'es'
                ? '¡No olvides el agua! El objetivo es 2–3 litros por día. Toca +250 o +500 para registrar tus tomas rápidamente.'
                : "Don't forget water! The goal is 2–3 liters a day. Tap +250 or +500 to quickly log your intake.",
        },
    ];

    const [selectedDate, setSelectedDate] = useState(new Date());
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    const todayNutrition = nutritionLogs[dateKey] || { calories: 0, protein: 0, carbs: 0, fats: 0, water: 0 };

    const [showAddFood, setShowAddFood] = useState(false);
    const [showLogWeight, setShowLogWeight] = useState(false);
    const [showGoalSetup, setShowGoalSetup] = useState(false);

    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const locale = lang === 'es' ? es : enUS;

    // --- Calculations ---
    const calorieProgress = macroGoals ? (todayNutrition.calories / macroGoals.calories) * 100 : 0;
    
    // --- Handlers ---
    const updateNutrition = (field: keyof DailyNutrition, value: number) => {
        setNutritionLogs(prev => ({
            ...prev,
            [dateKey]: {
                ...(prev[dateKey] || { id: dateKey, calories: 0, protein: 0, carbs: 0, fats: 0, water: 0 }),
                [field]: value
            }
        }));
    };

    const handleAddFood = (data: { calories: number; protein: number; carbs: number; fats: number }) => {
        setNutritionLogs(prev => {
            const current = prev[dateKey] || { id: dateKey, calories: 0, protein: 0, carbs: 0, fats: 0, water: 0 };
            return {
                ...prev,
                [dateKey]: {
                    ...current,
                    calories: current.calories + data.calories,
                    protein: current.protein + data.protein,
                    carbs: current.carbs + data.carbs,
                    fats: current.fats + data.fats
                }
            };
        });
    };

    const handleLogWeight = (data: { weight: number; bodyFat?: number; notes?: string }) => {
        const newLog: BodyLog = {
            id: Date.now(),
            date: selectedDate.getTime(),
            weight: data.weight,
            bodyFat: data.bodyFat,
            notes: data.notes
        };
        setBodyLogs(prev => [...prev, newLog]);
        setUserProfile(prev => ({
            ...prev,
            bodyWeight: data.weight,
            bodyFat: data.bodyFat
        }));
    };

    const addWater = (amount: number) => {
        updateNutrition('water', (todayNutrition.water || 0) + amount);
    };

    // --- Chart Data ---
    const weightChartData = useMemo(() => {
        const sortedLogs = [...bodyLogs].sort((a, b) => a.date - b.date).slice(-7);
        if (sortedLogs.length === 0) return { labels: [], datasets: [] };

        return {
            labels: sortedLogs.map(l => format(new Date(l.date), 'dd MMM', { locale })),
            datasets: [{
                label: lang === 'es' ? 'Peso (kg)' : 'Weight (kg)',
                data: sortedLogs.map(l => l.weight),
                borderColor: '#f97316',
                backgroundColor: 'rgba(249, 115, 22, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#f97316',
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        };
    }, [bodyLogs, lang, locale]);

    const chartOptions: ChartOptions<'line'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            x: { grid: { display: false }, ticks: { color: isDark ? '#71717a' : '#a1a1aa', font: { size: 10 } } },
            y: { grid: { color: isDark ? '#27272a' : '#f4f4f5' }, ticks: { color: isDark ? '#71717a' : '#a1a1aa', font: { size: 10 } } }
        }
    };

    return (
        <div className="flex flex-col min-h-screen pb-32 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Date Selector */}
            <div className="sticky top-0 z-20 px-4 pt-6 pb-4 bg-zinc-50/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-200 dark:border-white/5">
                <div className="flex items-center justify-between mb-2">
                    <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white uppercase">
                        {lang === 'es' ? 'Nutrición' : 'Nutrition'}
                    </h1>
                    <button 
                        onClick={() => setShowGoalSetup(true)}
                        className="p-2 rounded-xl bg-zinc-200/50 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 transition-colors"
                    >
                        <Icon name="Settings" size={20} className="text-zinc-500" />
                    </button>
                </div>
                
                <div className="flex items-center gap-4 py-2">
                    <button 
                        onClick={() => setSelectedDate(d => new Date(d.setDate(d.getDate() - 1)))}
                        className="p-2 rounded-xl bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 active:scale-90 transition-transform"
                    >
                        <Icon name="ChevronLeft" size={18} />
                    </button>
                    <div className="flex-1 text-center font-bold text-zinc-800 dark:text-zinc-100 capitalize">
                        {selectedDate.toDateString() === new Date().toDateString() 
                            ? (lang === 'es' ? 'Hoy' : 'Today') 
                            : format(selectedDate, 'EEEE, d MMMM', { locale })}
                    </div>
                    <button 
                        onClick={() => setSelectedDate(d => new Date(d.setDate(d.getDate() + 1)))}
                        className="p-2 rounded-xl bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 active:scale-90 transition-transform"
                    >
                        <Icon name="ChevronRight" size={18} />
                    </button>
                </div>
            </div>

            <div className="px-4 space-y-5 mt-5">
                {/* Daily Summary Card */}
                <div id="nutrition-calorie-ring" className="relative overflow-hidden rounded-[2.5rem] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 p-8 shadow-xl">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-[60px] rounded-full -mr-16 -mt-16" />
                    
                    <div className="flex flex-col items-center">
                        <div className="relative flex items-center justify-center mb-6">
                            <svg className="w-56 h-56 transform -rotate-90">
                                <circle
                                    className="text-zinc-100 dark:text-white/5"
                                    strokeWidth="10"
                                    stroke="currentColor"
                                    fill="transparent"
                                    r="100"
                                    cx="112"
                                    cy="112"
                                />
                                <circle
                                    className="text-orange-500 transition-all duration-1000 ease-out"
                                    strokeWidth="12"
                                    strokeDasharray={2 * Math.PI * 100}
                                    strokeDashoffset={2 * Math.PI * 100 * (1 - Math.min(calorieProgress, 100) / 100)}
                                    strokeLinecap="round"
                                    stroke="currentColor"
                                    fill="transparent"
                                    r="100"
                                    cx="112"
                                    cy="112"
                                />
                            </svg>
                            <div className="absolute flex flex-col items-center text-center">
                                <span className="text-4xl font-black text-zinc-900 dark:text-white leading-none">
                                    {todayNutrition.calories}
                                </span>
                                <span className="text-xs font-black uppercase tracking-widest text-zinc-400 mt-2">
                                    {lang === 'es' ? 'Kcal Totales' : 'Total Kcal'}
                                </span>
                                {macroGoals && (
                                    <span className="mt-1 text-[10px] font-bold text-orange-500/80 uppercase tracking-tighter">
                                        {lang === 'es' ? 'Objetivo: ' : 'Goal: '} {macroGoals.calories}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Macros Grid */}
                        <div id="nutrition-macros" className="grid grid-cols-3 gap-8 w-full border-t border-zinc-100 dark:border-white/5 pt-8">
                            <MacroItem 
                                label={lang === 'es' ? 'Prot' : 'Prot'} 
                                current={todayNutrition.protein} 
                                target={macroGoals?.protein || 0}
                                color="bg-red-500"
                                unit="g"
                            />
                            <MacroItem 
                                label={lang === 'es' ? 'Carb' : 'Carb'} 
                                current={todayNutrition.carbs} 
                                target={macroGoals?.carbs || 0}
                                color="bg-blue-500"
                                unit="g"
                            />
                            <MacroItem 
                                label={lang === 'es' ? 'Grasa' : 'Fat'} 
                                current={todayNutrition.fats} 
                                target={macroGoals?.fats || 0}
                                color="bg-yellow-500"
                                unit="g"
                            />
                        </div>
                    </div>
                </div>

                {/* Water Section */}
                <div id="nutrition-water" className="rounded-[2rem] bg-blue-500/5 border border-blue-500/10 p-6 flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-blue-500/20 text-blue-500 shadow-inner">
                                <Icon name="Droplet" size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-zinc-900 dark:text-white uppercase text-xs tracking-widest">
                                    {lang === 'es' ? 'Hidratación' : 'Hydration'}
                                </h3>
                                <p className="text-2xl font-black text-blue-500">
                                    {todayNutrition.water || 0} <span className="text-xs font-bold text-blue-300">ml</span>
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => addWater(250)}
                                className="bg-blue-500 text-white w-12 h-12 flex items-center justify-center rounded-xl text-xs font-black shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                            >
                                +250
                            </button>
                            <button 
                                onClick={() => addWater(500)}
                                className="bg-blue-600 text-white w-12 h-12 flex items-center justify-center rounded-xl text-xs font-black shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                            >
                                +500
                            </button>
                        </div>
                    </div>
                    
                    {/* Water progress micro-bar */}
                    <div className="w-full h-1.5 bg-blue-500/10 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-blue-500 transition-all duration-1000 ease-out"
                            style={{ width: `${Math.min(((todayNutrition.water || 0) / 3000) * 100, 100)}%` }}
                        />
                    </div>
                </div>

                {/* Quick Add Section */}
                <div id="nutrition-quick-add" className="grid grid-cols-1 gap-4">
                    <h2 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 px-1">
                        {lang === 'es' ? 'Registro Rápido' : 'Quick Actions'}
                    </h2>
                    <div className="grid grid-cols-2 gap-3">
                        <QuickAddButton 
                            icon="Apple" 
                            label={lang === 'es' ? 'Agregar Comida' : 'Add Food'} 
                            onClick={() => setShowAddFood(true)} 
                            color="bg-orange-500"
                        />
                        <QuickAddButton 
                            icon="Scale" 
                            label={lang === 'es' ? 'Registrar Peso' : 'Log Weight'} 
                            onClick={() => setShowLogWeight(true)} 
                            color="bg-zinc-900"
                        />
                    </div>
                </div>

                {/* Weight Chart Section */}
                <div className="rounded-[2rem] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <Icon name="TrendingUp" size={18} className="text-orange-500" />
                            <h3 className="font-bold text-zinc-900 dark:text-white uppercase text-xs tracking-widest">
                                {lang === 'es' ? 'Evolución de Peso' : 'Weight Evolution'}
                            </h3>
                        </div>
                        <div className="px-3 py-1 bg-orange-500/10 text-orange-500 rounded-lg text-[10px] font-black underline decoration-2 underline-offset-4">
                            7 DÍAS
                        </div>
                    </div>
                    <div className="h-48 w-full group">
                        {bodyLogs.length > 1 ? (
                            <Line data={weightChartData} options={chartOptions} />
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                                <Icon name="Scale" size={32} className="mb-2" />
                                <p className="text-xs font-bold uppercase tracking-widest">{lang === 'es' ? 'Faltan datos' : 'Need more data'}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Goals & TDEE (Call to Action) */}
                <div 
                    onClick={() => setShowGoalSetup(true)}
                    className="rounded-[2rem] bg-zinc-900 dark:bg-white text-white dark:text-black p-8 relative overflow-hidden cursor-pointer active:scale-[0.98] transition-all group"
                >
                    <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/5 dark:bg-black/5 blur-[40px] rounded-full -mr-20 -mb-20" />
                    <div className="relative z-10 flex flex-col gap-1">
                        <h3 className="text-2xl font-black uppercase tracking-tighter">
                            {lang === 'es' ? 'Optimiza tu Dieta' : 'Optimize Your Diet'}
                        </h3>
                        <p className="text-zinc-400 dark:text-zinc-500 text-xs font-medium max-w-[200px] leading-relaxed">
                            {lang === 'es' 
                                ? 'Calcula tus calorías ideales y define tus macros con IA.' 
                                : 'Calculate your ideal calories and define your macros with AI.'}
                        </p>
                    </div>
                    <div className="mt-8 relative z-10">
                        <div className="inline-flex items-center gap-2 bg-orange-500 text-white px-5 py-2.5 rounded-2xl font-black uppercase tracking-wider text-[10px] shadow-xl shadow-orange-500/20 group-hover:bg-orange-600 transition-colors">
                            {lang === 'es' ? 'Empezar Plan' : 'Start Plan'}
                            <Icon name="ArrowRight" size={12} />
                        </div>
                    </div>
                    <div className="absolute top-6 right-8 opacity-20 transform group-hover:scale-110 group-hover:rotate-6 transition-transform">
                        <Icon name="Bot" size={72} />
                    </div>
                </div>
            </div>

            {/* Nutrition Tutorial */}
            <TutorialOverlay
                steps={nutritionTutorialSteps}
                isActive={!tutorialProgress.nutrition}
                onComplete={() => markTutorialSeen('nutrition')}
            />

            {/* Modals */}
            <AddFoodModal 
                isOpen={showAddFood} 
                onClose={() => setShowAddFood(false)} 
                onAdd={handleAddFood} 
            />
            <LogWeightModal 
                isOpen={showLogWeight} 
                onClose={() => setShowLogWeight(false)} 
                onLog={handleLogWeight} 
            />
            <GoalSetupModal 
                isOpen={showGoalSetup} 
                onClose={() => setShowGoalSetup(false)} 
            />
        </div>
    );
};

interface MacroItemProps {
    label: string;
    current: number;
    target: number;
    color: string;
    unit: string;
}

const MacroItem: React.FC<MacroItemProps> = ({ label, current, target, color, unit }) => {
    const progress = target > 0 ? (current / target) * 100 : 0;
    
    return (
        <div className="flex flex-col items-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">{label}</span>
            <div className="w-full h-1 bg-zinc-100 dark:bg-white/5 rounded-full overflow-hidden mb-2">
                <div 
                    className={`h-full ${color} transition-all duration-700 ease-out`}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                />
            </div>
            <div className="flex items-baseline gap-0.5">
                <span className="text-sm font-black text-zinc-900 dark:text-white">{current}</span>
                <span className="text-[10px] font-medium text-zinc-500">{unit}</span>
            </div>
        </div>
    );
};

interface QuickAddButtonProps {
    icon: string;
    label: string;
    onClick: () => void;
    color: string;
}

const QuickAddButton: React.FC<QuickAddButtonProps> = ({ icon, label, onClick, color }) => (
    <button 
        onClick={onClick}
        className="flex items-center gap-3 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 active:scale-[0.96] transition-all hover:border-zinc-300 dark:hover:border-white/20 group shadow-sm"
    >
        <div className={`p-2.5 rounded-xl ${color} text-white shadow-lg shadow-black/10 transition-transform group-hover:scale-110 group-active:scale-95 flex-shrink-0`}>
            <Icon name={icon} size={20} className="text-white" />
        </div>
        <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300 text-left leading-tight">
            {label}
        </span>
    </button>
);

