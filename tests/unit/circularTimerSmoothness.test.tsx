import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { CircularTimer } from '../../components/ui/RestTimerOverlay';

describe('R6: CircularTimer Smooth Animation', () => {
    it('applies 1s linear transition for smooth continuous ring movement', () => {
        const { container } = render(
            <CircularTimer
                percentage={50}
                timeLeft={30}
                totalDuration={60}
                lang="es"
                reducedEffects={false}
            />
        );

        const circle = container.querySelectorAll('circle')[1];
        expect(circle).toBeDefined();
        expect(circle.style.transition).toBe('stroke-dashoffset 1s linear');
    });

    it('disables animation transition when reducedEffects is true', () => {
        const { container } = render(
            <CircularTimer
                percentage={50}
                timeLeft={30}
                totalDuration={60}
                lang="es"
                reducedEffects={true}
            />
        );

        const circle = container.querySelectorAll('circle')[1];
        expect(circle).toBeDefined();
        expect(circle.style.transition).toBe('none');
    });
});
