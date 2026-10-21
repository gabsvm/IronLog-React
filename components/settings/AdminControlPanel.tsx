import React, { useState } from 'react';
import { Icon } from '../ui/Icon';
import { useAppPreferences } from '../../context/AppContext';
import { TRANSLATIONS } from '../../constants';
import { AdminErrorReports } from './AdminErrorReports';
import { pickLang } from '../../utils/i18n';


/**
 * Admin-only information panel. Subscription mutation is intentionally
 * unavailable in the client; Firestore rules require server-side changes.
 */

export const AdminControlPanel: React.FC = () => {
    const { lang } = useAppPreferences();
    const t = TRANSLATIONS[lang];
    const [isOpen, setIsOpen] = useState(false);


    return (
        <>
            <button
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
                className={`w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors duration-fast ease-natural ${isOpen ? 'bg-primary-500/15 text-primary-300 border border-primary-500/30' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}
            >
                <Icon name="Shield" size={14} /> {isOpen ? t.adminClose : t.adminPanel}
            </button>

            {isOpen && (
                <div className="mt-3 p-4 bg-white/5 rounded-xl border border-primary-500/20 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-2 mb-3">
                        <Icon name="Crown" size={14} className="text-primary-400" />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">PRO Manager</span>
                    </div>
                    <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-200">
                        <Icon name="Shield" size={14} className="mt-0.5 shrink-0" />
                        <p>{pickLang(lang, {
                            es: 'Los cambios de suscripción solo se realizan desde herramientas de administración del servidor. Las reglas de Firestore impiden escrituras desde esta app.',
                            en: 'Subscription changes are restricted to server-side admin tools. Firestore rules block writes from this app.',
                        })}</p>
                    </div>
                    <AdminErrorReports />
                </div>
            )}

        </>
    );
};
