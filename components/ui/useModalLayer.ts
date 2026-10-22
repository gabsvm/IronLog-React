import { useCallback, useLayoutEffect, useRef } from 'react';

export interface ModalLayerOptions {
    manualFocus?: boolean;
    manageHistory?: boolean;
    hasExternalHistory?: boolean;
    layerName?: string;
}

interface ModalLayer {
    id: symbol;
    element: () => HTMLElement | null;
    dismiss: () => void;
    manualFocus: boolean;
    previousFocus: HTMLElement | null;
    manageHistory: boolean;
    hasExternalHistory: boolean;
    pushedHistory: boolean;
    closedByPopstate: boolean;
    sessionKey: string | null;
    mountedAt: number;
}
// Timestamp of the last programmatic history.back() issued to consume a modal
// entry. A popstate arriving from that consumption must not dismiss a modal
// mounted afterwards (e.g. finish sheet replaced by its discard confirm in
// the same tick); only a user Back after mount may close the top layer.
let programmaticBackAt = 0;
const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
/** Record that the next popstate was initiated by our own consumption. */
function noteProgrammaticBack() { programmaticBackAt = nowMs(); }
const isJsdomEnv = () => typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent);
/** Read without consuming: view-history and modal-history share one pop event. */
export function peekProgrammaticBackAt() { return programmaticBackAt; }
/** Consume after a popstate has been judged. */
export function clearProgrammaticBackAt() { programmaticBackAt = 0; }
const layers: ModalLayer[] = [];
// Radix may defer outside-pointer dispatch until click, after React has
// already removed the layer that received the original pointerdown.
const pointerOwners = new WeakMap<Event, symbol>();
let originalOverflow = '';
let restoringFocus = false;
let hiddenRootCount = 0;
let hiddenRootPrevInert: boolean | null = null;
let hiddenRootPrevAria: string | null = null;

function hideAppRoot() {
    if (typeof document === 'undefined') return;
    const root = document.getElementById('root');
    if (!root || root.closest('[role="dialog"]')) return;
    if (hiddenRootCount === 0) {
        hiddenRootPrevInert = root.hasAttribute('inert');
        hiddenRootPrevAria = root.getAttribute('aria-hidden');
        root.setAttribute('inert', '');
        root.setAttribute('aria-hidden', 'true');
    }
    hiddenRootCount += 1;
}

function showAppRoot() {
    if (typeof document === 'undefined') return;
    if (hiddenRootCount === 0) return;
    hiddenRootCount -= 1;
    if (hiddenRootCount > 0) return;
    const root = document.getElementById('root');
    if (!root) {
        hiddenRootPrevInert = null;
        hiddenRootPrevAria = null;
        return;
    }
    if (hiddenRootPrevInert === false) root.removeAttribute('inert');
    if (hiddenRootPrevAria === null) root.removeAttribute('aria-hidden');
    else root.setAttribute('aria-hidden', hiddenRootPrevAria);
    hiddenRootPrevInert = null;
    hiddenRootPrevAria = null;
}
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

function onPopState(event: PopStateEvent) {
    // Peek only: the view-history listener shares this pop event and judges
    // staleness on its own. Clear only when this pop is consumed by an action.
    const progAt = peekProgrammaticBackAt();
    const layer = topLayer();
    // Forward into an expired transient entry with no live layer: normalize
    // the zombie _modalKey instead of leaving history parked on it.
    if (!layer) {
        const orphan = (event.state as { _modalKey?: string } | null)?._modalKey;
        if (orphan && typeof window !== 'undefined' && window.history) {
            try {
                const next = { ...(event.state as object) } as Record<string, unknown>;
                delete next._modalKey;
                window.history.replaceState(next, '', window.location.href);
            } catch { }
        }
        clearProgrammaticBackAt();
        return;
    }

    // If the top layer was managed by us and the active history state no longer
    // matches its session key, the browser went Back past this layer — unless
    // this pop is the stale echo of a programmatic consumption issued before
    // this layer mounted (modal replaced synchronously by another modal).
    if (layer.pushedHistory && !layer.closedByPopstate) {
        const stateKey = (event.state as { _modalKey?: string } | null)?._modalKey;
        if (stateKey !== layer.sessionKey) {
            if (progAt !== 0 && layer.mountedAt > progAt) return;
            layer.closedByPopstate = true;
            clearProgrammaticBackAt();
            layer.dismiss();
        }
    }
}

function listen(add: boolean) {
    const method = add ? 'addEventListener' : 'removeEventListener';
    window[method]('keydown', onKeyDown, true);
    window[method]('pointerdown', onPointerDown, true);
    window[method]('focusin', onFocus, true);
    window[method]('focusout', onFocus, true);
    window[method]('popstate', onPopState, true);
}

/** Explicitly consumes a modal's history entry before performing actions/navigation. */
export function consumeModalHistory(action: () => void) {
    if (typeof window === 'undefined' || !window.history) {
        action();
        return;
    }
    const layer = topLayer();
    if (!layer || !layer.pushedHistory || layer.closedByPopstate) {
        action();
        return;
    }
    layer.closedByPopstate = true;

    const isJsdom = typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent);
    if (isJsdom) {
        action();
        return;
    }

    let done = false;
    const finish = () => {
        if (done) return;
        done = true;
        window.removeEventListener('popstate', onPop, true);
        window.clearTimeout(timer);
        window.setTimeout(action, 0);
    };
    const onPop = () => finish();
    window.addEventListener('popstate', onPop, true);
    const timer = window.setTimeout(finish, 150);
    try {
        noteProgrammaticBack();
        window.history.back();
    } catch {
        finish();
    }
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

/** Shared Escape/focus ownership and unified browser/Android Back integration. */
export function useModalLayer(
    open: boolean,
    onDismiss: () => void,
    optionsOrManualFocus: boolean | ModalLayerOptions = false,
) {
    const options: ModalLayerOptions = typeof optionsOrManualFocus === 'boolean'
        ? { manualFocus: optionsOrManualFocus }
        : (optionsOrManualFocus || {});
    const manualFocus = !!options.manualFocus;
    const manageHistory = options.manageHistory !== false;
    const hasExternalHistory = !!options.hasExternalHistory;

    const id = useRef(Symbol('modal-layer'));
    const sessionKeyRef = useRef<string | null>(null);
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
            previousFocus: activeElement && previousLayer?.element()?.contains(activeElement)
                ? previousLayer.previousFocus : activeElement,
            manageHistory,
            hasExternalHistory,
            pushedHistory: false,
            closedByPopstate: false,
            sessionKey: null,
            mountedAt: (typeof performance !== 'undefined' ? performance.now() : Date.now()),
        };
        previousOpening.current = layer;

        if (manageHistory && !hasExternalHistory && typeof window !== 'undefined' && window.history) {
            if (!sessionKeyRef.current) {
                sessionKeyRef.current = 'ml_' + Math.random().toString(36).slice(2, 9);
            }
            const key = sessionKeyRef.current;
            if (window.history.state?._modalKey !== key) {
                try {
                    window.history.pushState(
                        { ...(window.history.state || {}), _modalKey: key },
                        '',
                        window.location.href,
                    );
                    layer.pushedHistory = true;
                    layer.sessionKey = key;
                } catch { }
            } else {
                layer.pushedHistory = true;
                layer.sessionKey = key;
            }
        }
        if (!layers.length) {
            originalOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            listen(true);
        }
        layers.push(layer);
        // Portalled manual-focus dialogs (Auth/PRO/confirm) live outside #root:
        // keep the app background out of the a11y tree until all of them close.
        if (manualFocus) hideAppRoot();
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
            if (
                layer.pushedHistory &&
                !layer.closedByPopstate &&
                typeof window !== 'undefined' &&
                window.history &&
                window.history.state?._modalKey === layer.sessionKey
            ) {
                // jsdom tests drive popstate synthetically; a real back() there
                // would only leave stray markers from StrictMode probes.
                if (!isJsdomEnv()) {
                    try {
                        noteProgrammaticBack();
                        window.history.back();
                    } catch { }
                }
            }
            sessionKeyRef.current = null;
            if (manualFocus) showAppRoot();
            if (!layers.length) {
                document.body.style.overflow = originalOverflow;
                listen(false);
            }
        };
    }, [open, manualFocus, manageHistory, hasExternalHistory, focusInitial]);

    return { contentRef, isTopLayer, ownsInteraction, focusInitial, onCloseAutoFocus };
}
