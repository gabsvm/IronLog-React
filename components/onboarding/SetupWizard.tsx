
import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../constants';
import { UserProfile, MesoType } from '../../types';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { recommendProgram, RecommendationResult } from '../../utils/recommendationEngine';

interface SetupWizardProps {
    onComplete: () => void;
}

export const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete }) => {
    const { lang, setLang, setProgram, setActiveMeso } = useApp();
    const t = TRANSLATIONS[lang];
    const w = t.wizard;

    const [step, setStep] = useState(0);
    const [profile, setProfile] = useState<UserProfile>({
        experience: 'intermediate',
        daysPerWeek: 4,
        goal: 'hypertrophy',
        sessionDuration: 'medium'
    });
    
    const [recommendation, setRecommendation] = useState<RecommendationResult | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleNext = () => {
        if (step === 3) {
            setIsGenerating(true);
            // Simulate analyzing delay for better UX
            setTimeout(() => {
                const rec = recommendProgram(profile);
                setRecommendation(rec);
                setIsGenerating(false);
                setStep(4);
            }, 1500);
        } else {
            setStep(prev => prev + 1);
        }
    };

    const handleApply = () => {
        if (!recommendation) return;

        // Apply Template
        setProgram(recommendation.template);

        // Apply Meso Settings
        const plan = recommendation.template.map(day => (day.slots || []).map(slot => slot.exerciseId || null));
        setActiveMeso({
            id: Date.now(),
            name: String(t.phases[recommendation.mesoType] || "Recommended Plan"),
            mesoType: recommendation.mesoType,
            week: 1,
            targetWeeks: 5,
            isDeload: false,
            plan: plan,
            duration: 5
        });

        onComplete();
    };

    const OptionBtn = ({ label, description, selected, onClick, icon }: any) => (
        <button
            onClick={onClick}
            className={`w-full p-4 rounded-xl border-2 flex items-start gap-4 transition-all duration-200 active:scale-[0.98] ${
                selected 
                ? 'border-red-600 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' 
                : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600'
            }`}
        >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${selected ? 'bg-red-600 text-white' : 'bg-zinc-100 dark:bg-zinc-700'}`}>
                <Icon name={icon} size={20} />
            </div>
            <div className="flex-1 text-left">
                <div className="font-bold">{label}</div>
                {description && <div className="text-xs mt-1 opacity-70 leading-snug font-medium">{description}</div>}
            </div>
            {selected && <Icon name="Check" size={20} className="text-red-600 mt-1" />}
        </button>
    );

    // Render Steps
    const renderStep = () => {
        switch (step) {
            case 0: // Experience
                return (
                    <div className="space-y-3 animate-in slide-in-from-right duration-300">
                        <h3 className="text-xl font-black text-center mb-6 dark:text-white">{w.steps.exp}</h3>
                        
                        <OptionBtn 
                            label={w.expOptions.beginner} 
                            description={w.expDesc?.beginner}
                            selected={profile.experience === 'beginner'} 
                            onClick={() => setProfile({...profile, experience: 'beginner'})}
                            icon="Star"
                        />
                        <OptionBtn 
                            label={w.expOptions.intermediate} 
                            description={w.expDesc?.intermediate}
                            selected={profile.experience === 'intermediate'} 
                            onClick={() => setProfile({...profile, experience: 'intermediate'})}
                            icon="TrendingUp"
                        />
                        <OptionBtn 
                            label={w.expOptions.advanced} 
                            description={w.expDesc?.advanced}
                            selected={profile.experience === 'advanced'} 
                            onClick={() => setProfile({...profile, experience: 'advanced'})}
                            icon="Zap"
                        />

                        {w.expNote && (
                            <div className="mt-6 bg-blue-50 dark:bg-blue-900/10 p-3 rounded-xl flex gap-3 items-start border border-blue-100 dark:border-blue-900/20">
                                <Icon name="Info" size={16} className="text-blue-500 mt-0.5 shrink-0" />
                                <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed font-medium">
                                    {w.expNote}
                                </p>
                            </div>
                        )}
                    </div>
                );
            case 1: // Frequency
                return (
                    <div className="space-y-4 animate-in slide-in-from-right duration-300">
                        <h3 className="text-xl font-black text-center mb-6 dark:text-white">{w.steps.freq}</h3>
                        <div className="grid grid-cols-5 gap-2">
                            {[2, 3, 4, 5, 6].map(d => (
                                <button
                                    key={d}
                                    onClick={() => setProfile({...profile, daysPerWeek: d})}
                                    className={`aspect-square rounded-xl font-black text-lg transition-all ${
                                        profile.daysPerWeek === d 
                                        ? 'bg-red-600 text-white shadow-lg shadow-red-600/30 scale-110' 
                                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
                                    }`}
                                >
                                    {d}
                                </button>
                            ))}
                        </div>
                        <p className="text-center text-sm text-zinc-500 mt-4">
                            {lang === 'en' ? "Days per week" : "Días por semana"}
                        </p>
                    </div>
                );
            case 2: // Goal
                return (
                    <div className="space-y-3 animate-in slide-in-from-right duration-300">
                        <h3 className="text-xl font-black text-center mb-6 dark:text-white">{w.steps.goal}</h3>
                        <OptionBtn 
                            label={w.goalOptions.hypertrophy} 
                            selected={profile.goal === 'hypertrophy'} 
                            onClick={() => setProfile({...profile, goal: 'hypertrophy'})}
                            icon="Dumbbell"
                        />
                        <OptionBtn 
                            label={w.goalOptions.strength} 
                            selected={profile.goal === 'strength'} 
                            onClick={() => setProfile({...profile, goal: 'strength'})}
                            icon="Anchor" // Fallback icon, ensure imported or mapped
                        />
                        <OptionBtn 
                            label={w.goalOptions.endurance} 
                            selected={profile.goal === 'endurance'} 
                            onClick={() => setProfile({...profile, goal: 'endurance'})}
                            icon="Activity"
                        />
                    </div>
                );
            case 3: // Time
                return (
                    <div className="space-y-3 animate-in slide-in-from-right duration-300">
                        <h3 className="text-xl font-black text-center mb-6 dark:text-white">{w.steps.time}</h3>
                        <OptionBtn 
                            label={w.timeOptions.short} 
                            selected={profile.sessionDuration === 'short'} 
                            onClick={() => setProfile({...profile, sessionDuration: 'short'})}
                            icon="Clock"
                        />
                        <OptionBtn 
                            label={w.timeOptions.medium} 
                            selected={profile.sessionDuration === 'medium'} 
                            onClick={() => setProfile({...profile, sessionDuration: 'medium'})}
                            icon="Clock"
                        />
                        <OptionBtn 
                            label={w.timeOptions.long} 
                            selected={profile.sessionDuration === 'long'} 
                            onClick={() => setProfile({...profile, sessionDuration: 'long'})}
                            icon="Clock"
                        />
                    </div>
                );
            case 4: // Result
                if (!recommendation) return null;
                const recTitle = t.phases[recommendation.mesoType] || "Plan";
                const recDesc = (t.phaseDesc as any)[recommendation.mesoType] || "";
                const reasonText = (w.reason as any)[recommendation.reasonKey] || "";

                return (
                    <div className="text-center space-y-6 animate-in zoom-in-95 duration-500">
                        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Icon name="Check" size={40} strokeWidth={4} />
                        </div>
                        
                        <div>
                            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">{w.steps.result}</h3>
                            <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-2">{recTitle}</h2>
                            <p className="text-sm text-zinc-600 dark:text-zinc-300 italic px-4">"{recDesc}"</p>
                        </div>

                        <div className="bg-zinc-50 dark:bg-white/5 p-4 rounded-xl text-left space-y-2 border border-zinc-100 dark:border-white/5">
                            <div className="flex gap-3 items-start">
                                <Icon name="Info" size={18} className="text-blue-500 mt-0.5 shrink-0" />
                                <p className="text-sm text-zinc-600 dark:text-zinc-300">{reasonText}</p>
                            </div>
                            {recommendation.adjustedVolume && (
                                <div className="flex gap-3 items-start">
                                    <Icon name="Clock" size={18} className="text-orange-500 mt-0.5 shrink-0" />
                                    <p className="text-sm text-zinc-600 dark:text-zinc-300">{w.adjusted}</p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    if (isGenerating) {
        return (
            <div className="fixed inset-0 z-[100] bg-white dark:bg-zinc-950 flex flex-col items-center justify-center">
                <div className="w-16 h-16 border-4 border-zinc-200 dark:border-zinc-800 border-t-red-600 rounded-full animate-spin mb-6"></div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white animate-pulse">{w.generating}</h3>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] bg-white dark:bg-zinc-950 flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-900 flex justify-between items-center">
                <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-bold">
                    <div className="w-8 h-8 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-lg flex items-center justify-center font-black text-xs">IL</div>
                    <span>IronLog Setup</span>
                </div>
                
                <div className="flex items-center gap-3">
                    {/* Language Toggle */}
                    <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
                        <button 
                            onClick={() => setLang('en')}
                            className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${lang === 'en' ? 'bg-white dark:bg-zinc-600 shadow text-zinc-900 dark:text-white' : 'text-zinc-400 hover:text-zinc-600'}`}
                        >
                            EN
                        </button>
                        <button 
                            onClick={() => setLang('es')}
                            className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${lang === 'es' ? 'bg-white dark:bg-zinc-600 shadow text-zinc-900 dark:text-white' : 'text-zinc-400 hover:text-zinc-600'}`}
                        >
                            ES
                        </button>
                    </div>

                    {step < 4 && (
                        <button onClick={onComplete} className="text-xs font-bold text-zinc-400 hover:text-zinc-900 dark:hover:text-white uppercase tracking-widest">{w.manual}</button>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col justify-center max-w-md mx-auto w-full">
                {renderStep()}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950">
                <div className="max-w-md mx-auto w-full">
                    {step === 4 ? (
                        <Button size="lg" fullWidth onClick={handleApply} className="shadow-xl shadow-green-500/20 bg-green-600 hover:bg-green-500">
                            {w.apply}
                        </Button>
                    ) : (
                        <div className="flex gap-3">
                            <Button 
                                variant="secondary" 
                                onClick={() => setStep(prev => Math.max(0, prev - 1))}
                                disabled={step === 0}
                                className="w-1/3"
                            >
                                <Icon name="ChevronLeft" size={20} />
                            </Button>
                            <Button size="lg" fullWidth onClick={handleNext}>
                                {t.tutorial.next}
                            </Button>
                        </div>
                    )}
                    
                    {/* Progress Dots */}
                    {step < 4 && (
                        <div className="flex justify-center gap-2 mt-6">
                            {[0, 1, 2, 3].map(i => (
                                <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === step ? 'bg-zinc-800 dark:bg-white w-4' : 'bg-zinc-200 dark:bg-zinc-800'}`} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
