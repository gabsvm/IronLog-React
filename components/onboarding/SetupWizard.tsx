import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../constants';
import { UserProfile } from '../../types';
import { Icon } from '../ui/Icon';
import { Logo } from '../ui/Logo';
import { recommendProgram, RecommendationResult } from '../../utils/recommendationEngine';
import { useStore } from '../../lib/store';

interface SetupWizardProps {
    onComplete: () => void;
}

type Intent = 'program' | 'custom' | 'freestyle';

const intentStorageKey = 'gainslab.onboarding.intent';

export const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete }) => {
    const { lang, setLang, setProgram, setUserProfile } = useApp();
    const setActiveMeso = useStore(state => state.setActiveMeso);
    const t = TRANSLATIONS[lang];
    const w = t.wizard;

    const [intent, setIntent] = useState<Intent | null>(null);
    const [step, setStep] = useState(0);
    const [profile, setProfile] = useState<UserProfile>({
        experience: 'intermediate',
        daysPerWeek: 4,
        goal: 'hypertrophy',
        sessionDuration: 'medium',
    });
    const [recommendation, setRecommendation] = useState<RecommendationResult | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const persistIntentAndFinish = (nextIntent: Intent) => {
        try { window.sessionStorage.setItem(intentStorageKey, nextIntent); } catch { }
        if (nextIntent === 'custom') setProgram([]);
        onComplete();
    };

    const chooseIntent = (nextIntent: Intent) => {
        if (nextIntent === 'program') {
            setIntent('program');
            setStep(0);
            return;
        }
        persistIntentAndFinish(nextIntent);
    };

    const handleNext = () => {
        if (step < 3) {
            setStep(prev => prev + 1);
            return;
        }
        setIsGenerating(true);
        window.setTimeout(() => {
            const rec = recommendProgram(profile);
            setRecommendation(rec);
            setIsGenerating(false);
            setStep(4);
        }, 450);
    };

    const applyRecommendation = () => {
        if (!recommendation) return;
        setUserProfile(profile);
        setProgram(recommendation.template);
        const plan = recommendation.template.map(day => (day.slots || []).map(slot => slot.exerciseId || null));
        setActiveMeso({
            id: Date.now(),
            name: String(t.phases[recommendation.mesoType] || (lang === 'es' ? 'Programa recomendado' : 'Recommended program')),
            mesoType: recommendation.mesoType,
            week: 1,
            targetWeeks: 5,
            isDeload: false,
            plan,
            duration: 5,
        });
        onComplete();
    };

    const Option = ({ icon, title, description, selected, onClick }: {
        icon: string;
        title: string;
        description: string;
        selected?: boolean;
        onClick: () => void;
    }) => (
        <button
            type="button"
            onClick={onClick}
            className={`flex min-h-[76px] w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition-colors active:scale-[0.99] ${selected ? 'border-primary-500/35 bg-primary-500/8' : 'border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised)/0.62)]'}`}
        >
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${selected ? 'bg-primary-500 text-black' : 'bg-[rgb(var(--surface-base))] text-[rgb(var(--text-muted))]'}`}>
                <Icon name={icon} size={19} />
            </span>
            <span className="min-w-0 flex-1">
                <span className="block text-sm font-black text-[rgb(var(--text-primary))]">{title}</span>
                <span className="mt-1 block text-xs leading-relaxed text-[rgb(var(--text-muted))]">{description}</span>
            </span>
            {selected ? <Icon name="Check" size={17} className="shrink-0 text-primary-500" /> : <Icon name="ChevronRight" size={17} className="shrink-0 text-[rgb(var(--text-muted))]" />}
        </button>
    );

    const languageToggle = (
        <div className="flex rounded-lg bg-[rgb(var(--surface-raised))] p-1">
            {(['en', 'es'] as const).map(value => (
                <button
                    key={value}
                    type="button"
                    onClick={() => setLang(value)}
                    className={`min-h-8 rounded-md px-2.5 text-[10px] font-black uppercase ${lang === value ? 'bg-[rgb(var(--surface-base))] text-[rgb(var(--text-primary))]' : 'text-[rgb(var(--text-muted))]'}`}
                >
                    {value}
                </button>
            ))}
        </div>
    );

    if (!intent) {
        return (
            <div className="fixed inset-0 z-modal flex flex-col bg-[rgb(var(--surface-app))] text-[rgb(var(--text-primary))]">
                <header className="flex items-center justify-between border-b border-[rgb(var(--border-subtle)/0.7)] px-5 pb-3 pt-safe">
                    <Logo size={34} showText />
                    {languageToggle}
                </header>

                <main className="flex-1 overflow-y-auto px-5 py-7 scroll-container">
                    <div className="mx-auto max-w-md">
                        <p className="text-[10px] font-black uppercase tracking-[0.1em] text-primary-500">{lang === 'es' ? 'Empecemos por lo importante' : 'Start with what matters'}</p>
                        <h1 className="mt-2 text-3xl font-black tracking-[-0.045em]">{lang === 'es' ? '¿Cómo querés entrenar?' : 'How do you want to train?'}</h1>
                        <p className="mt-2 max-w-sm text-sm leading-relaxed text-[rgb(var(--text-muted))]">{lang === 'es' ? 'No hace falta aprender la app antes de usarla. Elegí tu intención y GainsLab te lleva al flujo correcto.' : 'You do not need to learn the app before using it. Pick your intent and GainsLab takes you to the right flow.'}</p>

                        <div className="mt-7 space-y-2.5">
                            <Option
                                icon="BookOpen"
                                title={lang === 'es' ? 'Seguir un programa' : 'Follow a program'}
                                description={lang === 'es' ? 'Te recomendamos una estructura según experiencia, frecuencia, objetivo y tiempo.' : 'Get a structure recommended from your experience, frequency, goal and available time.'}
                                onClick={() => chooseIntent('program')}
                            />
                            <Option
                                icon="FilePlus"
                                title={lang === 'es' ? 'Crear mi rutina' : 'Create my routine'}
                                description={lang === 'es' ? 'Abrí el editor con un lienzo vacío y armá tus propios días.' : 'Open a blank editor and build your own training days.'}
                                onClick={() => chooseIntent('custom')}
                            />
                            <Option
                                icon="Shuffle"
                                title={lang === 'es' ? 'Entrenar ahora' : 'Train now'}
                                description={lang === 'es' ? 'Sin programa fijo. Abrí Inicio rápido y registrá una sesión libre.' : 'No fixed program. Open Quick Start and log a freestyle session.'}
                                onClick={() => chooseIntent('freestyle')}
                            />
                        </div>

                        <button type="button" onClick={onComplete} className="mt-6 min-h-11 w-full text-xs font-bold text-[rgb(var(--text-muted))]">
                            {lang === 'es' ? 'Explorar la app por mi cuenta' : 'Explore the app on my own'}
                        </button>
                    </div>
                </main>
            </div>
        );
    }

    if (isGenerating) {
        return (
            <div className="fixed inset-0 z-modal flex items-center justify-center bg-[rgb(var(--surface-app))] p-8 text-[rgb(var(--text-primary))]">
                <div className="text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-500/10 text-primary-500"><Icon name="RefreshCw" size={22} className="animate-spin" /></div>
                    <h2 className="mt-4 text-lg font-black">{w.generating}</h2>
                    <p className="mt-1 text-xs text-[rgb(var(--text-muted))]">{lang === 'es' ? 'Cruzando tu perfil con la biblioteca…' : 'Matching your profile with the library…'}</p>
                </div>
            </div>
        );
    }

    const stepTitles = [w.steps.exp, w.steps.freq, w.steps.goal, w.steps.time];
    const progress = step < 4 ? ((step + 1) / 4) * 100 : 100;
    const titleByStep = [
        lang === 'es' ? '¿Cuál es tu nivel?' : "What's your level?",
        lang === 'es' ? '¿Cuántos días por semana?' : 'How many days per week?',
        lang === 'es' ? '¿Cuál es tu objetivo?' : "What's your goal?",
        lang === 'es' ? '¿Cuánto tiempo tenés?' : 'How much time do you have?',
    ];
    const descriptionByStep = [
        lang === 'es' ? 'Solo lo usamos para elegir una estructura razonable.' : 'We only use this to choose a sensible structure.',
        lang === 'es' ? 'Elegí una frecuencia que puedas sostener y recuperar.' : 'Choose a frequency you can sustain and recover from.',
        lang === 'es' ? 'Esto orienta la recomendación inicial.' : 'This guides the initial recommendation.',
        lang === 'es' ? 'Tiempo aproximado por sesión.' : 'Approximate time per session.',
    ];

    const profileStep = (() => {
        if (step === 0) return (
            <div className="space-y-2.5">
                <Option icon="Star" title={w.expOptions.beginner} description={w.expDesc?.beginner || ''} selected={profile.experience === 'beginner'} onClick={() => setProfile(prev => ({ ...prev, experience: 'beginner' }))} />
                <Option icon="TrendingUp" title={w.expOptions.intermediate} description={w.expDesc?.intermediate || ''} selected={profile.experience === 'intermediate'} onClick={() => setProfile(prev => ({ ...prev, experience: 'intermediate' }))} />
                <Option icon="Zap" title={w.expOptions.advanced} description={w.expDesc?.advanced || ''} selected={profile.experience === 'advanced'} onClick={() => setProfile(prev => ({ ...prev, experience: 'advanced' }))} />
            </div>
        );
        if (step === 1) return (
            <div>
                <div className="grid grid-cols-5 gap-2">
                    {[2, 3, 4, 5, 6].map(days => (
                        <button key={days} type="button" onClick={() => setProfile(prev => ({ ...prev, daysPerWeek: days }))} className={`aspect-square rounded-xl text-lg font-black transition-colors active:scale-95 ${profile.daysPerWeek === days ? 'bg-primary-500 text-black' : 'bg-[rgb(var(--surface-raised))] text-[rgb(var(--text-muted))]'}`}>{days}</button>
                    ))}
                </div>
                <p className="mt-4 text-center text-sm font-bold text-[rgb(var(--text-secondary))]">{profile.daysPerWeek} {lang === 'es' ? 'días / semana' : 'days / week'}</p>
            </div>
        );
        if (step === 2) return (
            <div className="space-y-2.5">
                <Option icon="Dumbbell" title={w.goalOptions.hypertrophy} description={lang === 'es' ? 'Priorizar masa muscular y tamaño.' : 'Prioritize muscle mass and size.'} selected={profile.goal === 'hypertrophy'} onClick={() => setProfile(prev => ({ ...prev, goal: 'hypertrophy' }))} />
                <Option icon="Shield" title={w.goalOptions.strength} description={lang === 'es' ? 'Priorizar fuerza en levantamientos principales.' : 'Prioritize strength on main lifts.'} selected={profile.goal === 'strength'} onClick={() => setProfile(prev => ({ ...prev, goal: 'strength' }))} />
                <Option icon="Activity" title={w.goalOptions.endurance} description={lang === 'es' ? 'Priorizar resistencia y condición física.' : 'Prioritize endurance and conditioning.'} selected={profile.goal === 'endurance'} onClick={() => setProfile(prev => ({ ...prev, goal: 'endurance' }))} />
            </div>
        );
        if (step === 3) return (
            <div className="space-y-2.5">
                <Option icon="Clock" title={w.timeOptions.short} description={lang === 'es' ? '45 min o menos.' : '45 min or less.'} selected={profile.sessionDuration === 'short'} onClick={() => setProfile(prev => ({ ...prev, sessionDuration: 'short' }))} />
                <Option icon="Clock" title={w.timeOptions.medium} description={lang === 'es' ? '60–75 min.' : '60–75 min.'} selected={profile.sessionDuration === 'medium'} onClick={() => setProfile(prev => ({ ...prev, sessionDuration: 'medium' }))} />
                <Option icon="Clock" title={w.timeOptions.long} description={lang === 'es' ? '90 min o más.' : '90 min or more.'} selected={profile.sessionDuration === 'long'} onClick={() => setProfile(prev => ({ ...prev, sessionDuration: 'long' }))} />
            </div>
        );
        return null;
    })();

    if (step === 4 && recommendation) {
        const recTitle = String(t.phases[recommendation.mesoType] || (lang === 'es' ? 'Programa recomendado' : 'Recommended program'));
        const recDesc = String((t.phaseDesc as any)?.[recommendation.mesoType] || '');
        const reasonText = String((w.reason as any)?.[recommendation.reasonKey] || '');
        return (
            <div className="fixed inset-0 z-modal flex flex-col bg-[rgb(var(--surface-app))] text-[rgb(var(--text-primary))]">
                <header className="flex items-center justify-between border-b border-[rgb(var(--border-subtle)/0.7)] px-5 pb-3 pt-safe"><Logo size={34} showText />{languageToggle}</header>
                <main className="flex-1 overflow-y-auto p-5 scroll-container">
                    <div className="mx-auto max-w-md space-y-4 py-4">
                        <div className="rounded-2xl border border-primary-500/25 bg-primary-500/[0.055] p-5">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-500/10 text-primary-500"><Icon name="CheckCircle" size={21} /></div>
                            <p className="mt-4 text-[10px] font-black uppercase tracking-[0.1em] text-primary-500">{lang === 'es' ? 'Tu recomendación' : 'Your recommendation'}</p>
                            <h1 className="mt-1 text-2xl font-black tracking-[-0.04em]">{recTitle}</h1>
                            {recDesc && <p className="mt-2 text-sm leading-relaxed text-[rgb(var(--text-secondary))]">{recDesc}</p>}
                        </div>

                        {reasonText && <div className="flex gap-3 rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised)/0.6)] p-4"><Icon name="Info" size={16} className="mt-0.5 shrink-0 text-primary-500" /><p className="text-sm leading-relaxed text-[rgb(var(--text-secondary))]">{reasonText}</p></div>}

                        <button type="button" onClick={applyRecommendation} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary-500 px-4 text-sm font-black text-black active:scale-[0.99]">{lang === 'es' ? 'Usar este programa' : 'Use this program'} <Icon name="ArrowRight" size={16} /></button>
                        <button type="button" onClick={() => { setRecommendation(null); setStep(0); }} className="min-h-11 w-full text-xs font-bold text-[rgb(var(--text-muted))]">{lang === 'es' ? 'Cambiar mis respuestas' : 'Change my answers'}</button>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-modal flex flex-col bg-[rgb(var(--surface-app))] text-[rgb(var(--text-primary))]">
            <header className="border-b border-[rgb(var(--border-subtle)/0.7)] px-5 pb-3 pt-safe">
                <div className="flex items-center justify-between"><Logo size={34} showText />{languageToggle}</div>
                <div className="mt-3 h-1 overflow-hidden rounded-full bg-[rgb(var(--surface-elevated))]"><div className="h-full rounded-full bg-primary-500 transition-all duration-200" style={{ width: `${progress}%` }} /></div>
                <div className="mt-2 grid grid-cols-4 gap-1">{stepTitles.map((title, index) => <span key={String(title)} className={`truncate text-center text-[8px] font-bold ${index <= step ? 'text-primary-500' : 'text-[rgb(var(--text-muted))]'}`}>{String(title)}</span>)}</div>
            </header>

            <main className="flex-1 overflow-y-auto px-5 py-6 scroll-container">
                <div className="mx-auto max-w-md">
                    <h1 className="text-2xl font-black tracking-[-0.04em]">{titleByStep[step]}</h1>
                    <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">{descriptionByStep[step]}</p>
                    <div className="mt-6">{profileStep}</div>
                </div>
            </main>

            <footer className="border-t border-[rgb(var(--border-subtle)/0.7)] bg-[rgb(var(--surface-base)/0.96)] p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
                <div className="mx-auto flex max-w-md gap-2">
                    <button type="button" onClick={() => step === 0 ? setIntent(null) : setStep(prev => prev - 1)} className="flex h-12 w-12 items-center justify-center rounded-xl bg-[rgb(var(--surface-raised))] text-[rgb(var(--text-muted))] active:scale-95"><Icon name="ChevronLeft" size={20} /></button>
                    <button type="button" onClick={handleNext} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary-500 text-sm font-black text-black active:scale-[0.99]">{step === 3 ? (lang === 'es' ? 'Ver recomendación' : 'See recommendation') : (lang === 'es' ? 'Siguiente' : 'Next')} <Icon name="ArrowRight" size={16} /></button>
                </div>
            </footer>
        </div>
    );
};
