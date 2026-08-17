import React, { useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../constants';
import { Icon } from './Icon';

interface PRCelebrationOverlayProps {
    onDismiss: () => void;
}

export const PRCelebrationOverlay: React.FC<PRCelebrationOverlayProps> = ({ onDismiss }) => {
    const { lang } = useApp();
    const t = TRANSLATIONS[lang];
    const cardRef = useRef<HTMLDivElement>(null);
    const [isSharing, setIsSharing] = useState(false);

    const handleShare = async () => {
        try {
            setIsSharing(true);
            if (!(window as any).html2canvas) {
                await new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
                    script.onload = resolve;
                    script.onerror = reject;
                    document.head.appendChild(script);
                });
            }
            if (!cardRef.current) return;
            const h2c = (window as any).html2canvas;
            const canvas = await h2c(cardRef.current, {
                backgroundColor: '#111113',
                scale: 3,
                useCORS: true,
                logging: false,
            });
            canvas.toBlob(async (blob: Blob | null) => {
                if (!blob) return;
                const file = new File([blob], 'gainslab-pr.png', { type: 'image/png' });
                const shareData = {
                    title: lang === 'es' ? 'Nuevo récord' : 'New PR',
                    text: lang === 'es' ? 'Nuevo PR en GainsLab.' : 'New PR in GainsLab.',
                    files: [file],
                };
                if (navigator.canShare?.(shareData)) {
                    await navigator.share(shareData);
                } else {
                    const url = URL.createObjectURL(blob);
                    const anchor = document.createElement('a');
                    anchor.href = url;
                    anchor.download = 'gainslab-pr.png';
                    anchor.click();
                    URL.revokeObjectURL(url);
                }
            }, 'image/png');
        } catch (error) {
            console.error('Share failed', error);
        } finally {
            setIsSharing(false);
        }
    };

    return (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-celebration px-3 pb-[calc(env(safe-area-inset-bottom)+0.7rem)]" role="status" aria-live="polite">
            <div className="pointer-events-auto mx-auto max-w-md overflow-hidden rounded-2xl border border-amber-500/20 bg-[rgb(var(--surface-raised)/0.98)] shadow-[0_18px_48px_rgba(0,0,0,0.42)] backdrop-blur-xl">
                <div ref={cardRef} className="flex items-center gap-3 bg-[#111113] px-4 py-3.5 text-white">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/12 text-amber-400">
                        <Icon name="Trophy" size={21} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="text-[9px] font-black uppercase tracking-[0.1em] text-amber-400">{lang === 'es' ? 'Nuevo récord personal' : 'New personal record'}</div>
                        <div className="mt-0.5 truncate text-sm font-black">{t.prMessage}</div>
                        <div className="mt-0.5 text-[9px] font-semibold text-zinc-500">GainsLab</div>
                    </div>
                </div>

                <div className="grid grid-cols-2 border-t border-[rgb(var(--border-subtle)/0.7)]">
                    <button type="button" onClick={handleShare} disabled={isSharing} className="flex min-h-11 items-center justify-center gap-1.5 text-xs font-bold text-[rgb(var(--text-secondary))] disabled:opacity-50 active:bg-[rgb(var(--surface-base))]">
                        <Icon name="Share2" size={14} /> {isSharing ? (lang === 'es' ? 'Preparando…' : 'Preparing…') : (lang === 'es' ? 'Compartir' : 'Share')}
                    </button>
                    <button type="button" onClick={onDismiss} className="min-h-11 border-l border-[rgb(var(--border-subtle)/0.7)] text-xs font-black text-primary-500 active:bg-primary-500/10">
                        {t.continue}
                    </button>
                </div>
            </div>
        </div>
    );
};
