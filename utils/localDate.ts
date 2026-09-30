/**
 * Deterministic local calendar helpers.
 * Never uses UTC-based toISOString().split('T')[0] for user-facing calendar days.
 */

/**
 * Format a Date object into 'YYYY-MM-DD' using local year, month, and day.
 */
export const formatLocalDateKey = (date: Date = new Date()): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Returns today's date formatted as 'YYYY-MM-DD' in local time.
 */
export const todayLocalDateKey = (): string => {
    return formatLocalDateKey(new Date());
};

/**
 * Parses a 'YYYY-MM-DD' local date key into a Date at local midnight.
 */
export const parseLocalDateKey = (key: string): Date => {
    const parts = key.split('-');
    if (parts.length !== 3) {
        return new Date(NaN);
    }
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return new Date(year, month, day, 0, 0, 0, 0);
};

/**
 * Add or subtract days from a Date or 'YYYY-MM-DD' key, returning the new 'YYYY-MM-DD' key.
 */
export const addLocalDays = (dateOrKey: Date | string, days: number): string => {
    const baseDate = typeof dateOrKey === 'string' ? parseLocalDateKey(dateOrKey) : new Date(dateOrKey);
    const result = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + days);
    return formatLocalDateKey(result);
};

/**
 * Difference in calendar days between keyA and keyB (keyA - keyB).
 */
export const diffLocalDays = (keyA: string, keyB: string): number => {
    const dateA = parseLocalDateKey(keyA);
    const dateB = parseLocalDateKey(keyB);
    const msPerDay = 1000 * 60 * 60 * 24;
    const utcA = Date.UTC(dateA.getFullYear(), dateA.getMonth(), dateA.getDate());
    const utcB = Date.UTC(dateB.getFullYear(), dateB.getMonth(), dateB.getDate());
    return Math.round((utcA - utcB) / msPerDay);
};

/**
 * Check if a string is a valid 'YYYY-MM-DD' calendar date key.
 */
export const isValidLocalDateKey = (key: string): boolean => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
    const parsed = parseLocalDateKey(key);
    return !isNaN(parsed.getTime()) && formatLocalDateKey(parsed) === key;
};
