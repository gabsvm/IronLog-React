import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../constants';
import { Button } from './Button';
import { Icon } from './Icon';

interface OnboardingModalProps {
    onClose: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ onClose }) => {
    const { lang, setLang } = useApp();
    const t = TRANSLATIONS[lang];
    const [step, setStep] = useState(0);

    const steps = [
        {
            icon: "Dumbbell",
            title: t.onb.s1_title,
            desc: t.onb.s1_desc,
            color: "text-red-500 bg-red-100 dark:bg-red-500/10"
        },
        {
            icon: "Layout",
            title: t.onb.s2_title,
            desc: t.onb.s2_desc,
            color: "text-blue-500 bg-blue-100 dark:bg-blue-500/10"
        },
        {
            icon: "Activity",
            title: t.onb.s3_title,
            desc: t.onb.s3_desc,
            color: "text-green-500 bg-green-100 dark:bg-green-500/10"
        },
        {
            icon: "TrendingUp",
            title: t.onb.s4_title,
            desc: t.onb.s4_desc,
            color: "text-purple-500 bg-purple-100 dark:bg-purple-500/10"
        }
    ];

    const handleNext = () => {
        if (step < steps.length - 1) {
            setStep(step + 1);
        } else {
            onClose();
        }
    };

    const currentStep = steps[step];

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-3xl p-8 shadow-2xl border border-zinc-200 dark:border-white/10 relative overflow-hidden">
                {/* Background Blobs */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-zinc-100 dark:bg-zinc-800 rounded-full blur-3xl opacity-50"></div>
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-zinc-100 dark:bg-zinc-800 rounded-full blur-3xl opacity-50"></div>

                <div className="relative z-10 flex flex-col items-center text-center">
                    
                    {/* Language Toggle */}
                    <div className="absolute top-0 right-0">
                        <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-full p-1 shadow-inner">
                            <button 
                                onClick={() => setLang('en')}
                                className={`px-3 py-1 rounded-full text-[10px] font-black transition-all ${lang === 'en' ? 'bg-white dark:bg-zinc-600 shadow-sm text-zinc-900 dark:text-white' : 'text-zinc-400 hover:text-zinc-600'}`}
                            >
                                EN
                            </button>
                            <button 
                                onClick={() => setLang('es')}
                                className={`px-3 py-1 rounded-full text-[10px] font-black transition-all ${lang === 'es' ? 'bg-white dark:bg-zinc-600 shadow-sm text-zinc-900 dark:text-white' : 'text-zinc-400 hover:text-zinc-600'}`}
                            >
                                ES
                            </button>
                        </div>
                    </div>

                    {/* Icon */}
                    <div className={`mt-6 w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-sm transition-all duration-300 ${currentStep.color}`}>
                        <Icon name={currentStep.icon as any} size={40} />
                    </div>

                    {/* Content */}
                    <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-3 tracking-tight animate-in slide-in-from-bottom-2 fade-in duration-300 key={step}">
                        {currentStep.title}
                    </h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed h-12">
                        {currentStep.desc}
                    </p>

                    {/* Indicators */}
                    <div className="flex gap-2 mb-8">
                        {steps.map((_, idx) => (
                            <div 
                                key={idx} 
                                className={`h-1.5 rounded-full transition-all duration-300 ${idx === step ? 'w-6 bg-red-600' : 'w-1.5 bg-zinc-200 dark:bg-zinc-800'}`}
                            ></div>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="w-full space-y-3">
                        <Button onClick={handleNext} fullWidth size="lg">
                            {step === steps.length - 1 ? t.onb.start : t.onb.next}
                        </Button>
                        {step < steps.length - 1 && (
                            <button 
                                onClick={onClose} 
                                className="text-xs font-bold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 uppercase tracking-widest py-2"
                            >
                                {t.onb.skip}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};