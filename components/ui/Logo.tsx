import React from 'react';

export interface LogoProps {
    className?: string;
    size?: number;
    variant?: 'icon' | 'lockup';
    alt?: string;
    showText?: boolean;
}

/**
 * Repyntra "Peak Signal" brand mark & lockup.
 * Exact dual ascending polyline geometry matching RepyntraWordmark.kt.
 * Theme-reactive via currentColor & Tailwind semantic tokens.
 */
export const Logo: React.FC<LogoProps> = ({
    className = '',
    size,
    variant,
    alt = 'Repyntra',
    showText,
}) => {
    // Sizing: prioritize explicit `size`, inspect Tailwind `h-XX` from className, or default to 32px
    const parseClassDimension = (classes: string): number | undefined => {
        const match = classes.match(/\bh-(\d+(?:\.\d+)?)\b/);
        if (match) {
            return parseFloat(match[1]) * 4;
        }
        return undefined;
    };

    const effectiveSize = size ?? parseClassDimension(className) ?? 32;

    // Variant: 'lockup' is default. Legacy `showText` also supported for backward-compatibility.
    const isLockup = variant !== undefined
        ? variant === 'lockup'
        : showText !== undefined
            ? Boolean(showText)
            : true;

    const renderPeakSignalSvg = (svgClassName?: string, customSize?: number) => (
        <svg
            viewBox="-6 -6 112 112"
            width={customSize ?? effectiveSize}
            height={customSize ?? effectiveSize}
            role="img"
            aria-label={alt}
            className={svgClassName}
            fill="none"
        >
            {/* RepyntraPeakCompanion (trailing lower stroke, accent lime) */}
            <polyline
                points="0,93 18,93 30,53 42,77 54,35 66,67 78,67 100,25"
                strokeWidth="4.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                className="text-primary-500"
                stroke="currentColor"
            />
            <circle cx="100" cy="25" r="4.2" className="fill-primary-500" />
            {/* RepyntraPeakDominant (leading upper stroke, theme text primary) */}
            <polyline
                points="0,82 18,82 30,40 42,66 54,22 66,56 78,56 100,12"
                strokeWidth="10.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                className="text-[rgb(var(--text-primary))]"
                stroke="currentColor"
            />
            <circle cx="100" cy="12" r="5.5" className="fill-[rgb(var(--text-primary))]" />
        </svg>
    );

    if (!isLockup) {
        return renderPeakSignalSvg(className || undefined);
    }

    // Lockup: strip fixed width/height classes from container so lockup text isn't constrained
    const containerClasses = [
        'inline-flex items-center gap-2 select-none',
        className ? className.replace(/\b[wh]-\S+\b/g, '').trim() : ''
    ].filter(Boolean).join(' ');

    const innerSvgSize = Math.round(effectiveSize * 0.72);

    return (
        <div className={containerClasses}>
            <span
                className="inline-flex shrink-0 items-center justify-center rounded-[8px] border border-primary-500/30 bg-primary-500/10"
                style={{ width: effectiveSize, height: effectiveSize }}
            >
                {renderPeakSignalSvg(undefined, innerSvgSize)}
            </span>
            <span
                className="font-sans font-extrabold tracking-[-0.035em] leading-none"
                style={{ fontSize: Math.round(effectiveSize * 0.68) }}
            >
                <span className="text-[rgb(var(--text-primary))]">Rep</span>
                <span className="text-primary-500">yntra</span>
            </span>
        </div>
    );
};
