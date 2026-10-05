// U5: circular countdown ring, moved verbatim from components/ui/RestTimerOverlay.tsx.
import React from 'react';
import { TRANSLATIONS } from '../../../constants';
import { TIMER_RING_RADIUS, TIMER_RING_CIRCUMFERENCE, calculateRingDashOffset } from './restTimerLogic';

export const CircularTimer: React.FC<{
    percentage: number;
    timeLeft: number;
    totalDuration: number;
    lang: 'en' | 'es';
    reducedEffects?: boolean;
}> = ({ percentage, timeLeft, totalDuration, lang, reducedEffects }) => {
    const tm = TRANSLATIONS[lang].timer;
    const size = 170;
    const strokeWidth = 7;
    const radius = TIMER_RING_RADIUS;
    const circumference = TIMER_RING_CIRCUMFERENCE;
    const dashOffset = calculateRingDashOffset(percentage, circumference);

    const formatSeconds = (seconds: number) => {
        const safe = Math.max(0, Math.floor(Number(seconds) || 0));
        return `${Math.floor(safe / 60)}:${(safe % 60).toString().padStart(2, '0')}`;
    };

    return (
        <div className="relative flex items-center justify-center mx-auto my-2" style={{ width: size, height: size }}>
            <svg viewBox="0 0 120 120" width={size} height={size}>
                <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="none"
                    stroke="#212125"
                    strokeWidth={strokeWidth}
                />
                <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="none"
                    stroke="rgb(var(--primary-500))"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    transform="rotate(-90 60 60)"
                    style={{ transition: reducedEffects ? 'none' : 'stroke-dashoffset 1s linear' }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-mono text-4xl font-semibold text-white tabular-nums tracking-tight">
                    {formatSeconds(timeLeft)}
                </span>
                <span className="text-xs text-muted mt-0.5">
                    {`${tm.ofWord} ${formatSeconds(totalDuration)}`}
                </span>
            </div>
        </div>
    );
};
