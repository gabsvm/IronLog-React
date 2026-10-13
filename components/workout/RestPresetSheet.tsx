import React, { useState } from 'react';
import { Sheet } from '../ui/Sheet';
import { triggerHaptic } from '../../utils/audio';
import { TRANSLATIONS } from '../../constants';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialSeconds: number;
    onSave: (seconds: number | undefined) => void;
    lang: 'en' | 'es';
}

/**
 * Sheet for configuring a per-exercise rest timer preset.
 * Migrated from inline modal inside SortableExerciseCard to use the unified Sheet primitive.
 */
export const RestPresetSheet: React.FC<Props> = ({ open, onOpenChange, initialSeconds, onSave, lang }) => {
    const t = TRANSLATIONS[lang];
    const r = t.restPreset;
    const [value, setValue] = useState(String(initialSeconds || ''));

    // Reset input every time the sheet opens
    React.useEffect(() => {
        if (open) setValue(String(initialSeconds || ''));
    }, [open, initialSeconds]);

    const handleSave = () => {
        const secs = parseInt(value, 10);
        onSave(isNaN(secs) || secs <= 0 ? undefined : secs);
        triggerHaptic('medium');
        onOpenChange(false);
    };

    return (
        <Sheet
            open={open}
            onOpenChange={onOpenChange}
            title={r.title}
            accent="primary"
            footer={
                <button
                    onClick={handleSave}
                    className="expressive-press min-h-12 w-full bg-primary-500 hover:bg-primary-400 text-zinc-950 font-bold rounded-full transition-colors duration-fast ease-natural focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                >
                    {t.save}
                </button>
            }
        >
            <div className="p-5 space-y-4">
                <input
                    type="number"
                    inputMode="numeric"
                    autoFocus
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="120"
                    aria-label={r.seconds}
                    className="premium-form-input w-full p-3 text-center !text-xl !font-bold focus:ring-2 focus:ring-primary-500"
                />
                <div className="flex gap-2">
                    {[60, 90, 120, 180].map((s) => (
                        <button
                            key={s}
                            onClick={() => setValue(String(s))}
                            className={`expressive-press min-h-11 flex-1 rounded-full text-xs font-bold transition-colors duration-fast ease-natural ${value === String(s) ? 'bg-primary-500 text-zinc-950' : 'bg-[rgb(var(--surface-elevated))] text-[rgb(var(--text-secondary))] hover:bg-primary-500/10'}`}
                        >
                            {s}s
                        </button>
                    ))}
                </div>
            </div>
        </Sheet>
    );
};
