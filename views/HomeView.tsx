import React, { useEffect, useMemo } from 'react';
import { HomeView as HomeViewImpl } from './HomeViewImpl';
import { useApp } from '../context/AppContext';
import { useStore } from '../lib/store';
import { KONG_4DAY_V1 } from '../programs/kong/kong4Day';
import { getProgramBlockForWeek, resolveProgramWeek } from '../programs/engine/ProgramResolver';
import { getKongDayDisplay } from '../programs/kong/kongDisplay';

interface HomeViewProps {
    startSession: (dayIdx: number) => void;
    onEditProgram: () => void;
    onSkipSession?: (dayIdx: number) => void;
    onStartFreeSession?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = (props) => {
    const { setProgram } = useApp();
    const activeMeso = useStore(state => state.activeMeso);
    const isKong = activeMeso?.programSystem?.systemId === KONG_4DAY_V1.id;
    const substitutionSignature = useMemo(
        () => JSON.stringify(activeMeso?.programSystem?.substitutions || {}),
        [activeMeso?.programSystem?.substitutions],
    );

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

        setProgram(prev => (prev === resolved || JSON.stringify(prev) === JSON.stringify(resolved)) ? prev : resolved);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeMeso?.week, isKong, setProgram, substitutionSignature]);

    return (
        <div className={`product-home-polish ${isKong ? 'kong-active' : ''} contents`}>
            <HomeViewImpl {...props} />
        </div>
    );
};
