import React from 'react';
import { Icon } from './Icon';

interface AvatarProps {
    email?: string | null;
    photoURL?: string | null;
    isPro?: boolean;
    size?: number;
    onClick?: () => void;
    ariaLabel?: string;
}

/**
 * Avatar button — replaces the generic Menu/hamburger.
 * Shows the user's initial (or a User icon if logged out) and an optional PRO crown.
 * Used in the top-right of the global header to open the user/settings sheet.
 */
export const Avatar: React.FC<AvatarProps> = ({
    email,
    photoURL,
    isPro = false,
    size = 40,
    onClick,
    ariaLabel,
}) => {
    const initial = email ? email.trim().charAt(0).toUpperCase() : null;
    const dim = `${size}px`;

    const inner = photoURL ? (
        <img
            src={photoURL}
            alt=""
            className="w-full h-full object-cover"
            draggable={false}
        />
    ) : initial ? (
        <span className="font-bold text-white tracking-tight" style={{ fontSize: size * 0.42 }}>
            {initial}
        </span>
    ) : (
        <Icon name="User" size={Math.round(size * 0.5)} className="text-zinc-400" />
    );

    return (
        <button
            onClick={onClick}
            aria-label={ariaLabel || (email ? `Open account (${email})` : 'Open account')}
            className={`relative rounded-full flex items-center justify-center bg-gradient-to-br from-zinc-700 to-zinc-900 active:scale-90 transition-[transform,border-color] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black overflow-hidden
                ${isPro ? 'border-2 border-amber-500/80 shadow-[0_0_10px_rgba(245,158,11,0.35)]' : 'border border-zinc-700 hover:border-zinc-500'}
            `}
            style={{ width: dim, height: dim }}
        >
            <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
                {inner}
            </div>
            {isPro && (
                <span
                    className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-[0_0_8px_rgba(251,146,60,0.6)] ring-2 ring-black"
                    aria-label="PRO member"
                >
                    <Icon name="Crown" size={9} className="text-white" />
                </span>
            )}
        </button>
    );
};
