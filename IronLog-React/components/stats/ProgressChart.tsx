
import React from 'react';
import { Line } from 'react-chartjs-2';
import { ChartOptions, ScriptableContext } from 'chart.js/auto';
import { formatDate } from '../../utils';
import { useApp } from '../../context/AppContext';

export interface ChartDataPoint {
    date: number;
    value: number;
    weight: number;
    reps: number;
}

interface ProgressChartProps {
    dataPoints: ChartDataPoint[];
    metric: '1rm' | 'volume' | 'duration' | 'distance';
    loading?: boolean;
}

export const ProgressChart: React.FC<ProgressChartProps> = ({ dataPoints, metric, loading }) => {
    const { lang, theme } = useApp();
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    const getLabel = (m: string) => {
        switch(m) {
            case '1rm': return 'Est. 1RM (kg)';
            case 'volume': return 'Volume (kg)';
            case 'duration': return 'Duration (min)';
            case 'distance': return 'Distance (km)';
            default: return 'Value';
        }
    };

    const data = {
        labels: dataPoints.map(d => formatDate(d.date, lang)),
        datasets: [
            {
                label: getLabel(metric),
                data: dataPoints.map(d => d.value),
                borderColor: '#dc2626',
                backgroundColor: (context: ScriptableContext<"line">) => {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 200);
                    gradient.addColorStop(0, 'rgba(220, 38, 38, 0.4)'); // Red top
                    gradient.addColorStop(1, 'rgba(220, 38, 38, 0.0)'); // Transparent bottom
                    return gradient;
                },
                borderWidth: 3,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#dc2626',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
                fill: true,
                tension: 0.4, // Smooth curves
            }
        ]
    };

    const options: ChartOptions<'line'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                backgroundColor: isDark ? '#18181b' : '#fff',
                titleColor: isDark ? '#fff' : '#18181b',
                bodyColor: isDark ? '#a1a1aa' : '#52525b',
                borderColor: isDark ? '#27272a' : '#e4e4e7',
                borderWidth: 1,
                padding: 10,
                displayColors: false,
                callbacks: {
                    label: (item) => {
                        const point = dataPoints[item.dataIndex];
                        if (metric === '1rm') {
                             return `Est. 1RM: ${item.formattedValue}kg (${point.weight}x${point.reps})`;
                        } else if (metric === 'duration') {
                            return `Time: ${item.formattedValue} min`;
                        } else if (metric === 'distance') {
                            return `Dist: ${item.formattedValue} km`;
                        }
                        return `Volume: ${item.formattedValue}kg`;
                    }
                }
            }
        },
        scales: {
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    color: isDark ? '#52525b' : '#a1a1aa',
                    font: {
                        size: 10,
                        family: 'Inter'
                    },
                    maxRotation: 0,
                    autoSkip: true,
                    maxTicksLimit: 5
                },
                border: {
                    display: false
                }
            },
            y: {
                grid: {
                    color: isDark ? '#27272a' : '#f4f4f5',
                },
                ticks: {
                    color: isDark ? '#52525b' : '#a1a1aa',
                    font: {
                        size: 10,
                        family: 'Inter'
                    }
                },
                border: {
                    display: false
                },
                beginAtZero: false // Better dynamics for 1RM
            }
        }
    };

    if (loading) {
        return (
            <div className="h-60 flex flex-col items-center justify-center p-4 rounded-xl bg-zinc-50 dark:bg-white/[0.02]">
                <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (dataPoints.length < 2) {
        return (
            <div className="h-60 flex flex-col items-center justify-center text-center p-4 border border-dashed border-zinc-200 dark:border-white/10 rounded-xl bg-zinc-50 dark:bg-white/[0.02]">
                <p className="text-sm font-bold text-zinc-400 mb-1">Not enough data</p>
                <p className="text-xs text-zinc-500">Complete at least 2 workouts with this exercise to see progress.</p>
            </div>
        );
    }

    return (
        <div className="h-60 w-full animate-in fade-in duration-500">
            <Line data={data} options={options} />
        </div>
    );
};
