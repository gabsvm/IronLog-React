
import React, { useEffect, useRef, useState } from 'react';
import { pickLang } from '../../utils/i18n';
import { useAuth } from '../../context/AuthContext';
import { useAppPreferences } from '../../context/AppContext';
import { TRANSLATIONS } from '../../constants';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';

interface AuthModalProps {
    onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
    const { login, register, error, clearError, continueAsGuest, startDemo, resetPassword } = useAuth();
    const { lang } = useAppPreferences();
    const t = TRANSLATIONS[lang].auth; // Get auth translations

    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [pass, setPass] = useState('');
    const [confirmPass, setConfirmPass] = useState('');
    const [name, setName] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [resetSent, setResetSent] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);
    const emailRef = useRef<HTMLInputElement | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError(null);
        clearError();
        if (!isLogin && pass !== confirmPass) {
            setLocalError("Passwords do not match");
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            if (isLogin) {
                await login(email, pass);
            } else {
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
        if (!email.trim()) {
            setLocalError(pickLang(lang, { en: 'Please enter your email first.', es: 'Ingresa tu correo electrónico primero.' }));
            return;
        }
        setLocalError(null);
        clearError();
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

    // ESC closes (only when no typed data, same rule as backdrop) + initial focus on email.
    useEffect(() => {
        emailRef.current?.focus();
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key !== 'Escape') return;
            const hasTyped = Boolean(
                (emailRef.current?.value ?? '') ||
                document.querySelector<HTMLInputElement>('#auth-modal-pass')?.value
            );
            if (!hasTyped) onClose();
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [onClose]);

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (email || pass || name) return; // Don't close if there's data
        onClose();
    };

    const handleGuest = () => {
        continueAsGuest();
        onClose();
    };

    return (
        <div
            className="fixed inset-0 z-confirm bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-base pointer-events-auto"
            onClick={handleBackdropClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-modal-title"
        >
            <div className="gl-panel w-full max-w-sm p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h3 id="auth-modal-title" className="text-xl font-bold text-[rgb(var(--text-primary))]">
                        {isLogin ? t.signIn : t.register}
                    </h3>
                    <button onClick={onClose} className="relative min-h-[44px] min-w-[44px] text-muted hover:text-[rgb(var(--text-primary))] after:absolute after:-inset-2 after:content-['']" aria-label={t.close}> <Icon name="X" size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <div>
                            <label className="text-sm font-semibold text-muted block mb-2">{t.name || "Name"}</label>
                            <input
                                type="text"
                                autoComplete="name"
                                className="gl-input w-full focus:ring-2 focus:ring-primary-500"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="John Doe"
                            />
                        </div>
                    )}
                    <div>
                        <label className="text-sm font-semibold text-muted block mb-2">{t.email}</label>
                            <input
                                ref={emailRef}
                                type="email"
                                required
                                autoComplete="email"
                                className="gl-input w-full focus:ring-2 focus:ring-primary-500"
                                value={email}
                                onChange={e => { setEmail(e.target.value); clearError(); }}
                                placeholder="you@example.com"
                            />
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-sm font-semibold text-muted block">{t.password}</label>
                            {isLogin && (
                                <button 
                                    type="button" 
                                    onClick={handleResetPassword}
                                    className="min-h-[44px] px-2 text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline"
                                >
                                    {t.forgotPassword || "Forgot password?"}
                                </button>
                            )}
                        </div>
                        <div className="relative">
                            <input
                                id="auth-modal-pass"
                                type={showPass ? "text" : "password"}
                                required
                                minLength={6}
                                autoComplete={isLogin ? "current-password" : "new-password"}
                                className="gl-input w-full pr-10 focus:ring-2 focus:ring-primary-500"
                                value={pass}
                                onChange={e => { setPass(e.target.value); clearError(); }}
                                placeholder="••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPass(!showPass)}
                                aria-label={showPass ? pickLang(lang, { en: 'Hide password', es: 'Ocultar contraseña' }) : pickLang(lang, { en: 'Show password', es: 'Mostrar contraseña' })}
                                aria-pressed={showPass}
                                className="absolute right-3 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted hover:text-zinc-600 dark:hover:text-zinc-300"
                            >
                                <Icon name={showPass ? "EyeOff" : "Eye"} size={16} />
                            </button>
                        </div>
                    </div>

                    {!isLogin && (
                        <div>
                            <label className="text-sm font-semibold text-muted block mb-2">{t.confirmPassword || "Confirm Password"}</label>
                            <input
                                type="password"
                                required
                                minLength={6}
                                autoComplete="new-password"
                            className={`gl-input w-full ${pass && confirmPass && pass !== confirmPass ? 'ring-2 ring-red-500' : 'focus:ring-2 focus:ring-primary-500'}`}
                                value={confirmPass}
                                onChange={e => setConfirmPass(e.target.value)}
                                placeholder="••••••"
                            />
                        </div>
                    )}

                    {(() => {
                        const activeError = localError || error;
                        return activeError ? (
                            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-[18px] text-sm font-medium flex items-center gap-2">
                                <Icon name="AlertTriangle" size={16} />
                                {activeError === "Passwords do not match" ? (t.passwordMismatch || activeError) : activeError}
                            </div>
                        ) : null;
                    })()}
                    {resetSent && (
                        <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-3 rounded-[18px] text-xs font-medium flex items-center gap-2">
                            <Icon name="CheckCircle" size={16} />
                            {t.resetSent || "Reset link sent to your email!"}
                        </div>
                    )}

                    <Button type="submit" fullWidth disabled={loading} className={loading ? 'opacity-70' : ''}>
                        {loading ? t.processing : (isLogin ? t.signIn : t.register)}
                    </Button>
                </form>

                <div className="my-6 flex items-center">
                    <div className="flex-grow border-t border-[rgb(var(--border-subtle))]"></div>
                    <span className="mx-4 flex-shrink-0 text-xs font-bold uppercase tracking-widest text-muted">{t.or}</span>
                    <div className="flex-grow border-t border-[rgb(var(--border-subtle))]"></div>

                </div>

                <div className={import.meta.env.DEV ? "grid grid-cols-2 gap-3" : "flex flex-col gap-3"}>
                    <Button variant="secondary" fullWidth onClick={handleGuest} className="dark:bg-zinc-800 dark:border-zinc-700 text-xs">
                        {t.continueGuest}
                    </Button>
                    {import.meta.env.DEV && (
                        <Button variant="secondary" fullWidth onClick={handleStartDemo} className="dark:bg-zinc-800 dark:border-zinc-700 text-xs text-primary-600 dark:text-primary-400">
                            {t.startDemo || "Try 7 Days Free"}
                        </Button>
                    )}
                </div>

                <div className="mt-6 text-center">
                    <p className="text-sm text-muted">
                        {isLogin ? `${t.noAccount} ` : `${t.hasAccount} `}
                        <button 
                            onClick={() => { setIsLogin(!isLogin); clearError(); setLocalError(null); }}
                            className="min-h-[44px] px-2 font-bold text-primary-600 hover:underline dark:text-primary-400"
                        >
                            {isLogin ? t.signUpBtn : t.signInBtn}
                        </button>
                    </p>
                </div>
                
                <div className="mt-4 border-t border-[rgb(var(--border-subtle))] pt-4 text-center">
                    <p className="text-xs text-muted leading-relaxed">
                        {t.syncNote}
                    </p>
                </div>
            </div>
        </div>
    );
};
