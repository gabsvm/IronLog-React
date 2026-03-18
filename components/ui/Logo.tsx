
import React from 'react';

interface LogoProps {
    className?: string;
    size?: number;
}

export const Logo: React.FC<LogoProps> = ({ className = "w-10 h-10", size }) => {
    const style = size ? { width: size, height: size } : {};
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 100 100"
            className={className}
            style={style}
            role="img"
            aria-label="GainsLab Logo"
        >
            <defs>
                <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="100%" stopColor="#991b1b" />
                </linearGradient>
                <filter id="logoShadow" x="-20%" y="-20%" width="140%" height="140%">
                    <stop offset="0%" stopColor="#000" stopOpacity="0.3" />
                </filter>
            </defs>

            {/* Background Ring (Dark Zinc) */}
            <circle cx="50" cy="50" r="48" fill="#18181b" />
            <circle cx="50" cy="50" r="44" fill="#27272a" />

            {/* Core Motif: Minimalist Barbell/Weight Element */}
            <g transform="translate(25, 35)">
                {/* Left Weight */}
                <rect x="0" y="5" width="8" height="20" rx="4" fill="url(#logoGradient)" />
                <rect x="10" y="0" width="6" height="30" rx="3" fill="url(#logoGradient)" opacity="0.8" />

                {/* Center Bar */}
                <rect x="16" y="12" width="18" height="6" rx="3" fill="#ffffff" />

                {/* Right Weight */}
                <rect x="34" y="0" width="6" height="30" rx="3" fill="url(#logoGradient)" opacity="0.8" />
                <rect x="42" y="5" width="8" height="20" rx="4" fill="url(#logoGradient)" />
            </g>

            {/* Text Integrated with stylized 'I' and 'L' hint in background or just clean text */}
            <text
                x="50"
                y="85"
                fontFamily="Inter, sans-serif"
                fontSize="14"
                fontWeight="900"
                fill="#ffffff"
                textAnchor="middle"
                letterSpacing="0.1em"
                style={{ textTransform: 'uppercase' }}
            >
                GainsLab
            </text>
        </svg>
    );
};
