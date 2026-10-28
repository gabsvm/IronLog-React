import React, { useState, useEffect, useRef } from 'react';
import { useAppPreferences } from '../../context/AppContext';
import { TRANSLATIONS } from '../../constants';
import { Icon } from '../ui/Icon';
import { BrandLogo } from '../BrandLogo';

interface LandingProps {
    onStart?: () => void;
    onGetStarted?: () => void;
    onLogin: () => void;
}

interface KineticState {
    t: number;
    duration: number;
    playing: boolean;
    muted: boolean;
}

export const Landing: React.FC<LandingProps> = ({ onStart, onGetStarted, onLogin }) => {
    const { lang, setLang } = useAppPreferences();
    const t = TRANSLATIONS[lang].landing as any;
    const handleGetStarted = onGetStarted || onStart;

    const iframeRef = useRef<HTMLIFrameElement>(null);
    const progressFillRef = useRef<HTMLDivElement>(null);
    const durationRef = useRef<number>(24);
    const [kineticState, setKineticState] = useState<KineticState>({
        t: 0,
        duration: 24,
        playing: true,
        muted: true,
    });

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            const data = event.data;
            if (data && data.type === 'KINETIC_STATE') {
                const dur = typeof data.duration === 'number' && data.duration > 0 ? data.duration : durationRef.current;
                durationRef.current = dur;
                if (typeof data.t === 'number' && progressFillRef.current) {
                    const pct = Math.min(100, Math.max(0, (data.t / dur) * 100));
                    progressFillRef.current.style.width = `${pct.toFixed(2)}%`;
                }
                setKineticState(prev => {
                    const nextPlaying = typeof data.playing === 'boolean' ? data.playing : prev.playing;
                    const nextMuted = typeof data.muted === 'boolean' ? data.muted : prev.muted;
                    if (prev.playing === nextPlaying && prev.muted === nextMuted) {
                        return prev;
                    }
                    return {
                        t: typeof data.t === 'number' ? data.t : prev.t,
                        duration: dur,
                        playing: nextPlaying,
                        muted: nextMuted,
                    };
                });
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    const sendKineticCmd = (cmd: 'toggle-play' | 'toggle-audio' | 'restart' | 'seek', extra?: { t?: number }) => {
        try {
            iframeRef.current?.contentWindow?.postMessage({ type: 'KINETIC_CMD', cmd, ...extra }, '*');
        } catch (_) {}
    };

    const handleScrubBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const dur = durationRef.current;
        if (rect.width <= 0 || dur <= 0) return;
        const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
        if (progressFillRef.current) {
            progressFillRef.current.style.width = `${(ratio * 100).toFixed(2)}%`;
        }
        sendKineticCmd('seek', { t: ratio * dur });
    };

    const handleFullscreen = () => {
        try {
            if (iframeRef.current?.requestFullscreen) {
                iframeRef.current.requestFullscreen();
            }
        } catch (_) {}
    };

    const heroTitle1 = t.heroTitle1 || t.title;
    const heroTitle2 = t.heroTitle2 || t.titleAccent;
    const heroSubtitle = t.heroSubtitle || t.subtitle;

    return (
        <div className="premium-landing fixed inset-0 z-50 overflow-y-auto scroll-container text-white selection:bg-[#C4F13A] selection:text-black font-sans">
            {/* Ambient Background Grid & Glow */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#C4F13A]/[0.06] via-transparent to-transparent" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:48px_48px]" />
            </div>

            {/* Top Header Bar */}
            <header className="sticky top-0 z-40 w-full bg-zinc-950/95 backdrop-blur-md border-b border-white/[0.07]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    {/* Brand lockup */}
                    <div className="flex items-center gap-3">
                        <BrandLogo size={26} className="text-[#C4F13A]" />
                        <span className="font-black tracking-tight text-lg text-white font-display uppercase">
                            REPYNTRA
                        </span>
                        <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-[4px] bg-white/[0.05] border border-white/[0.08] text-[10px] font-mono tracking-wider text-zinc-400 uppercase">
                            PEAK SIGNAL · v4.0
                        </span>
                    </div>

                    {/* Language Switcher & Login */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center bg-[#131316] border border-white/[0.07] rounded-[6px] p-0.5 text-xs font-mono">
                            {(['en', 'es'] as const).map((code) => (
                                <button
                                    key={code}
                                    type="button"
                                    onClick={() => setLang(code)}
                                    className={`px-2.5 py-1 rounded-[4px] uppercase transition-colors ${
                                        code === lang
                                            ? 'bg-[#C4F13A] text-black font-bold'
                                            : 'text-zinc-400 hover:text-white'
                                    }`}
                                >
                                    {code}
                                </button>
                            ))}
                        </div>

                        <button
                            type="button"
                            onClick={onLogin}
                            className="rounded-[6px] px-3.5 py-1.5 text-xs font-mono font-bold tracking-wider uppercase border border-white/[0.12] bg-[#131316] hover:bg-white/[0.06] text-white transition-colors"
                        >
                            {t.login}
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content Layout */}
            <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 md:pt-14 pb-16 flex flex-col min-h-[calc(100vh-4rem)]">
                {/* Hero Section */}
                <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                    {/* Left Column: Industrial Spec & CTAs */}
                    <div className="lg:col-span-5 flex flex-col space-y-6">
                        {/* Industrial Badge */}
                        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-[4px] bg-[#C4F13A]/10 border border-[#C4F13A]/30 text-[#C4F13A] font-mono text-[11px] font-bold uppercase tracking-[0.14em] self-start">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#C4F13A] animate-pulse" />
                            <span>MESOCYCLE ARCHITECTURE · 1:1 RP SPEC</span>
                        </div>

                        {/* Headline */}
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight uppercase leading-[0.95] text-white">
                            {heroTitle1}{' '}
                            <span className="text-[#C4F13A] block sm:inline">{heroTitle2}</span>
                        </h1>

                        {/* Subtitle */}
                        <p className="text-zinc-400 text-sm sm:text-base leading-relaxed max-w-xl">
                            {heroSubtitle}
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                            <button
                                type="button"
                                onClick={handleGetStarted}
                                className="bg-[#C4F13A] hover:bg-[#d2f95b] text-[#09090B] font-black uppercase tracking-[0.08em] rounded-[6px] px-6 py-3.5 text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-[0_0_24px_rgba(196,241,58,0.25)] transition-all active:scale-[0.98]"
                            >
                                <span>{t.getStarted}</span>
                                <Icon name="ArrowRight" size={18} />
                            </button>
                            <button
                                type="button"
                                onClick={onLogin}
                                className="bg-[#131316] hover:bg-zinc-800 border border-white/[0.08] hover:border-white/[0.18] text-[#F2F2F2] font-bold uppercase tracking-[0.08em] rounded-[6px] px-5 py-3.5 text-sm flex items-center justify-center gap-2 transition-colors"
                            >
                                <span>{t.login}</span>
                            </button>
                        </div>

                        {/* Telemetry Metric Callouts */}
                        <div className="pt-4 border-t border-white/[0.06] grid grid-cols-3 gap-3 font-mono text-[10px] text-zinc-400 uppercase tracking-wider">
                            <div>
                                <div className="text-white font-bold tabular-nums text-xs">1:1 RP</div>
                                <span>RIR TARGETS</span>
                            </div>
                            <div>
                                <div className="text-[#C4F13A] font-bold tabular-nums text-xs">AUTO</div>
                                <span>VOLUME ADAPT</span>
                            </div>
                            <div>
                                <div className="text-[#10B981] font-bold tabular-nums text-xs">OFFLINE</div>
                                <span>ZERO LATENCY</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Repyntra Kinetic Film Demo & Live Telemetry Card */}
                    <div className="lg:col-span-7 flex flex-col space-y-3">
                        {/* Repyntra Kinetic Film Player Frame */}
                        <div className="premium-landing-preview border border-white/[0.09] rounded-[6px] overflow-hidden shadow-2xl">
                            {/* Top Status Strip */}
                            <div className="bg-[#131316] border-b border-white/[0.07] px-3 py-2 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-[#C4F13A] animate-pulse" />
                                    <span className="font-mono text-[11px] text-zinc-300 font-bold uppercase tracking-wider">
                                        KINETIC ENGINE · 128 BPM · 60 FPS
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => sendKineticCmd('toggle-play')}
                                        className="text-[10px] font-mono font-bold tracking-wider px-2 py-1 rounded-[4px] premium-landing-input hover:bg-zinc-800 border border-white/[0.08] text-zinc-300 hover:text-white transition-colors"
                                        title="Play or Pause kinetic reel"
                                    >
                                        {kineticState.playing ? 'PAUSE' : 'PLAY'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => sendKineticCmd('toggle-audio')}
                                        className={`text-[10px] font-mono font-bold tracking-wider px-2 py-1 rounded-[4px] border transition-colors ${
                                            !kineticState.muted
                                                ? 'bg-[#C4F13A] text-[#09090B] border-[#C4F13A]'
                                                : 'premium-landing-input hover:bg-zinc-800 border-white/[0.08] text-zinc-300 hover:text-white'
                                        }`}
                                        title="Toggle 128 BPM Synth Soundtrack"
                                    >
                                        {kineticState.muted ? 'SOUND OFF' : 'SOUND ON'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => sendKineticCmd('restart')}
                                        className="text-[10px] font-mono font-bold tracking-wider px-2 py-1 rounded-[4px] premium-landing-input hover:bg-zinc-800 border border-white/[0.08] text-zinc-300 hover:text-white transition-colors"
                                        title="Restart reel from frame 0"
                                    >
                                        RESTART
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleFullscreen}
                                        className="text-[10px] font-mono font-bold tracking-wider px-2 py-1 rounded-[4px] premium-landing-input hover:bg-zinc-800 border border-white/[0.08] text-zinc-300 hover:text-white transition-colors"
                                        title="View Fullscreen"
                                    >
                                        FULLSCREEN
                                    </button>
                                </div>
                            </div>

                            {/* 16:9 Responsive Video Viewport */}
                            <div className="relative aspect-video w-full bg-black overflow-hidden">
                                <iframe
                                    ref={iframeRef}
                                    src="/kinetic-demo/index.html?embed=1"
                                    title="Repyntra Kinetic Demo"
                                    className="w-full h-full border-0 block bg-black"
                                    allow="autoplay; fullscreen"
                                />

                                {/* Interactive #C4F13A Scrub / Progress Bar */}
                                <div
                                    onClick={handleScrubBarClick}
                                    title="Click to seek timeline"
                                    className="absolute bottom-0 left-0 right-0 h-[5px] bg-white/[0.08] hover:h-[7px] cursor-pointer z-10 transition-all"
                                >
                                    <div
                                        ref={progressFillRef}
                                        className="h-full bg-[#C4F13A] transition-[width] duration-100 ease-linear"
                                        style={{ width: '0%' }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Compact RP 1:1 Live Mesocycle Telemetry Strip */}
                        <div className="rounded-[6px] bg-[#131316] border border-white/[0.07] p-3.5 space-y-2.5">
                            {/* Mesocycle Header */}
                            <div className="flex items-center justify-between text-xs font-mono">
                                <div className="flex items-center gap-2">
                                    <span className="px-1.5 py-0.5 rounded-[3px] bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981] text-[10px] font-bold tracking-wider uppercase">
                                        ACCUMULATION
                                    </span>
                                    <span className="text-zinc-200 font-bold tracking-wider">
                                        CHEST &amp; BACK · WEEK 3 · 1 RIR TARGET
                                    </span>
                                </div>
                                <span className="text-[#C4F13A] font-bold tracking-wider tabular-nums">
                                    TARGET RIR: 1
                                </span>
                            </div>

                            {/* Exercise Telemetry Details & Set Matrix */}
                            <div className="rounded-[4px] premium-landing-preview border border-white/[0.05] p-2.5 space-y-2">
                                <div className="flex items-center justify-between text-[11px] font-mono">
                                    <span className="text-white font-bold">
                                        Bench Press (Barbell) · 100 kg × 8 · RIR 1 · +2.5 kg
                                    </span>
                                    <span className="text-zinc-500 tabular-nums">
                                        PROGRESSION MATCHED
                                    </span>
                                </div>

                                <div className="grid grid-cols-12 gap-2 text-[10px] font-mono text-zinc-400 uppercase tracking-wider pb-1 border-b border-white/[0.04]">
                                    <div className="col-span-2 text-center">SET</div>
                                    <div className="col-span-4 text-center">WEIGHT</div>
                                    <div className="col-span-4 text-center">REPS / RIR</div>
                                    <div className="col-span-2 text-center">STATUS</div>
                                </div>

                                {/* Set 1 Warmup */}
                                <div className="grid grid-cols-12 gap-2 items-center text-xs font-mono tabular-nums text-zinc-300">
                                    <div className="col-span-2 text-center">
                                        <span className="px-1.5 py-0.5 rounded-[3px] bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-[10px] font-bold">
                                            W
                                        </span>
                                    </div>
                                    <div className="col-span-4 text-center font-bold">60.0 kg</div>
                                    <div className="col-span-4 text-center text-zinc-400">12 reps · RIR 4</div>
                                    <div className="col-span-2 flex justify-center">
                                        <span className="w-5 h-5 rounded-[4px] bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981] flex items-center justify-center text-[10px] font-bold">
                                            ✓
                                        </span>
                                    </div>
                                </div>

                                {/* Set 2 Completed Work Set */}
                                <div className="grid grid-cols-12 gap-2 items-center text-xs font-mono tabular-nums text-zinc-300">
                                    <div className="col-span-2 text-center">
                                        <span className="px-1.5 py-0.5 rounded-[3px] bg-white/[0.06] text-white border border-white/[0.1] text-[10px] font-bold">
                                            01
                                        </span>
                                    </div>
                                    <div className="col-span-4 text-center font-bold text-white">100.0 kg</div>
                                    <div className="col-span-4 text-center text-[#10B981] font-bold">8 reps · RIR 1</div>
                                    <div className="col-span-2 flex justify-center">
                                        <span className="w-5 h-5 rounded-[4px] bg-[#10B981]/20 border border-[#10B981]/40 text-[#10B981] flex items-center justify-center text-[10px] font-bold shadow-[0_0_8px_rgba(16,185,129,0.3)]">
                                            ✓
                                        </span>
                                    </div>
                                </div>

                                {/* Set 3 Target in Progress */}
                                <div className="grid grid-cols-12 gap-2 items-center text-xs font-mono tabular-nums text-zinc-300 bg-[#C4F13A]/[0.03] rounded-[3px] py-0.5">
                                    <div className="col-span-2 text-center">
                                        <span className="px-1.5 py-0.5 rounded-[3px] bg-[#C4F13A]/20 text-[#C4F13A] border border-[#C4F13A]/40 text-[10px] font-bold">
                                            02
                                        </span>
                                    </div>
                                    <div className="col-span-4 text-center font-bold text-[#C4F13A]">100.0 kg</div>
                                    <div className="col-span-4 text-center text-zinc-300">Target 8 @ RIR 1</div>
                                    <div className="col-span-2 flex justify-center">
                                        <span className="w-5 h-5 rounded-[4px] bg-[#C4F13A]/15 border border-[#C4F13A]/30 text-[#C4F13A] flex items-center justify-center text-[10px] font-bold animate-pulse">
                                            ●
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Grid */}
                <section id="features" className="mt-16 md:mt-24">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-zinc-400 font-mono text-xs font-bold uppercase tracking-[0.2em]">
                            {t.featuresTitle}
                        </h2>
                        <span className="text-zinc-600 font-mono text-[11px] uppercase tracking-wider hidden sm:inline-block">
                            RP HYPERTROPHY ARCHITECTURE
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {t.features?.map((feature: any, i: number) => {
                            const indexStr = `0${i + 1}`;
                            return (
                                <div
                                    key={i}
                                    className="bg-[#131316] border border-white/[0.07] hover:border-[#C4F13A]/40 rounded-[6px] p-5 transition-all group flex flex-col justify-between"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="font-mono text-[#C4F13A] text-xs font-bold tracking-wider">
                                            {indexStr}
                                        </span>
                                        <div className="w-8 h-8 rounded-[4px] bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-[#C4F13A] group-hover:bg-[#C4F13A]/10 group-hover:border-[#C4F13A]/30 transition-colors">
                                            <Icon name={feature.icon || 'Zap'} size={18} />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold text-sm uppercase tracking-wide mb-1.5">
                                            {feature.title}
                                        </h3>
                                        <p className="text-zinc-400 text-xs leading-relaxed">
                                            {feature.desc}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Footer */}
                <footer className="mt-16 md:mt-24 border-t border-white/[0.07] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-zinc-500">
                    <div className="flex items-center gap-2.5">
                        <BrandLogo size={20} className="text-[#C4F13A]" />
                        <span className="font-black text-white uppercase tracking-wider">REPYNTRA</span>
                        <span className="text-zinc-700">·</span>
                        <span className="text-zinc-400">PEAK SIGNAL v4.0</span>
                    </div>
                    <div className="text-zinc-500 text-center sm:text-right">
                        &copy; {new Date().getFullYear()} REPYNTRA HYPERTROPHY LABS · ALL RIGHTS RESERVED
                    </div>
                </footer>
            </main>
        </div>
    );
};
