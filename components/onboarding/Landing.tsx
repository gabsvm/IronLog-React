
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
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary-600/10 blur-[100px] md:blur-[120px] rounded-full" />
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
                                className={`px-3 py-1 text-[10px] font-bold rounded-full transition-all ${lang === 'en' ? 'bg-primary-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
                            >
                                EN
                            </button>
                            <button
                                onClick={() => setLang('es')}
                                className={`px-3 py-1 text-[10px] font-bold rounded-full transition-all ${lang === 'es' ? 'bg-primary-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
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
                    {/* Background grid */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff04_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-60" />

                    {/* Floating mock workout card */}
                    <div className="relative w-full max-w-xs mb-8 animate-bounce-cta" style={{ animationDuration: '3s' }}>
                        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl shadow-black/60">
                            {/* Card header */}
                            <div className="px-4 pt-4 pb-3 border-b border-zinc-800 flex items-center justify-between">
                                <div>
                                    <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mb-0.5">CHEST · WEEK 2</div>
                                    <div className="text-base font-black text-white">Bench Press</div>
                                </div>
                                <div className="text-[9px] font-bold bg-zinc-800 text-zinc-500 px-2 py-1 rounded-lg border border-zinc-700">
                                    8-12 Reps
                                </div>
                            </div>
                            {/* Mock sets */}
                            <div className="divide-y divide-zinc-800/60">
                                {[
                                    { label: 'W', weight: '60', reps: '12', done: true, color: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
                                    { label: '●', weight: '100', reps: '10', done: true, color: 'bg-zinc-800 text-zinc-400 border-zinc-700' },
                                    { label: '●', weight: '100', reps: '', done: false, color: 'bg-zinc-800 text-zinc-400 border-zinc-700' },
                                ].map((s, i) => (
                                    <div key={i} className={`grid grid-cols-12 gap-2 items-center py-2.5 px-3 ${s.done ? 'opacity-60' : ''}`}>
                                        <div className="col-span-2 flex justify-center">
                                            <div className={`w-8 h-8 rounded-lg border flex items-center justify-center text-[10px] font-black ${s.done ? 'bg-green-500/15 border-green-500/30 text-green-400' : s.color}`}>
                                                {s.done ? '✓' : s.label}
                                            </div>
                                        </div>
                                        <div className="col-span-4">
                                            <div className={`text-center text-lg font-black rounded-lg py-1.5 ${s.done ? 'text-green-400' : 'bg-zinc-800 text-white'}`}>
                                                {s.weight || '—'}
                                            </div>
                                        </div>
                                        <div className="col-span-4">
                                            <div className={`text-center text-lg font-black rounded-lg py-1.5 ${s.done ? 'text-green-400' : s.reps ? 'bg-zinc-800 text-white' : 'bg-zinc-800 text-zinc-600'}`}>
                                                {s.reps || '—'}
                                            </div>
                                        </div>
                                        <div className="col-span-2 flex justify-center">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm ${s.done ? 'bg-green-500 text-white shadow-[0_0_12px_rgba(34,197,94,0.5)]' : 'bg-zinc-800 text-zinc-600'}`}>
                                                ✓
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {/* Glow below card */}
                        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-8 bg-primary-600/15 blur-2xl rounded-full" />
                    </div>

                    <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tighter mb-4 md:mb-6 animate-in-up" style={{ animationDelay: '0.2s' }}>
                        {t.title}{' '}
                        <span className="text-primary-600">{t.titleAccent}</span>
                        {t.titleSuffix && ` ${t.titleSuffix}`}
                    </h1>
                    <p className="text-zinc-400 text-base md:text-xl max-w-sm md:max-w-md mb-8 md:mb-10 animate-in-up text-balance" style={{ animationDelay: '0.3s' }}>
                        {t.subtitle}
                    </p>

                    <div className="w-full max-w-xs md:max-w-sm animate-in-up" style={{ animationDelay: '0.4s' }}>
                        <Button
                            variant="primary"
                            size="lg"
                            className="w-full h-14 md:h-16 text-lg font-bold shadow-[0_0_30px_rgba(220,38,38,0.35)] active:scale-95 transition-transform flex items-center justify-center gap-3"
                            onClick={onStart}
                        >
                            {t.getStarted}
                            <Icon name="ArrowRight" size={20} />
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
                            className="glass-island p-5 md:p-6 rounded-[2rem] md:rounded-3xl animate-in-up hover:border-primary-600/30 transition-colors group"
                            style={{ animationDelay: `${0.6 + i * 0.1}s` }}
                        >
                            <div className="w-10 h-10 bg-primary-600/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Icon
                                    name={feature.icon || "Zap"}
                                    className="text-primary-500"
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
                    GainsLab v4.0 &copy; {new Date().getFullYear()} &bull; Professional Edition
                </div>
            </div>
        </div>
    );
};
