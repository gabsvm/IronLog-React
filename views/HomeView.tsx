import React, { useEffect, useRef } from 'react';
import { HomeView as HomeViewImpl } from './HomeViewImpl';
import { useAppPreferences } from '../context/AppContext';
import './product-polish.css';
import './reorder-history-polish.css';

interface HomeViewProps {
    startSession: (dayIdx: number) => void;
    onEditProgram: () => void;
    onSkipSession?: (dayIdx: number) => void;
    onStartFreeSession?: () => void;
}

/**
 * Product-polish shell around the proven Home implementation.
 * Keeps the training logic untouched while tightening information hierarchy.
 */
export const HomeView: React.FC<HomeViewProps> = (props) => {
    const { lang } = useAppPreferences();
    const rootRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const root = rootRef.current;
        if (!root) return;

        const normalizeProductLabels = () => {
            // Internal template IDs such as TPL_178... must never leak into customer-facing UI.
            const label = lang === 'es' ? 'PERSONALIZADO' : 'CUSTOM';
            root.querySelectorAll<HTMLElement>('span').forEach((node) => {
                const text = (node.textContent || '').trim();
                if (/^(tpl_|personal_)/i.test(text)) {
                    node.classList.add('product-internal-plan-id');
                    node.dataset.productLabel = label;
                }
            });
        };

        normalizeProductLabels();
        const observer = new MutationObserver(normalizeProductLabels);
        observer.observe(root, { childList: true, subtree: true, characterData: true });
        return () => observer.disconnect();
    }, [lang]);

    return (
        <div ref={rootRef} className="product-home-polish contents">
            <HomeViewImpl {...props} />
        </div>
    );
};
