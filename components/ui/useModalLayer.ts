import { useCallback, useLayoutEffect, useRef } from 'react';

interface ModalLayer {
    id: symbol;
    element: () => HTMLElement | null;
    dismiss: () => void;
    manualFocus: boolean;
    previousFocus: HTMLElement | null;
}

const layers: ModalLayer[] = [];
// Radix may defer outside-pointer dispatch until click, after React has
// already removed the layer that received the original pointerdown.
const pointerOwners = new WeakMap<Event, symbol>();
let originalOverflow = '';
let restoringFocus = false;

const topLayer = () => layers[layers.length - 1];

function controls(element: HTMLElement): HTMLElement[] {
    return Array.from(element.querySelectorAll<HTMLElement>(
        'button, a[href], input, select, textarea, [tabindex]',
    )).filter(item => item.tabIndex >= 0 && !item.matches(':disabled, [hidden], input[type="hidden"]')
        && !item.closest('[hidden], [inert]')
        && getComputedStyle(item).visibility !== 'hidden'
        && !hasHiddenAncestor(item, element));
}

function hasHiddenAncestor(element: HTMLElement, root: HTMLElement): boolean {
    for (let node: HTMLElement | null = element; node; node = node.parentElement) {
        if (getComputedStyle(node).display === 'none') return true;
        if (node === root) break;
    }
    return false;
}

function focusLayer(layer: ModalLayer) {
    const element = layer.element();
    if (!element || element.contains(document.activeElement)) return;
    (controls(element)[0] ?? element).focus({ preventScroll: true });
}

function onKeyDown(event: KeyboardEvent) {
    const layer = topLayer();
    if (!layer) return;
    if (event.key === 'Escape') {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (!event.repeat) layer.dismiss();
    } else if (event.key === 'Tab' && layer.manualFocus && !event.altKey && !event.ctrlKey && !event.metaKey) {
        const element = layer.element();
        if (!element) return;
        // Own the complete Tab sequence, not just its edges: the lower Radix
        // focus scope must never see a Tab from a portalled confirmation.
        event.preventDefault();
        event.stopImmediatePropagation();
        const items = controls(element);
        const current = items.indexOf(document.activeElement as HTMLElement);
        const next = current < 0 ? (event.shiftKey ? items.length - 1 : 0)
            : (current + (event.shiftKey ? -1 : 1) + items.length) % items.length;
        (items[next] ?? element).focus({ preventScroll: true });
    }
}

function onFocus(event: FocusEvent) {
    const layer = topLayer();
    if (!restoringFocus && !layer?.manualFocus) return;
    // Radix listens to both focusin AND focusout on document. Shield both
    // while a custom confirm owns focus, otherwise its lower sheet steals
    // focus back before the confirm can finish moving between its controls.
    event.stopImmediatePropagation();
    if (!restoringFocus && event.type === 'focusin' && layer) focusLayer(layer);
}

function onPointerDown(event: PointerEvent) {
    const layer = topLayer();
    if (layer) pointerOwners.set(event, layer.id);
}

function listen(add: boolean) {
    const method = add ? 'addEventListener' : 'removeEventListener';
    window[method]('keydown', onKeyDown, true);
    window[method]('pointerdown', onPointerDown, true);
    window[method]('focusin', onFocus, true);
    window[method]('focusout', onFocus, true);
}

function restoreLayerFocus(layer: ModalLayer) {
    // A delayed Radix close callback may belong to a StrictMode probe or an
    // earlier opening of a sheet that is already open again.
    if (layers.some(active => active.id === layer.id)) return;
    const next = topLayer();
    const target = layer.previousFocus;
    if (!next) listen(true);
    restoringFocus = true;
    try {
        if (target?.isConnected && (!next || next.element()?.contains(target))) {
            target.focus({ preventScroll: true });
        } else if (next) {
            focusLayer(next);
        }
    } finally {
        restoringFocus = false;
        if (!next) listen(false);
    }
}

/** Shared Escape/focus ownership only; browser Back remains Layout's concern. */
export function useModalLayer(open: boolean, onDismiss: () => void, manualFocus = false) {
    const id = useRef(Symbol('modal-layer'));
    const lastContent = useRef<HTMLDivElement | null>(null);
    const previousOpening = useRef<ModalLayer | null>(null);
    const contentRef = useCallback((element: HTMLDivElement | null) => {
        // Keep the closing element available to cleanup after React detaches
        // its ref, including when a lower layer unmounts before its children.
        if (element) lastContent.current = element;
    }, []);
    const dismissRef = useRef(onDismiss);
    dismissRef.current = onDismiss;
    const closeRestorations = useRef(new Map<EventTarget, () => void>());
    const onCloseAutoFocus = useCallback((event: Event) => {
        event.preventDefault();
        if (!event.target) return;
        const restore = closeRestorations.current.get(event.target);
        closeRestorations.current.delete(event.target);
        restore?.();
    }, []);
    const isTopLayer = useCallback(() => topLayer()?.id === id.current, []);
    const ownsInteraction = useCallback((event: Event) => (
        isTopLayer() && (!pointerOwners.has(event) || pointerOwners.get(event) === id.current)
    ), [isTopLayer]);
    const focusInitial = useCallback(() => {
        const layer = topLayer();
        if (!layer || layer.id !== id.current) return;
        restoringFocus = true;
        try {
            focusLayer(layer);
        } finally {
            restoringFocus = false;
        }
    }, []);

    useLayoutEffect(() => {
        if (!open) return;
        const pendingCloseRestorations = closeRestorations.current;
        const activeElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        const previousLayer = previousOpening.current;
        const layer: ModalLayer = {
            id: id.current,
            element: () => lastContent.current,
            dismiss: () => dismissRef.current(),
            manualFocus,
            // StrictMode replays setup before a sheet's asynchronous native
            // teardown. Do not mistake focus in that same sheet for its opener.
            previousFocus: activeElement && previousLayer?.element()?.contains(activeElement)
                ? previousLayer.previousFocus : activeElement,
        };
        previousOpening.current = layer;
        if (!layers.length) {
            originalOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            listen(true);
        }
        layers.push(layer);
        if (manualFocus) focusInitial();

        return () => {
            const index = layers.indexOf(layer);
            if (index < 0) return;
            const wasTop = layer === topLayer();
            layers.splice(index, 1);
            // If a lower layer disappears first, preserve the return path for
            // its children instead of restoring to a disconnected trigger.
            layers.forEach(remaining => {
                if (remaining.previousFocus && layer.element()?.contains(remaining.previousFocus)) {
                    remaining.previousFocus = layer.previousFocus;
                }
            });
            if (wasTop) {
                if (manualFocus) {
                    restoreLayerFocus(layer);
                } else {
                    const element = layer.element();
                    if (element) {
                        // FocusScope tears down after the closing content is
                        // removed, not when `open` changes. Restore only after
                        // its trap and exit animation release the old scope.
                        pendingCloseRestorations.set(element, () => restoreLayerFocus(layer));
                    }
                }
            }
            if (!layers.length) {
                document.body.style.overflow = originalOverflow;
                listen(false);
            }
        };
    }, [open, manualFocus, focusInitial]);

    return { contentRef, isTopLayer, ownsInteraction, focusInitial, onCloseAutoFocus };
}
