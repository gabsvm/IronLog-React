import React, { useState } from 'react';
import { collection, doc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Icon } from '../ui/Icon';
import { AdminTemplateManager } from '../admin/AdminTemplateManager';

interface Props {
    adminEmail: string | undefined;
}

type Status = { msg: string; type: 'success' | 'error' | 'neutral'; codeSnippet?: string };

/**
 * Admin-only sub-panel inside Settings → Account tab.
 * Lets the admin user grant/revoke PRO for any UID or email, and access
 * the global template manager. Fully self-contained: owns its own state
 * (target input, status, template-manager toggle) and Firestore calls.
 * Renders nothing for non-admin users (caller guards on email).
 */
export const AdminControlPanel: React.FC<Props> = ({ adminEmail }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [targetInput, setTargetInput] = useState('');
    const [status, setStatus] = useState<Status | null>(null);
    const [showTemplateManager, setShowTemplateManager] = useState(false);

    const resolveUid = async (input: string): Promise<string | null> => {
        if (!db) return null;
        const trimmed = input.trim();
        if (!trimmed) return null;

        if (trimmed.includes('@')) {
            try {
                setStatus({ msg: `Searching: ${trimmed}...`, type: 'neutral' });
                const usersRef = collection(db, 'users');
                const q = query(usersRef, where('email', '==', trimmed));
                const snap = await getDocs(q);
                if (snap.empty) return null;
                return snap.docs[0].id;
            } catch (e: any) {
                if (e.code === 'permission-denied') throw new Error('PERMISSION_DENIED_LIST');
                throw new Error(`Email lookup failed: ${e.message}`);
            }
        }
        return trimmed;
    };

    const handleSubscriptionChange = async (grantPro: boolean) => {
        if (!db) return;
        setStatus({ msg: 'Processing...', type: 'neutral' });
        try {
            const uidToModify = await resolveUid(targetInput);
            if (!uidToModify) {
                setStatus({ msg: 'Error: User not found', type: 'error' });
                return;
            }
            const subData = {
                isPro: grantPro,
                tier: grantPro ? 'lifetime' : 'free',
                expiryDate: null,
                grantedByAdmin: grantPro,
                revokedByAdmin: !grantPro,
                updatedAt: Date.now(),
                adminUser: adminEmail,
            };
            await setDoc(doc(db, 'users', uidToModify, 'data', 'subscription'), subData, { merge: true });
            setStatus({
                msg: grantPro ? `✅ PRO Granted` : `🚫 PRO Revoked`,
                type: grantPro ? 'success' : 'error',
            });
        } catch (e: any) {
            let helpfulMsg = e.message;
            let codeSnippet = '';
            if (e.code === 'permission-denied' || e.message === 'PERMISSION_DENIED_LIST') {
                helpfulMsg = '⛔ FIREBASE RULES BLOCKING';
                codeSnippet = `rules_version = '2'; service cloud.firestore { match /databases/{database}/documents { function isAdmin() { return request.auth != null && request.auth.token.email == '${adminEmail}'; } match /users { allow list: if isAdmin(); } match /users/{userId}/{document=**} { allow read, write: if request.auth != null && (request.auth.uid == userId || isAdmin()); } match /global_templates/{docId} { allow read: if true; allow write: if isAdmin(); } } }`;
            }
            setStatus({ msg: helpfulMsg, type: 'error', codeSnippet });
        }
    };

    if (showTemplateManager) {
        return <AdminTemplateManager onClose={() => setShowTemplateManager(false)} />;
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
                className={`w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors duration-fast ease-natural ${isOpen ? 'bg-primary-500/15 text-primary-300 border border-primary-500/30' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}
            >
                <Icon name="Shield" size={14} /> {isOpen ? 'Close Admin' : 'Admin Panel'}
            </button>

            {isOpen && (
                <div className="mt-3 p-4 bg-white/5 rounded-xl border border-primary-500/20 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-2 mb-3">
                        <Icon name="Crown" size={14} className="text-primary-400" />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">PRO Manager</span>
                    </div>

                    <div className="space-y-3">
                        <input
                            type="text"
                            value={targetInput}
                            onChange={(e) => setTargetInput(e.target.value)}
                            placeholder="Email or UID"
                            aria-label="Target user email or UID"
                            className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-white placeholder:text-zinc-600 focus:border-primary-500 focus:outline-none transition-colors duration-fast"
                        />

                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => handleSubscriptionChange(true)}
                                className="py-2 bg-primary-500 text-black rounded-lg text-[10px] font-black uppercase tracking-tight hover:bg-primary-400 active:scale-95 transition-all duration-fast ease-natural shadow-lg shadow-primary-500/20"
                            >
                                Grant PRO
                            </button>
                            <button
                                onClick={() => handleSubscriptionChange(false)}
                                className="py-2 bg-red-500/15 text-red-400 border border-red-500/30 rounded-lg text-[10px] font-black uppercase tracking-tight hover:bg-red-500/25 active:scale-95 transition-all duration-fast ease-natural"
                            >
                                Revoke PRO
                            </button>
                        </div>

                        {status && (
                            <div
                                role="status"
                                className={`text-[10px] font-bold p-2 rounded-lg ${status.type === 'success' ? 'bg-primary-500/10 text-primary-300 border border-primary-500/20' : status.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-white/5 text-zinc-300 border border-white/10'}`}
                            >
                                {status.msg}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <button
                onClick={() => setShowTemplateManager(true)}
                className="w-full py-2 mt-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors duration-fast ease-natural bg-primary-500 text-black hover:bg-primary-400 shadow-md shadow-primary-500/20"
            >
                <Icon name="Layout" size={14} /> Manage Templates
            </button>
        </>
    );
};
