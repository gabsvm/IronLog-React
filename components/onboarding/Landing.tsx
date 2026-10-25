import React from 'react';
import { useAppPreferences } from '../../context/AppContext';
import { TRANSLATIONS } from '../../constants';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Logo } from '../ui/Logo';

interface LandingProps {
    onStart: () => void;
    onLogin: () => void;
}

export const Landing: React.FC<LandingProps> = ({ onStart, onLogin }) => {
    const { lang, setLang } = useAppPreferences();
    const t = TRANSLATIONS[lang].landing;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto scroll-container bg-[rgb(var(--surface-app))] text-[rgb(var(--text-primary))]">
            <div className="min-h-full flex flex-col px-6 pb-8 md:pb-12 pt-[calc(2rem+var(--safe-area-top))] max-w-5xl mx-auto">
                <header className="flex justify-between items-center gap-3 mb-12">
                    <Logo size={28} />
                    <div className="flex items-center gap-3">
                        <div className="flex bg-[rgb(var(--surface-raised))] p-1 rounded-xl border border-[rgb(var(--border-subtle))]">
                            {(['en', 'es'] as const).map(language => (
                                <button
                                    key={language}
                                    onClick={() => setLang(language)}
                                    aria-pressed={lang === language}
                                    className={`min-h-11 min-w-11 px-3 text-xs font-semibold rounded-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 ${lang === language ? 'bg-[rgb(var(--surface-elevated))] text-[rgb(var(--text-primary))]' : 'text-muted hover:text-[rgb(var(--text-primary))]'}`}
                                >
                                    {language.toUpperCase()}
                                </button>
                            ))}
                        </div>
                        <button onClick={onLogin} className="min-h-11 px-2 text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] text-sm font-medium rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500">
                            {t.login}
                        </button>
                    </div>
                </header>

                <main className="flex-1 flex flex-col items-center justify-center text-center py-12 md:py-20">
                    <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] text-accent">
                        <Icon name="Dumbbell" size={28} />
                    </div>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight mb-4">
                        {t.title}{' '}
                        <span className="text-accent">{t.titleAccent}</span>
                        {t.titleSuffix && ` ${t.titleSuffix}`}
                    </h1>
                    <p className="text-[rgb(var(--text-secondary))] text-base md:text-lg max-w-md mb-8 text-balance">{t.subtitle}</p>
                    <Button variant="primary" size="lg" className="w-full max-w-sm min-h-12 text-base font-semibold flex items-center justify-center gap-3" onClick={onStart}>
                        {t.getStarted}
                        <Icon name="ArrowRight" size={20} />
                    </Button>
                </main>

                <section id="features" className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
                    <h2 className="col-span-full text-muted text-xs font-semibold mb-2">{t.featuresTitle}</h2>
                    {t.features.map((feature, i: number) => (
                        <div key={i} className="p-5 md:p-6 rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))]">
                            <div className="w-10 h-10 bg-[rgb(var(--surface-elevated))] rounded-xl flex items-center justify-center mb-4">
                                <Icon name={feature.icon || 'Zap'} className="text-accent" size={20} />
                            </div>
                            <h3 className="text-[rgb(var(--text-primary))] font-semibold mb-1 text-base">{feature.title}</h3>
                            <p className="text-[rgb(var(--text-secondary))] text-sm leading-relaxed">{feature.desc}</p>
                        </div>
                    ))}
                </section>
                <footer className="text-center text-muted text-xs mt-auto pb-[calc(1rem+var(--safe-area-bottom))]">
                    Repyntra v4.0 &copy; {new Date().getFullYear()} &bull; Professional Edition
                </footer>
            </div>
        </div>
    );
};
