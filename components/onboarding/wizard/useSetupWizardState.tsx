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

    // 0–2: profile steps, 3: recommendation, 4: launch mode picker
    const [step, setStep] = useState(0);
    const [profile, setProfile] = useState<UserProfile>(() => ({
        daysPerWeek: userProfile?.daysPerWeek || 4,
        goal: userProfile?.goal || 'hypertrophy',
        sessionDuration: userProfile?.sessionDuration || 'medium',
        ...userProfile,
    }));

    const [recommendation, setRecommendation] = useState<RecommendationResult | null>(null);
    const [isGenerating] = useState(false);

    // ── Navigation ────────────────────────────────────────────────────
    const handleNext = () => {
        if (step === 2) {
            const rec = recommendProgram(profile);
            setRecommendation(rec);
            setStep(3); // recommendation screen
        } else if (step < 2) {
            setStep(prev => prev + 1);
        }
    };

    const handleApply = (mode: Mode) => {
        // Persist onboarding answers into userProfile without losing existing body-profile fields
        setUserProfile(prev => ({
            ...prev,
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
    const OptionBtn = ({ label, description, selected, onClick, icon }: {
        label: string;
        description?: string;
        selected: boolean;
        onClick: () => void;
        icon: string;
    }) => (
        <button
            onClick={onClick}
            aria-pressed={selected}
            className={`w-full min-h-11 p-4 rounded-2xl border flex items-start gap-4 transition-colors text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 ${
                selected
                    ? 'border-primary-500 bg-primary-500/10'
                    : 'border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] hover:border-[rgb(var(--border-strong))]'
            }`}
        >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                selected ? 'bg-primary-500 text-zinc-950' : 'bg-[rgb(var(--surface-elevated))] text-muted'
            }`}>
                <Icon name={icon} size={20} />
            </div>
            <div className="flex-1 min-w-0">
                <div className={`font-semibold text-base ${selected ? 'text-accent' : 'text-[rgb(var(--text-primary))]'}`}>{label}</div>
                {description && (
                    <div className="text-sm mt-1 leading-relaxed text-[rgb(var(--text-secondary))]">
                        {description}
                    </div>
                )}
            </div>
            {selected && <Icon name="Check" size={18} className="text-accent mt-1 flex-shrink-0" />}
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
        handleNext,
        handleApply,
        OptionBtn,
    };
};

export type SetupWizardState = ReturnType<typeof useSetupWizardState>;
