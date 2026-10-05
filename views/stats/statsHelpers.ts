// S6: pure Stats helpers, moved verbatim from views/StatsViewImpl.tsx.
import { ChartMetric } from '../../hooks/useStatsWorker';

export const getVolumeZone = (sets: number) => {
    if (sets < 6) return { color: 'bg-yellow-500', label: 'MV', textColor: 'text-yellow-500' };
    if (sets < 12) return { color: 'bg-green-500', label: 'MEV', textColor: 'text-green-500' };
    if (sets <= 22) return { color: 'bg-blue-500', label: 'MAV', textColor: 'text-blue-500' };
    return { color: 'bg-red-500', label: 'MRV', textColor: 'text-red-500' };
};

export const chartMetricLabel = (metric: ChartMetric) => {
    switch (metric) {
        case '1rm': return '1RM';
        case 'volume': return 'VOL';
        case 'duration': return 'TIME';
        case 'distance': return 'DIST';
        case 'max_reps': return 'REPS';
        case 'hold_time': return 'HOLD';
        default: return '1RM';
    }
};

export type PerformanceBand = 'beginner' | 'intermediate' | 'advanced';

export const getExerciseStrengthProfile = (exercise: { id?: string; muscle?: string; isBodyweight?: boolean; isIsometric?: boolean; skillLevel?: number } | null) => {
    const id = String(exercise?.id || '').toLowerCase();
    const muscle = exercise?.muscle || '';

    if (exercise?.isIsometric) return 'isometric';
    if (exercise?.isBodyweight) {
        if (/(pullup|chinup)/.test(id)) return 'bw_pull';
        if (/(dip)/.test(id)) return 'bw_dip';
        if (/(pushup|push_up|pu)/.test(id)) return 'bw_push';
        if (/(pistol|one_leg_squat|single_leg_squat)/.test(id)) return 'bw_single_leg';
        return 'bw_generic';
    }

    if (/(deadlift|rdl|rack_pull|good_morning)/.test(id)) return 'hinge';
    if (/(squat|leg_press|hack|lunge|split_squat|bulgarian|step_up)/.test(id)) return 'squat';
    if (/(shoulder_press|ohp|military_press|arnold_press)/.test(id)) return 'vertical_press';
    if (/(bench|chest_press|incline_press|decline_press|dip)/.test(id)) return 'horizontal_press';
    if (/(row|pulldown|pullup|chinup|lat_|seated_row)/.test(id)) return 'upper_pull';
    if (/(curl|pushdown|extension|lateral_raise|fly|pec_deck|rear_delt)/.test(id)) return 'isolation';
    if (muscle === 'QUADS' || muscle === 'HAMSTRINGS' || muscle === 'GLUTES') return 'squat';
    if (muscle === 'CHEST') return 'horizontal_press';
    if (muscle === 'BACK') return 'upper_pull';
    if (muscle === 'SHOULDERS') return 'vertical_press';
    return 'isolation';
};

export const getWeightedLevel = (profile: string, relativeStrength: number): PerformanceBand => {
    const thresholds: Record<string, [number, number]> = {
        squat: [1, 1.8],
        hinge: [1.25, 2],
        horizontal_press: [0.85, 1.25],
        vertical_press: [0.6, 0.9],
        upper_pull: [0.9, 1.4],
        isolation: [0.25, 0.45],
    };
    const [intermediateFloor, advancedFloor] = thresholds[profile] || thresholds.isolation;
    if (relativeStrength >= advancedFloor) return 'advanced';
    if (relativeStrength >= intermediateFloor) return 'intermediate';
    return 'beginner';
};

export const getBodyweightLevel = (profile: string, reps: number, addedLoad: number, skillLevel?: number, bestHoldSeconds?: number): PerformanceBand => {
    if (typeof skillLevel === 'number') {
        if (skillLevel >= 4) return 'advanced';
        if (skillLevel >= 2) return 'intermediate';
        return 'beginner';
    }
    if (typeof bestHoldSeconds === 'number' && bestHoldSeconds > 0) {
        if (bestHoldSeconds >= 30) return 'advanced';
        if (bestHoldSeconds >= 15) return 'intermediate';
        return 'beginner';
    }
    if (addedLoad > 0) return addedLoad >= 20 ? 'advanced' : 'intermediate';

    const thresholds: Record<string, [number, number]> = {
        bw_pull: [5, 12],
        bw_dip: [8, 15],
        bw_push: [15, 30],
        bw_single_leg: [5, 10],
        bw_generic: [10, 20],
    };
    const [intermediateFloor, advancedFloor] = thresholds[profile] || thresholds.bw_generic;
    if (reps >= advancedFloor) return 'advanced';
    if (reps >= intermediateFloor) return 'intermediate';
    return 'beginner';
};
