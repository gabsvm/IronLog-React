import React from 'react';
import { TutorialOverlay } from '../components/ui/TutorialOverlay';
import { StatsScope } from '../utils/statsScope';
import { Chart as ChartJS, RadialLinearScale, ArcElement, Tooltip, Legend, PointElement, LineElement, Filler, CategoryScale, LinearScale } from 'chart.js';
import { useStatsData } from './stats/useStatsData';
import { StatsHeader } from './stats/StatsHeader';
import { StatsProgressTab } from './stats/StatsProgressTab';
import { StatsOverviewTab } from './stats/StatsOverviewTab';
import { StatsVolumeTab } from './stats/StatsVolumeTab';
import { StatsExercisePicker } from './stats/StatsExercisePicker';

ChartJS.register(
    RadialLinearScale,
    ArcElement,
    Tooltip,
    Legend,
    PointElement,
    LineElement,
    Filler,
    CategoryScale,
    LinearScale
);

// S6: helpers and widgets moved to views/stats/; re-exported for existing importers.
export { getVolumeZone } from './stats/statsHelpers';
export { VolumeAverageCaption, VolumeMuscleList, PersonalRecordRow } from './stats/StatsWidgets';
export type { PersonalRecordRowProps } from './stats/StatsWidgets';

export interface StatsViewImplProps {
    activeTab?: 'overview' | 'progress' | 'volume';
    hideHeader?: boolean;
    /** Controlled scope, owned by the StatsView wrapper. */
    scope: StatsScope;
    onScopeChange: (scope: StatsScope) => void;
}

export const StatsView: React.FC<StatsViewImplProps> = ({ activeTab, hideHeader = false, scope: statsScope }) => {
    const stats = useStatsData({ activeTab, hideHeader, statsScope });
    const { showPicker, statsTutorialSteps, tutorialProgress, markTutorialSeen } = stats;

    return (
        <div className="relative space-y-4 px-4 pb-24 pt-3">
            {!hideHeader && <StatsHeader stats={stats} />}

            {(!activeTab || activeTab === 'progress') && <StatsProgressTab stats={stats} />}

            {(!activeTab || activeTab === 'overview') && <StatsOverviewTab stats={stats} />}

            {(!activeTab || activeTab === 'volume') && <StatsVolumeTab stats={stats} />}

            {showPicker && <StatsExercisePicker stats={stats} />}

            <TutorialOverlay
                steps={statsTutorialSteps}
                isActive={!tutorialProgress.stats}
                onComplete={() => markTutorialSeen('stats')}
            />
        </div>
    );
};
