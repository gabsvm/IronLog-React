import React, { useEffect, useState } from 'react';
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

/**
 * Contextual coachmark rather than a blocking tutorial takeover.
 * The underlying screen remains readable and interactive; we only outline the
 * relevant control and explain it at the edge of the viewport. This keeps first
 * use discoverable without forcing users through a modal slideshow.
 */
export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ steps, onComplete, isActive }) => {
    const { lang } = useApp();
    const t = TRANSLATIONS[lang];
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [rect, setRect] = useState<DOMRect | null>(null);
    const [ready, setReady] = useState(false);

    const handleNext = () => {
        if (currentStepIndex < steps.length - 1) setCurrentStepIndex(prev => prev + 1);
        else onComplete();
    };

    useEffect(() => {
        if (!isActive) {
            setCurrentStepIndex(0);
            setRect(null);
            setReady(false);
            return;
        }
        const timer = window.setTimeout(() => setReady(true), 350);
        return () => window.clearTimeout(timer);
    }, [isActive]);

    useEffect(() => {
        if (!isActive || !ready || steps.length === 0) return;
        const step = steps[currentStepIndex];
        if (!step) {
            onComplete();
            return;
        }

        const updateRect = () => {
            const el = document.getElementById(step.targetId);
            if (!el) {
                handleNext();
                return;
            }
            setRect(el.getBoundingClientRect());
            el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        };

        updateRect();
        const doubleCheck = window.setTimeout(updateRect, 250);
        window.addEventListener('resize', updateRect);
        window.addEventListener('scroll', updateRect, true);
        return () => {
            window.clearTimeout(doubleCheck);
            window.removeEventListener('resize', updateRect);
            window.removeEventListener('scroll', updateRect, true);
        };
        // `handleNext` intentionally follows the current index without becoming
        // an effect dependency that would continuously rebind scroll listeners.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentStepIndex, isActive, ready, steps, onComplete]);

    if (!isActive || !ready || !steps[currentStepIndex]) return null;

    const step = steps[currentStepIndex];
    const isLast = currentStepIndex === steps.length - 1;
    const preferTop = step.position === 'top' || (step.position !== 'bottom' && !!rect && rect.top > window.innerHeight * 0.52);
    const pad = 5;

    return createPortal(
        <div className="pointer-events-none fixed inset-0 z-tutorial font-sans">
            {rect && (
                <div
                    className="pointer-events-none absolute rounded-xl border-2 border-primary-500/70 bg-primary-500/[0.025] shadow-[0_0_0_4px_rgb(var(--primary-500)/0.08)] transition-all duration-200"
                    style={{
                        top: Math.max(2, rect.top - pad),
                        left: Math.max(2, rect.left - pad),
                        width: Math.min(window.innerWidth - 4, rect.width + pad * 2),
                        height: rect.height + pad * 2,
                    }}
                />
            )}

            <div
                className={`pointer-events-auto absolute left-3 right-3 mx-auto max-w-sm overflow-hidden rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised)/0.97)] shadow-[0_14px_42px_rgba(0,0,0,0.3)] backdrop-blur-xl ${preferTop ? 'top-[calc(env(safe-area-inset-top)+68px)]' : 'bottom-[calc(env(safe-area-inset-bottom)+88px)]'}`}
                role="dialog"
                aria-label={step.title}
            >
                <div className="h-1 bg-[rgb(var(--surface-elevated))]">
                    <div className="h-full bg-primary-500 transition-all duration-200" style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }} />
                </div>

                <div className="p-4">
                    <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-500/10 text-primary-500">
                            <Icon name="Info" size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-3">
                                <h3 className="text-sm font-black tracking-tight text-[rgb(var(--text-primary))]">{step.title}</h3>
                                <span className="shrink-0 text-[9px] font-bold tabular-nums text-[rgb(var(--text-muted))]">{currentStepIndex + 1}/{steps.length}</span>
                            </div>
                            <p className="mt-1 text-xs leading-relaxed text-[rgb(var(--text-secondary))]">{step.text}</p>
                        </div>
                    </div>

                    <div className="mt-3 flex items-center justify-end gap-2">
                        <button type="button" onClick={onComplete} className="min-h-9 rounded-lg px-3 text-[11px] font-bold text-[rgb(var(--text-muted))] active:bg-[rgb(var(--surface-base))]">
                            {t.onb.skip}
                        </button>
                        <button type="button" onClick={handleNext} className="flex min-h-9 items-center gap-1.5 rounded-lg bg-primary-500 px-3.5 text-[11px] font-black text-black active:scale-95">
                            {isLast ? t.tutorial.finish : t.tutorial.next}
                            {!isLast && <Icon name="ArrowRight" size={13} />}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
