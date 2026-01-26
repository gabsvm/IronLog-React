
import React from 'react';

interface LogoProps {
    className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = "w-10 h-10" }) => {
    return (
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 100 100" 
            className={className}
            role="img"
            aria-label="IronLog Logo"
        >
            {/* Outer Ring (Dark Grey) */}
            <circle cx="50" cy="50" r="50" fill="#3f3f46" />
            
            {/* Inner Circle (White) */}
            <circle cx="50" cy="50" r="44" fill="#ffffff" />

            {/* Geometric Graphic (Zinc 800) */}
            <g fill="#27272a">
                {/* Left Small Vertical Bar */}
                <rect x="24" y="42" width="10" height="20" rx="5" />
                
                {/* Middle Tall Vertical Bar */}
                <rect x="38" y="30" width="10" height="32" rx="5" />
                
                {/* Right Horizontal Bar */}
                <rect x="52" y="42" width="26" height="10" rx="5" />
            </g>

            {/* Text Label */}
            <text 
                x="50" 
                y="78" 
                fontFamily="sans-serif" 
                fontSize="15" 
                fontWeight="900" 
                fill="#27272a" 
                textAnchor="middle" 
                letterSpacing="-0.5"
            >
                IronLog
            </text>
        </svg>
    );
};
