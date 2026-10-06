// dates.ts
// Formatting helpers for dates and timestamps from the API

/**
 * Formats a "YYYY-MM-DD" calendar date, e.g. "Sep 1, 2026". Parsed as a local date, so it never shifts by a day
 *
 * @param date The calendar date
 * @returns The formatted date
 */
export const formatDate = (date: string) => {
    const [year, month, day] = date.split("-").map(Number);
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(year, month - 1, day));
};

/**
 * Formats an ISO timestamp in the viewer's locale and timezone, e.g. "Oct 5, 2026, 7:13 PM"
 *
 * @param timestamp The ISO timestamp
 * @returns The formatted date and time
 */
export const formatDateTime = (timestamp: string) =>
    new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(timestamp));

/**
 * The UTC midnight of a "YYYY-MM-DD" calendar date, in milliseconds. Differences between these are always whole days
 * (local midnights can be 23 or 25 hours apart across a daylight-saving change)
 *
 * @param date The calendar date
 * @returns Milliseconds since the epoch
 */
export const calendarDateToUtcMs = (date: string) => {
    const [year, month, day] = date.split("-").map(Number);
    return Date.UTC(year, month - 1, day);
};
