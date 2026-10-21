import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Sheet } from '../ui/Sheet';
import { Button } from '../ui/Button';
import { TRANSLATIONS } from '../../constants';
import { fromDisplay, resolveWeightUnit, toDisplay, unitLabel } from '../../utils/units';

interface LogWeightModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLog: (data: { weight: number; bodyFat?: number; notes?: string }) => void;
}

export const LogWeightModal: React.FC<LogWeightModalProps> = ({ isOpen, onClose, onLog }) => {
    const { lang, userProfile, config } = useApp();
    const unit = resolveWeightUnit(config);
    const [weight, setWeight] = useState<string>(userProfile?.bodyWeight ? String(toDisplay(userProfile.bodyWeight, unit)) : '');
    const [bodyFat, setBodyFat] = useState<string>(String(userProfile?.bodyFat || ''));
    const [notes, setNotes] = useState<string>('');

    useEffect(() => {
        if (isOpen) {
            setWeight(userProfile?.bodyWeight ? String(toDisplay(userProfile.bodyWeight, unit)) : '');
            setBodyFat(userProfile?.bodyFat !== undefined && userProfile?.bodyFat !== null ? String(userProfile.bodyFat) : '');
        }
    }, [isOpen, unit, userProfile?.bodyWeight, userProfile?.bodyFat]);

    const numericWeight = Number(weight);
    const isValid = Number.isFinite(numericWeight) && numericWeight > 0;

    const handleSubmit = () => {
        if (!isValid) return;
        onLog({
            weight: fromDisplay(numericWeight, unit) || 0,
            bodyFat: bodyFat ? Number(bodyFat) : undefined,
            notes: notes || undefined
        });
        setNotes('');
        onClose();
    };

    const t = TRANSLATIONS[lang];
    const w = t.logWeight;

    return (
        <Sheet
            open={isOpen}
            onOpenChange={(open) => !open && onClose()}
            title={w.title}
            accent="primary"
            footer={
                <div className="flex gap-3">
                    <Button variant="secondary" onClick={onClose} fullWidth>
                        {t.cancel}
                    </Button>
                    <Button onClick={handleSubmit} disabled={!isValid} fullWidth>
                        {t.save}
                    </Button>
                </div>
            }
        >
            <div className="p-5 space-y-5">
                <div>
                    <label className="block text-sm font-semibold tracking-normal text-muted mb-2 px-1">
                        {w.currentWeight}
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            inputMode="decimal"
                            value={weight}
                            onChange={(e) => setWeight(e.target.value)}
                            placeholder="0.0"
                            className="w-full premium-form-input px-6 pr-20 py-5 text-3xl font-black text-[rgb(var(--text-primary))] focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all placeholder:text-muted "
                            autoFocus
                        />
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 text-[rgb(var(--text-secondary))] font-black uppercase tracking-tighter text-sm bg-[rgb(var(--surface-elevated))] px-2.5 py-1 rounded-full">{unitLabel(unit).toLowerCase()}</div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold tracking-normal text-muted mb-2 px-1">
                        {w.bodyFat} (%)
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            inputMode="decimal"
                            value={bodyFat}
                            onChange={(e) => setBodyFat(e.target.value)}
                            placeholder="0.0"
                            className="w-full premium-form-input px-6 pr-16 py-4 text-xl font-bold text-[rgb(var(--text-primary))] focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all placeholder:text-muted "
                        />
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 text-[rgb(var(--text-secondary))] font-black text-sm bg-[rgb(var(--surface-elevated))] px-2.5 py-1 rounded-full">%</div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold tracking-normal text-muted mb-2 px-1">
                        {t.notes}
                    </label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder={w.notePlaceholder}
                        className="nutri-field w-full premium-form-input px-4 py-4 min-h-[90px] font-medium text-[rgb(var(--text-primary))] focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all resize-none placeholder:text-muted "
                    />
                </div>
            </div>
        </Sheet>
    );
};
