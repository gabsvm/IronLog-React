import { useMemo } from 'react';
import { useApp } from '../context/AppContext';

export const useFatigueAI = () => {
    const { activeMeso, rpFeedback } = useApp();

    const fatigueReport = useMemo(() => {
        if (!activeMeso || !rpFeedback[activeMeso.id]) return null;

        // We need at least 2 past weeks of data to compare
        const completedWeeks = Object.keys(rpFeedback[activeMeso.id])
            .map(Number)
            .sort((a, b) => b - a); // descending

        if (completedWeeks.length < 2) return null;

        const latestWeek = completedWeeks[0];
        const prevWeek = completedWeeks[1];

        const currentFb = rpFeedback[activeMeso.id][latestWeek];
        const prevFb = rpFeedback[activeMeso.id][prevWeek];

        let droppedMuscles = 0;
        let reasons: string[] = [];

        Object.keys(currentFb).forEach(muscle => {
            if (prevFb[muscle]) {
                const perfNow = currentFb[muscle].performance;
                const perfPrev = prevFb[muscle].performance;
                const sorNow = currentFb[muscle].soreness;

                // Performance drops (RP scale: 1 is very bad, 5 is PR)
                // Soreness high (RP scale: 1 is fine, 5 is crippled)
                // We assume performance drops from e.g. 4 to 2, and soreness is high
                if (perfNow < perfPrev && perfNow <= 2 && sorNow >= 3) {
                    droppedMuscles++;
                    reasons.push(muscle);
                }
            }
        });

        // If >= 2 muscles show systemic performance drop + high soreness simultaneously
        if (droppedMuscles >= 2) {
            return {
                shouldDeload: true,
                muscles: reasons
            };
        }

        return null;
    }, [activeMeso, rpFeedback]);

    return fatigueReport;
};
