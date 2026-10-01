import React, { Component, type ReactNode } from 'react';
import { TRANSLATIONS } from '../../constants/translations';

interface LazyViewBoundaryProps {
    children: ReactNode;
    lang: keyof typeof TRANSLATIONS;
    resetKey?: string | number;
}

interface LazyViewBoundaryState {
    hasError: boolean;
}

/**
 * Local error boundary for lazy-loaded views and modals.
 *
 * A failed chunk import (offline without precache, redeployed build) must not
 * take down the whole app: only the affected screen shows a message with a
 * retry action. Retry reloads the page because React caches the rejected
 * `import()` promise, so re-rendering alone would throw the same error again.
 */
export class LazyViewBoundary extends Component<LazyViewBoundaryProps, LazyViewBoundaryState> {
    state: LazyViewBoundaryState = { hasError: false };

    static getDerivedStateFromError(): Partial<LazyViewBoundaryState> {
        return { hasError: true };
    }

    componentDidCatch(error: unknown) {
        console.error('[LazyView] Chunk failed to load:', error);
    }

    componentDidUpdate(prevProps: LazyViewBoundaryProps) {
        if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
            this.setState({ hasError: false });
        }
    }

    render() {
        if (this.state.hasError) {
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

        return this.props.children;
    }
}
