import React from 'react';

export interface LogoProps {
    className?: string;
    size?: number;
    variant?: 'icon' | 'lockup';
    alt?: string;
    showText?: boolean;
}

/**
 * MEVRA "Volume Strata M" brand mark & lockup.
 * Four razor-parallel ascending geometric strata representing MEV -> MAV -> MRV.
 * Theme-reactive via Tailwind semantic tokens and CSS variables.
 */
export const Logo: React.FC<LogoProps> = ({
    className = '',
    size,
    variant,
    alt = 'MEVRA',
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

    const renderVolumeStrataSvg = (svgClassName?: string, customSize?: number) => (
        <svg
            viewBox="0 0 100 100"
            width={customSize ?? effectiveSize}
            height={customSize ?? effectiveSize}
            role="img"
            aria-label={alt}
            className={svgClassName}
            fill="none"
        >
            {/* Left diagonal bar (MEV, theme text primary) */}
            <polygon points="13,84 37,40 51,40 27,84" className="fill-[rgb(var(--text-primary))]" />
            {/* Center diagonal lower half (MAV, theme text primary) */}
            <polygon points="35,84 63,32.5 63,58.3 49,84" className="fill-[rgb(var(--text-primary))]" />
            {/* Center diagonal upper peak (MRV, theme primary accent) */}
            <polygon points="63,32.5 72,16 86,16 63,58.3" className="fill-primary-500" />
            {/* Right vertical pillar (theme primary accent) */}
            <polygon points="72,57 86,31.3 86,84 72,84" className="fill-primary-500" />
        </svg>
    );

    if (!isLockup) {
        return renderVolumeStrataSvg(className || undefined);
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
                {renderVolumeStrataSvg(undefined, innerSvgSize)}
            </span>
            <span
                className="font-sans font-extrabold tracking-[0.06em] uppercase leading-none text-[rgb(var(--text-primary))]"
                style={{ fontSize: Math.round(effectiveSize * 0.66) }}
            >
                MEVRA
            </span>
        </div>
    );
};
