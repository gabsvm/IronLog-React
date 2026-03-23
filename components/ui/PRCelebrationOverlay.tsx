
import React, { useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../constants';
import { Button } from './Button';
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

            // Add temp styling for screenshot
            cardRef.current.classList.add('bg-zinc-950', 'p-8', 'rounded-3xl');
            const h2c = (window as any).html2canvas;
            const canvas = await h2c(cardRef.current, {
                backgroundColor: '#09090b', // zinc-950
                scale: 3,
                useCORS: true,
                logging: false,
            });
            cardRef.current.classList.remove('bg-zinc-950', 'p-8', 'rounded-3xl');

            canvas.toBlob(async (blob: Blob | null) => {
                if (!blob) return;
                const file = new File([blob], 'gainslab-pr.png', { type: 'image/png' });
                const shareData = {
                    title: lang === 'es' ? 'Nuevo Récord' : 'New PR!',
                    text: lang === 'es' ? '¡Miren mi nuevo PR en GainsLab Pro! 🔥' : 'Check out my new PR on GainsLab Pro! 🔥',
                    files: [file]
                };

                if (navigator.canShare && navigator.canShare(shareData)) {
                    await navigator.share(shareData);
                } else {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'gainslab-pr.png';
                    a.click();
                    URL.revokeObjectURL(url);
                }
            }, 'image/png');
        } catch (e) {
            console.error('Share failed', e);
        } finally {
            setIsSharing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[110] bg-black/90 flex items-center justify-center p-6 animate-in fade-in duration-500">
            <div className="w-full max-w-sm flex flex-col items-center text-center animate-in zoom-in-95 duration-500 delay-100">

                {/* Reference for the screenshot */}
                <div ref={cardRef} className="flex flex-col items-center w-full relative">
                    {/* Trophy Animation Container */}
                    <div className="relative mb-8 mt-4">
                        {/* Glowing effect */}
                        <div className="absolute inset-0 bg-yellow-500 blur-3xl opacity-30 rounded-full scale-150 animate-pulse"></div>

                        {/* Icon */}
                        <div className="relative w-32 h-32 text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.6)]">
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                                <path d="M5.25 2.25H18.75C19.9926 2.25 21 3.25736 21 4.5V9C21 11.0506 19.6225 12.7797 17.7501 13.3107C17.4764 16.2995 15.1105 18.6659 12.1875 18.7461V20.25H15C15.4142 20.25 15.75 20.5858 15.75 21C15.75 21.4142 15.4142 21.75 15 21.75H9C8.58579 21.75 8.25 21.4142 8.25 21C8.25 20.5858 8.58579 20.25 9 20.25H11.8125V18.7461C8.88947 18.6659 6.52361 16.2995 6.24987 13.3107C4.37752 12.7797 3 11.0506 3 9V4.5C3 3.25736 4.00736 2.25 5.25 2.25ZM18.75 3.75H17.25V9C17.25 10.3807 16.1307 11.5 14.75 11.5H9.25C7.86929 11.5 6.75 10.3807 6.75 9V3.75H5.25C4.83579 3.75 4.5 4.08579 4.5 4.5V9C4.5 10.7424 5.70014 12.2031 7.31972 12.6075C7.85461 15.4057 10.0248 17.6596 12.8687 18.2323L12 18.25L11.1313 18.2323C13.9752 17.6596 16.1454 15.4057 16.6803 12.6075C18.2999 12.2031 19.5 10.7424 19.5 9V4.5C19.5 4.08579 19.1642 3.75 18.75 3.75Z" />
                            </svg>
                        </div>
                    </div>

                    <h2 className="text-4xl font-black text-white italic tracking-tighter mb-2 drop-shadow-lg">
                        {t.newRecord}
                    </h2>

                    <p className="text-lg text-zinc-300 font-medium mb-6 max-w-[250px] leading-relaxed">
                        {t.prMessage}
                    </p>

                    {/* Watermark only visible in the exported image, usually hidden via CSS trick but we'll just leave it subtle */}
                    <div className="opacity-40 text-xs font-bold tracking-widest uppercase mb-10 flex gap-1 items-center">
                        <Icon name="Activity" size={12} /> GainsLab Pro
                    </div>
                </div>

                <div className="w-full flex gap-3 flex-col sm:flex-row">
                    <Button
                        onClick={handleShare}
                        disabled={isSharing}
                        className="flex-1 bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 text-white border-none py-4 text-base shadow-[0_0_20px_rgba(236,72,153,0.3)] shadow-pink-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 font-bold"
                    >
                        {isSharing ? (
                            <span className="animate-spin"><Icon name="Loader" size={20} /></span>
                        ) : (
                            <><Icon name="Share2" size={20} /> {lang === 'es' ? 'Compartir Logro' : 'Share PR'}</>
                        )}
                    </Button>

                    <Button
                        onClick={onDismiss}
                        className="flex-1 bg-white/10 text-white hover:bg-white/20 border-none py-4 text-base font-bold"
                    >
                        {t.continue}
                    </Button>
                </div>
            </div>
        </div>
    );
};
