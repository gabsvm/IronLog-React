import React, { useEffect, useMemo, useRef } from 'react';
import { HomeView as HomeViewImpl } from './HomeViewImpl';
import { useApp, useAppPreferences } from '../context/AppContext';
import { useStore } from '../lib/store';
import { KONG_4DAY_V1 } from '../programs/kong/kong4Day';
import { getProgramBlockForWeek, resolveProgramWeek } from '../programs/engine/ProgramResolver';
import { getKongDayDisplay } from '../programs/kong/kongDisplay';
import './product-polish.css';
import './reorder-history-polish.css';
import './kong-final-polish.css';

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
    const { setProgram } = useApp();
    const activeMeso = useStore(state => state.activeMeso);
    const rootRef = useRef<HTMLDivElement>(null);
    const isKong = activeMeso?.programSystem?.systemId === KONG_4DAY_V1.id;
    const substitutionSignature = useMemo(
        () => JSON.stringify(activeMeso?.programSystem?.substitutions || {}),
        [activeMeso?.programSystem?.substitutions],
    );

    useEffect(() => {
        document.documentElement.classList.toggle('kong-program-active', !!isKong);
        return () => document.documentElement.classList.remove('kong-program-active');
    }, [isKong]);

    // KONG is a dynamic 12-week system. Keep the legacy `program` projection in
    // sync with the current global week so Home, skip labels, estimates and any
    // legacy consumers never remain stuck on Block 1 after the resolver advances.
    useEffect(() => {
        if (!isKong || !activeMeso) return;
        const { block } = getProgramBlockForWeek(KONG_4DAY_V1, activeMeso.week);
        const resolved = resolveProgramWeek(
            KONG_4DAY_V1,
            activeMeso.week,
            activeMeso.programSystem?.substitutions || {},
        ).map((day, dayIndex) => ({
            ...day,
            dayName: getKongDayDisplay(block.number, dayIndex),
        }));

        setProgram(prev => JSON.stringify(prev) === JSON.stringify(resolved) ? prev : resolved);
    }, [activeMeso?.week, isKong, setProgram, substitutionSignature]);

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
                if (isKong && lang === 'es' && /^KONG\s*·\s*BLOCK\s+\d+$/i.test(text)) {
                    node.textContent = text.replace(/BLOCK/i, 'BLOQUE');
                }
            });

            if (isKong) {
                const settingsButton = root.querySelector<HTMLElement>('#tut-settings-btn');
                settingsButton?.closest('.flex.justify-between.items-start.pt-2')?.classList.add('kong-home-header');
            }
        };

        normalizeProductLabels();
        const observer = new MutationObserver(normalizeProductLabels);
        observer.observe(root, { childList: true, subtree: true, characterData: true });
        return () => observer.disconnect();
    }, [isKong, lang]);

    return (
        <div ref={rootRef} className={`product-home-polish ${isKong ? 'kong-active' : ''} contents`}>
            <HomeViewImpl {...props} />
        </div>
    );
};
