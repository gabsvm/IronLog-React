import React, { Component, type ReactNode } from 'react';
import { TRANSLATIONS } from '../../constants/translations';
import { logError } from '../../utils/errorLog';

interface LazyViewBoundaryProps {
    children: ReactNode;
    lang: keyof typeof TRANSLATIONS;
    resetKey?: string | number;
}

interface LazyViewBoundaryState {
    error: unknown;
}

/**
 * Message fragments that identify a failed dynamic `import()` (chunk load
 * failure): offline without precache, redeployed build, truncated download.
 * Covers Vite ("Failed to fetch dynamically imported module"), webpack
 * ("Loading chunk", "error loading dynamically imported module") and Safari
 * ("Importing a module script failed") wordings.
 */
const CHUNK_ERROR_PATTERNS = [
    'Failed to fetch dynamically imported module',
    'Importing a module script failed',
    'Loading chunk',
    'error loading dynamically imported module',
];

export const isChunkLoadError = (error: unknown): boolean => {
    const message = error instanceof Error ? error.message : String(error ?? '');
    return CHUNK_ERROR_PATTERNS.some(pattern => message.includes(pattern));
};

/**
 * Local error boundary for lazy-loaded views and modals.
 *
 * ONLY chunk-load failures are handled locally (message + reload action).
 * Any other render error is rethrown from render() so it propagates to the
 * parent boundary — the root ErrorBoundary in index.tsx, which offers the
 * emergency backup export and local-data reset. Swallowing real errors here
 * used to hide corrupt-state crashes behind a reload loop with no way out.
 *
 * Retry reloads the page because React caches the rejected `import()`
 * promise, so re-rendering alone would throw the same error again.
 */
export class LazyViewBoundary extends Component<LazyViewBoundaryProps, LazyViewBoundaryState> {
    state: LazyViewBoundaryState = { error: null };

    static getDerivedStateFromError(error: unknown): Partial<LazyViewBoundaryState> {
        return { error };
    }

    componentDidCatch(error: unknown) {
        if (isChunkLoadError(error)) {
            console.error('[LazyView] Chunk failed to load:', error);
        } else {
            console.error('[LazyView] Non-chunk error, propagating to parent boundary:', error);
        }
        void logError({
            message: error instanceof Error ? error.message : String(error ?? 'unknown'),
            stack: error instanceof Error ? error.stack : undefined,
            source: isChunkLoadError(error) ? 'chunk' : 'boundary',
        });
    }

    componentDidUpdate(prevProps: LazyViewBoundaryProps) {
        if (prevProps.resetKey !== this.props.resetKey && this.state.error !== null) {
            this.setState({ error: null });
        }
    }

    render() {
        const { error } = this.state;
        if (error === null || error === undefined) {
            return this.props.children;
        }

        // A boundary cannot catch errors from its own render: throwing here
        // hands the error to the parent boundary (root ErrorBoundary).
        if (!isChunkLoadError(error)) {
            throw error;
        }

        const t = TRANSLATIONS[this.props.lang];
        return (
            <div
                role="alert"
                className="h-full min-h-[40dvh] flex flex-col items-center justify-center gap-4 px-6 text-center"
            >
                <p className="text-sm text-muted max-w-xs">{t.viewLoadFailed}</p>
                <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="min-h-[44px] px-6 rounded-xl bg-primary-500 text-sm font-bold text-black transition-colors hover:bg-primary-400"
                >
                    {t.retry}
                </button>
            </div>
        );
    }
}
