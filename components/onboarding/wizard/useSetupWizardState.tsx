// U5: SetupWizard state, moved verbatim from components/onboarding/SetupWizard.tsx.
import { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { TRANSLATIONS } from '../../../constants';
import { UserProfile, ProgramDay } from '../../../types';
import { Icon } from '../../ui/Icon';
import { recommendProgram, RecommendationResult } from '../../../utils/recommendationEngine';
import { useStore } from '../../../lib/store';

export interface SetupWizardProps {
    onComplete: (outcome: OnboardingOutcome) => void;
}

export interface OnboardingOutcome {
    mode: Mode;
    template?: ProgramDay[];
}

export type Mode = 'suggested' | 'custom' | 'freestyle';

export const useSetupWizardState = ({ onComplete }: SetupWizardProps) => {
    const { lang, setLang, setProgram, userProfile, setUserProfile } = useApp();
    const setActiveMeso = useStore(state => state.setActiveMeso);
    const t = TRANSLATIONS[lang];
    const w = t.wizard;

    // 0–3: profile steps, 4: recommendation, 5: launch mode picker
    const [step, setStep] = useState(0);
    const [profile, setProfile] = useState<UserProfile>(() => ({
        experience: userProfile?.experience || 'intermediate',
        daysPerWeek: userProfile?.daysPerWeek || 4,
        goal: userProfile?.goal || 'hypertrophy',
        sessionDuration: userProfile?.sessionDuration || 'medium',
        ...userProfile,
    }));

    const [recommendation, setRecommendation] = useState<RecommendationResult | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // ── Navigation ────────────────────────────────────────────────────
    const handleNext = () => {
        if (step === 3) {
            const rec = recommendProgram(profile);
            setRecommendation(rec);
            setStep(4); // recommendation screen
        } else if (step < 3) {
            setStep(prev => prev + 1);
        }
    };

    const handleApply = (mode: Mode) => {
        // Persist onboarding answers into userProfile without losing existing body-profile fields
        setUserProfile(prev => ({
            ...prev,
            experience: profile.experience,
            daysPerWeek: profile.daysPerWeek,
            goal: profile.goal,
            sessionDuration: profile.sessionDuration,
        }));

        if (mode === 'freestyle') {
            setActiveMeso(null);
            onComplete({ mode: 'freestyle' });
            return;
        }

        if (mode === 'custom') {
            const blankProgram: ProgramDay[] = [{
                id: `d_${Date.now()}`,
                dayName: { en: 'Day 1', es: 'Día 1' },
                slots: []
            }];
            setProgram(blankProgram);
            setActiveMeso(null);
            onComplete({ mode: 'custom', template: blankProgram });
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
        onComplete({ mode: 'suggested', template: recommendation.template });
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
                <div className={`font-black text-sm ${selected ? 'text-primary-700 dark:text-primary-400' : 'text-zinc-900 dark:text-white'}`}>{label}</div>
                {description && (
                    <div className={`text-xs mt-1 leading-relaxed font-medium ${selected ? 'text-primary-600/70 dark:text-primary-400/70' : 'text-zinc-500 dark:text-zinc-400'}`}>
                        {description}
                    </div>
                )}
            </div>
            {selected && <Icon name="Check" size={18} className="text-primary-600 mt-1 flex-shrink-0" />}
        </button>
    );

    // ── Step renderers ────────────────────────────────────────────────

    return {
        onComplete,
        lang,
        setLang,
        setProgram,
        userProfile,
        setUserProfile,
        setActiveMeso,
        t,
        w,
        step,
        setStep,
        profile,
        setProfile,
        recommendation,
        setRecommendation,
        isGenerating,
        setIsGenerating,
        handleNext,
        handleApply,
        OptionBtn,
    };
};

export type SetupWizardState = ReturnType<typeof useSetupWizardState>;
