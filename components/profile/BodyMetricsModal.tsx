import { formatMessage } from '../../utils/i18n';
import React, { useState, useEffect } from 'react';
import { Sheet } from '../ui/Sheet';
import { Button } from '../ui/Button';
import { UserProfile, WeightUnit } from '../../types';
import { fromDisplay, toDisplay, unitLabel } from '../../utils/units';
import { TRANSLATIONS } from '../../constants/translations';
import { fromDisplaySize, sizeUnitLabel, type SizeUnit } from '../../utils/strongTraining';
import { toSizeDisplay } from '../../utils/measurements';

interface BodyMetricsModalProps {
    open: boolean;
    onClose: () => void;
    userProfile: UserProfile | null;
    onSave: (updated: Partial<UserProfile>) => void;
    lang: 'es' | 'en';
    unit?: WeightUnit;
    /** Display/entry unit for height (stored canonical cm). */
    sizeUnit?: SizeUnit;
}

export const BodyMetricsModal: React.FC<BodyMetricsModalProps> = ({
    open,
    onClose,
    userProfile,
    onSave,
    lang,
    unit = 'kg',
    sizeUnit = 'cm',
}) => {
    const [bodyWeight, setBodyWeight] = useState<string>('');
    const [height, setHeight] = useState<string>('');
    const [bodyFat, setBodyFat] = useState<string>('');

    useEffect(() => {
        if (open) {
            setBodyWeight(userProfile?.bodyWeight ? String(toDisplay(userProfile.bodyWeight, unit)) : '');
            setHeight(userProfile?.height ? String(toSizeDisplay(userProfile.height, sizeUnit)) : '');
            setBodyFat(userProfile?.bodyFat ? String(userProfile.bodyFat) : '');
        }
    }, [open, userProfile, unit, sizeUnit]);

    const handleSave = () => {
        const parsedWeight = fromDisplay(parseFloat(bodyWeight), unit);
        const parsedHeightCm = fromDisplaySize(parseFloat(height), sizeUnit);
        const parsedFat = parseFloat(bodyFat);

        onSave({
            bodyWeight: Number.isFinite(parsedWeight) && parsedWeight > 0 ? parsedWeight : undefined,
            height: Number.isFinite(parsedHeightCm) && parsedHeightCm > 0 ? Math.round(parsedHeightCm * 100) / 100 : undefined,
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
                <p className="text-xs text-muted">
                    {TRANSLATIONS[lang].copy.bodyMetricsModal.updateYourMetricsFor}
                </p>

                <div className="space-y-3">
                    <div>
                        <label className="text-sm font-semibold text-muted block mb-1">
                            {formatMessage(TRANSLATIONS[lang].copy.bodyMetricsModal.bodyWeight, { v: unitLabel(unit).toLowerCase() })}
                        </label>
                        <input
                            type="number"
                            step="0.1"
                            value={bodyWeight}
                            onChange={(e) => setBodyWeight(e.target.value)}
                            placeholder="e.g. 75"
                            className="gl-input min-h-11 text-base font-medium"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-sm font-semibold text-muted block mb-1">
                                {TRANSLATIONS[lang].copy.bodyMetricsModal.heightCm.replace('cm', sizeUnitLabel(sizeUnit))}
                            </label>
                            <input
                                type="number"
                                step="1"
                                value={height}
                                onChange={(e) => setHeight(e.target.value)}
                                placeholder="e.g. 175"
                            className="gl-input min-h-11 text-base font-medium"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-semibold text-muted block mb-1">
                                {TRANSLATIONS[lang].copy.bodyMetricsModal.bodyFat}
                            </label>
                            <input
                                type="number"
                                step="0.5"
                                value={bodyFat}
                                onChange={(e) => setBodyFat(e.target.value)}
                            className="gl-input min-h-11 text-base font-medium"
                        />
                        </div>
                    </div>
                </div>
            </div>
        </Sheet>
    );
};
