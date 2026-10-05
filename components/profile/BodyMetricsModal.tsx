import { formatMessage } from '../../utils/i18n';
import React, { useState, useEffect } from 'react';
import { Sheet } from '../ui/Sheet';
import { Button } from '../ui/Button';
import { UserProfile, WeightUnit } from '../../types';
import { fromDisplay, toDisplay, unitLabel } from '../../utils/units';
import { TRANSLATIONS } from '../../constants/translations';

interface BodyMetricsModalProps {
    open: boolean;
    onClose: () => void;
    userProfile: UserProfile | null;
    onSave: (updated: Partial<UserProfile>) => void;
    lang: 'es' | 'en';
    unit?: WeightUnit;
}

export const BodyMetricsModal: React.FC<BodyMetricsModalProps> = ({
    open,
    onClose,
    userProfile,
    onSave,
    lang,
    unit = 'kg',
}) => {
    const [bodyWeight, setBodyWeight] = useState<string>('');
    const [height, setHeight] = useState<string>('');
    const [bodyFat, setBodyFat] = useState<string>('');

    useEffect(() => {
        if (open) {
            setBodyWeight(userProfile?.bodyWeight ? String(toDisplay(userProfile.bodyWeight, unit)) : '');
            setHeight(userProfile?.height ? String(userProfile.height) : '');
            setBodyFat(userProfile?.bodyFat ? String(userProfile.bodyFat) : '');
        }
    }, [open, userProfile, unit]);

    const handleSave = () => {
        const parsedWeight = fromDisplay(parseFloat(bodyWeight), unit);
        const parsedHeight = parseFloat(height);
        const parsedFat = parseFloat(bodyFat);

        onSave({
            bodyWeight: Number.isFinite(parsedWeight) && parsedWeight > 0 ? parsedWeight : undefined,
            height: Number.isFinite(parsedHeight) && parsedHeight > 0 ? parsedHeight : undefined,
            bodyFat: Number.isFinite(parsedFat) && parsedFat > 0 ? parsedFat : undefined,
        });
        onClose();
    };

    return (
        <Sheet
            open={open}
            onOpenChange={(next) => { if (!next) onClose(); }}
            title={TRANSLATIONS[lang].copy.bodyMetricsModal.bodyMetrics}
            accent="primary"
            footer={
                <div className="flex gap-2">
                    <Button variant="ghost" fullWidth onClick={onClose}>
                        {TRANSLATIONS[lang].copy.bodyMetricsModal.cancel}
                    </Button>
                    <Button variant="primary" fullWidth onClick={handleSave}>
                        {TRANSLATIONS[lang].copy.bodyMetricsModal.save}
                    </Button>
                </div>
            }
        >
            <div className="p-5 space-y-4">
                <p className="text-xs text-zinc-500">
                    {TRANSLATIONS[lang].copy.bodyMetricsModal.updateYourMetricsFor}
                </p>

                <div className="space-y-3">
                    <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">
                            {formatMessage(TRANSLATIONS[lang].copy.bodyMetricsModal.bodyWeight, { v: unitLabel(unit).toLowerCase() })}
                        </label>
                        <input
                            type="number"
                            step="0.1"
                            value={bodyWeight}
                            onChange={(e) => setBodyWeight(e.target.value)}
                            placeholder="e.g. 75"
                            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-base font-bold text-zinc-900 outline-none focus:border-primary-500 dark:border-white/10 dark:bg-zinc-800 dark:text-white"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">
                                {TRANSLATIONS[lang].copy.bodyMetricsModal.heightCm}
                            </label>
                            <input
                                type="number"
                                step="1"
                                value={height}
                                onChange={(e) => setHeight(e.target.value)}
                                placeholder="e.g. 175"
                                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-base font-bold text-zinc-900 outline-none focus:border-primary-500 dark:border-white/10 dark:bg-zinc-800 dark:text-white"
                            />
                        </div>

                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">
                                {TRANSLATIONS[lang].copy.bodyMetricsModal.bodyFat}
                            </label>
                            <input
                                type="number"
                                step="0.5"
                                value={bodyFat}
                                onChange={(e) => setBodyFat(e.target.value)}
                                placeholder="e.g. 15"
                                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-base font-bold text-zinc-900 outline-none focus:border-primary-500 dark:border-white/10 dark:bg-zinc-800 dark:text-white"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </Sheet>
    );
};
