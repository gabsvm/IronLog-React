// Q8: ExactAlarmRow — visibility, states, enable, refresh on return.
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const { audioMock } = vi.hoisted(() => ({
    audioMock: {
        state: null as null | { granted: boolean; sdkInt: number },
        openExactAlarmSettings: vi.fn(),
    },
}));

vi.mock('../../utils/audio', () => ({
    getExactAlarmState: async () => audioMock.state,
    openExactAlarmSettings: (...args: unknown[]) => audioMock.openExactAlarmSettings(...args),
}));

import { ExactAlarmRow } from '../../components/profile/ExactAlarmRow';

describe('Q8: ExactAlarmRow', () => {
    beforeEach(() => {
        audioMock.state = null;
        audioMock.openExactAlarmSettings.mockClear();
    });

    it('hides on web and on Android below API 31', async () => {
        const { container, rerender } = render(<ExactAlarmRow lang="es" />);
        await new Promise((r) => setTimeout(r, 50));
        expect(container.innerHTML).toBe('');

        audioMock.state = { granted: false, sdkInt: 30 };
        rerender(<ExactAlarmRow lang="en" />);
        await new Promise((r) => setTimeout(r, 50));
        expect(container.innerHTML).toBe('');
    });

    it('shows granted state without the enable button', async () => {
        audioMock.state = { granted: true, sdkInt: 33 };
        render(<ExactAlarmRow lang="es" />);
        expect(await screen.findByText('Alarmas y recordatorios exactos')).toBeDefined();
        expect(await screen.findByText('Concedido')).toBeDefined();
        expect(screen.queryByText('Activar')).toBeNull();
    });

    it('shows denied state and opens settings on tap', async () => {
        audioMock.state = { granted: false, sdkInt: 34 };
        render(<ExactAlarmRow lang="es" />);
        expect(await screen.findByText('No concedido')).toBeDefined();
        fireEvent.click(screen.getByText('Activar'));
        expect(audioMock.openExactAlarmSettings).toHaveBeenCalledTimes(1);
    });

    it('refreshes when returning to the app', async () => {
        audioMock.state = { granted: false, sdkInt: 34 };
        render(<ExactAlarmRow lang="es" />);
        expect(await screen.findByText('No concedido')).toBeDefined();

        audioMock.state = { granted: true, sdkInt: 34 };
        window.dispatchEvent(new Event('focus'));
        expect(await screen.findByText('Concedido')).toBeDefined();
        document.dispatchEvent(new Event('visibilitychange'));
        await waitFor(() => expect(screen.queryByText('No concedido')).toBeNull());
    });
});
