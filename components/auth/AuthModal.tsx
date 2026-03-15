
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
    const { login, register, error, clearError, continueAsGuest, startDemo, resetPassword } = useAuth();
    const { lang } = useApp(); // Get current language
    const t = TRANSLATIONS[lang].auth; // Get auth translations

    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [pass, setPass] = useState('');
    const [confirmPass, setConfirmPass] = useState('');
    const [name, setName] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [resetSent, setResetSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isLogin) {
                await login(email, pass);
            } else {
                if (pass !== confirmPass) {
                    throw new Error("Passwords do not match");
                }
                await register(email, pass, name);
            }
            onClose();
        } catch (e) {
            // Error is handled in context and displayed below
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!email) {
            // Handle error or alert
            return;
        }
        try {
            await resetPassword(email);
            setResetSent(true);
        } catch (e) {
            // Error handled
        }
    };

    const handleStartDemo = async () => {
        setLoading(true);
        try {
            await startDemo();
            onClose();
        } catch (e) {
            // Error handled
        } finally {
            setLoading(false);
        }
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (email || pass || name) return; // Don't close if there's data
        onClose();
    };

    const handleGuest = () => {
        continueAsGuest();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200" onClick={handleBackdropClick}>
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
                    {!isLogin && (
                        <div>
                            <label className="text-xs font-bold uppercase text-zinc-400 tracking-wider block mb-2">{t.name || "Name"}</label>
                            <input 
                                type="text" 
                                className="w-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl p-3 outline-none focus:ring-2 focus:ring-red-500"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="John Doe"
                            />
                        </div>
                    )}
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
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-bold uppercase text-zinc-400 tracking-wider block">{t.password}</label>
                            {isLogin && (
                                <button 
                                    type="button" 
                                    onClick={handleResetPassword}
                                    className="text-[10px] font-bold text-red-600 hover:underline"
                                >
                                    {t.forgotPassword || "Forgot password?"}
                                </button>
                            )}
                        </div>
                        <div className="relative">
                            <input 
                                type={showPass ? "text" : "password"} 
                                required
                                minLength={6}
                                className="w-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl p-3 outline-none focus:ring-2 focus:ring-red-500 pr-10"
                                value={pass}
                                onChange={e => { setPass(e.target.value); clearError(); }}
                                placeholder="••••••"
                            />
                            <button 
                                type="button" 
                                onClick={() => setShowPass(!showPass)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                            >
                                <Icon name={showPass ? "EyeOff" : "Eye"} size={16} />
                            </button>
                        </div>
                    </div>

                    {!isLogin && (
                        <div>
                            <label className="text-xs font-bold uppercase text-zinc-400 tracking-wider block mb-2">{t.confirmPassword || "Confirm Password"}</label>
                            <input 
                                type="password" 
                                required
                                minLength={6}
                                className={`w-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl p-3 outline-none focus:ring-2 ${pass && confirmPass && pass !== confirmPass ? 'ring-2 ring-red-500' : 'focus:ring-red-500'}`}
                                value={confirmPass}
                                onChange={e => setConfirmPass(e.target.value)}
                                placeholder="••••••"
                            />
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm font-medium flex items-center gap-2">
                            <Icon name="AlertTriangle" size={16} />
                            {error === "Passwords do not match" ? (t.passwordMismatch || error) : error}
                        </div>
                    )}
                    {resetSent && (
                        <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-3 rounded-xl text-xs font-medium flex items-center gap-2">
                            <Icon name="CheckCircle" size={16} />
                            {t.resetSent || "Reset link sent to your email!"}
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

                <div className="grid grid-cols-2 gap-3">
                    <Button variant="secondary" fullWidth onClick={handleGuest} className="dark:bg-zinc-800 dark:border-zinc-700 text-xs">
                        {t.continueGuest}
                    </Button>
                    <Button variant="secondary" fullWidth onClick={handleStartDemo} className="dark:bg-zinc-800 dark:border-zinc-700 text-xs text-orange-500">
                        {t.startDemo || "Try 7 Days Free"}
                    </Button>
                </div>

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
