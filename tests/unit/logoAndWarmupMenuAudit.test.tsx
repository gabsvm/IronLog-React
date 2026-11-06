import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Logo } from '../../components/ui/Logo';
import { ExerciseCardMenu } from '../../components/workout/ExerciseCardMenu';
import { WarmupModal } from '../../components/ui/WarmupModal';
import { TRANSLATIONS } from '../../constants';
import * as AppContext from '../../context/AppContext';

vi.mock('../../context/AppContext', async (importOriginal) => {
    const actual = await importOriginal<typeof AppContext>();
    return {
        ...actual,
        useAppPreferences: vi.fn(() => ({
            lang: 'es',
            reducedEffects: false,
        })),
    };
});

describe('Impeccable Visual Audit: Logo & Wordmark', () => {
    it('renders the semantic split Rep + yntra and 2 terminal pulse circle nodes', () => {
        const { container } = render(<Logo size={32} variant="lockup" />);

        // Semantic wordmark split
        const repSpan = container.querySelector('span.font-sans span:first-child');
        const yntraSpan = container.querySelector('span.font-sans span:last-child');
        expect(repSpan?.textContent).toBe('Rep');
        expect(yntraSpan?.textContent).toBe('yntra');

        // Squircle badge
        const badge = container.querySelector('.rounded-\\[8px\\]');
        expect(badge).not.toBeNull();

        // Terminal pulse circles in SVG
        const circles = container.querySelectorAll('svg circle');
        expect(circles.length).toBe(2);

        const companionDot = Array.from(circles).find(c => c.getAttribute('cy') === '25');
        const dominantDot = Array.from(circles).find(c => c.getAttribute('cy') === '12');

        expect(companionDot).toBeDefined();
        expect(companionDot?.getAttribute('cx')).toBe('100');
        expect(companionDot?.getAttribute('r')).toBe('4.2');

        expect(dominantDot).toBeDefined();
        expect(dominantDot?.getAttribute('cx')).toBe('100');
        expect(dominantDot?.getAttribute('r')).toBe('5.5');
    });

    it('renders standalone icon without text when variant="icon"', () => {
        const { container } = render(<Logo size={32} variant="icon" />);
        expect(container.querySelector('span')).toBeNull();
        const svg = container.querySelector('svg');
        expect(svg).not.toBeNull();
        expect(svg?.querySelectorAll('circle').length).toBe(2);
    });
});

describe('Impeccable Visual Audit: ExerciseCardMenu', () => {
    const baseProps = {
        ex: { instanceId: 10, id: 'bench', sets: [] } as any,
        isOpen: true,
        onClose: vi.fn(),
        isCardio: false,
        cardioMode: 'steady' as const,
        hasSuperset: false,
        isLinking: false,
        onCardioModeChange: vi.fn(),
        onInjectWarmup: vi.fn(),
        onSupersetAction: vi.fn(),
        onReplace: vi.fn(),
        onRequestDelete: vi.fn(),
        t: TRANSLATIONS.es,
        lang: 'es' as const,
    };

    it('renders with rounded-[8px], section headers, W badge, and wires onInjectWarmup & onOpenWarmup', () => {
        const onInject = vi.fn();
        const onOpenWarmup = vi.fn();
        const onClose = vi.fn();

        const { container } = render(
            <ExerciseCardMenu
                {...baseProps}
                onClose={onClose}
                onInjectWarmup={onInject}
                onOpenWarmup={onOpenWarmup}
            />
        );

        // Clinical container style
        const menu = screen.getByRole('menu');
        expect(menu.className).toContain('rounded-[8px]');
        expect(menu.className).toContain('bg-surface-elevated');
        expect(menu.className).toContain('border-border-subtle');

        // Section headers
        expect(screen.getByText('Preparación y series')).toBeDefined();
        expect(screen.getByText('Ejercicio')).toBeDefined();

        // Clinical W badge
        const wBadge = container.querySelector('span.border-blue-500\\/30');
        expect(wBadge?.textContent?.trim()).toBe('W');

        // Fire onInjectWarmup
        const addWarmupBtn = screen.getByText(TRANSLATIONS.es.cardMenu.addWarmup);
        fireEvent.click(addWarmupBtn);
        expect(onInject).toHaveBeenCalledTimes(1);

        // Fire onOpenWarmup
        const warmupCalcText = TRANSLATIONS.es.warmupTitle;
        const warmupCalcBtn = screen.getByText(warmupCalcText);
        fireEvent.click(warmupCalcBtn);
        expect(onOpenWarmup).toHaveBeenCalledTimes(1);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('renders English section headers when lang="en"', () => {
        render(
            <ExerciseCardMenu
                {...baseProps}
                lang="en"
                t={TRANSLATIONS.en}
            />
        );

        expect(screen.getByText('Warmup & sets')).toBeDefined();
        expect(screen.getByText('Exercise')).toBeDefined();
    });
});

describe('Impeccable Visual Audit: WarmupModal', () => {
    it('renders percentage badges (50%, 75%, 90%) and clinical surface-raised rows', () => {
        const onClose = vi.fn();
        const onInjectWarmup = vi.fn();

        render(
            <WarmupModal
                targetWeight={100}
                exerciseName="Bench Press"
                onClose={onClose}
                onInjectWarmup={onInjectWarmup}
            />
        );

        // Header W badge
        const wBadges = screen.getAllByText('W');
        expect(wBadges.length).toBeGreaterThanOrEqual(1);

        // Percentage badges
        expect(screen.getByText('50%')).toBeDefined();
        expect(screen.getByText('75%')).toBeDefined();
        expect(screen.getByText('90%')).toBeDefined();

        // Clinical tokens on rows
        const buttons = document.querySelectorAll('button.expressive-press');
        expect(buttons.length).toBe(3);
        buttons.forEach((btn) => {
            expect(btn.className).toContain('rounded-[8px]');
            expect(btn.className).toContain('bg-[rgb(var(--surface-raised))]');
            expect(btn.className).toContain('border-[rgb(var(--border-subtle))]');
        });

        // Inject warmup action in footer
        const injectBtn = screen.getByText(TRANSLATIONS.es.cardMenu.addWarmup);
        fireEvent.click(injectBtn);
        expect(onInjectWarmup).toHaveBeenCalledTimes(1);
        expect(onClose).toHaveBeenCalledTimes(1);
    });
});
