
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Icon } from '../ui/Icon';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../constants';
import { functions, httpsCallable } from '../../lib/firebase';

// Define types for clarity
type Tier = 'monthly' | 'yearly' | 'lifetime';
type PaymentMethod = 'mercado_pago' | 'binance_pay';

interface PaywallModalProps {
    onClose: () => void;
    feature?: string;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({ onClose, feature }) => {
    const { user } = useAuth();
    const { lang } = useApp();
    const [loading, setLoading] = useState<PaymentMethod | null>(null);
    const [selectedTier, setSelectedTier] = useState<Tier | null>(null);
    const t = TRANSLATIONS[lang].pro;

    const handleSelectTier = (tier: Tier) => {
        if (!user) {
            alert(lang === 'en' ? "Please log in to subscribe." : "Inicia sesión para suscribirte.");
            return;
        }
        setSelectedTier(tier);
    };

    const handlePayment = async (method: PaymentMethod) => {
        if (!selectedTier) return;

        setLoading(method);

        try {
            if (method === 'mercado_pago') {
                const createMercadoPagoPreference = httpsCallable(functions, 'createMercadoPagoPreference');
                const response = await createMercadoPagoPreference({
                    tier: selectedTier,
                    success_url: window.location.href,
                    failure_url: window.location.href,
                });
                const { init_point } = response.data as { init_point: string };
                window.location.href = init_point; // Redirect to Mercado Pago

            } else if (method === 'binance_pay') {
                const createBinancePayOrder = httpsCallable(functions, 'createBinancePayOrder');
                const response = await createBinancePayOrder({ tier: selectedTier });
                const { checkoutUrl } = response.data as { checkoutUrl: string };
                window.location.href = checkoutUrl; // Redirect to Binance Pay
            }
        } catch (error: any) {
            console.error(`Error during ${method} purchase:`, error);
            alert(`An error occurred: ${error.message || 'Please try again.'}`);
            setLoading(null);
        }
    };

    const renderTierSelection = () => (
        <div className="p-6">
            {/* Features & Trigger */}
            <div className="flex items-center justify-center gap-3 mb-6 bg-red-50 dark:bg-red-900/20 p-3 rounded-xl border border-red-100 dark:border-red-900/30">
                <Icon name="Lock" size={16} className="text-red-500 shrink-0" />
                <p className="text-xs text-red-700 dark:text-red-300 font-bold leading-tight">
                    {feature ? (lang === 'en' ? `Locked: ${feature}` : `Bloqueado: ${feature}`) : t.subtitle}
                </p>
            </div>
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
            <div className="grid grid-cols-1 gap-3 mb-2">
                <button onClick={() => handleSelectTier('monthly')} className="w-full p-4 rounded-xl border-2 border-zinc-200 dark:border-zinc-700 hover:border-red-500 dark:hover:border-red-500 transition-all flex justify-between items-center group active:scale-[0.98]">
                    <span className="font-bold text-zinc-600 dark:text-zinc-400 group-hover:text-red-500">Monthly</span>
                    <span className="font-black text-lg text-zinc-900 dark:text-white">$5.99</span>
                </button>
                <button onClick={() => handleSelectTier('yearly')} className="w-full p-4 rounded-xl border-2 border-zinc-200 dark:border-zinc-700 hover:border-red-500 dark:hover:border-red-500 transition-all flex justify-between items-center group active:scale-[0.98]">
                    <span className="font-bold text-zinc-600 dark:text-zinc-400 group-hover:text-red-500">Yearly</span>
                    <span className="font-black text-lg text-red-600">$49.99</span>
                </button>
                <button onClick={() => handleSelectTier('lifetime')} className="w-full p-4 rounded-xl border-2 border-zinc-200 dark:border-zinc-700 hover:border-red-500 dark:hover:border-red-500 transition-all flex justify-between items-center group active:scale-[0.98]">
                    <span className="font-bold text-zinc-600 dark:text-zinc-400 group-hover:text-red-500">Lifetime</span>
                    <span className="font-black text-lg text-zinc-900 dark:text-white">$99.99</span>
                </button>
            </div>
        </div>
    );

    const renderPaymentSelection = () => (
        <div className="p-6">
            <button onClick={() => setSelectedTier(null)} className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 mb-4">
                <Icon name="ArrowLeft" size={14} />
                Back to tiers
            </button>
            <h3 className="text-center font-bold text-lg mb-1 dark:text-white">Select Payment Method</h3>
            <p className="text-center text-sm text-zinc-500 mb-6">You selected the <span className="font-bold text-red-500 capitalize">{selectedTier}</span> plan.</p>
            
            <div className="space-y-3">
                {/* Mercado Pago Button */}
                <button 
                    onClick={() => handlePayment('mercado_pago')}
                    disabled={!!loading}
                    className="w-full p-4 rounded-xl bg-[#009EE3] text-white font-bold text-lg flex items-center justify-center gap-3 transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-wait active:scale-[0.98]"
                >
                    <img src="https://raw.githubusercontent.com/mercado-pago/assets/main/ux/mp-logo-light.svg" alt="Mercado Pago" className="h-6" />
                </button>

                {/* Binance Pay Button */}
                <button 
                    onClick={() => handlePayment('binance_pay')}
                    disabled={!!loading}
                    className="w-full p-4 rounded-xl bg-[#F0B90B] text-[#1E2329] font-bold text-lg flex items-center justify-center gap-3 transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-wait active:scale-[0.98]"
                >
                    <Icon name="Landmark" className="h-6 w-6" />
                    Binance Pay
                </button>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative border border-zinc-200 dark:border-white/10 max-h-[90vh] overflow-y-auto scroll-container">
                
                {/* Header */}
                <div className="h-36 bg-gradient-to-br from-red-600 to-orange-600 relative flex flex-col items-center justify-center shrink-0">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                    <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-xl mb-2">
                        <Icon name="Crown" size={28} className="text-yellow-500 fill-yellow-500" />
                    </div>
                    <button onClick={onClose} className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white rounded-full p-2 transition-colors z-20">
                        <Icon name="X" size={20} />
                    </button>
                    <h2 className="text-xl font-black text-white tracking-tight drop-shadow-md z-10">
                        {t.title}
                    </h2>
                </div>

                {/* Conditional Content */}
                {selectedTier ? renderPaymentSelection() : renderTierSelection()}
                
                {/* Footer */}
                <div className="text-center py-4 px-6 border-t border-zinc-200 dark:border-zinc-800">
                     <button onClick={onClose} className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 underline">
                        {lang === 'en' ? "Maybe later" : "Quizás más tarde"}
                    </button>
                </div>
            </div>
            
            {/* Loading Overlay */}
            {loading && (
                <div className="absolute inset-0 z-[210] bg-black/60 flex items-center justify-center backdrop-blur-sm">
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl flex flex-col items-center shadow-2xl animate-in zoom-in-95">
                        <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <span className="font-bold dark:text-white text-sm tracking-wide uppercase">
                            Redirecting to {loading === 'mercado_pago' ? 'Mercado Pago' : 'Binance Pay'}...
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};
