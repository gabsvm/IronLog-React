import { Capacitor, registerPlugin } from '@capacitor/core';

/**
 * Q13: workout reminders (native Android only; alarms are device-local so the
 * config lives in localStorage and is never synced).
 *
 * Days use JS getDay() numbering (0 = Sunday .. 6 = Saturday); the UI shows
 * them Monday-first. All scheduling math is local-time.
 */

export interface WorkoutReminderConfig {
    enabled: boolean;
    days: number[];
    hour: number;
    minute: number;
}

export const DEFAULT_REMINDER_CONFIG: WorkoutReminderConfig = {
    enabled: false,
    days: [1, 2, 3, 4, 5],
    hour: 18,
    minute: 0,
};

export const REMINDER_CONFIG_KEY = 'il_cfg_reminders_v1';
export const TRAINED_DAY_KEY = 'il_trained_day_v1';

/** Monday-first getDay() numbers for the day chips. */
export const CHIP_DAYS = [1, 2, 3, 4, 5, 6, 0];

const isValidConfig = (value: unknown): value is WorkoutReminderConfig => {
    if (typeof value !== 'object' || value === null) return false;
    const c = value as Record<string, unknown>;
    return (
        typeof c.enabled === 'boolean'
        && Array.isArray(c.days)
        && c.days.every((d): d is number => Number.isInteger(d) && (d as number) >= 0 && (d as number) <= 6)
        && Number.isInteger(c.hour) && (c.hour as number) >= 0 && (c.hour as number) <= 23
        && Number.isInteger(c.minute) && (c.minute as number) >= 0 && (c.minute as number) <= 59
    );
};

export const loadReminderConfig = (): WorkoutReminderConfig => {
    try {
        const raw = localStorage.getItem(REMINDER_CONFIG_KEY);
        if (!raw) return { ...DEFAULT_REMINDER_CONFIG };
        const parsed: unknown = JSON.parse(raw);
        return isValidConfig(parsed) ? { ...parsed, days: [...parsed.days] } : { ...DEFAULT_REMINDER_CONFIG };
    } catch {
        return { ...DEFAULT_REMINDER_CONFIG };
    }
};

export const saveReminderConfig = (config: WorkoutReminderConfig): void => {
    try {
        localStorage.setItem(REMINDER_CONFIG_KEY, JSON.stringify(config));
    } catch {
        // Private mode etc: reminders simply do not persist.
    }
};

/** Local (never UTC) YYYY-MM-DD for trained-day markers. */
export const toISODate = (date: Date): string => {
    const pad = (n: number): string => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

export const trainedDayMarker = (): string | null => {
    try {
        return localStorage.getItem(TRAINED_DAY_KEY);
    } catch {
        return null;
    }
};

export const isTrainedOn = (marker: string | null, date: Date): boolean =>
    marker != null && marker === toISODate(date);

/**
 * Next reminder strictly after `now` (local time), or null when disabled or
 * dayless. Scans today + the next 7 days so any weekly pattern resolves.
 */
export const computeNextReminder = (now: Date, config: WorkoutReminderConfig): Date | null => {
    if (!config.enabled) return null;
    const days = [...new Set(config.days)].filter((d) => Number.isInteger(d) && d >= 0 && d <= 6);
    if (days.length === 0) return null;
    for (let offset = 0; offset < 8; offset += 1) {
        const candidate = new Date(now);
        candidate.setDate(now.getDate() + offset);
        candidate.setHours(config.hour, config.minute, 0, 0);
        if (candidate.getTime() <= now.getTime()) continue;
        if (days.includes(candidate.getDay())) return candidate;
    }
    return null;
};

interface ReminderBridgePlugin {
    scheduleWorkoutReminder(options: { enabled: boolean; days: number[]; hour: number; minute: number }): Promise<void>;
    cancelWorkoutReminder(): Promise<void>;
    markWorkoutDone(options: { date: string }): Promise<void>;
}

const ReminderBridge = registerPlugin<ReminderBridgePlugin>('NativeBridge');

export const isReminderSupported = (): boolean =>
    Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

/** Push the current config to the native scheduler (no-op off Android). */
export const syncReminderSchedule = async (config: WorkoutReminderConfig): Promise<void> => {
    if (!isReminderSupported()) return;
    try {
        if (!config.enabled || config.days.length === 0) {
            await ReminderBridge.cancelWorkoutReminder();
        } else {
            await ReminderBridge.scheduleWorkoutReminder({
                enabled: true,
                days: [...config.days],
                hour: config.hour,
                minute: config.minute,
            });
        }
    } catch {
        // Best-effort: a failed sync never breaks the settings UI.
    }
};

/**
 * Record that a workout finished today (local marker + native flag so the
 * receiver skips today's notification). Safe to call on any platform.
 */
export const notifyWorkoutDone = (now: Date = new Date()): void => {
    try {
        localStorage.setItem(TRAINED_DAY_KEY, toISODate(now));
    } catch {
        // Ignore storage failures; the native flag below still applies.
    }
    if (!isReminderSupported()) return;
    void ReminderBridge.markWorkoutDone({ date: toISODate(now) }).catch(() => {});
};
