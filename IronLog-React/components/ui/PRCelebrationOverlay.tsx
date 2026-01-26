
import React from 'react';
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

    return (
        <div className="fixed inset-0 z-[110] bg-black/90 flex items-center justify-center p-6 animate-in fade-in duration-500">
            <div className="w-full max-w-sm flex flex-col items-center text-center animate-in zoom-in-95 duration-500 delay-100">
                
                {/* Trophy Animation Container */}
                <div className="relative mb-8">
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
                
                <p className="text-lg text-zinc-300 font-medium mb-10 max-w-[250px] leading-relaxed">
                    {t.prMessage}
                </p>

                <Button 
                    onClick={onDismiss} 
                    size="lg" 
                    fullWidth 
                    className="bg-white text-black hover:bg-zinc-200 border-none text-lg shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                >
                    {t.continue}
                </Button>
            </div>
        </div>
    );
};
