// Q6: BackupReminderBanner — visibility rule, export now, dismiss.
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { db } from '../../utils/db';
import {
    BACKUP_REMINDER_DISMISSED_KEY,
    LAST_BACKUP_AT_KEY,
} from '../../services/autoBackup';

const DAY = 24 * 60 * 60 * 1000;

const { appState } = vi.hoisted(() => ({
    appState: {
        program: [],
        exercises: [],
        logs: [] as { endTime: number }[],
        activeMeso: null,
        activeSession: null,
        userProfile: {},
        nutritionLogs: [],
        cardioSessions: [],
        bodyLogs: [],
        macroGoals: null,
        nutritionGoal: null,
        personalTemplates: [],
        customFoods: [],
        rpFeedback: {},
        config: {},
    },
}));

vi.mock('../../context/AppContext', () => ({
    useApp: () => appState,
    useAppPreferences: () => ({ lang: 'es' }),
}));

import { BackupReminderBanner } from '../../components/home/BackupReminderBanner';

describe('Q6: BackupReminderBanner', () => {
    const origCreate = URL.createObjectURL;
    const origRevoke = URL.revokeObjectURL;

    beforeEach(async () => {
        await db.clear();
        appState.logs = [];
    });

    afterEach(() => {
        URL.createObjectURL = origCreate;
        URL.revokeObjectURL = origRevoke;
    });

    it('appears with stale export and newer sessions', async () => {
        appState.logs = [{ endTime: Date.now() - DAY }];
        await db.set(LAST_BACKUP_AT_KEY, Date.now() - 20 * DAY);
        render(<BackupReminderBanner />);
        expect(await screen.findByText(/más de 14 días/)).toBeDefined();
        expect(screen.getByText('Exportar ahora')).toBeDefined();
    });

    it('stays hidden with a recent export', async () => {
        appState.logs = [{ endTime: Date.now() - 20 * DAY }];
        await db.set(LAST_BACKUP_AT_KEY, Date.now() - DAY);
        render(<BackupReminderBanner />);
        await new Promise((r) => setTimeout(r, 100));
        expect(screen.queryByText(/más de 14 días/)).toBeNull();
    });

    it('export now stamps the export and hides the banner', async () => {
        appState.logs = [{ endTime: Date.now() - DAY }];
        await db.set(LAST_BACKUP_AT_KEY, Date.now() - 20 * DAY);
        URL.createObjectURL = vi.fn(() => 'blob:mock') as never;
        URL.revokeObjectURL = vi.fn() as never;
        const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
        render(<BackupReminderBanner />);
        expect(await screen.findByText(/más de 14 días/)).toBeDefined();

        fireEvent.click(screen.getByText('Exportar ahora'));

        await waitFor(async () => {
            expect(await db.get(LAST_BACKUP_AT_KEY, null)).toBeGreaterThan(Date.now() - 60 * 1000);
        });
        await waitFor(() => expect(screen.queryByText(/más de 14 días/)).toBeNull());
        expect(click).toHaveBeenCalledTimes(1);
        click.mockRestore();
    });

    it('dismiss persists and hides the banner', async () => {
        appState.logs = [{ endTime: Date.now() - DAY }];
        await db.set(LAST_BACKUP_AT_KEY, Date.now() - 20 * DAY);
        render(<BackupReminderBanner />);
        expect(await screen.findByText(/más de 14 días/)).toBeDefined();

        fireEvent.click(screen.getByLabelText('Descartar'));

        await waitFor(() => expect(screen.queryByText(/más de 14 días/)).toBeNull());
        expect(await db.get(BACKUP_REMINDER_DISMISSED_KEY, null)).toBeGreaterThan(0);
    });
});
