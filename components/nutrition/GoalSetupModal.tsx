
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../ui/Modal';
import { Icon } from '../ui/Icon';
import { calculateTDEE, calculateMacros } from '../../utils';

interface GoalSetupModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const GoalSetupModal: React.FC<GoalSetupModalProps> = ({ isOpen, onClose }) => {
    const { lang, userProfile, setUserProfile, setMacroGoals } = useApp();
    const [step, setStep] = useState(1);
    
    // Form State
    const [age, setAge] = useState<string>(String(userProfile?.age || ''));
    const [gender, setGender] = useState<'male' | 'female'>(userProfile?.gender === 'female' ? 'female' : 'male');
    const [height, setHeight] = useState<string>(String(userProfile?.height || ''));
    const [weight, setWeight] = useState<string>(String(userProfile?.bodyWeight || ''));
    const [activity, setActivity] = useState(userProfile?.activityLevel || 'moderate');
    const [goal, setGoal] = useState<'cut' | 'maintain' | 'bulk'>(userProfile?.nutritionGoal || 'maintain');

    const handleFinish = () => {
        const tdee = calculateTDEE(Number(weight), Number(height), Number(age), gender, activity);
        
        let targetCalories = tdee;
        if (goal === 'cut') targetCalories -= 500;
        else if (goal === 'bulk') targetCalories += 300;

        const macros = calculateMacros(targetCalories, goal);

        setUserProfile(prev => ({
            ...prev,
            age: Number(age),
            gender,
            height: Number(height),
            bodyWeight: Number(weight),
            activityLevel: activity as any,
            nutritionGoal: goal
        }));

        setMacroGoals({
            calories: targetCalories,
            ...macros
        });

        onClose();
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={lang === 'es' ? 'Configurar Objetivos' : 'Setup Goals'}
            footer={
                <div className="flex gap-3">
                    {step > 1 && (
                        <button type="button" onClick={() => setStep(s => s - 1)} className="flex-1 py-3.5 rounded-2xl font-bold text-sm text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 transition-all active:scale-95">
                            {lang === 'es' ? 'Atrás' : 'Back'}
                        </button>
                    )}
                    <button 
                        type="button"
                        onClick={() => { if (step < 3) setStep(s => s + 1); else handleFinish(); }}
                        className="flex-1 py-3.5 rounded-2xl font-black text-sm text-white bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/30 transition-all active:scale-95"
                    >
                        {step === 3 ? (lang === 'es' ? '✓ Guardar Plan' : '✓ Save Plan') : (lang === 'es' ? 'Siguiente →' : 'Next →')}
                    </button>
                </div>
            }
        >
            <div className="space-y-8">
                {/* Progress Indicators */}
                <div className="flex gap-2">
                    {[1, 2, 3].map(s => (
                        <div 
                            key={s} 
                            className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${s <= step ? 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.3)]' : 'bg-zinc-200 dark:bg-white/5'}`} 
                        />
                    ))}
                </div>

                {step === 1 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="space-y-2">
                            <h3 className="text-xl font-black text-zinc-900 dark:text-white">
                                {lang === 'es' ? 'Tus Datos' : 'Your Data'}
                            </h3>
                            <p className="text-sm text-zinc-500">
                                {lang === 'es' ? 'Necesitamos estos datos para calcular tu BMR.' : 'We need these details to calculate your BMR.'}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">
                                    {lang === 'es' ? 'Edad' : 'Age'}
                                </label>
                                <input
                                    type="number"
                                    value={age}
                                    onChange={e => setAge(e.target.value)}
                                    className="w-full bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl px-5 py-3 font-bold text-lg text-zinc-900 dark:text-white outline-none focus:border-orange-500 transition-all"
                                    placeholder="25"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">
                                    {lang === 'es' ? 'Género' : 'Gender'}
                                </label>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => setGender('male')}
                                        className={`flex-1 py-3 rounded-2xl font-bold border transition-all ${gender === 'male' ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/20' : 'bg-white dark:bg-white/5 border-zinc-200 dark:border-white/10 text-zinc-500'}`}
                                    >
                                        M
                                    </button>
                                    <button 
                                        onClick={() => setGender('female')}
                                        className={`flex-1 py-3 rounded-2xl font-bold border transition-all ${gender === 'female' ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/20' : 'bg-white dark:bg-white/5 border-zinc-200 dark:border-white/10 text-zinc-500'}`}
                                    >
                                        F
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">
                                    {lang === 'es' ? 'Altura (cm)' : 'Height (cm)'}
                                </label>
                                <input
                                    type="number"
                                    value={height}
                                    onChange={e => setHeight(e.target.value)}
                                    className="w-full bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl px-5 py-3 font-bold text-lg text-zinc-900 dark:text-white outline-none focus:border-orange-500 transition-all"
                                    placeholder="180"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">
                                    {lang === 'es' ? 'Peso (kg)' : 'Weight (kg)'}
                                </label>
                                <input
                                    type="number"
                                    value={weight}
                                    onChange={e => setWeight(e.target.value)}
                                    className="w-full bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl px-5 py-3 font-bold text-lg text-zinc-900 dark:text-white outline-none focus:border-orange-500 transition-all"
                                    placeholder="80"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="space-y-2">
                            <h3 className="text-xl font-black text-zinc-900 dark:text-white">
                                {lang === 'es' ? 'Nivel de Actividad' : 'Activity Level'}
                            </h3>
                            <p className="text-sm text-zinc-500">
                                {lang === 'es' ? '¿Cuánto te mueves en el día a día?' : 'How much do you move on a daily basis?'}
                            </p>
                        </div>

                        <div className="space-y-2">
                            {[
                                { key: 'sedentary', es: 'Sedentario', en: 'Sedentary', subEs: 'Trabajo de escritorio, sin ejercicio', subEn: 'Desk job, no exercise' },
                                { key: 'light', es: 'Ligero', en: 'Light', subEs: '1-3 días/semana de ejercicio', subEn: '1-3 days/week exercise' },
                                { key: 'moderate', es: 'Moderado', en: 'Moderate', subEs: '3-5 días/semana de ejercicio', subEn: '3-5 days/week exercise' },
                                { key: 'active', es: 'Activo', en: 'Active', subEs: '6-7 días/semana de ejercicio', subEn: '6-7 days/week exercise' },
                                { key: 'very_active', es: 'Muy Activo', en: 'Very Active', subEs: 'Atleta / doble sesión', subEn: 'Athlete / double session' }
                            ].map(act => (
                                <button
                                    key={act.key}
                                    onClick={() => setActivity(act.key as any)}
                                    className={`w-full p-4 rounded-2xl border text-left transition-all active:scale-[0.98] ${activity === act.key ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/20' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/10 text-zinc-800 dark:text-zinc-200'}`}
                                >
                                    <div className="font-bold">{lang === 'es' ? act.es : act.en}</div>
                                    <div className={`text-xs mt-0.5 ${activity === act.key ? 'text-orange-100' : 'text-zinc-400 dark:text-zinc-500'}`}>{lang === 'es' ? act.subEs : act.subEn}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="space-y-2">
                            <h3 className="text-xl font-black text-zinc-900 dark:text-white">
                                {lang === 'es' ? 'Tu Objetivo' : 'Your Goal'}
                            </h3>
                            <p className="text-sm text-zinc-500">
                                {lang === 'es' ? 'Define qué quieres lograr con tu dieta.' : 'Define what you want to achieve with your diet.'}
                            </p>
                        </div>

                        <div className="space-y-4">
                            <GoalOption 
                                selected={goal === 'cut'} 
                                onSelect={() => setGoal('cut')} 
                                title={lang === 'es' ? 'Perder Grasa' : 'Lose Fat'} 
                                desc={lang === 'es' ? 'Déficit calórico de -500 kcal/día.' : 'Caloric deficit of -500 kcal/day.'} 
                                icon="Minus"
                            />
                            <GoalOption 
                                selected={goal === 'maintain'} 
                                onSelect={() => setGoal('maintain')} 
                                title={lang === 'es' ? 'Mantenimiento' : 'Maintenance'} 
                                desc={lang === 'es' ? 'Mantener peso y recomposición.' : 'Maintain weight and recomposition.'} 
                                icon="Activity"
                            />
                            <GoalOption 
                                selected={goal === 'bulk'} 
                                onSelect={() => setGoal('bulk')} 
                                title={lang === 'es' ? 'Ganar Músculo' : 'Gain Muscle'} 
                                desc={lang === 'es' ? 'Superávit calórico controlado.' : 'Controlled caloric surplus.'} 
                                icon="TrendingUp"
                            />
                        </div>
                    </div>
                )}

            </div>
        </Modal>
    );
};

const GoalOption: React.FC<{ selected: boolean; onSelect: () => void; title: string; desc: string; icon: string }> = ({ selected, onSelect, title, desc, icon }) => (
    <button
        onClick={onSelect}
        className={`w-full p-5 rounded-[2rem] border flex items-center gap-4 transition-all active:scale-[0.98] ${
            selected 
                ? 'bg-zinc-900 dark:bg-orange-500 border-zinc-900 dark:border-orange-500 text-white shadow-2xl' 
                : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-zinc-200'
        }`}
    >
        <div className={`p-3 rounded-2xl ${selected ? 'bg-orange-500 text-white' : 'bg-zinc-100 dark:bg-white/5 text-zinc-500'}`}>
            <Icon name={icon} size={24} />
        </div>
        <div className="text-left flex-1">
            <div className="font-black uppercase tracking-tight text-lg leading-none mb-1">{title}</div>
            <div className={`text-xs ${selected ? 'text-zinc-400' : 'text-zinc-500'}`}>{desc}</div>
        </div>
        {selected && <Icon name="CheckCircle" size={24} className="text-orange-500" />}
    </button>
);
