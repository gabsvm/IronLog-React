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
            <div className="fixed inset-0 z-modal bg-[rgb(var(--surface-app))] flex flex-col items-center justify-center gap-6 p-8">
                <div className="relative">
                    <div className="w-20 h-20 border-4 border-[rgb(var(--border-subtle))] border-t-primary-500 rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Icon name="Dumbbell" size={28} className="text-primary-600" />
                    </div>
                </div>
                <div className="text-center">
                    <h3 className="text-xl font-semibold text-[rgb(var(--text-primary))]">{w.generating}</h3>
                    <p className="text-sm text-muted mt-2">{TRANSLATIONS[lang].copy.setupWizard.analyzingYourProfile}</p>
                </div>
            </div>
        );
    }

    const stepTitles = [w.steps.freq, w.steps.goal, w.steps.time];
    const totalSteps = 3;
    const progress = step < totalSteps ? ((step + 1) / totalSteps) * 100 : 100;

    // ── Main render ───────────────────────────────────────────────────
    return (
        <div className="fixed inset-0 z-modal bg-[rgb(var(--surface-app))] flex flex-col">
            {/* Header */}
            <div className="px-6 pb-4 pt-[calc(1rem+var(--safe-area-top))] border-b border-[rgb(var(--border-subtle))]">
                <div className="flex justify-between items-center gap-3 mb-4">
                    <div className="flex shrink-0 items-center gap-2">
                        <Logo size={28} showText />
                    </div>
                    <div className="flex min-w-0 items-center gap-2">
                        {/* Language Toggle */}
                        <div className="flex shrink-0 bg-[rgb(var(--surface-elevated))] border border-[rgb(var(--border-subtle))] rounded-xl p-1">
                            {(['en', 'es'] as const).map(l => (
                                <button
                                    key={l}
                                    onClick={() => setLang(l)}
                                    aria-pressed={lang === l}
                                    className={`min-h-11 min-w-11 px-2 rounded-lg text-xs font-semibold transition-colors uppercase focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 ${
                                        lang === l ? 'bg-primary-500 text-zinc-950' : 'text-muted hover:text-[rgb(var(--text-primary))]'
                                    }`}
                                >
                                    {l}
                                </button>
                            ))}
                        </div>
                        {step < 3 && (
                            <button onClick={() => handleApply('custom')} className="min-h-11 min-w-0 rounded-lg px-2 text-right text-xs font-semibold leading-tight text-muted hover:text-[rgb(var(--text-primary))] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500">
                                {w.manual}
                            </button>
                        )}
                    </div>
                </div>

                {/* Progress bar */}
                {step < totalSteps && (
                    <div className="space-y-2">
                        <div className="h-1.5 bg-[rgb(var(--surface-elevated))] rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary-500 rounded-full transition-all duration-500"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <div className="flex justify-between">
                            {stepTitles.map((title, i) => (
                                <span
                                    key={i}
                                    className={`text-xs font-semibold transition-colors ${
                                        i <= step ? 'text-accent' : 'text-muted'
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
                    <h2 className="text-2xl font-semibold text-[rgb(var(--text-primary))]">
                        {step === 0 && (TRANSLATIONS[lang].copy.setupWizard.howManyDaysPer)}
                        {step === 1 && (TRANSLATIONS[lang].copy.setupWizard.whatSYourGoal)}
                        {step === 2 && (TRANSLATIONS[lang].copy.setupWizard.howMuchTimeDo)}
                    </h2>
                    <p className="text-sm text-muted mt-1">
                        {step === 0 && (TRANSLATIONS[lang].copy.setupWizard.considerYourCommitmentsAnd)}
                        {step === 1 && (TRANSLATIONS[lang].copy.setupWizard.youCanChangeThis)}
                        {step === 2 && (TRANSLATIONS[lang].copy.setupWizard.perTrainingSession)}
                    </p>
                </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-6 scroll-container">
                <SetupWizardStep state={state} />
            </div>

            {/* Step footer: step 3 can return to edit the recommendation inputs. */}
            {step <= 3 && (
                <div className="px-6 pt-5 pb-[calc(1.25rem+var(--safe-area-bottom))] border-t border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-app))] flex gap-3">
                    <button
                        type="button"
                        onClick={() => setStep(Math.max(0, step - 1))}
                        disabled={step === 0}
                        aria-label={t.back}
                        className="w-14 h-12 rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-elevated))] flex items-center justify-center text-[rgb(var(--text-secondary))] disabled:opacity-30 hover:bg-[rgb(var(--surface-raised))] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
                    >
                        <Icon name="ChevronLeft" size={22} />
                    </button>
                    {step < 3 && (
                        <button
                            type="button"
                            onClick={handleNext}
                            className="flex-1 h-12 rounded-xl bg-primary-500 hover:bg-primary-400 text-zinc-950 font-semibold text-base transition-colors flex items-center justify-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
                        >
                            {step === 2
                                ? (TRANSLATIONS[lang].copy.setupWizard.analyzeMyProfile)
                                : (TRANSLATIONS[lang].copy.setupWizard.next)}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};
