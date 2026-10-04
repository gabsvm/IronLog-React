
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../ui/Modal';
import { Icon } from '../ui/Icon';
import { calculateTDEE, calculateMacros } from '../../utils';
import { fromDisplay, resolveWeightUnit, toDisplay, unitLabel } from '../../utils/units';
import { TRANSLATIONS } from '../../constants';

interface GoalSetupModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const GoalSetupModal: React.FC<GoalSetupModalProps> = ({ isOpen, onClose }) => {
    const { lang, userProfile, setUserProfile, setMacroGoals, config } = useApp();
    const t = TRANSLATIONS[lang];
    const g = t.goalSetup;
    const unit = resolveWeightUnit(config);
    const [step, setStep] = useState(1);

    // Form State
    const [age, setAge] = useState<string>(String(userProfile?.age || ''));
    const [gender, setGender] = useState<'male' | 'female'>(userProfile?.gender === 'female' ? 'female' : 'male');
    const [height, setHeight] = useState<string>(String(userProfile?.height || ''));
    const [weight, setWeight] = useState<string>(userProfile?.bodyWeight ? String(toDisplay(userProfile.bodyWeight, unit)) : '');
    const [activity, setActivity] = useState(userProfile?.activityLevel || 'moderate');
    const [goal, setGoal] = useState<'cut' | 'maintain' | 'bulk'>(userProfile?.nutritionGoal || 'maintain');

    const handleFinish = () => {
        const weightKg = fromDisplay(Number(weight), unit);
        const tdee = calculateTDEE(weightKg, Number(height), Number(age), gender, activity);
        
        let targetCalories = tdee;
        if (goal === 'cut') targetCalories -= 500;
        else if (goal === 'bulk') targetCalories += 300;

        const macros = calculateMacros(targetCalories, goal);

        setUserProfile(prev => ({
            ...prev,
            age: Number(age),
            gender,
            height: Number(height),
            bodyWeight: weightKg,
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
            title={g.title}
            footer={
                <div className="flex gap-3">
                    {step > 1 && (
                        <button type="button" onClick={() => setStep(s => s - 1)} className="flex-1 py-3.5 rounded-2xl font-bold text-sm text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 transition-all active:scale-95">
                            {t.back}
                        </button>
                    )}
                    <button 
                        type="button"
                        onClick={() => { if (step < 3) setStep(s => s + 1); else handleFinish(); }}
                        className="flex-1 py-3.5 rounded-2xl font-black text-sm text-black bg-primary-500 hover:bg-primary-400 shadow-lg shadow-primary-500/30 transition-all active:scale-95"
                    >
                        {step === 3 ? g.savePlan : g.next}
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
                            className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${s <= step ? 'bg-primary-500 shadow-[0_0_10px_rgb(var(--primary-500)/0.3)]' : 'bg-zinc-200 dark:bg-white/5'}`}
                        />
                    ))}
                </div>

                {step === 1 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="space-y-2">
                            <h3 className="text-xl font-black text-zinc-900 dark:text-white">
                                {g.dataTitle}
                            </h3>
                            <p className="text-sm text-zinc-500">
                                {g.dataDesc}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">
                                    {g.age}
                                </label>
                                <input
                                    type="number"
                                    value={age}
                                    onChange={e => setAge(e.target.value)}
                                    className="w-full bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl px-5 py-3 font-bold text-lg text-zinc-900 dark:text-white outline-none focus:border-primary-500 transition-all"
                                    placeholder="25"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">
                                    {g.gender}
                                </label>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => setGender('male')}
                                        className={`flex-1 py-3 rounded-2xl font-bold border transition-all ${gender === 'male' ? 'bg-primary-500 border-primary-500 text-black shadow-lg shadow-primary-500/20' : 'bg-white dark:bg-white/5 border-zinc-200 dark:border-white/10 text-zinc-500'}`}
                                    >
                                        M
                                    </button>
                                    <button 
                                        onClick={() => setGender('female')}
                                        className={`flex-1 py-3 rounded-2xl font-bold border transition-all ${gender === 'female' ? 'bg-primary-500 border-primary-500 text-black shadow-lg shadow-primary-500/20' : 'bg-white dark:bg-white/5 border-zinc-200 dark:border-white/10 text-zinc-500'}`}
                                    >
                                        F
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">
                                    {g.height}
                                </label>
                                <input
                                    type="number"
                                    value={height}
                                    onChange={e => setHeight(e.target.value)}
                                    className="w-full bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl px-5 py-3 font-bold text-lg text-zinc-900 dark:text-white outline-none focus:border-primary-500 transition-all"
                                    placeholder="180"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">
                                    {`${g.weight} (${unitLabel(unit).toLowerCase()})`}
                                </label>
                                <input
                                    type="number"
                                    value={weight}
                                    onChange={e => setWeight(e.target.value)}
                                    className="w-full bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl px-5 py-3 font-bold text-lg text-zinc-900 dark:text-white outline-none focus:border-primary-500 transition-all"
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
                                {g.activityTitle}
                            </h3>
                            <p className="text-sm text-zinc-500">
                                {g.activityDesc}
                            </p>
                        </div>

                        <div className="space-y-2">
                            {[
                                { key: 'sedentary', label: g.actSedentary, sub: g.actSedentarySub },
                                { key: 'light', label: g.actLight, sub: g.actLightSub },
                                { key: 'moderate', label: g.actModerate, sub: g.actModerateSub },
                                { key: 'active', label: g.actActive, sub: g.actActiveSub },
                                { key: 'very_active', label: g.actVeryActive, sub: g.actVeryActiveSub },
                            ].map(act => (
                                <button
                                    key={act.key}
                                    onClick={() => setActivity(act.key as any)}
                                    className={`w-full p-4 rounded-2xl border text-left transition-all active:scale-[0.98] ${activity === act.key ? 'bg-primary-500 border-primary-500 text-black shadow-lg shadow-primary-500/20' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/10 text-zinc-800 dark:text-zinc-200'}`}
                                >
                                    <div className="font-bold">{act.label}</div>
                                    <div className={`text-xs mt-0.5 ${activity === act.key ? 'text-primary-900' : 'text-zinc-400 dark:text-zinc-500'}`}>{act.sub}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="space-y-2">
                            <h3 className="text-xl font-black text-zinc-900 dark:text-white">
                                {g.goalTitle}
                            </h3>
                            <p className="text-sm text-zinc-500">
                                {g.goalDesc}
                            </p>
                        </div>

                        <div className="space-y-4">
                            <GoalOption 
                                selected={goal === 'cut'} 
                                onSelect={() => setGoal('cut')} 
                                title={g.cutTitle} 
                                desc={g.cutDesc} 
                                icon="Minus"
                            />
                            <GoalOption 
                                selected={goal === 'maintain'} 
                                onSelect={() => setGoal('maintain')} 
                                title={g.maintainTitle} 
                                desc={g.maintainDesc} 
                                icon="Activity"
                            />
                            <GoalOption 
                                selected={goal === 'bulk'} 
                                onSelect={() => setGoal('bulk')} 
                                title={g.bulkTitle} 
                                desc={g.bulkDesc} 
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
                ? 'bg-primary-500 border-primary-500 text-black shadow-2xl'
                : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-zinc-200'
        }`}
    >
        <div className={`p-3 rounded-2xl ${selected ? 'bg-primary-500 text-black' : 'bg-zinc-100 dark:bg-white/5 text-zinc-500'}`}>
            <Icon name={icon} size={24} />
        </div>
        <div className="text-left flex-1">
            <div className="font-black uppercase tracking-tight text-lg leading-none mb-1">{title}</div>
            <div className={`text-xs ${selected ? 'text-zinc-400' : 'text-zinc-500'}`}>{desc}</div>
        </div>
        {selected && <Icon name="CheckCircle" size={24} className="text-primary-500" />}
    </button>
);
