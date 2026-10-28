import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { TRANSLATIONS } from '../../../constants';
import { BodyMetricsModal } from '../BodyMetricsModal';
import { HealthConnectCard } from '../HealthConnectCard';
import { formatWeight, resolveWeightUnit, unitLabel } from '../../../utils/units';
import { todayLocalDateKey, formatLocalDateKey } from '../../../utils/localDate';

/** Q18: "Tu cuerpo" section, moved verbatim from ProfileSheet. */
export const BodySection: React.FC = () => {
    const { lang, userProfile, setUserProfile, config, bodyLogs, setBodyLogs } = useApp();
    const t = TRANSLATIONS[lang];
    const ty = t.you;

    const [showBodyModal, setShowBodyModal] = useState(false);

    return (
        <div id="profile-section-body">
            <div className="label-reference px-1 mb-1.5">{ty.body}</div>
            <div className="premium-theme-panel rounded-[8px] p-4">
                <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-muted">{ty.bodySubtitle}</p>
                    <button
                        type="button"
                        onClick={() => setShowBodyModal(true)}
                        className="px-3 py-1.5 bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded-[6px] min-h-11 text-xs font-semibold tracking-normal hover:bg-primary-500/20 active:scale-95 transition-all"
                    >
                        {ty.edit}
                    </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-[6px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-elevated)/0.6)] p-2.5 text-center">
                        <div className="text-xs font-semibold tracking-normal text-zinc-500">{ty.weight}</div>
                        <div className="mt-0.5 text-sm font-black text-[rgb(var(--text-primary))] tabular-nums">
                            {userProfile?.bodyWeight ? `${formatWeight(userProfile.bodyWeight, resolveWeightUnit(config), lang)} ${unitLabel(resolveWeightUnit(config)).toLowerCase()}` : '—'}
                        </div>
                    </div>
                    <div className="rounded-[6px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-elevated)/0.6)] p-2.5 text-center">
                        <div className="text-xs font-semibold tracking-normal text-zinc-500">{ty.height}</div>
                        <div className="mt-0.5 text-sm font-black text-[rgb(var(--text-primary))] tabular-nums">
                            {userProfile?.height ? `${userProfile.height} cm` : '—'}
                        </div>
                    </div>
                    <div className="rounded-[6px] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-elevated)/0.6)] p-2.5 text-center">
                        <div className="text-xs font-semibold tracking-normal text-zinc-500">{ty.bodyFat}</div>
                        <div className="mt-0.5 text-sm font-black text-[rgb(var(--text-primary))] tabular-nums">
                            {userProfile?.bodyFat ? `${userProfile.bodyFat}%` : '—'}
                        </div>
                    </div>
                </div>
            </div>
            <HealthConnectCard lang={lang} bodyLogs={bodyLogs} setBodyLogs={setBodyLogs} />

            <BodyMetricsModal
                open={showBodyModal}
                onClose={() => setShowBodyModal(false)}
                userProfile={userProfile || null}
                onSave={(updated) => {
                    if (setUserProfile) {
                        setUserProfile((prev: any) => ({ ...prev, ...updated }));
                    }
                    if (updated?.bodyWeight && updated.bodyWeight > 0 && setBodyLogs) {
                        const now = Date.now();
                        const today = todayLocalDateKey();
                        const entry = {
                            id: now,
                            date: now,
                            weight: updated.bodyWeight,
                            ...(updated.bodyFat !== undefined ? { bodyFat: updated.bodyFat } : {}),
                        };
                        setBodyLogs((prev: any[]) => [
                            entry,
                            ...(prev || []).filter((l: any) => formatLocalDateKey(new Date(l.date)) !== today),
                        ]);
                    }
                }}
                lang={lang}
                unit={resolveWeightUnit(config)}
            />
        </div>
    );
};
