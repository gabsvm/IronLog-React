import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import { TRANSLATIONS } from '../../constants/translations';
import { ProgramHub } from '../../components/programs/ProgramHub';
import { KONG_4DAY_V1 } from '../../programs/kong/kong4Day';

// U5: ProgramHub was split into a state hook + top-level panel components.
// This walks every panel through the real component.
const h = TRANSLATIONS.es.programHub;

const meso = {
    id: 3, name: 'KONG', mesoType: 'kong', week: 5, duration: 12, plan: [],
    programSystem: { systemId: KONG_4DAY_V1.id, systemVersion: KONG_4DAY_V1.version, substitutions: {} },
} as any;

const renderHub = (onClose = vi.fn()) =>
    render(<ProgramHub meso={meso} logs={[]} lang="es" onClose={onClose} />);

describe('U5: ProgramHub panels', () => {
    it('opens on the home panel with the hero and access items', () => {
        renderHub();
        const dialog = screen.getByRole('dialog', { name: 'KONG Program Hub' });
        expect(within(dialog).getByText(h.hubTitle)).toBeTruthy();
        expect(within(dialog).getByText(`${h.heroWeek} 5 / 12`)).toBeTruthy();
        expect(within(dialog).getByText(h.accessBlockLabel)).toBeTruthy();
    });

    it('every access item opens its panel and back returns home', async () => {
        renderHub();
        const dialog = screen.getByRole('dialog', { name: 'KONG Program Hub' });
        const labels = [h.accessBlockLabel, h.accessPrinciplesLabel];
        for (const label of labels) {
            fireEvent.click(within(dialog).getByText(label));
            // Header now shows the panel title instead of the hub title.
            expect(within(dialog).queryByText(h.hubTitle)).toBeNull();
            // Back goes through history.back() → popstate (async in the browser too).
            fireEvent.click(within(dialog).getByRole('button', { name: h.goBack }));
            expect(await within(dialog).findByText(h.hubTitle)).toBeTruthy();
        }
    });

    it('all panels render without crashing', async () => {
        renderHub();
        const dialog = screen.getByRole('dialog', { name: 'KONG Program Hub' });
        const buttons = within(dialog).getAllByRole('button').filter((b) => b.getAttribute('aria-label') !== h.close);
        const count = buttons.length;
        expect(count).toBeGreaterThan(3);
        for (let i = 0; i < count; i++) {
            const candidates = within(dialog).getAllByRole('button').filter((b) => b.getAttribute('aria-label') !== h.close);
            fireEvent.click(candidates[i]);
            const back = within(dialog).queryByRole('button', { name: h.goBack });
            if (back) {
                fireEvent.click(back);
                await within(dialog).findByText(h.hubTitle);
            }
        }
        expect(within(dialog).getByText(h.hubTitle)).toBeTruthy();
    });

    it('the close button on home calls onClose', async () => {
        const onClose = vi.fn();
        // Like the app: the hub opens on top of a normal (non-hub) history entry.
        window.history.pushState({}, '', '/');
        renderHub(onClose);
        fireEvent.click(screen.getByRole('button', { name: h.close }));
        await waitFor(() => expect(onClose).toHaveBeenCalled());
    });
});
