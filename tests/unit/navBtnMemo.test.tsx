import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { NavBtn } from '../../components/layout/Layout';

describe('R4: NavBtn isolation, memoization, and accessibility', () => {
    it('renders with aria-current="page" when active, and no aria-current when inactive', () => {
        const onSelect = vi.fn();

        const { rerender, getByRole } = render(
            <NavBtn id="home" label="Entreno" icon="Layout" isActive={true} onSelect={onSelect} />
        );

        const btnActive = getByRole('button');
        expect(btnActive.getAttribute('aria-current')).toBe('page');

        rerender(
            <NavBtn id="home" label="Entreno" icon="Layout" isActive={false} onSelect={onSelect} />
        );

        const btnInactive = getByRole('button');
        expect(btnInactive.getAttribute('aria-current')).toBeNull();
    });

    it('triggers onSelect with its id on click', () => {
        const onSelect = vi.fn();
        const { getByRole } = render(
            <NavBtn id="history" label="Historial" icon="Calendar" isActive={false} onSelect={onSelect} />
        );

        fireEvent.click(getByRole('button'));
        expect(onSelect).toHaveBeenCalledWith('history');
    });

    it('preserves component identity across re-renders (does not unmount DOM node)', () => {
        let mountCount = 0;
        let unmountCount = 0;

        const LifecycleProbe: React.FC<{ isActive: boolean }> = ({ isActive }) => {
            React.useEffect(() => {
                mountCount++;
                return () => {
                    unmountCount++;
                };
            }, []);

            return <NavBtn id="home" label="Entreno" icon="Layout" isActive={isActive} onSelect={() => {}} />;
        };

        const { rerender } = render(<LifecycleProbe isActive={false} />);
        expect(mountCount).toBe(1);
        expect(unmountCount).toBe(0);

        // Re-render parent (as would happen if Layout re-renders due to isOnline/sync change)
        rerender(<LifecycleProbe isActive={false} />);
        expect(mountCount).toBe(1);
        expect(unmountCount).toBe(0);
    });
});
