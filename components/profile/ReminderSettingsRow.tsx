import React from 'react';
import { TRANSLATIONS } from '../../constants/translations';
import { Icon } from '../ui/Icon';
import { CHIP_DAYS, type WorkoutReminderConfig } from '../../utils/reminders';

interface ReminderSettingsRowProps {
    lang: keyof typeof TRANSLATIONS;
    config: WorkoutReminderConfig;
    onChange: (next: WorkoutReminderConfig) => void;
}

const pad2 = (n: number): string => String(n).padStart(2, '0');

/**
 * Q13: workout-reminder settings (enable + weekdays + time). Rendered by
 * ProfileSheet only on native Android; pure props in/out for testability.
 */
export const ReminderSettingsRow: React.FC<ReminderSettingsRowProps> = ({ lang, config, onChange }) => {
    const r = TRANSLATIONS[lang].reminders;

    const toggleDay = (day: number) => {
        const days = config.days.includes(day)
            ? config.days.filter((d) => d !== day)
            : [...config.days, day].sort((a, b) => a - b);
        onChange({ ...config, days });
    };

    const handleTime = (value: string) => {
        const match = /^(\d{1,2}):(\d{2})$/.exec(value);
        if (!match) return;
        const hour = Number(match[1]);
        const minute = Number(match[2]);
        if (hour > 23 || minute > 59) return;
        onChange({ ...config, hour, minute });
    };

    return (
        <div className="p-3 space-y-3">
            <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-surface-elevated flex items-center justify-center text-primary-400 shrink-0">
                    <Icon name="Bell" size={17} />
                </span>
                <div className="flex-1 text-sm font-medium text-white">{r.enable}</div>
                <button
                    type="button"
                    onClick={() => onChange({ ...config, enabled: !config.enabled })}
                    aria-label={r.enable}
                    aria-pressed={config.enabled}
                    className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${config.enabled ? 'bg-primary-500' : 'bg-surface-elevated border border-border-strong'}`}
                >
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full shadow transition-all ${config.enabled ? 'left-[22px] bg-white' : 'left-0.5 bg-white'}`} />
                </button>
            </div>
            {config.enabled && (
                <>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">{r.days}</p>
                        <div className="flex gap-1.5" role="group" aria-label={r.days}>
                            {CHIP_DAYS.map((day, i) => {
                                const active = config.days.includes(day);
                                return (
                                    <button
                                        key={day}
                                        type="button"
                                        onClick={() => toggleDay(day)}
                                        aria-pressed={active}
                                        aria-label={r.weekdaysLong[i]}
                                        title={r.weekdaysLong[i]}
                                        className={`w-9 h-9 rounded-full text-xs font-black transition-all shrink-0 ${
                                            active
                                                ? 'bg-primary-500 text-black shadow-sm'
                                                : 'bg-surface-elevated text-muted border border-border-strong'
                                        }`}
                                    >
                                        {r.weekdaysShort[i]}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    <label className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-white">{r.time}</span>
                        <input
                            type="time"
                            value={`${pad2(config.hour)}:${pad2(config.minute)}`}
                            onChange={(e) => handleTime(e.target.value)}
                            aria-label={r.time}
                            className="rounded-xl border border-border-subtle bg-zinc-100 dark:bg-zinc-800 px-3 py-2 text-sm font-bold text-zinc-900 dark:text-white outline-none focus:border-primary-500"
                        />
                    </label>
                </>
            )}
        </div>
    );
};
