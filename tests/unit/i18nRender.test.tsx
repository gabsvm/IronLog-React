import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TRANSLATIONS } from '../../constants';
import { TemplateSelector } from '../../views/home/TemplateSelector';
import { ExerciseProtocolBanners } from '../../components/workout/ExerciseProtocolBanners';
import { WaterTracker } from '../../views/nutri/WaterTracker';

// Q19: key migrated screens render their TRANSLATIONS strings in both
// languages with no missing keys (a missing key renders nothing or the
// literal "undefined" inside composed templates).
const expectNoUndefined = () => {
    expect(document.body.textContent || '').not.toContain('undefined');
};

describe('Q19: migrated screens render in es and en', () => {

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
        expect(screen.getByRole('heading', { name: TRANSLATIONS[lang].startMeso })).toBeTruthy();
        expect(screen.getByText(lang === 'es' ? '12 semanas · 4 días · 3 bloques' : '12 weeks · 4 days · 3 blocks')).toBeTruthy();
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
