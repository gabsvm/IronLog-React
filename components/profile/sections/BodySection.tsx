import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { TRANSLATIONS } from '../../../constants';
import { BodyMetricsModal } from '../BodyMetricsModal';
import { HealthConnectCard } from '../HealthConnectCard';
import { formatWeight, resolveWeightUnit, unitLabel } from '../../../utils/units';

/** Q18: "Tu cuerpo" section, moved verbatim from ProfileSheet. */
export const BodySection: React.FC = () => {
    const { lang, userProfile, setUserProfile, config, bodyLogs, setBodyLogs } = useApp();
    const t = TRANSLATIONS[lang];
    const ty = t.you;

    const [showBodyModal, setShowBodyModal] = useState(false);

    return (
        <div id="profile-section-body">
            <div className="label-reference px-1 mb-1.5">{ty.body}</div>
            <div className="p-4 bg-zinc-50 dark:bg-white/5 rounded-2xl border border-zinc-100 dark:border-white/5">
                <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] text-zinc-400">{ty.bodySubtitle}</p>
                    <button
                        type="button"
                        onClick={() => setShowBodyModal(true)}
                        className="px-3 py-1.5 bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded-lg text-xs font-black uppercase tracking-wider hover:bg-primary-500/20 active:scale-95 transition-all"
                    >
                        {ty.edit}
                    </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-xl border border-zinc-200/60 dark:border-white/5 bg-white dark:bg-zinc-800 p-2.5 text-center">
                        <div className="text-[9px] font-black uppercase tracking-wider text-zinc-500">{ty.weight}</div>
                        <div className="mt-0.5 text-sm font-black text-zinc-900 dark:text-white tabular-nums">
                            {userProfile?.bodyWeight ? `${formatWeight(userProfile.bodyWeight, resolveWeightUnit(config), lang)} ${unitLabel(resolveWeightUnit(config)).toLowerCase()}` : '—'}
                        </div>
                    </div>
                    <div className="rounded-xl border border-zinc-200/60 dark:border-white/5 bg-white dark:bg-zinc-800 p-2.5 text-center">
                        <div className="text-[9px] font-black uppercase tracking-wider text-zinc-500">{ty.height}</div>
                        <div className="mt-0.5 text-sm font-black text-zinc-900 dark:text-white tabular-nums">
                            {userProfile?.height ? `${userProfile.height} cm` : '—'}
                        </div>
                    </div>
                    <div className="rounded-xl border border-zinc-200/60 dark:border-white/5 bg-white dark:bg-zinc-800 p-2.5 text-center">
                        <div className="text-[9px] font-black uppercase tracking-wider text-zinc-500">{ty.bodyFat}</div>
                        <div className="mt-0.5 text-sm font-black text-zinc-900 dark:text-white tabular-nums">
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
                }}
                lang={lang}
                unit={resolveWeightUnit(config)}
            />
        </div>
    );
};
