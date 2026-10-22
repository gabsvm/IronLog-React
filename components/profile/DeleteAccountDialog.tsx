import React, { useEffect, useRef, useState } from 'react';
import { useAppPreferences } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { TRANSLATIONS } from '../../constants';
import { AccountDeletionError, type AccountDeletionErrorCode } from '../../services/accountDeletion';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';

interface DeleteAccountDialogProps {
    open: boolean;
    onClose: () => void;
    onDeleted: () => void;
    isPro: boolean;
}

export const DeleteAccountDialog: React.FC<DeleteAccountDialogProps> = ({ open, onClose, onDeleted, isPro }) => {
    const { lang } = useAppPreferences();
    const { deleteAccount } = useAuth();
    const t = TRANSLATIONS[lang].deleteAccount;
    const [password, setPassword] = useState('');
    const [confirmWord, setConfirmWord] = useState('');
    const [wipeLocal, setWipeLocal] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [errorCode, setErrorCode] = useState<AccountDeletionErrorCode | null>(null);
    const [subscriptionRetained, setSubscriptionRetained] = useState(false);
    const passwordRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (open) {
            setPassword('');
            setConfirmWord('');
            setWipeLocal(false);
            setDeleting(false);
            setErrorCode(null);
            setSubscriptionRetained(false);
            passwordRef.current?.focus();
        }
    }, [open ]);

    if (!open) return null;

    const canDelete = password.length > 0 && confirmWord.trim().toUpperCase() === t.confirmWord.toUpperCase() && !deleting;

    const handleDelete = async () => {
        if (!canDelete) return;
        setDeleting(true);
        setErrorCode(null);
        try {
            const result = await deleteAccount(password, { wipeLocalData: wipeLocal });
            if (result?.subscriptionRetained) {
                // Account and training data are gone; only the store-side
                // subscription record remains (a backend erasure removes it).
                setSubscriptionRetained(true);
                setDeleting(false);
                return;
            }
            onDeleted();
        } catch (err) {
            setErrorCode(err instanceof AccountDeletionError ? err.code : 'unknown');
            setDeleting(false);
        }
    };

    return (
        <div
            className="modal-backdrop fixed inset-0 z-confirm flex items-center justify-center p-6 backdrop-blur-sm animate-in fade-in duration-base pointer-events-auto"
            onClick={onClose}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
            aria-describedby="delete-account-desc"
        >
            <div className="w-full max-w-sm rounded-2xl border border-border-subtle bg-surface-base p-6 max-h-[calc(100dvh-2rem)] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-red-500/10 text-red-500">
                    <Icon name="AlertTriangle" size={32} />
                </div>
                <h3 id="delete-account-title" className="mb-2 text-center text-xl font-bold text-[rgb(var(--text-primary))]">
                    {t.dialogTitle}
                </h3>
                <p id="delete-account-desc" className="mb-3 text-center text-sm leading-relaxed text-muted">
                    {t.dialogBody}
                </p>
                {isPro && (
                    <p className="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-4 leading-relaxed text-center">
                        {t.proWarning}
                    </p>
                )}
                {errorCode && (
                    <p role="alert" className="text-sm font-semibold text-red-700 dark:text-red-400 mb-4 leading-relaxed text-center">
                        {t.errors[errorCode] ?? t.errors.unknown}
                    </p>
                )}

                <label className="mb-3 flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-elevated)/0.5)] px-3 py-2 text-sm font-medium text-[rgb(var(--text-primary))]">
                    <input
                        type="checkbox"
                        checked={wipeLocal}
                        onChange={(e) => setWipeLocal(e.target.checked)}
                        disabled={deleting}
                        className="h-5 w-5 shrink-0 accent-red-500"
                    />
                    {t.wipeLocal}
                </label>

                <label htmlFor="delete-account-password" className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted">
                    {t.passwordLabel}
                </label>
                <input
                    id="delete-account-password"
                    ref={passwordRef}
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={deleting}
                    className="gl-input min-h-11 text-base mb-3 focus:border-red-500"
                />

                <label htmlFor="delete-account-confirm" className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted">
                    {t.confirmLabel}
                </label>
                <input
                    id="delete-account-confirm"
                    type="text"
                    autoComplete="off"
                    autoCapitalize="characters"
                    value={confirmWord}
                    onChange={(e) => setConfirmWord(e.target.value)}
                    disabled={deleting}
                    className="gl-input min-h-11 text-base mb-5 focus:border-red-500"
                />

                {subscriptionRetained ? (
                    <>
                        <p role="status" className="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-5 leading-relaxed text-center">
                            {t.subscriptionRetained}
                        </p>
                        <Button variant="secondary" onClick={onDeleted} fullWidth>
                            {TRANSLATIONS[lang].understood}
                        </Button>
                    </>
                ) : (
                <div className="grid grid-cols-2 gap-3">
                    <Button variant="secondary" onClick={onClose} disabled={deleting}>
                        {TRANSLATIONS[lang].cancel}
                    </Button>
                    <Button variant="danger" onClick={handleDelete} disabled={!canDelete}>
                        {deleting ? t.deleting : t.deleteButton}
                    </Button>
                </div>
                )}
            </div>
        </div>
    );
};
