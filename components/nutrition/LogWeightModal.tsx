import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Sheet } from '../ui/Sheet';
import { Button } from '../ui/Button';

interface LogWeightModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLog: (data: { weight: number; bodyFat?: number; notes?: string }) => void;
}

export const LogWeightModal: React.FC<LogWeightModalProps> = ({ isOpen, onClose, onLog }) => {
    const { lang, userProfile } = useApp();
    const [weight, setWeight] = useState<string>(String(userProfile?.bodyWeight || ''));
    const [bodyFat, setBodyFat] = useState<string>(String(userProfile?.bodyFat || ''));
    const [notes, setNotes] = useState<string>('');

    const handleSubmit = () => {
        onLog({ weight: Number(weight) || 0, bodyFat: bodyFat ? Number(bodyFat) : undefined, notes: notes || undefined });
        setNotes('');
        onClose();
    };

    const t = {
        title: lang === 'es' ? 'Registrar composición' : 'Log body composition',
        currentWeight: lang === 'es' ? 'Peso actual' : 'Current weight',
        bodyFat: lang === 'es' ? 'Grasa corporal' : 'Body fat',
        notes: lang === 'es' ? 'Nota opcional' : 'Optional note',
        save: lang === 'es' ? 'Guardar' : 'Save',
        cancel: lang === 'es' ? 'Cancelar' : 'Cancel',
    };

    const inputClass = 'w-full rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-base))] px-4 text-[rgb(var(--text-primary))] outline-none transition-colors placeholder:text-[rgb(var(--text-muted))] focus:border-primary-500/45 focus:ring-2 focus:ring-primary-500/10';

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()} title={t.title} accent="primary" footer={<div className="grid grid-cols-2 gap-3"><Button variant="secondary" onClick={onClose}>{t.cancel}</Button><Button onClick={handleSubmit} disabled={!Number(weight)}>{t.save}</Button></div>}>
            <div className="space-y-5 p-5">
                <div>
                    <label className="mb-2 block px-1 text-[10px] font-bold uppercase tracking-[0.09em] text-[rgb(var(--text-muted))]">{t.currentWeight}</label>
                    <div className="relative"><input type="number" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="0.0" className={`${inputClass} h-14 pr-16 text-2xl font-black tabular-nums`} autoFocus /><div className="absolute right-4 top-1/2 -translate-y-1/2 rounded-lg bg-[rgb(var(--surface-raised))] px-2 py-1 text-xs font-bold text-[rgb(var(--text-muted))]">kg</div></div>
                </div>

                <div>
                    <label className="mb-2 block px-1 text-[10px] font-bold uppercase tracking-[0.09em] text-[rgb(var(--text-muted))]">{t.bodyFat}</label>
                    <div className="relative"><input type="number" inputMode="decimal" value={bodyFat} onChange={(e) => setBodyFat(e.target.value)} placeholder="0.0" className={`${inputClass} h-12 pr-14 text-lg font-bold tabular-nums`} /><div className="absolute right-4 top-1/2 -translate-y-1/2 rounded-lg bg-[rgb(var(--surface-raised))] px-2 py-1 text-xs font-bold text-[rgb(var(--text-muted))]">%</div></div>
                </div>

                <div>
                    <label className="mb-2 block px-1 text-[10px] font-bold uppercase tracking-[0.09em] text-[rgb(var(--text-muted))]">{t.notes}</label>
                    <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={lang === 'es' ? 'Ej.: misma hora, ayunas…' : 'e.g. same time, fasted…'} className={`${inputClass} min-h-[86px] resize-none py-3 text-sm`} />
                </div>
            </div>
        </Sheet>
    );
};
