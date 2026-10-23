import React from 'react';

interface LogoProps {
    className?: string;
    size?: number;
    showText?: boolean;
}

/**
 * GainsLab brand mark with theme-adaptive background container and dark glyph.
 * Ensures the mark stays synchronized with active theme colors (RP Lime, Forest, Ocean, Royal, Sunset).
 */
export const Logo: React.FC<LogoProps> = ({ className = "w-10 h-10", size, showText = false }) => {
    const style = size ? { width: size, height: size } : {};

    return (
        <div className="relative inline-flex shrink-0 items-center gap-2.5">
            <div
                className={`relative inline-flex shrink-0 items-center justify-center rounded-[24%] bg-[rgb(var(--primary-500))] shadow-sm transition-colors duration-200 overflow-hidden ${className}`}
                style={style}
            >
                <img
                    src="/assets/branding/gainslab-glyph.png"
                    className="w-full h-full object-contain pointer-events-none"
                    alt="GainsLab"
                    draggable={false}
                />
            </div>

            {showText && (
                <span className="whitespace-nowrap text-xl font-black tracking-tighter text-zinc-900 dark:text-white uppercase italic">
                    Gains<span className="text-[rgb(var(--accent-text))] font-black transition-colors duration-200">Lab</span>
                </span>
            )}
        </div>
    );
};
