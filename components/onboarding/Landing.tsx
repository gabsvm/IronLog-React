
import React from 'react';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../constants';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Logo } from '../ui/Logo';

interface LandingProps {
    onStart: () => void;
    onLogin: () => void;
}

export const Landing: React.FC<LandingProps> = ({ onStart, onLogin }) => {
    const { lang, setLang } = useApp();
    const t = TRANSLATIONS[lang].landing;

    return (
        <div className="fixed inset-0 z-50 bg-black overflow-y-auto scroll-container">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-red-600/10 blur-[100px] md:blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-zinc-800/20 blur-[100px] md:blur-[120px] rounded-full" />
            </div>

            <div className="relative min-h-full flex flex-col px-6 py-8 md:py-12 max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-12 md:mb-16 animate-in-up" style={{ animationDelay: '0.1s' }}>
                    <Logo size={28} />

                    <div className="flex items-center gap-4">
                        {/* Language Toggle */}
                        <div className="flex bg-zinc-900/50 p-1 rounded-full border border-white/5">
                            <button
                                onClick={() => setLang('en')}
                                className={`px-3 py-1 text-[10px] font-bold rounded-full transition-all ${lang === 'en' ? 'bg-red-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
                            >
                                EN
                            </button>
                            <button
                                onClick={() => setLang('es')}
                                className={`px-3 py-1 text-[10px] font-bold rounded-full transition-all ${lang === 'es' ? 'bg-red-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
                            >
                                ES
                            </button>
                        </div>

                        <button
                            onClick={onLogin}
                            className="text-zinc-400 hover:text-white text-xs md:text-sm font-medium transition-colors"
                        >
                            {t.login}
                        </button>
                    </div>
                </div>

                {/* Hero Section */}
                <div className="flex-1 flex flex-col items-center justify-center text-center mb-16 md:mb-24 relative min-h-[60vh]">
                    <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tighter mb-4 md:mb-6 animate-in-up" style={{ animationDelay: '0.2s' }}>
                        {t.title.split(' ').map((word, i) => (
                            <span key={i} className={i === 1 ? "text-red-600" : ""}>{word} </span>
                        ))}
                    </h1>
                    <p className="text-zinc-400 text-base md:text-xl max-w-sm md:max-w-md mb-8 md:mb-10 animate-in-up text-balance" style={{ animationDelay: '0.3s' }}>
                        {t.subtitle}
                    </p>

                    <div className="w-full max-w-xs md:max-w-sm animate-in-up" style={{ animationDelay: '0.4s' }}>
                        <Button
                            variant="primary"
                            size="lg"
                            className="w-full h-14 md:h-16 text-lg font-bold shadow-2xl shadow-red-600/20 active:scale-95 transition-transform"
                            onClick={onStart}
                        >
                            {t.getStarted}
                        </Button>
                    </div>

                    {/* Scroll Indicator */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 animate-bounce opacity-20 hover:opacity-100 transition-opacity hidden md:flex flex-col items-center gap-2">
                        <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-zinc-500">Scroll</span>
                        <Icon name="ChevronDown" size={16} className="text-zinc-500" />
                    </div>
                </div>

                {/* Features Grid */}
                <div id="features" className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mb-12">
                    <h2 className="col-span-full text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-2 animate-in-up" style={{ animationDelay: '0.5s' }}>
                        {t.featuresTitle}
                    </h2>
                    {t.features.map((feature: any, i: number) => (
                        <div
                            key={i}
                            className="glass-island p-5 md:p-6 rounded-[2rem] md:rounded-3xl animate-in-up hover:border-red-600/30 transition-colors group"
                            style={{ animationDelay: `${0.6 + i * 0.1}s` }}
                        >
                            <div className="w-10 h-10 bg-red-600/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Icon
                                    name={i === 0 ? "Zap" : i === 1 ? "Activity" : i === 2 ? "Shield" : "Cloud"}
                                    className="text-red-500"
                                    size={20}
                                />
                            </div>
                            <h3 className="text-white font-bold mb-1 text-sm md:text-base">{feature.title}</h3>
                            <p className="text-zinc-400 text-xs md:text-sm leading-relaxed">{feature.desc}</p>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="text-center text-zinc-600 text-[9px] md:text-[10px] uppercase tracking-widest mt-auto pb-4 animate-in-up" style={{ animationDelay: '1s' }}>
                    IronLog v4.0 &copy; {new Date().getFullYear()} &bull; Professional Edition
                </div>
            </div>
        </div>
    );
};
