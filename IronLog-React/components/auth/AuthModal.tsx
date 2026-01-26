
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext'; // Import App Context for language
import { TRANSLATIONS } from '../../constants';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';

interface AuthModalProps {
    onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
    const { login, register, error, clearError, continueAsGuest } = useAuth();
    const { lang } = useApp(); // Get current language
    const t = TRANSLATIONS[lang].auth; // Get auth translations

    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [pass, setPass] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isLogin) {
                await login(email, pass);
            } else {
                await register(email, pass);
            }
            onClose();
        } catch (e) {
            // Error is handled in context and displayed below
        } finally {
            setLoading(false);
        }
    };

    const handleGuest = () => {
        continueAsGuest();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-zinc-200 dark:border-white/10" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                        {isLogin ? t.signIn : t.register}
                    </h3>
                    <button onClick={onClose} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
                        <Icon name="X" size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold uppercase text-zinc-400 tracking-wider block mb-2">{t.email}</label>
                        <input 
                            type="email" 
                            required
                            className="w-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl p-3 outline-none focus:ring-2 focus:ring-red-500"
                            value={email}
                            onChange={e => { setEmail(e.target.value); clearError(); }}
                            placeholder="you@example.com"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase text-zinc-400 tracking-wider block mb-2">{t.password}</label>
                        <input 
                            type="password" 
                            required
                            minLength={6}
                            className="w-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl p-3 outline-none focus:ring-2 focus:ring-red-500"
                            value={pass}
                            onChange={e => { setPass(e.target.value); clearError(); }}
                            placeholder="••••••"
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm font-medium flex items-center gap-2">
                            <Icon name="AlertTriangle" size={16} />
                            {error}
                        </div>
                    )}

                    <Button type="submit" fullWidth disabled={loading} className={loading ? 'opacity-70' : ''}>
                        {loading ? t.processing : (isLogin ? t.signIn : t.register)}
                    </Button>
                </form>

                <div className="my-6 flex items-center">
                    <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
                    <span className="flex-shrink-0 mx-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">{t.or}</span>
                    <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
                </div>

                <Button variant="secondary" fullWidth onClick={handleGuest} className="dark:bg-zinc-800 dark:border-zinc-700">
                    {t.continueGuest}
                </Button>

                <div className="mt-6 text-center">
                    <p className="text-sm text-zinc-500">
                        {isLogin ? `${t.noAccount} ` : `${t.hasAccount} `}
                        <button 
                            onClick={() => { setIsLogin(!isLogin); clearError(); }}
                            className="text-red-600 font-bold hover:underline"
                        >
                            {isLogin ? t.signUpBtn : t.signInBtn}
                        </button>
                    </p>
                </div>
                
                <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-white/5 text-center">
                    <p className="text-[10px] text-zinc-400 leading-relaxed">
                        {t.syncNote}
                    </p>
                </div>
            </div>
        </div>
    );
};
