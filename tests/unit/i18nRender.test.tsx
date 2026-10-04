import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TRANSLATIONS } from '../../constants';
import { NextSessionCard } from '../../views/home/NextSessionCard';
import { TemplateSelector } from '../../views/home/TemplateSelector';
import { ExerciseProtocolBanners } from '../../components/workout/ExerciseProtocolBanners';
import { RestPresetSheet } from '../../components/workout/RestPresetSheet';
import { WaterTracker } from '../../views/nutri/WaterTracker';

// Q19: key migrated screens render their TRANSLATIONS strings in both
// languages with no missing keys (a missing key renders nothing or the
// literal "undefined" inside composed templates).
const expectNoUndefined = () => {
    expect(document.body.textContent || '').not.toContain('undefined');
};

describe('Q19: migrated screens render in es and en', () => {
    const cardProps = {
        nextDayDef: { dayName: { es: 'Pecho', en: 'Chest' }, slots: [{ muscle: 'CHEST' }] },
        isSessionActive: true,
        nextWorkoutIdx: 0,
        startSession: vi.fn(),
        handleSkipClick: vi.fn(),
        tm: (m: string) => m,
        estimatedMin: 45,
        adherencePct: 80,
    };

    it.each(['es', 'en'] as const)('NextSessionCard renders migrated keys (%s)', (lang) => {
        const { unmount } = render(<NextSessionCard {...cardProps} lang={lang} t={TRANSLATIONS[lang]} />);
        expect(screen.getByText(lang === 'es' ? 'EN CURSO' : 'IN PROGRESS')).toBeTruthy();
        expect(screen.getByText(/80% (adherencia|adherence)/)).toBeTruthy();
        expect(screen.getByText(lang === 'es' ? 'Reanudar' : 'Resume Workout')).toBeTruthy();
        expectNoUndefined();
        unmount();
    });

    it.each(['es', 'en'] as const)('TemplateSelector renders migrated keys (%s)', (lang) => {
        const { unmount } = render(
            <TemplateSelector
                onClose={vi.fn()}
                onSelectTemplate={vi.fn()}
                onCreateCustom={vi.fn()}
                onSelectProgram={vi.fn()}
                templates={[]}
                lang={lang}
                t={TRANSLATIONS[lang]}
            />,
        );
        expect(screen.getByText(lang === 'es' ? 'PLAN DE ENTRENAMIENTO' : 'TRAINING PLAN')).toBeTruthy();
        expect(screen.getByText(lang === 'es' ? 'PROGRAMAS' : 'PROGRAMS')).toBeTruthy();
        expect(screen.getByText(lang === 'es' ? 'Crear desde Cero' : 'Design from Scratch')).toBeTruthy();
        expectNoUndefined();
        unmount();
    });

    it.each(['es', 'en'] as const)('ExerciseProtocolBanners renders migrated keys (%s)', (lang) => {
        const { unmount } = render(
            <ExerciseProtocolBanners
                lang={lang}
                totalSets={3}
                isEMOM={false}
                isMyorep={true}
                isCluster={false}
                isGiant={false}
                isRestPause={false}
                isDrop={false}
                isTimeVolume={false}
                isTripleAdd={false}
                hasTopBackoff={false}
                isTabata={false}
                isHIIT={false}
                onEmomMinuteChange={vi.fn()}
            />,
        );
        expect(screen.getByText(lang === 'es' ? 'Set 1 = activacion' : 'Set 1 = activation')).toBeTruthy();
        expectNoUndefined();
        unmount();
    });

    it.each(['es', 'en'] as const)('RestPresetSheet renders migrated keys (%s)', (lang) => {
        const { unmount } = render(
            <RestPresetSheet
                open={true}
                onOpenChange={vi.fn()}
                initialSeconds={90}
                onSave={vi.fn()}
                lang={lang}
            />,
        );
        expect(screen.getByText(lang === 'es' ? 'Descanso (segundos)' : 'Rest Time (seconds)')).toBeTruthy();
        expect(screen.getByRole('button', { name: lang === 'es' ? 'Guardar' : 'Save' })).toBeTruthy();
        expectNoUndefined();
        unmount();
    });

    it.each(['es', 'en'] as const)('WaterTracker renders migrated keys (%s)', (lang) => {
        const { unmount } = render(
            <WaterTracker
                waterMl={500}
                onAdd={vi.fn()}
                lang={lang}
            />,
        );
        expect(screen.getByText(lang === 'es' ? 'Agua' : 'Water')).toBeTruthy();
        expect(screen.getByLabelText(lang === 'es' ? 'Registro de agua' : 'Water tracker')).toBeTruthy();
        expectNoUndefined();
        unmount();
    });
});
