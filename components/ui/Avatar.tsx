import React from 'react';
import { Icon } from './Icon';

interface AvatarProps {
    email?: string | null;
    photoURL?: string | null;
    size?: number;
    onClick?: () => void;
    ariaLabel?: string;
}

/**
 * Avatar button — replaces the generic Menu/hamburger.
 * Shows the user's initial (or a User icon if logged out).
 * Used in the top-right of the global header to open the user/settings sheet.
 */
export const Avatar: React.FC<AvatarProps> = ({
    email,
    photoURL,
    size = 44,
    onClick,
    ariaLabel,
}) => {
    const initial = email ? email.trim().charAt(0).toUpperCase() : null;
    const dim = `${size}px`;
    const Element = onClick ? 'button' : 'span';

    const inner = photoURL ? (
        <img
            src={photoURL}
            alt=""
            className="w-full h-full object-cover"
            draggable={false}
        />
    ) : initial ? (
        <span className="font-bold text-[rgb(var(--text-primary))] tracking-tight" style={{ fontSize: size * 0.42 }}>
            {initial}
        </span>
    ) : (
        <Icon name="User" size={Math.round(size * 0.5)} className="text-muted" />
    );

    return (
        <Element
            onClick={onClick}
            aria-label={onClick ? ariaLabel || (email ? `Open account (${email})` : 'Open account') : undefined}
            className={`relative rounded-full flex shrink-0 items-center justify-center bg-surface-elevated active:scale-90 transition-[transform,border-color] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--surface-app))] overflow-hidden
                border border-border-strong hover:border-[rgb(var(--text-muted))]
            `}
            style={{ width: dim, height: dim }}
        >
            <span className="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
                {inner}
            </span>
        </Element>
    );
};
