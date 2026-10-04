import React, { useState } from 'react';
import { useApp, useSyncMeta, useSyncStatus } from '../../../context/AppContext';
import { useAuth } from '../../../context/AuthContext';
import { TRANSLATIONS } from '../../../constants';
import { Icon } from '../../ui/Icon';
import { ErrorLogCard } from '../ErrorLogCard';
import { StoragePersistRow } from '../StoragePersistRow';
import { PhilosophyModal } from '../../ui/PhilosophyModal';
import { AdminControlPanel } from '../../settings/AdminControlPanel';

interface AdvancedSectionProps {
    syncStatusText: string;
}

/** Q18: "Avanzado" section, moved verbatim from ProfileSheet. */
export const AdvancedSection: React.FC<AdvancedSectionProps> = ({ syncStatusText }) => {
    const { lang, pendingCloudSections } = useApp();
    const { localLastUpdated, localSectionSyncMeta } = useSyncMeta();
    const { isOnline, syncStatus } = useSyncStatus();
    const { user, isAdmin } = useAuth();
    const t = TRANSLATIONS[lang];
    const ty = t.you;

    const [showPhilosophy, setShowPhilosophy] = useState(false);

    return (
        <div id="profile-section-advanced">
            <details>
                <summary className="label-reference px-1 mb-1.5 cursor-pointer list-none flex items-center gap-1.5 [&::-webkit-details-marker]:hidden">
                    {ty.advanced}
                    <Icon name="ChevronDown" size={14} className="text-muted" />
                </summary>
                <div className="space-y-4">
                    <div className="card-reference p-4 space-y-2">
                        <div className="label-reference px-1 mb-1">{ty.diagnostics}</div>
                        <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-zinc-500">{ty.network}</span>
                            <span className={`font-black ${isOnline ? 'text-emerald-500' : 'text-amber-400'}`}>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-zinc-500">{ty.pendingQueue}</span>
                            <span className="font-black text-zinc-900 dark:text-white">{syncStatus.pending}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-zinc-500">{ty.status}</span>
                            <span className="font-black text-zinc-900 dark:text-white">{syncStatus.isSyncing ? ty.syncingState : ty.idleState}</span>
                        </div>
                        <div className="text-xs text-muted">
                            {ty.lastChange} {localLastUpdated ? new Date(localLastUpdated).toLocaleString() : 'n/a'}
                        </div>
                        <StoragePersistRow lang={lang} />
                        {pendingCloudSections.length > 0 && (
                            <div className="text-[10px] text-amber-500">
                                {ty.cloudNewer}{' '}
                                {pendingCloudSections.map(s => ((t.syncSections as any)?.[s]) || s).join(', ')}
                            </div>
                        )}
                        <div className="flex flex-wrap gap-1 pt-1">
                            {Object.entries(localSectionSyncMeta).slice(0, 8).map(([section]) => (
                                <span key={section} className="rounded-full bg-zinc-200 px-2 py-0.5 text-[9px] font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                                    {((t.syncSections as any)?.[section]) || section}
                                </span>
                            ))}
                        </div>
                    </div>

                    <ErrorLogCard lang={lang} syncStatusText={syncStatusText} />
                    <div>
                        <div className="label-reference px-1 mb-1.5">{t.creditsTitle}</div>
                        <button
                            type="button"
                            onClick={() => setShowPhilosophy(true)}
                            className="w-full py-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-xs font-bold flex justify-center gap-2 items-center text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                        >
                            <Icon name="BookOpen" size={16} /> {t.nhRule}
                        </button>
                    </div>

                    {isAdmin && <AdminControlPanel adminEmail={user?.email || undefined} />}
                </div>
            </details>

            <PhilosophyModal isOpen={showPhilosophy} onClose={() => setShowPhilosophy(false)} lang={lang} />
        </div>
    );
};
