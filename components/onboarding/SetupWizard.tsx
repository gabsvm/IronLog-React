
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../constants';
import { UserProfile } from '../../types';
import { Icon } from '../ui/Icon';
import { Logo } from '../ui/Logo';
import { recommendProgram, RecommendationResult } from '../../utils/recommendationEngine';

interface SetupWizardProps {
    onComplete: () => void;
}

type Mode = 'suggested' | 'custom' | 'freestyle';

export const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete }) => {
    const { lang, setLang, setProgram, setActiveMeso } = useApp();
    const t = TRANSLATIONS[lang];
    const w = t.wizard;

    // 0–3: profile steps, 4: recommendation, 5: launch mode picker
    const [step, setStep] = useState(0);
    const [profile, setProfile] = useState<UserProfile>({
        experience: 'intermediate',
        daysPerWeek: 4,
        goal: 'hypertrophy',
        sessionDuration: 'medium'
    });

    const [recommendation, setRecommendation] = useState<RecommendationResult | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // ── Navigation ────────────────────────────────────────────────────
    const handleNext = () => {
        if (step === 3) {
            setIsGenerating(true);
            setTimeout(() => {
                const rec = recommendProgram(profile);
                setRecommendation(rec);
                setIsGenerating(false);
                setStep(4); // recommendation screen
            }, 1500);
        } else if (step < 3) {
            setStep(prev => prev + 1);
        }
    };

    const handleApply = (mode: Mode) => {
        if (mode === 'freestyle') {
            // No program, no meso — just log freely
            onComplete();
            return;
        }

        if (mode === 'custom') {
            // Skip to blank program editor
            onComplete();
            return;
        }

        // 'suggested' — apply wizard recommendation
        if (!recommendation) return;
        setProgram(recommendation.template);
        const plan = recommendation.template.map(day =>
            (day.slots || []).map(slot => slot.exerciseId || null)
        );
        setActiveMeso({
            id: Date.now(),
            name: String(t.phases[recommendation.mesoType] || 'Recommended Plan'),
            mesoType: recommendation.mesoType,
            week: 1,
            targetWeeks: 5,
            isDeload: false,
            plan,
            duration: 5
        });
        onComplete();
    };

    // ── Sub-components ────────────────────────────────────────────────
    const OptionBtn = ({ label, description, selected, onClick, icon }: any) => (
        <button
            onClick={onClick}
            className={`w-full p-4 rounded-2xl border-2 flex items-start gap-4 transition-all duration-200 active:scale-[0.98] text-left ${
                selected
                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700'
            }`}
        >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                selected ? 'bg-primary-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
            }`}>
                <Icon name={icon} size={20} />
            </div>
            <div className="flex-1 min-w-0">
                <div className={`font-black text-sm ${selected ? 'text-primary-700 dark:text-red-400' : 'text-zinc-900 dark:text-white'}`}>{label}</div>
                {description && (
                    <div className={`text-xs mt-1 leading-relaxed font-medium ${selected ? 'text-primary-600/70 dark:text-red-400/70' : 'text-zinc-500 dark:text-zinc-400'}`}>
                        {description}
                    </div>
                )}
            </div>
            {selected && <Icon name="Check" size={18} className="text-primary-600 mt-1 flex-shrink-0" />}
        </button>
    );

    // ── Step renderers ────────────────────────────────────────────────
    const renderStep = () => {
        switch (step) {
            case 0: return (
                <div className="space-y-3 animate-in slide-in-from-right-4 duration-300">
                    <OptionBtn
                        label={w.expOptions.beginner}
                        description={w.expDesc?.beginner}
                        selected={profile.experience === 'beginner'}
                        onClick={() => setProfile({ ...profile, experience: 'beginner' })}
                        icon="Star"
                    />
                    <OptionBtn
                        label={w.expOptions.intermediate}
                        description={w.expDesc?.intermediate}
                        selected={profile.experience === 'intermediate'}
                        onClick={() => setProfile({ ...profile, experience: 'intermediate' })}
                        icon="TrendingUp"
                    />
                    <OptionBtn
                        label={w.expOptions.advanced}
                        description={w.expDesc?.advanced}
                        selected={profile.experience === 'advanced'}
                        onClick={() => setProfile({ ...profile, experience: 'advanced' })}
                        icon="Zap"
                    />
                    {w.expNote && (
                        <div className="mt-4 bg-blue-50 dark:bg-blue-900/10 p-3 rounded-xl flex gap-3 items-start border border-blue-100 dark:border-blue-900/20">
                            <Icon name="Info" size={16} className="text-blue-500 mt-0.5 shrink-0" />
                            <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed font-medium">{w.expNote}</p>
                        </div>
                    )}
                </div>
            );
            case 1: return (
                <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                    <div className="grid grid-cols-5 gap-2">
                        {[2, 3, 4, 5, 6].map(d => (
                            <button
                                key={d}
                                onClick={() => setProfile({ ...profile, daysPerWeek: d })}
                                className={`aspect-square rounded-2xl font-black text-xl transition-all active:scale-90 ${
                                    profile.daysPerWeek === d
                                        ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30 scale-110'
                                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                                }`}
                            >
                                {d}
                            </button>
                        ))}
                    </div>
                    <div className="text-center">
                        <p className="text-3xl font-black text-zinc-900 dark:text-white">
                            {profile.daysPerWeek}
                            <span className="text-base font-medium text-zinc-400 ml-2">
                                {lang === 'es' ? 'días / semana' : 'days / week'}
                            </span>
                        </p>
                    </div>
                </div>
            );
            case 2: return (
                <div className="space-y-3 animate-in slide-in-from-right-4 duration-300">
                    <OptionBtn
                        label={w.goalOptions.hypertrophy}
                        description={lang === 'es' ? 'Ganar masa muscular y tamaño.' : 'Build muscle mass and size.'}
                        selected={profile.goal === 'hypertrophy'}
                        onClick={() => setProfile({ ...profile, goal: 'hypertrophy' })}
                        icon="Dumbbell"
                    />
                    <OptionBtn
                        label={w.goalOptions.strength}
                        description={lang === 'es' ? 'Aumentar 1RM en levantamientos principales.' : 'Increase 1RM on main lifts.'}
                        selected={profile.goal === 'strength'}
                        onClick={() => setProfile({ ...profile, goal: 'strength' })}
                        icon="Shield"
                    />
                    <OptionBtn
                        label={w.goalOptions.endurance}
                        description={lang === 'es' ? 'Mejorar resistencia y condición física.' : 'Improve endurance and conditioning.'}
                        selected={profile.goal === 'endurance'}
                        onClick={() => setProfile({ ...profile, goal: 'endurance' })}
                        icon="Activity"
                    />
                </div>
            );
            case 3: return (
                <div className="space-y-3 animate-in slide-in-from-right-4 duration-300">
                    <OptionBtn
                        label={w.timeOptions.short}
                        description={lang === 'es' ? '45 min o menos. Entrenos compactos y eficientes.' : '45 min or less. Compact and efficient sessions.'}
                        selected={profile.sessionDuration === 'short'}
                        onClick={() => setProfile({ ...profile, sessionDuration: 'short' })}
                        icon="Clock"
                    />
                    <OptionBtn
                        label={w.timeOptions.medium}
                        description={lang === 'es' ? '60–75 min. La duración ideal para la mayoría.' : '60–75 min. The ideal duration for most.'}
                        selected={profile.sessionDuration === 'medium'}
                        onClick={() => setProfile({ ...profile, sessionDuration: 'medium' })}
                        icon="Clock"
                    />
                    <OptionBtn
                        label={w.timeOptions.long}
                        description={lang === 'es' ? '90+ min. Para quienes tienen tiempo y capacidad.' : '90+ min. For those with time and capacity.'}
                        selected={profile.sessionDuration === 'long'}
                        onClick={() => setProfile({ ...profile, sessionDuration: 'long' })}
                        icon="Clock"
                    />
                </div>
            );
            case 4: {
                if (!recommendation) return null;
                const recTitle = t.phases[recommendation.mesoType] || 'Plan';
                const recDesc = (t.phaseDesc as any)[recommendation.mesoType] || '';
                const reasonText = (w.reason as any)[recommendation.reasonKey] || '';
                return (
                    <div className="space-y-6 animate-in zoom-in-95 duration-500">
                        {/* Result card */}
                        <div className="bg-gradient-to-br from-green-500/10 to-green-500/0 border border-green-500/20 rounded-3xl p-6 text-center">
                            <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Icon name="Check" size={32} className="text-green-500" strokeWidth={3} />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-green-500 mb-2">
                                {lang === 'es' ? 'Tu programa recomendado' : 'Your recommended program'}
                            </p>
                            <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-2">{String(recTitle)}</h2>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 italic">"{recDesc}"</p>
                        </div>

                        <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-white/5 rounded-2xl p-4 space-y-3">
                            <div className="flex gap-3 items-start">
                                <Icon name="Info" size={16} className="text-blue-500 mt-0.5 shrink-0" />
                                <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">{reasonText}</p>
                            </div>
                            {recommendation.adjustedVolume && (
                                <div className="flex gap-3 items-start">
                                    <Icon name="Clock" size={16} className="text-orange-500 mt-0.5 shrink-0" />
                                    <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">{w.adjusted}</p>
                                </div>
                            )}
                        </div>

                        {/* ── Launch Mode Picker ── */}
                        <div className="space-y-3">
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 px-1">
                                {lang === 'es' ? '¿Cómo quieres comenzar?' : 'How do you want to start?'}
                            </p>

                            <button
                                onClick={() => handleApply('suggested')}
                                className="w-full p-4 bg-primary-600 hover:bg-primary-500 rounded-2xl flex items-center gap-4 transition-all active:scale-[0.98] group shadow-lg shadow-primary-600/30"
                            >
                                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                                    <Icon name="Zap" size={20} className="text-white" />
                                </div>
                                <div className="flex-1 text-left">
                                    <div className="font-black text-white text-sm">
                                        {lang === 'es' ? 'Comenzar con rutina sugerida' : 'Start with suggested routine'}
                                    </div>
                                    <div className="text-xs text-white/70 mt-0.5">
                                        {lang === 'es' ? `Aplicar "${String(recTitle)}" ahora mismo` : `Apply "${String(recTitle)}" right now`}
                                    </div>
                                </div>
                                <Icon name="ArrowRight" size={18} className="text-white/80 group-hover:translate-x-1 transition-transform" />
                            </button>

                            <button
                                onClick={() => handleApply('custom')}
                                className="w-full p-4 bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 rounded-2xl flex items-center gap-4 transition-all active:scale-[0.98] group"
                            >
                                <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center shrink-0">
                                    <Icon name="FilePlus" size={20} className="text-zinc-600 dark:text-zinc-300" />
                                </div>
                                <div className="flex-1 text-left">
                                    <div className="font-black text-zinc-900 dark:text-white text-sm">
                                        {lang === 'es' ? 'Crear mi propia plantilla' : 'Create my own template'}
                                    </div>
                                    <div className="text-xs text-zinc-400 mt-0.5">
                                        {lang === 'es' ? 'Diseña tu rutina desde cero' : 'Design your routine from scratch'}
                                    </div>
                                </div>
                                <Icon name="ChevronRight" size={18} className="text-zinc-300 group-hover:translate-x-1 transition-transform" />
                            </button>

                            <button
                                onClick={() => handleApply('freestyle')}
                                className="w-full p-4 bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 rounded-2xl flex items-center gap-4 transition-all active:scale-[0.98] group"
                            >
                                <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center shrink-0">
                                    <Icon name="Shuffle" size={20} className="text-zinc-600 dark:text-zinc-300" />
                                </div>
                                <div className="flex-1 text-left">
                                    <div className="font-black text-zinc-900 dark:text-white text-sm">
                                        {lang === 'es' ? 'Registrar sesiones libres' : 'Log freestyle sessions'}
                                    </div>
                                    <div className="text-xs text-zinc-400 mt-0.5">
                                        {lang === 'es' ? 'Sin programa fijo, entrena lo que quieras' : 'No fixed program, train whatever you like'}
                                    </div>
                                </div>
                                <Icon name="ChevronRight" size={18} className="text-zinc-300 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                );
            }
            default: return null;
        }
    };

    // ── Loading screen ────────────────────────────────────────────────
    if (isGenerating) {
        return (
            <div className="fixed inset-0 z-[100] bg-white dark:bg-zinc-950 flex flex-col items-center justify-center gap-6 p-8">
                <div className="relative">
                    <div className="w-20 h-20 border-4 border-zinc-100 dark:border-zinc-800 border-t-primary-600 rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Icon name="Dumbbell" size={28} className="text-primary-600" />
                    </div>
                </div>
                <div className="text-center">
                    <h3 className="text-xl font-black text-zinc-900 dark:text-white">{w.generating}</h3>
                    <p className="text-sm text-zinc-400 mt-2">{lang === 'es' ? 'Analizando tu perfil...' : 'Analyzing your profile...'}</p>
                </div>
            </div>
        );
    }

    const stepTitles = [w.steps.exp, w.steps.freq, w.steps.goal, w.steps.time];
    const totalSteps = 4;
    const progress = step < totalSteps ? ((step + 1) / totalSteps) * 100 : 100;

    // ── Main render ───────────────────────────────────────────────────
    return (
        <div className="fixed inset-0 z-[100] bg-white dark:bg-zinc-950 flex flex-col">
            {/* Header */}
            <div className="px-6 pt-safe py-4 border-b border-zinc-100 dark:border-zinc-900">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                        <Logo size={32} showText />
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Language Toggle */}
                        <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-xl p-1">
                            {(['en', 'es'] as const).map(l => (
                                <button
                                    key={l}
                                    onClick={() => setLang(l)}
                                    className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all uppercase ${
                                        lang === l ? 'bg-white dark:bg-zinc-600 shadow-sm text-zinc-900 dark:text-white' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-white'
                                    }`}
                                >
                                    {l}
                                </button>
                            ))}
                        </div>
                        {step < 4 && (
                            <button onClick={onComplete} className="text-[10px] font-black uppercase tracking-wider text-zinc-400 hover:text-zinc-700 dark:hover:text-white">
                                {w.manual}
                            </button>
                        )}
                    </div>
                </div>

                {/* Progress bar */}
                {step < totalSteps && (
                    <div className="space-y-2">
                        <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary-600 rounded-full transition-all duration-500"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <div className="flex justify-between">
                            {stepTitles.map((title, i) => (
                                <span
                                    key={i}
                                    className={`text-[9px] font-black uppercase tracking-wider transition-colors ${
                                        i <= step ? 'text-primary-600' : 'text-zinc-300 dark:text-zinc-700'
                                    }`}
                                >
                                    {title}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Step title */}
            {step < totalSteps && (
                <div className="px-6 pt-8 pb-4">
                    <h2 className="text-2xl font-black text-zinc-900 dark:text-white">
                        {step === 0 && (lang === 'es' ? '¿Cuál es tu nivel?' : "What's your level?")}
                        {step === 1 && (lang === 'es' ? '¿Cuántos días por semana?' : 'How many days per week?')}
                        {step === 2 && (lang === 'es' ? '¿Cuál es tu objetivo?' : "What's your goal?")}
                        {step === 3 && (lang === 'es' ? '¿Cuánto tiempo tienes?' : 'How much time do you have?')}
                    </h2>
                    <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">
                        {step === 0 && (lang === 'es' ? 'Sé honesto, esto personalizará tu rutina.' : 'Be honest, this personalizes your routine.')}
                        {step === 1 && (lang === 'es' ? 'Considera compromisos y descanso.' : 'Consider your commitments and recovery.')}
                        {step === 2 && (lang === 'es' ? 'Puedes cambiar esto más adelante.' : 'You can change this later.')}
                        {step === 3 && (lang === 'es' ? 'Por sesión de entrenamiento.' : 'Per training session.')}
                    </p>
                </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-6 scroll-container">
                {renderStep()}
            </div>

            {/* Footer – only shown on steps 0–3 */}
            {step < 4 && (
                <div className="px-6 py-5 border-t border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 flex gap-3">
                    <button
                        onClick={() => setStep(Math.max(0, step - 1))}
                        disabled={step === 0}
                        className="w-14 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 disabled:opacity-30 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all active:scale-90"
                    >
                        <Icon name="ChevronLeft" size={22} />
                    </button>
                    <button
                        onClick={handleNext}
                        className="flex-1 h-12 rounded-2xl bg-primary-600 hover:bg-primary-500 text-white font-black text-sm shadow-lg shadow-primary-600/30 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        {step === 3
                            ? (lang === 'es' ? 'Analizar mi perfil →' : 'Analyze my profile →')
                            : (lang === 'es' ? 'Siguiente →' : 'Next →')}
                    </button>
                </div>
            )}
        </div>
    );
};
