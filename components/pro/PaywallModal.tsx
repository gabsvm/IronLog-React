
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
    const [success, setSuccess] = useState(false);
    const t = TRANSLATIONS[lang].pro;

    const WA_NUMBER = '5491132483927';

    const handleContactWhatsApp = (tier: 'monthly' | 'yearly' | 'lifetime') => {
        const tierLabels: Record<string, string> = {
            monthly: 'Mensual',
            yearly: 'Anual',
            lifetime: 'Lifetime'
        };
        const message = encodeURIComponent(
            `Hola! Quiero activar IronLog Pro (${tierLabels[tier]}). Mi email registrado es: ${user?.email || '(sin cuenta)'}`
        );
        window.open(`https://wa.me/${WA_NUMBER}?text=${message}`, '_blank');
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
                        {(['monthly', 'yearly', 'lifetime'] as const).map(tier => (
                            <button
                                key={tier}
                                onClick={() => handleContactWhatsApp(tier)}
                                className="w-full flex items-center justify-between p-4 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-green-500/50 rounded-2xl transition-all active:scale-95 group"
                            >
                                <div className="text-left">
                                    <div className="font-bold text-white text-sm">{t.tiers[tier].label}</div>
                                    <div className="text-xs text-zinc-400">{t.tiers[tier].price}</div>
                                </div>
                                {/* Ícono de WhatsApp */}
                                <div className="w-10 h-10 bg-green-500/20 group-hover:bg-green-500 rounded-xl flex items-center justify-center transition-colors">
                                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-green-400 group-hover:fill-white transition-colors">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                    </svg>
                                </div>
                            </button>
                        ))}
                    </div>

                    <p className="text-center text-[10px] text-zinc-600 mt-4 leading-relaxed">
                        {lang === 'en' 
                            ? 'Send a WhatsApp message and we\'ll activate your account within 24hs.' 
                            : 'Envianos un mensaje por WhatsApp y activamos tu cuenta en menos de 24hs.'}
                    </p>

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
                        <span className="font-bold dark:text-white text-sm tracking-wide uppercase">
                            {lang === 'en' ? 'Processing...' : 'Procesando...'}
                        </span>
                    </div>
                </div>
            )}

            {success && (
                <div className="absolute inset-0 z-[210] bg-black/60 flex items-center justify-center backdrop-blur-sm">
                    <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl flex flex-col items-center shadow-2xl animate-in zoom-in-95">
                        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4 animate-bounce">
                            <Icon name="Check" size={32} className="text-white" strokeWidth={4} />
                        </div>
                        <span className="font-black text-xl dark:text-white tracking-tight uppercase">
                            {lang === 'en' ? 'Welcome Pro!' : '¡Bienvenido Pro!'}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};
