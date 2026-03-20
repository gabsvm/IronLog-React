
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../constants';
import { Icon } from './Icon';

interface Step {
    targetId: string;
    title: string;
    text: string;
    position?: 'top' | 'bottom' | 'auto';
}

interface TutorialOverlayProps {
    steps: Step[];
    onComplete: () => void;
    isActive: boolean;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ steps, onComplete, isActive }) => {
    const { lang } = useApp();
    const t = TRANSLATIONS[lang];
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [rect, setRect] = useState<DOMRect | null>(null);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        if (!isActive) {
            setCurrentStepIndex(0);
            setRect(null);
            setReady(false);
        } else {
            setTimeout(() => setReady(true), 500);
        }
    }, [isActive]);

    useEffect(() => {
        if (!isActive || !ready) return;

        const updateRect = () => {
            const step = steps[currentStepIndex];
            const el = document.getElementById(step.targetId);
            if (el) {
                setRect(el.getBoundingClientRect());
                el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
            } else {
                handleNext();
            }
        };

        updateRect();
        const doubleCheck = setTimeout(updateRect, 300);
        window.addEventListener('resize', updateRect);
        return () => {
            window.removeEventListener('resize', updateRect);
            clearTimeout(doubleCheck);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentStepIndex, isActive, ready, steps]);

    if (!isActive || !ready) return null;

    const handleNext = () => {
        if (currentStepIndex < steps.length - 1) {
            setCurrentStepIndex(prev => prev + 1);
        } else {
            onComplete();
        }
    };

    const step = steps[currentStepIndex];
    const isLast = currentStepIndex === steps.length - 1;

    // Smart positioning — dock to top if element is in the bottom 40%
    const isDockedTop = rect ? rect.top > window.innerHeight * 0.55 : false;

    const PAD = 6;

    return createPortal(
        <div className="fixed inset-0 z-[9999] pointer-events-auto font-sans touch-none overflow-hidden">

            {/* === BACKDROP WITH HOLE PUNCH === */}
            {rect && (
                <>
                    {/* Top dim */}
                    <div className="absolute top-0 left-0 right-0 bg-black/85 transition-all duration-300" style={{ height: rect.top - PAD }} />
                    {/* Bottom dim */}
                    <div className="absolute left-0 right-0 bottom-0 bg-black/85 transition-all duration-300" style={{ top: rect.bottom + PAD }} />
                    {/* Left dim */}
                    <div className="absolute left-0 bg-black/85 transition-all duration-300" style={{ top: rect.top - PAD, bottom: window.innerHeight - rect.bottom - PAD, width: Math.max(0, rect.left - PAD) }} />
                    {/* Right dim */}
                    <div className="absolute right-0 bg-black/85 transition-all duration-300" style={{ top: rect.top - PAD, bottom: window.innerHeight - rect.bottom - PAD, left: rect.right + PAD }} />

                    {/* Highlight ring */}
                    <div
                        className="absolute rounded-2xl pointer-events-none transition-all duration-300"
                        style={{
                            top: rect.top - PAD,
                            left: rect.left - PAD,
                            width: rect.width + PAD * 2,
                            height: rect.height + PAD * 2,
                            boxShadow: '0 0 0 2px rgba(255,255,255,0.6), 0 0 0 4px rgba(239,68,68,0.4)',
                        }}
                    >
                        {/* Pulsing corner dots */}
                        {[...Array(4)].map((_, i) => (
                            <div
                                key={i}
                                className="absolute w-2 h-2 rounded-full bg-red-500 animate-ping"
                                style={{
                                    top: i < 2 ? -4 : 'auto',
                                    bottom: i >= 2 ? -4 : 'auto',
                                    left: i % 2 === 0 ? -4 : 'auto',
                                    right: i % 2 === 1 ? -4 : 'auto',
                                    animationDelay: `${i * 150}ms`,
                                }}
                            />
                        ))}
                    </div>
                </>
            )}

            {/* === TOOLTIP CARD === */}
            <div
                className={`
                    absolute left-4 right-4 max-w-sm mx-auto z-10
                    bg-zinc-950 border border-white/10 rounded-3xl shadow-2xl shadow-black/80
                    transition-all duration-400
                    ${isDockedTop
                        ? 'top-[calc(env(safe-area-inset-top)+72px)] animate-in slide-in-from-top-4'
                        : 'bottom-[calc(env(safe-area-inset-bottom)+100px)] animate-in slide-in-from-bottom-4'}
                `}
            >
                {/* Step counter pill */}
                <div className="flex items-center justify-between px-5 pt-5 pb-0">
                    <div className="flex items-center gap-1.5">
                        {steps.map((_, idx) => (
                            <div
                                key={idx}
                                className={`h-1 rounded-full transition-all duration-300 ${
                                    idx === currentStepIndex
                                        ? 'w-5 bg-red-500'
                                        : idx < currentStepIndex
                                        ? 'w-3 bg-white/30'
                                        : 'w-2 bg-white/10'
                                }`}
                            />
                        ))}
                    </div>
                    <span className="text-[9px] font-black tracking-widest text-zinc-500 uppercase">
                        {currentStepIndex + 1} / {steps.length}
                    </span>
                </div>

                {/* Content */}
                <div className="px-5 pt-4 pb-5">
                    <h3 className="font-black text-lg text-white tracking-tight leading-tight mb-2">
                        {step.title}
                    </h3>
                    <p className="text-sm text-zinc-300 leading-relaxed font-medium mb-5">
                        {step.text}
                    </p>

                    <div className="flex items-center justify-between gap-3">
                        <button
                            onClick={onComplete}
                            className="text-xs font-bold text-zinc-500 hover:text-zinc-300 transition-colors uppercase tracking-widest py-2 px-1"
                        >
                            {t.onb.skip}
                        </button>

                        <button
                            onClick={handleNext}
                            className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-2xl text-sm font-black shadow-lg shadow-red-600/30 transition-all active:scale-95"
                        >
                            {isLast ? t.tutorial.finish : t.tutorial.next}
                            {!isLast && <Icon name="ArrowRight" size={15} />}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
