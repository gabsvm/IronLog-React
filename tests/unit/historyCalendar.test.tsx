import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { HistoryCalendar } from '../../views/history/HistoryCalendar';

const logs = [
    { id: 1, endTime: new Date(2026, 9, 26, 20, 51).getTime() },
] as any;

describe('HistoryCalendar (Strong parity)', () => {
    it('opens on the initial month and applies the picked day', () => {
        let picked: string | null = 'unset';
        const { container } = render(
            <HistoryCalendar
                logs={logs}
                lang="es"
                initialDay="2026-10-26"
                onApply={(d) => { picked = d; }}
                onClose={() => {}}
            />,
        );
        expect(screen.getByText(/octubre/i)).toBeTruthy();
        const dialog = screen.getByRole('dialog');
        const day = within(dialog).getByRole('button', { name: (_: string, el?: Element | null) => el?.textContent === '26' });
        expect(day).toBeTruthy();
        fireEvent.click(screen.getByText('OK'));
        expect(picked).toBe('2026-10-26');
        expect(container).toBeTruthy();
    });
});
