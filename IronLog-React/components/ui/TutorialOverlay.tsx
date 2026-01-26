
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

    // Reset internal state if activation changes
    useEffect(() => {
        if (!isActive) {
            setCurrentStepIndex(0);
            setRect(null);
            setReady(false);
        } else {
            // Small delay to allow UI to render/settle before measuring
            setTimeout(() => setReady(true), 500);
        }
    }, [isActive]);

    // Update rect when step changes or window resizes
    useEffect(() => {
        if (!isActive || !ready) return;

        const updateRect = () => {
            const step = steps[currentStepIndex];
            const el = document.getElementById(step.targetId);
            if (el) {
                const r = el.getBoundingClientRect();
                setRect(r);
                // Ensure element is scrolled into view with padding
                el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
            } else {
                console.warn(`Tutorial target #${step.targetId} not found`);
                // Auto-skip if target missing
                handleNext();
            }
        };

        // Initial measure
        updateRect();
        
        // Measure again after a slight delay to account for scrolling/layout shifts
        const doubleCheck = setTimeout(updateRect, 300);

        window.addEventListener('resize', updateRect);
        return () => {
            window.removeEventListener('resize', updateRect);
            clearTimeout(doubleCheck);
        };
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

    // --- SMART POSITIONING ENGINE (DOCKED CARD) ---
    // Instead of placing next to element, we dock to bottom (default) or top (if element is at bottom)
    let isDockedTop = false;
    
    if (rect) {
        const viewportHeight = window.innerHeight;
        // If the target element is in the bottom 40% of the screen, move card to top to avoid covering it
        // Or if the element takes up the whole screen (height > 60%), default to bottom
        const isTargetLow = rect.top > (viewportHeight * 0.6);
        const isTargetHuge = rect.height > (viewportHeight * 0.7);
        
        if (isTargetLow && !isTargetHuge) {
            isDockedTop = true;
        }
    }

    return createPortal(
        <div className="fixed inset-0 z-[9999] pointer-events-auto font-sans touch-none overflow-hidden">
            {/* Backdrop Logic (The "Hole Punch" Effect) */}
            {rect && (
                <>
                    {/* Top Dim */}
                    <div className="absolute top-0 left-0 right-0 bg-black/80 backdrop-blur-[2px] transition-all duration-300 ease-out" style={{ height: rect.top }} />
                    {/* Bottom Dim */}
                    <div className="absolute left-0 right-0 bottom-0 bg-black/80 backdrop-blur-[2px] transition-all duration-300 ease-out" style={{ top: rect.bottom }} />
                    {/* Left Dim */}
                    <div className="absolute left-0 bg-black/80 backdrop-blur-[2px] transition-all duration-300 ease-out" style={{ top: rect.top, bottom: window.innerHeight - rect.bottom, width: rect.left }} />
                    {/* Right Dim */}
                    <div className="absolute right-0 bg-black/80 backdrop-blur-[2px] transition-all duration-300 ease-out" style={{ top: rect.top, bottom: window.innerHeight - rect.bottom, left: rect.right }} />
                    
                    {/* Highlight Border & Pulsing Ring */}
                    <div 
                        className="absolute border-2 border-white/50 rounded-xl transition-all duration-300 ease-out pointer-events-none"
                        style={{
                            top: rect.top - 4,
                            left: rect.left - 4,
                            width: rect.width + 8,
                            height: rect.height + 8,
                        }}
                    >
                        {/* Pulsing Outer Ring */}
                        <div className="absolute inset-0 -m-1 border-2 border-red-500/50 rounded-xl animate-ping opacity-75"></div>
                    </div>
                </>
            )}

            {/* Docked Tooltip Card */}
            <div 
                className={`
                    absolute left-4 right-4 max-w-md mx-auto
                    bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-2xl border border-zinc-200 dark:border-white/10 
                    transition-all duration-500 ease-out
                    ${isDockedTop ? 'top-24 animate-in slide-in-from-top-4' : 'bottom-8 animate-in slide-in-from-bottom-4'}
                `}
            >
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-black text-lg text-zinc-900 dark:text-white tracking-tight leading-tight pr-4">{step.title}</h3>
                    <span className="text-[9px] font-bold bg-zinc-100 dark:bg-white/10 text-zinc-500 dark:text-zinc-400 px-2 py-1 rounded-full shrink-0">
                        {currentStepIndex + 1} / {steps.length}
                    </span>
                </div>
                
                <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-6 leading-relaxed font-medium">
                    {step.text}
                </p>

                <div className="flex justify-between items-center">
                    <button 
                        onClick={onComplete}
                        className="text-xs font-bold text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors px-2 py-2 uppercase tracking-wider"
                    >
                        {t.onb.skip}
                    </button>
                    <button 
                        onClick={handleNext}
                        className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-600/20 transition-transform active:scale-95 flex items-center gap-2"
                    >
                        {isLast ? t.tutorial.finish : t.tutorial.next}
                        {!isLast && <Icon name="ArrowRight" size={16} />}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
