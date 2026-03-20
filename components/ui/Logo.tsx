import React from 'react';

interface LogoProps {
    className?: string;
    size?: number;
    showText?: boolean;
}

/**
 * GainsLab Modern Logo
 * 
 * Features a minimalist hexagonal 'Lab' flask integrated with a 'G' profile,
 * representing the scientific approach to gains.
 * 
 * Uses CSS variables for theme cohesiveness:
 * --primary-500, --primary-600
 */
export const Logo: React.FC<LogoProps> = ({ className = "w-10 h-10", size, showText = false }) => {
    const style = size ? { width: size, height: size } : {};
    
    return (
        <div className={`relative flex items-center gap-2 ${className}`} style={style}>
            <svg
                viewBox="0 0 100 100"
                className="w-full h-full"
                role="img"
                aria-label="GainsLab Logo"
            >
                <defs>
                    <linearGradient id="gainslabGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="rgb(var(--primary-400))" />
                        <stop offset="100%" stopColor="rgb(var(--primary-600))" />
                    </linearGradient>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>

                {/* Hexagonal Background for 'Lab' tech aesthetic */}
                <path
                    d="M50 5 L90 27.5 L90 72.5 L50 95 L10 72.5 L10 27.5 Z"
                    fill="rgb(var(--primary-500))"
                    fillOpacity="0.1"
                    stroke="rgb(var(--primary-500))"
                    strokeWidth="2"
                    className="transition-colors duration-500"
                />

                {/* Core Motif: Stylized 'G' + Beaker Outline */}
                <g transform="translate(50, 50)" filter="url(#glow)">
                    {/* The 'G' Shape / Beaker Body */}
                    <path
                        d="M20 -15 C 25 -10, 25 10, 20 15 C 10 25, -10 25, -20 15 C -25 10, -25 -10, -20 -15 C -15 -20, -5 -20, 0 -20 L 0 -30 M 0 -20 C 5 -20, 15 -20, 20 -15 M 0 0 L 20 0"
                        fill="none"
                        stroke="url(#gainslabGradient)"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    
                    {/* Interior Pulse / Energy */}
                    <circle cx="0" cy="0" r="6" fill="white" className="animate-pulse" />
                </g>
            </svg>
            
            {showText && (
                <span className="text-xl font-black tracking-tighter text-white uppercase italic">
                    Gains<span className="text-[rgb(var(--primary-500))] font-black">Lab</span>
                </span>
            )}
        </div>
    );
};
