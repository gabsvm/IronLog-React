// U5: per-step content of the setup wizard, moved verbatim from components/onboarding/SetupWizard.tsx.
import { formatMessage } from '../../../utils/i18n';
import React from 'react';
import { TRANSLATIONS } from '../../../constants';
import { Icon } from '../../ui/Icon';
import type { SetupWizardState, Mode } from './useSetupWizardState';

export const SetupWizardStep: React.FC<{ state: SetupWizardState }> = ({ state }) => {
    const { lang, t, w, step, profile, setProfile, recommendation, handleApply, OptionBtn } = state;
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
                        <div className="mt-4 bg-primary-500/10 p-3 rounded-xl flex gap-3 items-start border border-primary-500/20">
                            <Icon name="Info" size={16} className="text-primary-500 mt-0.5 shrink-0" />
                            <p className="text-xs text-primary-700 dark:text-primary-300 leading-relaxed font-medium">{w.expNote}</p>
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
                                {TRANSLATIONS[lang].copy.setupWizard.daysWeek}
                            </span>
                        </p>
                    </div>
                </div>
            );
            case 2: return (
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
            case 3: return (
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
                                {TRANSLATIONS[lang].copy.setupWizard.yourRecommendedProgram}
                            </p>
                            <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-2">{String(recTitle)}</h2>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 italic">"{recDesc}"</p>
                        </div>

                        <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-white/5 rounded-2xl p-4 space-y-3">
                            <div className="flex gap-3 items-start">
                                <Icon name="Info" size={16} className="text-primary-500 mt-0.5 shrink-0" />
                                <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">{reasonText}</p>
                            </div>
                            {recommendation.adjustedVolume && (
                                <div className="flex gap-3 items-start">
                                    <Icon name="Clock" size={16} className="text-primary-500 mt-0.5 shrink-0" />
                                    <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">{w.adjusted}</p>
                                </div>
                            )}
                        </div>

                        {/* ── Launch Mode Picker ── */}
                        <div className="space-y-3">
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 px-1">
                                {TRANSLATIONS[lang].copy.setupWizard.howDoYouWant}
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
                                        {TRANSLATIONS[lang].copy.setupWizard.startWithSuggestedRoutine}
                                    </div>
                                    <div className="text-xs text-white/70 mt-0.5">
                                        {formatMessage(TRANSLATIONS[lang].copy.setupWizard.applyRightNow, { v: String(recTitle) })}
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
                                        {TRANSLATIONS[lang].copy.setupWizard.createMyOwnTemplate}
                                    </div>
                                    <div className="text-xs text-zinc-400 mt-0.5">
                                        {TRANSLATIONS[lang].copy.setupWizard.designYourRoutineFrom}
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
                                        {TRANSLATIONS[lang].copy.setupWizard.logFreestyleSessions}
                                    </div>
                                    <div className="text-xs text-zinc-400 mt-0.5">
                                        {TRANSLATIONS[lang].copy.setupWizard.noFixedProgramTrain}
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
