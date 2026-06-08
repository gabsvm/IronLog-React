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
        onLog({
            weight: Number(weight) || 0,
            bodyFat: bodyFat ? Number(bodyFat) : undefined,
            notes: notes || undefined
        });
        setNotes('');
        onClose();
    };

    const t = {
        title: lang === 'es' ? 'Registrar Peso' : 'Log Weight',
        currentWeight: lang === 'es' ? 'Peso Actual' : 'Current Weight',
        bodyFat: lang === 'es' ? 'Grasa Corporal' : 'Body Fat',
        notes: lang === 'es' ? 'Notas' : 'Notes',
        save: lang === 'es' ? 'Guardar' : 'Save',
        cancel: lang === 'es' ? 'Cancelar' : 'Cancel',
    };

    return (
        <Sheet
            open={isOpen}
            onOpenChange={(open) => !open && onClose()}
            title={t.title}
            accent="primary"
            footer={
                <div className="flex gap-3">
                    <Button variant="secondary" onClick={onClose} fullWidth>
                        {t.cancel}
                    </Button>
                    <Button onClick={handleSubmit} fullWidth>
                        {t.save}
                    </Button>
                </div>
            }
        >
            <div className="p-5 space-y-5">
                <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 px-1">
                        {t.currentWeight}
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            inputMode="decimal"
                            value={weight}
                            onChange={(e) => setWeight(e.target.value)}
                            placeholder="0.0"
                            className="w-full bg-zinc-800 border border-zinc-700/50 rounded-2xl px-6 pr-20 py-5 text-3xl font-black text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all placeholder:text-zinc-600 glow-input-neon"
                            autoFocus
                        />
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-300 font-black uppercase tracking-tighter text-sm bg-zinc-700/50 px-2.5 py-1 rounded-lg">kg</div>
                    </div>
                </div>

                <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 px-1">
                        {t.bodyFat} (%)
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            inputMode="decimal"
                            value={bodyFat}
                            onChange={(e) => setBodyFat(e.target.value)}
                            placeholder="0.0"
                            className="w-full bg-zinc-800 border border-zinc-700/50 rounded-2xl px-6 pr-16 py-4 text-xl font-bold text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all placeholder:text-zinc-600 glow-input-neon"
                        />
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-300 font-black text-sm bg-zinc-700/50 px-2.5 py-1 rounded-lg">%</div>
                    </div>
                </div>

                <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 px-1">
                        {t.notes}
                    </label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder={lang === 'es' ? 'Añade una nota...' : 'Add a note...'}
                        className="w-full bg-zinc-800 border border-zinc-700/50 rounded-2xl px-4 py-4 min-h-[90px] text-sm font-medium text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all resize-none placeholder:text-zinc-600 glow-input-neon"
                    />
                </div>
            </div>
        </Sheet>
    );
};
