// duration.ts
// Formats a time difference as its largest unit plus the next one, e.g. "1 year, 2 days" or "6 hours, 4 minutes"

const MINUTE_MS = 60 * 1000;
const MINUTES_PER_HOUR = 60;
const MINUTES_PER_DAY = 24 * MINUTES_PER_HOUR;
const MINUTES_PER_YEAR = 365 * MINUTES_PER_DAY;

const UNITS = [
    { name: "year", minutes: MINUTES_PER_YEAR },
    { name: "day", minutes: MINUTES_PER_DAY },
    { name: "hour", minutes: MINUTES_PER_HOUR },
    { name: "minute", minutes: 1 }
];

const plural = (count: number, unit: string) => `${count} ${unit}${count === 1 ? "" : "s"}`;

export interface FormatDurationOptions {
    /** "in 2 days" for a positive difference and "2 days ago" for a negative one, instead of just "2 days" */
    countdown?: boolean;
}

/**
 * Formats a time difference using its largest non-zero unit plus the next smaller unit (if that's non-zero), with
 * minutes as the smallest unit: 367 days -> "1 year, 2 days", 51 hours -> "2 days, 3 hours", 364 minutes -> "6 hours, 4
 * minutes", 1 year and 5 hours -> "1 year". Partial minutes are dropped; under a minute is "less than a minute".
 *
 * @param differenceMs The difference in milliseconds; positive when the end is after the start (i.e. in the future)
 * @param options See FormatDurationOptions
 * @returns The formatted duration
 */
export const formatDuration = (differenceMs: number, { countdown = false }: FormatDurationOptions = {}) => {
    let remaining = Math.floor(Math.abs(differenceMs) / MINUTE_MS);

    const counts = UNITS.map(({ minutes }) => {
        const count = Math.floor(remaining / minutes);
        remaining -= count * minutes;
        return count;
    });

    const largest = counts.findIndex(count => count > 0);
    let text: string;
    if (largest === -1) {
        text = "less than a minute";
    } else {
        text = plural(counts[largest], UNITS[largest].name);
        const next = largest + 1;
        if (next < UNITS.length && counts[next] > 0) text += `, ${plural(counts[next], UNITS[next].name)}`;
    }

    if (!countdown) return text;
    return differenceMs >= 0 ? `in ${text}` : `${text} ago`;
};
