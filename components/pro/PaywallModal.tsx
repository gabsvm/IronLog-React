
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Icon } from '../ui/Icon';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../constants';

interface PaywallModalProps {
    onClose: () => void;
    feature?: string;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({ onClose, feature }) => {
    const { upgradeToPro, user } = useAuth();
    const { lang } = useApp();
    const [loading, setLoading] = useState<string | null>(null);
    const t = TRANSLATIONS[lang].pro;

    // Determine specific trigger text
    const triggerText = feature && (t.triggers as any)[feature] 
        ? (t.triggers as any)[feature] 
        : t.subtitle;

    const handlePurchase = async (tier: 'monthly' | 'yearly' | 'lifetime') => {
        if (!user) {
            alert(lang === 'en' ? "Please log in to subscribe." : "Inicia sesión para suscribirte.");
            return;
        }
        setLoading(tier);
        // Simulate API call lag
        setTimeout(async () => {
            await upgradeToPro(tier);
            setLoading(null);
            onClose();
        }, 1500);
    };

    return (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative border border-zinc-200 dark:border-white/10 max-h-[90vh] overflow-y-auto scroll-container">
                
                {/* Header Image / Gradient */}
                <div className="h-40 bg-gradient-to-br from-red-600 to-orange-600 relative flex flex-col items-center justify-center shrink-0">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                    <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-xl animate-bounce mb-2">
                        <Icon name="Crown" size={28} className="text-yellow-500 fill-yellow-500" />
                    </div>
                    <button onClick={onClose} className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white rounded-full p-2 transition-colors z-20">
                        <Icon name="X" size={20} />
                    </button>
                    <div className="relative z-10 text-center px-6">
                        <h2 className="text-xl font-black text-white leading-tight mb-1 tracking-tight drop-shadow-md">
                            {t.title}
                        </h2>
                    </div>
                </div>

                <div className="p-6">
                    {/* Context Trigger */}
                    <div className="flex items-center justify-center gap-3 mb-6 bg-red-50 dark:bg-red-900/20 p-3 rounded-xl border border-red-100 dark:border-red-900/30">
                        <Icon name="Lock" size={16} className="text-red-500 shrink-0" />
                        <p className="text-xs text-red-700 dark:text-red-300 font-bold leading-tight">
                            {feature ? (lang === 'en' ? `Locked: ${feature}` : `Bloqueado: ${feature}`) : t.subtitle}
                        </p>
                    </div>

                    {/* Features List */}
                    <div className="space-y-3 mb-8">
                        {t.features.map((f: string, i: number) => (
                            <div key={i} className="flex items-start gap-3">
                                <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center shrink-0 mt-0.5">
                                    <Icon name="Check" size={12} strokeWidth={4} />
                                </div>
                                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 leading-snug">{f}</span>
                            </div>
                        ))}
                    </div>

                    {/* Pricing Cards */}
                    <div className="grid grid-cols-1 gap-3 mb-6">
                        {/* MONTHLY */}
                        <button 
                            onClick={() => handlePurchase('monthly')}
                            className="w-full p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 transition-all flex justify-between items-center group active:scale-[0.98]"
                        >
                            <span className="font-bold text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white">Monthly</span>
                            <span className="font-black text-lg text-zinc-900 dark:text-white">{t.plans.monthly.split('/')[0]}</span>
                        </button>
                        
                        {/* YEARLY (Hero) */}
                        <button 
                            onClick={() => handlePurchase('yearly')}
                            className="w-full p-1 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 shadow-lg shadow-red-500/20 active:scale-[0.98] transition-transform relative overflow-hidden group"
                        >
                            <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-[9px] font-black px-2 py-1 rounded-bl-lg z-10 uppercase tracking-wider">
                                {t.bestValue}
                            </div>
                            <div className="bg-white dark:bg-zinc-800 rounded-lg p-3 flex justify-between items-center h-full">
                                <div className="flex flex-col items-start">
                                    <span className="font-black text-zinc-900 dark:text-white flex items-center gap-2">
                                        Yearly <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded uppercase">PRO</span>
                                    </span>
                                    <span className="text-[10px] text-zinc-400 line-through mt-0.5">$71.88</span>
                                </div>
                                <div className="text-right">
                                    <span className="block font-black text-xl text-red-600 dark:text-red-500">{t.plans.yearly.split('/')[0]}</span>
                                    <span className="text-[9px] text-zinc-500 dark:text-zinc-400">{lang === 'en' ? '/ year' : '/ año'}</span>
                                </div>
                            </div>
                        </button>

                        {/* LIFETIME */}
                        <button 
                            onClick={() => handlePurchase('lifetime')}
                            className="w-full p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:border-yellow-500 dark:hover:border-yellow-500 transition-all flex justify-between items-center group active:scale-[0.98]"
                        >
                            <span className="font-bold text-zinc-600 dark:text-zinc-400">Lifetime</span>
                            <span className="font-black text-lg text-zinc-900 dark:text-white">{t.plans.lifetime.split(' ')[0]}</span>
                        </button>
                    </div>

                    {/* Footer */}
                    <div className="text-center space-y-2">
                        <p className="text-[10px] text-zinc-400 font-medium">
                            {t.guarantee}
                        </p>
                        <button onClick={onClose} className="text-[10px] text-zinc-300 hover:text-zinc-500 underline">
                            {lang === 'en' ? "Restore Purchases" : "Restaurar Compras"}
                        </button>
                    </div>
                </div>
            </div>
            
            {loading && (
                <div className="absolute inset-0 z-[210] bg-black/60 flex items-center justify-center backdrop-blur-sm">
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl flex flex-col items-center shadow-2xl animate-in zoom-in-95">
                        <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <span className="font-bold dark:text-white text-sm tracking-wide uppercase">Processing...</span>
                    </div>
                </div>
            )}
        </div>
    );
};
