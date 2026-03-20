
import React, { useEffect } from 'react';
import { Icon } from './Icon';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    fullScreen?: boolean;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer, fullScreen = false }) => {
    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'unset';
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        /* z-[500] ensures this is above the nav bar (z-30) AND any header (z-20) */
        <div className="fixed inset-0 z-[500] flex items-end sm:items-center justify-center animate-in fade-in duration-300">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/75 backdrop-blur-sm"
                onClick={onClose}
            />
            
            {/* Bottom-sheet panel — mb-[88px] clears the floating nav island on mobile */}
            <div className={`
                relative bg-zinc-50 dark:bg-[#0f0f0f] w-full mb-[88px] sm:mb-0
                ${fullScreen ? 'h-full mb-0' : 'max-h-[78vh] sm:max-h-[90vh] sm:max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl'}
                border-t sm:border border-zinc-200/50 dark:border-white/10
                flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 duration-400
            `}>
                {/* Drag Handle – mobile only */}
                <div className="sm:hidden flex justify-center pt-3 flex-shrink-0">
                    <div className="w-10 h-1 rounded-full bg-zinc-300 dark:bg-white/20" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-8 py-5 border-b border-zinc-200 dark:border-white/5 flex-shrink-0">
                    <h2 className="text-xl font-black tracking-tight text-zinc-900 dark:text-white uppercase">
                        {title}
                    </h2>
                    <button 
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-200 dark:bg-white/5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors active:scale-90"
                    >
                        <Icon name="X" size={20} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-8 pt-6 pb-4 scroll-container">
                    {children}
                </div>

                {/* Sticky Footer – always visible, renders at the bottom of the panel */}
                {footer && (
                    <div className="flex-shrink-0 px-8 py-5 bg-zinc-50 dark:bg-[#0f0f0f] border-t border-zinc-100 dark:border-white/5">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};
