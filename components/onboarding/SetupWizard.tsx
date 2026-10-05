import React from 'react';
import { TRANSLATIONS } from '../../constants';
import { Icon } from '../ui/Icon';
import { Logo } from '../ui/Logo';
import { useSetupWizardState, type SetupWizardProps } from './wizard/useSetupWizardState';
import { SetupWizardStep } from './wizard/SetupWizardStep';

export type { SetupWizardProps, OnboardingOutcome } from './wizard/useSetupWizardState';

export const SetupWizard: React.FC<SetupWizardProps> = (props) => {
    const state = useSetupWizardState(props);
    const { lang, setLang, t, w, step, setStep, isGenerating, handleNext, handleApply } = state;

    // ── Loading screen ────────────────────────────────────────────────
    if (isGenerating) {
        return (
            <div className="fixed inset-0 z-modal bg-white dark:bg-zinc-950 flex flex-col items-center justify-center gap-6 p-8">
                <div className="relative">
                    <div className="w-20 h-20 border-4 border-zinc-100 dark:border-zinc-800 border-t-primary-600 rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Icon name="Dumbbell" size={28} className="text-primary-600" />
                    </div>
                </div>
                <div className="text-center">
                    <h3 className="text-xl font-black text-zinc-900 dark:text-white">{w.generating}</h3>
                    <p className="text-sm text-zinc-400 mt-2">{TRANSLATIONS[lang].copy.setupWizard.analyzingYourProfile}</p>
                </div>
            </div>
        );
    }

    const stepTitles = [w.steps.exp, w.steps.freq, w.steps.goal, w.steps.time];
    const totalSteps = 4;
    const progress = step < totalSteps ? ((step + 1) / totalSteps) * 100 : 100;

    // ── Main render ───────────────────────────────────────────────────
    return (
        <div className="fixed inset-0 z-modal bg-white dark:bg-zinc-950 flex flex-col">
            {/* Header */}
            <div className="px-6 pb-4 pt-[calc(1rem+var(--safe-area-top))] border-b border-zinc-100 dark:border-zinc-900">
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
                            <button onClick={() => handleApply('custom')} className="text-[10px] font-black uppercase tracking-wider text-zinc-400 hover:text-zinc-700 dark:hover:text-white">
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
                        {step === 0 && (TRANSLATIONS[lang].copy.setupWizard.whatSYourLevel)}
                        {step === 1 && (TRANSLATIONS[lang].copy.setupWizard.howManyDaysPer)}
                        {step === 2 && (TRANSLATIONS[lang].copy.setupWizard.whatSYourGoal)}
                        {step === 3 && (TRANSLATIONS[lang].copy.setupWizard.howMuchTimeDo)}
                    </h2>
                    <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">
                        {step === 0 && (TRANSLATIONS[lang].copy.setupWizard.beHonestThisPersonalizes)}
                        {step === 1 && (TRANSLATIONS[lang].copy.setupWizard.considerYourCommitmentsAnd)}
                        {step === 2 && (TRANSLATIONS[lang].copy.setupWizard.youCanChangeThis)}
                        {step === 3 && (TRANSLATIONS[lang].copy.setupWizard.perTrainingSession)}
                    </p>
                </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-6 scroll-container">
                <SetupWizardStep state={state} />
            </div>

            {/* Footer – only shown on steps 0–3 */}
            {step < 4 && (
                <div className="px-6 pt-5 pb-[calc(1.25rem+var(--safe-area-bottom))] border-t border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 flex gap-3">
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
                            ? (TRANSLATIONS[lang].copy.setupWizard.analyzeMyProfile)
                            : (TRANSLATIONS[lang].copy.setupWizard.next)}
                    </button>
                </div>
            )}
        </div>
    );
};
