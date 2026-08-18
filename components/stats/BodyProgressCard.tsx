import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Icon } from '../ui/Icon';
import { LogWeightModal } from '../nutrition/LogWeightModal';

export const BodyProgressCard: React.FC = () => {
    const { lang, bodyLogs, setBodyLogs, userProfile, setUserProfile } = useApp();
    const [open, setOpen] = useState(false);
    const safeLogs = Array.isArray(bodyLogs) ? bodyLogs : [];

    const sorted = useMemo(() => [...safeLogs].sort((a, b) => b.date - a.date), [safeLogs]);
    const latest = sorted[0];
    const previous = sorted[1];
    const currentWeight = latest?.weight ?? userProfile?.bodyWeight;
    const currentBodyFat = latest?.bodyFat ?? userProfile?.bodyFat;
    const weightChange = latest && previous ? latest.weight - previous.weight : null;

    const logMeasurement = (data: { weight: number; bodyFat?: number; notes?: string }) => {
        if (!data.weight || data.weight <= 0) return;
        const entry = { id: Date.now(), date: Date.now(), weight: data.weight, bodyFat: data.bodyFat, notes: data.notes };
        setBodyLogs(prev => [entry, ...(Array.isArray(prev) ? prev : [])]);
        setUserProfile(prev => ({ ...prev, bodyWeight: data.weight, bodyFat: data.bodyFat ?? prev.bodyFat }));
    };

    return (
        <>
            <section className="mx-4 mb-3 rounded-2xl border border-[rgb(var(--border-subtle)/0.75)] bg-[rgb(var(--surface-raised)/0.58)] p-4">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2"><Icon name="Scale" size={15} className="text-primary-500" /><h3 className="text-sm font-black">{lang === 'es' ? 'Composición corporal' : 'Body composition'}</h3></div>
                        <p className="mt-1 text-[10px] text-[rgb(var(--text-muted))]">{lang === 'es' ? 'Peso y grasa corporal en el mismo lugar que tu progreso.' : 'Weight and body fat alongside training progress.'}</p>
                    </div>
                    <button type="button" onClick={() => setOpen(true)} className="flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg bg-primary-500/10 px-3 text-[11px] font-black text-primary-500 active:scale-95"><Icon name="Plus" size={13} /> {lang === 'es' ? 'Registrar' : 'Log'}</button>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="rounded-xl bg-[rgb(var(--surface-base))] p-3">
                        <div className="text-[9px] font-bold uppercase tracking-[0.08em] text-[rgb(var(--text-muted))]">{lang === 'es' ? 'Peso actual' : 'Current weight'}</div>
                        <div className="mt-1 flex items-end gap-1.5"><span className="text-2xl font-black tabular-nums tracking-tight">{currentWeight ? Number(currentWeight).toFixed(1) : '—'}</span>{currentWeight && <span className="pb-0.5 text-[10px] font-bold text-[rgb(var(--text-muted))]">kg</span>}</div>
                        {weightChange !== null && <div className={`mt-1 text-[10px] font-bold tabular-nums ${Math.abs(weightChange) < 0.05 ? 'text-[rgb(var(--text-muted))]' : weightChange > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>{weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)} kg {lang === 'es' ? 'vs anterior' : 'vs previous'}</div>}
                    </div>
                    <div className="rounded-xl bg-[rgb(var(--surface-base))] p-3">
                        <div className="text-[9px] font-bold uppercase tracking-[0.08em] text-[rgb(var(--text-muted))]">{lang === 'es' ? 'Grasa corporal' : 'Body fat'}</div>
                        <div className="mt-1 flex items-end gap-1.5"><span className="text-2xl font-black tabular-nums tracking-tight">{currentBodyFat != null ? Number(currentBodyFat).toFixed(1) : '—'}</span>{currentBodyFat != null && <span className="pb-0.5 text-[10px] font-bold text-[rgb(var(--text-muted))]">%</span>}</div>
                        <div className="mt-1 text-[10px] text-[rgb(var(--text-muted))]">{sorted.length ? `${sorted.length} ${lang === 'es' ? 'registros' : 'entries'}` : (lang === 'es' ? 'Sin historial aún' : 'No history yet')}</div>
                    </div>
                </div>
            </section>

            <LogWeightModal isOpen={open} onClose={() => setOpen(false)} onLog={logMeasurement} />
        </>
    );
};
