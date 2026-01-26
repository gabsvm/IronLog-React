
import React from 'react';
import { Radar } from 'react-chartjs-2';
import { ChartData, ChartOptions } from 'chart.js/auto';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../constants';
import { MuscleGroup } from '../../types';

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

    // Normalize data slightly to avoid ugly charts if volume is 0
    // We add a small buffer or purely show raw relative data. Raw is more honest.

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
                    display: false, // Hide concentric numbers for cleaner look
                    backdropColor: 'transparent'
                },
                suggestedMin: 0,
                // Add a bit of headroom to the chart so points don't clip text
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
