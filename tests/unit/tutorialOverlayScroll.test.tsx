import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';

vi.mock('../../context/AppContext', () => ({
    useAppPreferences: () => ({ lang: 'es', setLang: vi.fn() }),
}));

import { TutorialOverlay } from '../../components/ui/TutorialOverlay';

const stepsMissing = [{ targetId: 'n2-target', title: 'N2 paso', text: 'texto' }];
const stepsPresent = [{ targetId: 'n2-target-2', title: 'N2 paso 2', text: 'texto' }];

describe('N2: TutorialOverlay without scrollIntoView (jsdom / old WebViews)', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('shows the step tooltip without throwing when the API is missing', () => {
        expect(typeof (document.createElement('div') as any).scrollIntoView).toBe('undefined');

        render(
            <>
                <div id="n2-target">target</div>
                <TutorialOverlay
                    steps={stepsMissing}
                    isActive={true}
                    onComplete={vi.fn()}
                />
            </>
        );

        act(() => {
            vi.advanceTimersByTime(1000);
        });

        expect(screen.getByText('N2 paso')).toBeDefined();
    });

    it('still scrolls the target into view when the API exists', () => {
        const scrollIntoView = vi.fn();
        (window.HTMLElement.prototype as any).scrollIntoView = scrollIntoView;
        try {
            render(
                <>
                    <div id="n2-target-2">target</div>
                    <TutorialOverlay
                        steps={stepsPresent}
                        isActive={true}
                        onComplete={vi.fn()}
                    />
                </>
            );

            act(() => {
                vi.advanceTimersByTime(1000);
            });

            expect(scrollIntoView).toHaveBeenCalled();
            expect(screen.getByText('N2 paso 2')).toBeDefined();
        } finally {
            delete (window.HTMLElement.prototype as any).scrollIntoView;
        }
    });
});
