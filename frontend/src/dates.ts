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

/**
 * Today as a local "YYYY-MM-DD" calendar date, comparable with the API's dates as strings
 *
 * @returns Today's calendar date
 */
export const todayDate = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

/**
 * Formats an ISO timestamp compactly for tables, e.g. "Sep 20, 11:59 PM" (the year is added when it isn't this year)
 *
 * @param timestamp The ISO timestamp
 * @returns The formatted date and time
 */
export const formatCompactDateTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        year: date.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
        hour: "numeric",
        minute: "2-digit"
    }).format(date);
};

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Converts an ISO timestamp to a datetime-local input's value ("YYYY-MM-DDTHH:mm" in the viewer's timezone)
 *
 * @param timestamp The ISO timestamp
 * @returns The input value
 */
export const toDateTimeLocal = (timestamp: string) => {
    const d = new Date(timestamp);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/**
 * Converts a datetime-local input's value (the viewer's local time) to an ISO timestamp in UTC, as the API expects
 *
 * @param value The input value, "YYYY-MM-DDTHH:mm"
 * @returns The ISO timestamp, e.g. "2026-09-21T03:59:00.000Z"
 */
export const fromDateTimeLocal = (value: string) => {
    const [date, time] = value.split("T");
    const [year, month, day] = date.split("-").map(Number);
    const [hours, minutes] = time.split(":").map(Number);
    return new Date(year, month - 1, day, hours, minutes).toISOString();
};

/**
 * The first millisecond of a "YYYY-MM-DD" calendar date in the viewer's timezone
 *
 * @param date The calendar date
 * @returns Milliseconds since the epoch
 */
export const startOfLocalDay = (date: string) => {
    const [year, month, day] = date.split("-").map(Number);
    return new Date(year, month - 1, day).getTime();
};

/**
 * The last millisecond of a "YYYY-MM-DD" calendar date in the viewer's timezone
 *
 * @param date The calendar date
 * @returns Milliseconds since the epoch
 */
export const endOfLocalDay = (date: string) => {
    const [year, month, day] = date.split("-").map(Number);
    return new Date(year, month - 1, day + 1).getTime() - 1;
};

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 365 * 24 * 60 * 60 * 1000],
    ["month", 30 * 24 * 60 * 60 * 1000],
    ["week", 7 * 24 * 60 * 60 * 1000],
    ["day", 24 * 60 * 60 * 1000],
    ["hour", 60 * 60 * 1000],
    ["minute", 60 * 1000]
];

/**
 * Describes a timestamp relative to now in its largest whole unit, e.g. "in 3 days" or "2 hours ago"
 *
 * @param timestamp The ISO timestamp
 * @param now The current time in milliseconds
 * @returns The relative description ("now" within a minute)
 */
export const formatRelative = (timestamp: string, now: number) => {
    const diff = Date.parse(timestamp) - now;
    const format = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
    for (const [unit, ms] of RELATIVE_UNITS) {
        if (Math.abs(diff) >= ms) return format.format(Math.trunc(diff / ms), unit);
    }
    return format.format(0, "minute");
};

/**
 * The viewer's current week, Monday 00:00 to the next Monday 00:00 in their timezone
 *
 * @param now The current time
 * @returns The bounds as ISO timestamps (start inclusive, end exclusive)
 */
export const localWeekBounds = (now: Date) => {
    const daysSinceMonday = (now.getDay() + 6) % 7;
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysSinceMonday);
    const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7);
    return { start: start.toISOString(), end: end.toISOString() };
};
