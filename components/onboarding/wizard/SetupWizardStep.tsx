// U5: per-step content of the setup wizard, moved verbatim from components/onboarding/SetupWizard.tsx.
import { formatMessage } from '../../../utils/i18n';
import React from 'react';
import { TRANSLATIONS } from '../../../constants';
import { Icon } from '../../ui/Icon';
import type { SetupWizardState } from './useSetupWizardState';

export const SetupWizardStep: React.FC<{ state: SetupWizardState }> = ({ state }) => {
    const { lang, t, w, step, profile, setProfile, recommendation, handleApply, OptionBtn } = state;
        switch (step) {
            case 0: return (
                <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                    <div className="grid grid-cols-5 gap-2">
                        {[2, 3, 4, 5, 6].map(d => (
                            <button
                                key={d}
                                onClick={() => setProfile({ ...profile, daysPerWeek: d })}
                                aria-pressed={profile.daysPerWeek === d}
                                className={`min-h-11 aspect-square rounded-xl border font-semibold text-xl transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 ${
                                    profile.daysPerWeek === d
                                        ? 'bg-primary-500 text-zinc-950 border-primary-500'
                                        : 'border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-elevated))] text-[rgb(var(--text-secondary))] hover:border-[rgb(var(--border-strong))]'
                                }`}
                            >
                                {d}
                            </button>
                        ))}
                    </div>
                    <div className="text-center">
                        <p className="text-3xl font-semibold text-[rgb(var(--text-primary))]">
                            {profile.daysPerWeek}
                            <span className="text-base font-medium text-muted ml-2">
                                {TRANSLATIONS[lang].copy.setupWizard.daysWeek}
                            </span>
                        </p>
                    </div>
                </div>
            );
            case 1: return (
                <div className="space-y-3 animate-in slide-in-from-right-4 duration-300">
                    <OptionBtn
                        label={w.goalOptions.hypertrophy}
                        description={TRANSLATIONS[lang].copy.setupWizard.buildMuscleMassAnd}
                        selected={profile.goal === 'hypertrophy'}
                        onClick={() => setProfile({ ...profile, goal: 'hypertrophy' })}
                        icon="Dumbbell"
                    />
                    <OptionBtn
                        label={w.goalOptions.strength}
                        description={TRANSLATIONS[lang].copy.setupWizard.increase1rmOnMain}
                        selected={profile.goal === 'strength'}
                        onClick={() => setProfile({ ...profile, goal: 'strength' })}
                        icon="Shield"
                    />
                    <OptionBtn
                        label={w.goalOptions.endurance}
                        description={TRANSLATIONS[lang].copy.setupWizard.improveEnduranceAndConditioning}
                        selected={profile.goal === 'endurance'}
                        onClick={() => setProfile({ ...profile, goal: 'endurance' })}
                        icon="Activity"
                    />
                </div>
            );
            case 2: return (
                <div className="space-y-3 animate-in slide-in-from-right-4 duration-300">
                    <OptionBtn
                        label={w.timeOptions.short}
                        description={TRANSLATIONS[lang].copy.setupWizard.n45MinOrLess}
                        selected={profile.sessionDuration === 'short'}
                        onClick={() => setProfile({ ...profile, sessionDuration: 'short' })}
                        icon="Clock"
                    />
                    <OptionBtn
                        label={w.timeOptions.medium}
                        description={TRANSLATIONS[lang].copy.setupWizard.n6075MinThe}
                        selected={profile.sessionDuration === 'medium'}
                        onClick={() => setProfile({ ...profile, sessionDuration: 'medium' })}
                        icon="Clock"
                    />
                    <OptionBtn
                        label={w.timeOptions.long}
                        description={TRANSLATIONS[lang].copy.setupWizard.n90MinForThose}
                        selected={profile.sessionDuration === 'long'}
                        onClick={() => setProfile({ ...profile, sessionDuration: 'long' })}
                        icon="Clock"
                    />
                </div>
            );
            case 3: {
                if (!recommendation) return null;
                const recTitle = t.phases[recommendation.mesoType] || 'Plan';
                const recDesc = (t.phaseDesc as any)[recommendation.mesoType] || '';
                const reasonText = (w.reason as any)[recommendation.reasonKey] || '';
                return (
                    <div className="space-y-6">
                        {/* Result card */}
                        <div className="bg-[rgb(var(--surface-raised))] border border-[rgb(var(--border-subtle))] rounded-2xl p-6 text-center">
                            <div className="w-16 h-16 bg-[rgb(var(--surface-elevated))] rounded-xl flex items-center justify-center mx-auto mb-4">
                                <Icon name="Check" size={32} className="text-green-700 dark:text-green-400" />
                            </div>
                            <p className="text-xs font-semibold text-muted mb-2">
                                {TRANSLATIONS[lang].copy.setupWizard.yourRecommendedProgram}
                            </p>
                            <h2 className="text-2xl font-semibold text-[rgb(var(--text-primary))] mb-2">{String(recTitle)}</h2>
                            <p className="text-sm text-[rgb(var(--text-secondary))]">"{recDesc}"</p>
                        </div>

                        <div className="bg-[rgb(var(--surface-raised))] border border-[rgb(var(--border-subtle))] rounded-2xl p-4 space-y-3">
                            <div className="flex gap-3 items-start">
                                <Icon name="Info" size={16} className="text-primary-500 mt-0.5 shrink-0" />
                                <p className="text-sm text-[rgb(var(--text-secondary))] leading-relaxed">{reasonText}</p>
                            </div>
                            {recommendation.adjustedVolume && (
                                <div className="flex gap-3 items-start">
                                    <Icon name="Clock" size={16} className="text-primary-500 mt-0.5 shrink-0" />
                                    <p className="text-sm text-[rgb(var(--text-secondary))] leading-relaxed">{w.adjusted}</p>
                                </div>
                            )}
                        </div>

                        {/* ── Launch Mode Picker ── */}
                        <div className="space-y-3">
                            <p className="text-xs font-semibold text-muted px-1">
                                {TRANSLATIONS[lang].copy.setupWizard.howDoYouWant}
                            </p>

                            <button
                                onClick={() => handleApply('suggested')}
                                className="w-full min-h-11 p-4 bg-primary-500 hover:bg-primary-400 rounded-xl flex items-center gap-4 transition-colors group focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
                            >
                                <div className="w-10 h-10 bg-zinc-950/10 rounded-xl flex items-center justify-center shrink-0">
                                    <Icon name="Zap" size={20} className="text-zinc-950" />
                                </div>
                                <div className="flex-1 text-left">
                                    <div className="font-semibold text-zinc-950 text-base">
                                        {TRANSLATIONS[lang].copy.setupWizard.startWithSuggestedRoutine}
                                    </div>
                                    <div className="text-xs text-zinc-950/75 mt-0.5">
                                        {formatMessage(TRANSLATIONS[lang].copy.setupWizard.applyRightNow, { v: String(recTitle) })}
                                    </div>
                                </div>
                                <Icon name="ArrowRight" size={18} className="text-zinc-950/80 group-hover:translate-x-1 transition-transform" />
                            </button>

                            <button
                                onClick={() => handleApply('custom')}
                                className="w-full min-h-11 p-4 bg-[rgb(var(--surface-raised))] border border-[rgb(var(--border-subtle))] hover:border-[rgb(var(--border-strong))] rounded-xl flex items-center gap-4 transition-colors group focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
                            >
                                <div className="w-10 h-10 bg-[rgb(var(--surface-elevated))] rounded-xl flex items-center justify-center shrink-0">
                                    <Icon name="FilePlus" size={20} className="text-muted" />
                                </div>
                                <div className="flex-1 text-left">
                                    <div className="font-semibold text-[rgb(var(--text-primary))] text-base">
                                        {TRANSLATIONS[lang].copy.setupWizard.createMyOwnTemplate}
                                    </div>
                                    <div className="text-xs text-muted mt-0.5">
                                        {TRANSLATIONS[lang].copy.setupWizard.designYourRoutineFrom}
                                    </div>
                                </div>
                                <Icon name="ChevronRight" size={18} className="text-muted" />
                            </button>

                            <button
                                onClick={() => handleApply('freestyle')}
                                className="w-full min-h-11 p-4 bg-[rgb(var(--surface-raised))] border border-[rgb(var(--border-subtle))] hover:border-[rgb(var(--border-strong))] rounded-xl flex items-center gap-4 transition-colors group focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
                            >
                                <div className="w-10 h-10 bg-[rgb(var(--surface-elevated))] rounded-xl flex items-center justify-center shrink-0">
                                    <Icon name="Shuffle" size={20} className="text-muted" />
                                </div>
                                <div className="flex-1 text-left">
                                    <div className="font-semibold text-[rgb(var(--text-primary))] text-base">
                                        {TRANSLATIONS[lang].copy.setupWizard.logFreestyleSessions}
                                    </div>
                                    <div className="text-xs text-muted mt-0.5">
                                        {TRANSLATIONS[lang].copy.setupWizard.noFixedProgramTrain}
                                    </div>
                                </div>
                                <Icon name="ChevronRight" size={18} className="text-muted" />
                            </button>
                        </div>
                    </div>
                );
            }
            default: return null;
        }
};
