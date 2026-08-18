import React from 'react';
import { Radar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
    type ChartData,
    type ChartOptions,
} from 'chart.js';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../constants';
import { MuscleGroup } from '../../types';

// Keep the radar self-contained. This component used to rely on StatsViewImpl
// registering Chart.js primitives as a side effect; once that legacy view was
// removed, opening Progress > Volume could crash with
// `"radialLinear" is not a registered scale`.
ChartJS.register(
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
);

interface SymmetryRadarProps {
    volumeData: Record<string, number>;
}

// Anatomical sorting order for the Radar to make sense visually
const RADAR_ORDER: MuscleGroup[] = [
    'CHEST', 'SHOULDERS', 'TRICEPS', // Push
    'BACK', 'TRAPS', 'BICEPS',       // Pull
    'ABS', 'FOREARMS',               // Core/Small
    'QUADS', 'HAMSTRINGS', 'GLUTES', 'CALVES' // Legs
];

export const SymmetryRadar: React.FC<SymmetryRadarProps> = ({ volumeData }) => {
    const { theme, lang } = useApp();
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    const dataValues = RADAR_ORDER.map(m => volumeData[m] || 0);
    const labels = RADAR_ORDER.map(m => TRANSLATIONS[lang].muscle[m]);

    const data: ChartData<'radar'> = {
        labels,
        datasets: [
            {
                label: 'Weekly Sets',
                data: dataValues,
                backgroundColor: isDark ? 'rgba(220, 38, 38, 0.5)' : 'rgba(220, 38, 38, 0.2)',
                borderColor: '#dc2626',
                borderWidth: 2,
                pointBackgroundColor: isDark ? '#fff' : '#dc2626',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: '#dc2626'
            }
        ]
    };

    const options: ChartOptions<'radar'> = {
        scales: {
            r: {
                angleLines: {
                    color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                },
                grid: {
                    color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                },
                pointLabels: {
                    color: isDark ? '#a1a1aa' : '#52525b',
                    font: {
                        size: 9,
                        weight: 'bold',
                        family: 'Inter'
                    }
                },
                ticks: {
                    display: false,
                    backdropColor: 'transparent'
                },
                suggestedMin: 0,
                suggestedMax: Math.max(...dataValues, 10) + 2
            }
        },
        plugins: {
            legend: { display: false }
        },
        maintainAspectRatio: false
    };

    return (
        <div className="h-64 w-full relative">
            <Radar data={data} options={options} />
        </div>
    );
};
