// Q6: AutoBackupList — list snapshots, confirm, restore into storage.
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { db } from '../../utils/db';
import { createBackupEnvelope } from '../../services/backupService';
import { AUTO_BACKUP_KEY } from '../../services/autoBackup';
import { AutoBackupList } from '../../components/profile/AutoBackupList';

describe('Q6: AutoBackupList', () => {
    beforeEach(async () => {
        await db.clear();
    });

    it('shows the empty state without snapshots', async () => {
        render(<AutoBackupList lang="es" onRestored={vi.fn()} />);
        expect(await screen.findByText('Aún no hay respaldos')).toBeDefined();
    });

    it('lists snapshots and restores after confirmation', async () => {
        const now = Date.now();
        await db.set(AUTO_BACKUP_KEY, [
            {
                at: now - 1000,
                envelope: createBackupEnvelope({ logs: [{ id: 'OLD' }] } as never),
            },
            {
                at: now,
                envelope: createBackupEnvelope({ logs: [{ id: 'NEW' }] } as never),
            },
        ]);
        await db.set('il_logs_v16', []);
        const onRestored = vi.fn();

        render(<AutoBackupList lang="es" onRestored={onRestored} />);
        const restoreButtons = await screen.findAllByText('Restaurar');
        expect(restoreButtons).toHaveLength(2);

        // Newest first: restore the NEW snapshot.
        fireEvent.click(restoreButtons[0]);
        expect(await screen.findByText('Restaurar respaldo')).toBeDefined();
        const confirms = screen.getAllByText('Restaurar');
        fireEvent.click(confirms[confirms.length - 1]);

        await waitFor(() => expect(onRestored).toHaveBeenCalledTimes(1));
        expect(await db.get('il_logs_v16', null)).toEqual([{ id: 'NEW' }]);
    });

    it('cancel leaves storage untouched', async () => {
        await db.set(AUTO_BACKUP_KEY, [
            {
                at: Date.now(),
                envelope: createBackupEnvelope({ logs: [{ id: 'X' }] } as never),
            },
        ]);
        await db.set('il_logs_v16', [{ id: 'KEEP' }]);
        const onRestored = vi.fn();

        render(<AutoBackupList lang="es" onRestored={onRestored} />);
        fireEvent.click((await screen.findAllByText('Restaurar'))[0]);
        expect(await screen.findByText('Restaurar respaldo')).toBeDefined();
        fireEvent.click(screen.getByText('Cancelar'));

        await waitFor(() =>
            expect(screen.queryByText('Restaurar respaldo')).toBeNull(),
        );
        expect(onRestored).not.toHaveBeenCalled();
        expect(await db.get('il_logs_v16', null)).toEqual([{ id: 'KEEP' }]);
    });
});
