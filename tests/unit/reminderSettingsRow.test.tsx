import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReminderSettingsRow } from '../../components/profile/ReminderSettingsRow';
import type { WorkoutReminderConfig } from '../../utils/reminders';

const renderRow = (config: WorkoutReminderConfig, lang: 'es' | 'en' = 'es') => {
    const onChange = vi.fn();
    render(<ReminderSettingsRow lang={lang} config={config} onChange={onChange} />);
    return { onChange };
};

describe('Q13: ReminderSettingsRow', () => {
    it('toggles the master switch', () => {
        const { onChange } = renderRow({ enabled: false, days: [1], hour: 18, minute: 0 });
        // Days/time stay hidden until enabled.
        expect(screen.queryByLabelText('Días')).toBeNull();
        fireEvent.click(screen.getByRole('button', { name: 'Recordarme entrenar' }));
        expect(onChange).toHaveBeenCalledWith({ enabled: true, days: [1], hour: 18, minute: 0 });
    });

    it('toggles weekday chips by getDay number (Monday-first display)', () => {
        const { onChange } = renderRow({ enabled: true, days: [1, 3], hour: 18, minute: 0 });
        expect(screen.getByRole('button', { name: 'lunes' })).toHaveAttribute('aria-pressed', 'true');
        expect(screen.getByRole('button', { name: 'martes' })).toHaveAttribute('aria-pressed', 'false');
        fireEvent.click(screen.getByRole('button', { name: 'martes' }));
        expect(onChange).toHaveBeenCalledWith({ enabled: true, days: [1, 2, 3], hour: 18, minute: 0 });
        fireEvent.click(screen.getByRole('button', { name: 'lunes' }));
        expect(onChange).toHaveBeenCalledWith({ enabled: true, days: [3], hour: 18, minute: 0 });
    });

    it('parses the time input and ignores garbage', () => {
        const { onChange } = renderRow({ enabled: true, days: [1], hour: 18, minute: 0 });
        const time = screen.getByLabelText('Hora') as HTMLInputElement;
        expect(time.value).toBe('18:00');
        fireEvent.change(time, { target: { value: '07:30' } });
        expect(onChange).toHaveBeenCalledWith({ enabled: true, days: [1], hour: 7, minute: 30 });
        fireEvent.change(time, { target: { value: 'nope' } });
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('renders English labels', () => {
        renderRow({ enabled: true, days: [], hour: 8, minute: 0 }, 'en');
        expect(screen.getByRole('button', { name: 'Remind me to train' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Wednesday' })).toBeTruthy();
    });
});
