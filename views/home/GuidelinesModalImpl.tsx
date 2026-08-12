import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '../../components/ui/Icon';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    images?: string[];
}

/**
 * Full-screen viewer for program guideline images.
 * Supports double-tap zoom, drag-to-pan, and keyboard-free swipe between pages.
 * Extracted from HomeView to keep that view focused on dashboard composition.
 */
export const GuidelinesModal: React.FC<Props> = ({ isOpen, onClose, images }) => {
    const [idx, setIdx] = useState(0);
    const [scale, setScale] = useState(1);
    const [pos, setPos] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const startPos = useRef({ x: 0, y: 0 });

    const resetZoom = () => {
        setScale(1);
        setPos({ x: 0, y: 0 });
    };

    // Reset state when opening or changing page
    useEffect(() => {
        if (isOpen) {
            setIdx(0);
            resetZoom();
        }
    }, [isOpen]);

    useEffect(() => {
        resetZoom();
    }, [idx]);

    if (!isOpen || !images || images.length === 0) return null;

    const currentImg = images[idx];
    const hasNext = idx < images.length - 1;
    const hasPrev = idx > 0;

    const handleDoubleTap = () => {
        if (scale > 1) {
            resetZoom();
        } else {
            setScale(2.5);
            setPos({ x: 0, y: 0 });
        }
    };

    const onTouchStart = (e: React.TouchEvent) => {
        if (scale === 1) return;
        setIsDragging(true);
        startPos.current = {
            x: e.touches[0].clientX - pos.x,
            y: e.touches[0].clientY - pos.y,
        };
    };

    const onTouchMove = (e: React.TouchEvent) => {
        if (!isDragging || scale === 1) return;
        e.preventDefault();
        const x = e.touches[0].clientX - startPos.current.x;
        const y = e.touches[0].clientY - startPos.current.y;
        setPos({ x, y });
    };

    const onTouchEnd = () => setIsDragging(false);

    return (
        <div className="fixed inset-0 z-confirm bg-black flex flex-col animate-in fade-in duration-slow" role="dialog" aria-modal="true" aria-label="Guidelines viewer">
            {/* Header with Zoom Controls */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-50 bg-gradient-to-b from-black/90 to-transparent pt-safe">
                <h3 className="text-white font-black text-lg uppercase flex items-center gap-2 drop-shadow-md">
                    <Icon name="Info" size={20} className="text-blue-500" /> Guidelines
                </h3>
                <div className="flex gap-3">
                    <button
                        onClick={() => setScale((s) => Math.max(1, s - 0.5))}
                        aria-label="Zoom out"
                        className="w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center border border-white/10 backdrop-blur-md active:bg-zinc-800"
                    >
                        <Icon name="Minus" size={20} />
                    </button>
                    <button
                        onClick={() => setScale((s) => Math.min(4, s + 0.5))}
                        aria-label="Zoom in"
                        className="w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center border border-white/10 backdrop-blur-md active:bg-zinc-800"
                    >
                        <Icon name="Plus" size={20} />
                    </button>
                    <div className="w-px h-6 bg-white/20 mx-1" />
                    <button
                        onClick={onClose}
                        aria-label="Close"
                        className="w-10 h-10 rounded-full bg-zinc-800 text-white flex items-center justify-center hover:bg-zinc-700 border border-white/10 shadow-lg"
                    >
                        <Icon name="X" size={24} />
                    </button>
                </div>
            </div>

            {/* Image Viewer Container */}
            <div
                className="flex-1 overflow-hidden relative flex items-center justify-center touch-none bg-zinc-950"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                onDoubleClick={handleDoubleTap}
            >
                <img
                    src={currentImg}
                    alt={`Page ${idx + 1}`}
                    className="max-w-none transition-transform duration-100 ease-out select-none pointer-events-none"
                    style={{
                        transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
                        width: '100%',
                        height: 'auto',
                        maxHeight: '100%',
                        objectFit: 'contain',
                    }}
                />
            </div>

            {/* Navigation Controls */}
            {images.length > 1 && (
                <div className="absolute bottom-24 left-0 right-0 flex justify-center items-center gap-6 z-50 pointer-events-none pb-safe">
                    <button
                        onClick={() => setIdx((i) => Math.max(0, i - 1))}
                        disabled={!hasPrev}
                        aria-label="Previous page"
                        className={`pointer-events-auto w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-xl border transition-all shadow-2xl ${hasPrev ? 'bg-zinc-900 text-white border-zinc-700 active:scale-95 hover:bg-zinc-800' : 'bg-zinc-900/50 text-zinc-600 border-zinc-800/50'}`}
                    >
                        <Icon name="ChevronLeft" size={28} />
                    </button>

                    <span className="text-sm font-black text-white bg-zinc-900 px-4 py-2 rounded-full backdrop-blur-xl border border-zinc-700 shadow-2xl min-w-[80px] text-center">
                        {idx + 1} / {images.length}
                    </span>

                    <button
                        onClick={() => setIdx((i) => Math.min(images.length - 1, i + 1))}
                        disabled={!hasNext}
                        aria-label="Next page"
                        className={`pointer-events-auto w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-xl border transition-all shadow-2xl ${hasNext ? 'bg-zinc-900 text-white border-zinc-700 active:scale-95 hover:bg-zinc-800' : 'bg-zinc-900/50 text-zinc-600 border-zinc-800/50'}`}
                    >
                        <Icon name="ChevronRight" size={28} />
                    </button>
                </div>
            )}

            {/* Helper Text */}
            <div className="absolute bottom-10 left-0 right-0 text-center pointer-events-none z-40 opacity-60 pb-safe">
                <p className="text-[10px] text-white font-bold uppercase tracking-widest bg-black/40 inline-block px-3 py-1.5 rounded-full backdrop-blur border border-white/5">
                    Double tap to zoom • Drag to pan
                </p>
            </div>
        </div>
    );
};
