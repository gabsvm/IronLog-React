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
            {/* The edit action sits with the section title, so the panel holds only the values. */}
            <div className="mb-1.5 mt-4 flex items-center justify-between px-1">
                <div className="label-reference !m-0">{ty.body}</div>
                <button
                    type="button"
                    onClick={() => setShowBodyModal(true)}
                    className="gl-textbtn px-2"
                >
                    {ty.edit}
                </button>
            </div>
            <div className="gl-panel p-3">
                <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-elevated)/0.5)] p-2.5 text-center">
                        <div className="text-xs font-semibold text-muted">{ty.weight}</div>
                        <div className="gl-num mt-0.5 text-sm font-bold text-[rgb(var(--text-primary))]">
                            {userProfile?.bodyWeight ? `${formatWeight(userProfile.bodyWeight, resolveWeightUnit(config), lang)} ${unitLabel(resolveWeightUnit(config)).toLowerCase()}` : '—'}
                        </div>
                    </div>
                    <div className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-elevated)/0.5)] p-2.5 text-center">
                        <div className="text-xs font-semibold text-muted">{ty.height}</div>
                        <div className="gl-num mt-0.5 text-sm font-bold text-[rgb(var(--text-primary))]">
                            {userProfile?.height ? `${userProfile.height} cm` : '—'}
                        </div>
                    </div>
                    <div className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-elevated)/0.5)] p-2.5 text-center">
                        <div className="text-xs font-semibold text-muted">{ty.bodyFat}</div>
                        <div className="gl-num mt-0.5 text-sm font-bold text-[rgb(var(--text-primary))]">
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
