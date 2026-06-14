
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
    children, variant = 'primary', size = 'md', fullWidth = false, className = '', ...props 
}) => {
    const base = "font-bold rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black";
    
    const variants = {
        // primary: RP Hypertrophy lime CTA — every <Button> defaults to this, so it
        // MUST match the brand. Previously was bg-white/text-black, which made every
        // CTA across SessionSummary, NutriView, ProgramEdit, ConfirmModal etc.
        // appear as a generic white pill instead of the brand color.
        primary: "bg-primary-500 text-black hover:bg-primary-400 shadow-[0_0_20px_rgb(var(--primary-500)/0.25)] border border-transparent focus:ring-primary-500",
        secondary: "bg-zinc-800 text-white border border-zinc-700 hover:bg-zinc-700 focus:ring-zinc-600",
        danger: "bg-red-900/20 text-red-500 border border-red-500/50 hover:bg-red-500 hover:text-white focus:ring-red-500",
        ghost: "text-zinc-400 hover:text-white hover:bg-white/5",
        outline: "border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 border-dashed"
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
