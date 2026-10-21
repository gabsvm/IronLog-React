
import React, { useCallback, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { ChartOptions, ScriptableContext } from 'chart.js/auto';
import { formatDate } from '../../utils';
import { useAppPreferences } from '../../context/AppContext';
import { TRANSLATIONS } from '../../constants';
import { primaryChartColor } from '../../utils/chartColors';
import { toDisplay, unitLabel } from '../../utils/units';
import type { WeightUnit } from '../../types';

export interface ChartDataPoint {
    date: number;
    value: number;
    weight: number;
    reps: number;
}

interface ProgressChartProps {
    dataPoints: ChartDataPoint[];
    metric: '1rm' | 'volume' | 'duration' | 'distance' | 'max_reps' | 'hold_time';
    loading?: boolean;
    /** Display unit for weight-based metrics (stored values are kg). */
    unit?: WeightUnit;
}

export const ProgressChart: React.FC<ProgressChartProps> = ({ dataPoints, metric, loading, unit = 'kg' }) => {
    const { lang, theme } = useAppPreferences();
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const weightSuffix = unitLabel(unit).toLowerCase();
    // getComputedStyle per render forces style recalc; the accent only changes with theme.
    // `theme` is intentionally a dep without being read: it invalidates the cached color.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const chartColor = useMemo(() => primaryChartColor(), [theme]);
    const toShownValue = useCallback((v: number) => (metric === '1rm' || metric === 'volume') ? toDisplay(v, unit) : v, [metric, unit]);

    const getLabel = useCallback((m: string) => {
        switch(m) {
            case '1rm': return `Est. 1RM (${weightSuffix})`;
            case 'volume': return `Volume (${weightSuffix})`;
            case 'duration': return 'Duration (min)';
            case 'distance': return 'Distance (km)';
            case 'max_reps': return 'Reps';
            case 'hold_time': return 'Hold (s)';
            default: return 'Value';
        }
    }, [weightSuffix]);

    const data = useMemo(() => ({
        labels: dataPoints.map(d => formatDate(d.date, lang)),
        datasets: [
            {
                label: getLabel(metric),
                data: dataPoints.map(d => toShownValue(d.value)),
                borderColor: chartColor,
                backgroundColor: (context: ScriptableContext<"line">) => {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 200);
                    const color = chartColor;
                    let rgb = '196, 255, 38';
                    if (color.startsWith('#') && color.length === 7) {
                        const r = parseInt(color.slice(1, 3), 16);
                        const g = parseInt(color.slice(3, 5), 16);
                        const b = parseInt(color.slice(5, 7), 16);
                        rgb = `${r}, ${g}, ${b}`;
                    } else {
                        const m = color.match(/\d+[\s,]+\d+[\s,]+\d+/);
                        if (m) rgb = m[0].replace(/[\s,]+/g, ', ');
                    }
                    gradient.addColorStop(0, `rgba(${rgb}, 0.32)`);
                    gradient.addColorStop(1, `rgba(${rgb}, 0.0)`);
                    return gradient;
                },
                borderWidth: 3,
                pointBackgroundColor: '#fff',
                pointBorderColor: chartColor,
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
                fill: true,
                tension: 0.4, // Smooth curves
            }
        ]
    }), [dataPoints, metric, lang, getLabel, toShownValue, chartColor]);

    const options: ChartOptions<'line'> = useMemo(() => ({
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
                             return `Est. 1RM: ${item.formattedValue}${weightSuffix} (${toShownValue(point.weight)}x${point.reps})`;
                        } else if (metric === 'duration') {
                            return `Time: ${item.formattedValue} min`;
                        } else if (metric === 'distance') {
                            return `Dist: ${item.formattedValue} km`;
                        } else if (metric === 'max_reps') {
                            return `Reps: ${item.formattedValue}`;
                        } else if (metric === 'hold_time') {
                            return `Hold: ${item.formattedValue} s`;
                        }
                        return `Volume: ${item.formattedValue}${weightSuffix}`;
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
    }), [isDark, metric, dataPoints, weightSuffix, toShownValue]);

    if (loading) {
        return (
            <div className="h-60 flex flex-col items-center justify-center p-4 rounded-[1.4rem] border border-white/6 bg-zinc-50 dark:bg-white/[0.02]">
                <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (dataPoints.length === 0) {
        const { progressEmptyTitle, progressEmptyBody } = TRANSLATIONS[lang];
        return (
            <div className="h-60 flex flex-col items-center justify-center text-center p-4 border border-dashed border-zinc-200 dark:border-white/10 rounded-[1.4rem] bg-zinc-50 dark:bg-white/[0.02]">
                <p className="text-sm font-bold text-zinc-300 mb-1">{progressEmptyTitle}</p>
                <p className="text-xs text-zinc-500">{progressEmptyBody}</p>
            </div>
        );
    }

    return (
        <div className="h-60 w-full animate-in fade-in duration-500">
            <Line data={data} options={options} />
        </div>
    );
};
