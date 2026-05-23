import React, { useState } from 'react';
import { Sheet } from '../ui/Sheet';
import { triggerHaptic } from '../../utils/audio';

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
    const [value, setValue] = useState(String(initialSeconds || ''));

    // Reset input every time the sheet opens
    React.useEffect(() => {
        if (open) setValue(String(initialSeconds || ''));
    }, [open, initialSeconds]);

    const handleSave = () => {
        const secs = parseInt(value);
        onSave(isNaN(secs) || secs <= 0 ? undefined : secs);
        triggerHaptic('medium');
        onOpenChange(false);
    };

    return (
        <Sheet
            open={open}
            onOpenChange={onOpenChange}
            title={lang === 'es' ? 'Descanso (segundos)' : 'Rest Time (seconds)'}
            accent="primary"
            footer={
                <button
                    onClick={handleSave}
                    className="w-full py-3 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-xl transition-colors duration-fast ease-natural focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                >
                    {lang === 'es' ? 'Guardar' : 'Save'}
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
                    aria-label={lang === 'es' ? 'Segundos de descanso' : 'Rest seconds'}
                    className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl p-3 text-center font-bold text-xl text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
                />
                <div className="flex gap-2">
                    {[60, 90, 120, 180].map((s) => (
                        <button
                            key={s}
                            onClick={() => setValue(String(s))}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors duration-fast ease-natural ${value === String(s) ? 'bg-primary-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}
                        >
                            {s}s
                        </button>
                    ))}
                </div>
            </div>
        </Sheet>
    );
};
