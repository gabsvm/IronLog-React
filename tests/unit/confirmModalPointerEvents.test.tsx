import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmModal } from '../../components/ui/ConfirmModal';

/**
 * A Vaul sheet (Radix dismissable layer) sets body{pointer-events:none} while
 * open and only its own layer opts back in. Any ConfirmModal opened above a
 * sheet painted on top but let taps fall through to the sheet beneath.
 * The backdrop must therefore carry its own pointer-events opt-in.
 */
describe('ConfirmModal stays tappable above a sheet body-lock', () => {
    afterEach(() => {
        document.body.style.pointerEvents = '';
    });

    it('opts the backdrop back into pointer events under a Radix body lock', () => {
        document.body.style.pointerEvents = 'none';
        const onCancel = () => {};
        const { container } = render(
            <ConfirmModal
                isOpen={true}
                title="Importar Datos"
                description="Sobrescribir"
                confirmText="Importar Datos"
                cancelText="Cancelar"
                onConfirm={() => {}}
                onCancel={onCancel}
            />
        );
        const backdrop = container.querySelector('.modal-backdrop');
        expect(backdrop).toBeTruthy();
        // The opt-in must be on the backdrop itself so it survives any
        // ancestor with pointer-events:none (Radix sets it on <body>).
        expect(backdrop!.className).toMatch(/(^|\s)pointer-events-auto(\s|$)/);
    });

    it('Cancel still fires while the body is locked', () => {
        document.body.style.pointerEvents = 'none';
        let cancelled = false;
        render(
            <ConfirmModal
                isOpen={true}
                title="Importar Datos"
                description="Sobrescribir"
                confirmText="Importar Datos"
                cancelText="Cancelar"
                onConfirm={() => {}}
                onCancel={() => { cancelled = true; }}
            />
        );
        fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
        expect(cancelled).toBe(true);
    });
});
