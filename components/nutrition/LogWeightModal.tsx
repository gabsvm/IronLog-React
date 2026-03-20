
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../ui/Modal';

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

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={lang === 'es' ? 'Registrar Peso' : 'Log Weight'}
            footer={
                <div className="flex gap-3">
                    <button type="button" onClick={onClose} className="flex-1 py-3.5 rounded-2xl font-bold text-sm text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 transition-all active:scale-95">
                        {lang === 'es' ? 'Cancelar' : 'Cancel'}
                    </button>
                    <button type="button" onClick={handleSubmit} className="flex-1 py-3.5 rounded-2xl font-black text-sm text-white bg-zinc-900 dark:bg-white dark:text-black hover:bg-zinc-700 dark:hover:bg-zinc-100 shadow-lg transition-all active:scale-95">
                        {lang === 'es' ? 'Guardar' : 'Save'}
                    </button>
                </div>
            }
        >
            <div className="space-y-6">
                <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-2 px-1">
                        {lang === 'es' ? 'Peso Actual' : 'Current Weight'}
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            inputMode="decimal"
                            value={weight}
                            onChange={(e) => setWeight(e.target.value)}
                            placeholder="0.0"
                            className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded-2xl px-6 pr-20 py-5 text-3xl font-black text-zinc-900 dark:text-white focus:border-zinc-500 dark:focus:border-white/50 outline-none transition-all placeholder:text-zinc-300 dark:placeholder:text-zinc-600"
                            autoFocus
                        />
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-300 font-black uppercase tracking-tighter text-sm bg-zinc-100 dark:bg-white/10 px-2.5 py-1 rounded-lg">kg</div>
                    </div>
                </div>

                <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-2 px-1">
                        {lang === 'es' ? 'Grasa Corporal' : 'Body Fat'} (%)
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            inputMode="decimal"
                            value={bodyFat}
                            onChange={(e) => setBodyFat(e.target.value)}
                            placeholder="0.0"
                            className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded-2xl px-6 pr-16 py-4 text-xl font-bold text-zinc-900 dark:text-white focus:border-zinc-500 dark:focus:border-white/50 outline-none transition-all placeholder:text-zinc-300 dark:placeholder:text-zinc-600"
                        />
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-300 font-black text-sm bg-zinc-100 dark:bg-white/10 px-2.5 py-1 rounded-lg">%</div>
                    </div>
                </div>

                <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-2 px-1">
                        {lang === 'es' ? 'Notas' : 'Notes'}
                    </label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder={lang === 'es' ? 'Añade una nota...' : 'Add a note...'}
                        className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded-2xl px-4 py-4 min-h-[90px] text-sm font-medium text-zinc-700 dark:text-zinc-200 focus:border-zinc-500 dark:focus:border-white/50 outline-none transition-all resize-none placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                    />
                </div>
            </div>
        </Modal>
    );
};
