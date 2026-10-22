import React, { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { NutriView, NutriSubTab } from '../../views/NutriView';
import { TRANSLATIONS } from '../../constants';

vi.mock('../../context/AppContext', () => ({
    useApp: () => ({
        nutritionLogs: [], setNutritionLogs: vi.fn(),
        lang: 'en', config: { weightUnit: 'kg' },
        cardioSessions: [], setCardioSessions: vi.fn(),
        nutritionGoal: { calories: 2500, protein: 180, carbs: 250, fat: 70 },
        setNutritionGoal: vi.fn(), userProfile: null, setUserProfile: vi.fn(),
        bodyLogs: [], setBodyLogs: vi.fn(), customFoods: [], setCustomFoods: vi.fn(),
    }),
    useAppPreferences: () => ({ lang: 'en' }),
    useAppConfig: () => ({ config: { weightUnit: 'kg' } }),
}));
vi.mock('../../utils/audio', () => ({ triggerHaptic: vi.fn() }));
vi.mock('../../components/ui/Sheet', () => ({
    Sheet: ({ open, title, children, onOpenChange }: {
        open: boolean; title: string; children: React.ReactNode;
        onOpenChange: (open: boolean) => void;
    }) => open ? <section role="dialog" aria-label={title}>
        <button onClick={() => onOpenChange(false)}>Close nutrition form</button>
        {children}
    </section> : null,
}));
vi.mock('../../components/ui/ConfirmModal', () => ({ ConfirmModal: () => null }));

const copy = TRANSLATIONS.en;

describe('nutrition navigation boundaries', () => {

    it('consumes meal shortcuts through the existing form and can handle another request after closing', () => {
        const handled = vi.fn();
        const Harness = () => {
            const [requested, setRequested] = useState(true);
            const [tab, setTab] = useState<NutriSubTab>('today');
            return <>
                <button onClick={() => setRequested(true)}>Request meal shortcut</button>
                <NutriView subTab={tab} onSubTabChange={setTab} addMealRequested={requested}
                    onAddMealHandled={() => { handled(); setRequested(false); }} />
            </>;
        };
        render(<Harness />);
        expect(screen.getByRole('dialog', { name: copy.copy.addMealModal.addFood })).toBeTruthy();
        expect(handled).toHaveBeenCalledTimes(1);
        fireEvent.click(screen.getByRole('button', { name: 'Close nutrition form' }));
        expect(screen.queryByRole('dialog', { name: copy.copy.addMealModal.addFood })).toBeNull();
        fireEvent.click(screen.getByRole('button', { name: 'Request meal shortcut' }));
        expect(screen.getByRole('dialog', { name: copy.copy.addMealModal.addFood })).toBeTruthy();
        expect(handled).toHaveBeenCalledTimes(2);
    });
});
