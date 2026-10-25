import React from 'react';

interface LogoProps {
    className?: string;
    size?: number;
    showText?: boolean;
}

/**
 * Repyntra brand mark featuring the Peak Signal icon on a deep navy background (#071424),
 * paired with the distinctive Repyntra gradient wordmark.
 */
export const Logo: React.FC<LogoProps> = ({ className = "w-10 h-10", size, showText = false }) => {
    const style: React.CSSProperties = {
        backgroundColor: '#071424',
        ...(size ? { width: size, height: size } : {}),
    };

    return (
        <div className="relative inline-flex shrink-0 items-center gap-2.5">
            <div
                className={`relative inline-flex shrink-0 items-center justify-center rounded-[24%] shadow-sm transition-colors duration-200 overflow-hidden ring-1 ring-white/10 ${className}`}
                style={style}
            >
                <img
                    src="/assets/branding/repyntra-glyph.png"
                    className="w-full h-full object-contain pointer-events-none p-1"
                    alt="Repyntra"
                    draggable={false}
                />
            </div>

            {showText && (
                <span className="whitespace-nowrap text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                    Rep<span className="bg-gradient-to-r from-[#972BFF] to-[#00E5DB] bg-clip-text text-transparent font-extrabold">yntra</span>
                </span>
            )}
        </div>
    );
};
