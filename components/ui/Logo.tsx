import React from 'react';

interface LogoProps {
    className?: string;
    size?: number;
    showText?: boolean;
}

/**
 * Repyntra brand mark sourced from the original brand assets.
 * Keep the mark as an image so the in-app logo and native launcher use the
 * same artwork instead of a second, theme-dependent SVG recreation.
 */
export const Logo: React.FC<LogoProps> = ({ className = "w-10 h-10", size, showText = false }) => {
    const style = size ? { width: size, height: size } : {};

    return (
        <div className="relative inline-flex shrink-0 items-center gap-2">
            <img
                src="/assets/branding/repyntra-icon.png"
                className={className}
                style={style}
                alt="Repyntra"
                draggable={false}
            />

            {showText && (
                <span className="whitespace-nowrap text-xl font-black tracking-tighter text-zinc-900 dark:text-white uppercase italic">
                    Rep<span className="text-[rgb(var(--primary-500))] font-black">yntra</span>
                </span>
            )}
        </div>
    );
};
