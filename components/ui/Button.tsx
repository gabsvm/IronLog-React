
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
    children, variant = 'primary', size = 'md', fullWidth = false, className = '', ...props 
}) => {
    const base = "font-semibold rounded-xl transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-text))] focus-visible:ring-offset-2 focus-visible:ring-offset-surface-app min-h-[44px]";
    
    const variants = {
        // primary: RP Hypertrophy lime CTA — every <Button> defaults to this, so it
        // MUST match the brand. Previously was bg-white/text-black, which made every
        // CTA across SessionSummary, NutriView, ProgramEdit, ConfirmModal etc.
        // appear as a generic white pill instead of the brand color.
        primary: "bg-primary-500 text-[rgb(var(--accent-ink))] hover:bg-primary-400 shadow-sm border border-transparent",
        secondary: "bg-[rgb(var(--surface-elevated))] text-[rgb(var(--text-primary))] border border-[rgb(var(--border-subtle))] hover:bg-primary-500/10",
        danger: "bg-red-500/10 text-red-700 dark:text-red-400 border border-red-700/50 dark:border-red-400/50 hover:bg-red-700 hover:text-white",
        ghost: "text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--surface-elevated))]",
        outline: "bg-transparent hover:bg-surface-elevated text-[rgb(var(--text-primary))] border border-border-strong"
    };
    
    const sizes = {
        sm: "px-4 py-2 text-xs",
        md: "px-5 py-3 text-sm",
        lg: "px-6 py-4 text-base tracking-wide"
    };

    return (
        <button 
            className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};
