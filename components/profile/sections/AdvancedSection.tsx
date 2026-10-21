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
                    <div className="gl-panel space-y-2 p-4">
                        <div className="label-reference px-1 mb-1">{ty.diagnostics}</div>
                        <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-muted">{ty.network}</span>
                            <span className={`font-black ${isOnline ? 'text-emerald-500' : 'text-amber-400'}`}>{isOnline ? ty.online : ty.offline}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-muted">{ty.pendingQueue}</span>
                            <span className="gl-num font-black text-[rgb(var(--text-primary))]">{syncStatus.pending}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-muted">{ty.status}</span>
                            <span className="font-black text-[rgb(var(--text-primary))]">{syncStatus.isSyncing ? ty.syncingState : ty.idleState}</span>
                        </div>
                        <div className="text-xs text-muted">
                            {ty.lastChange} {localLastUpdated ? new Date(localLastUpdated).toLocaleString() : 'n/a'}
                        </div>
                        <StoragePersistRow lang={lang} />
                        {pendingCloudSections.length > 0 && (
                            <div className="text-xs text-amber-500">
                                {ty.cloudNewer}{' '}
                                {pendingCloudSections.map(s => ((t.syncSections as any)?.[s]) || s).join(', ')}
                            </div>
                        )}
                        <div className="flex flex-wrap gap-1 pt-1">
                            {Object.entries(localSectionSyncMeta).slice(0, 8).map(([section]) => (
                                <span key={section} className="gl-pill text-xs">
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
                            className="gl-quiet w-full text-xs"
                        >
                            <Icon name="BookOpen" size={16} /> {t.nhRule}
                        </button>
                    </div>

                    {isAdmin && <AdminControlPanel />}
                </div>
            </details>

            <PhilosophyModal isOpen={showPhilosophy} onClose={() => setShowPhilosophy(false)} lang={lang} />
        </div>
    );
};
