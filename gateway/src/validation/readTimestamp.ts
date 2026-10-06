// readTimestamp.ts
// Reads ISO 8601 timestamps from requests, rejecting ones without a timezone or that aren't real dates

import { HttpError } from "../error/HttpError";

// An ISO 8601 timestamp with an explicit offset; without one, `new Date()` would read it in the gateway's timezone
const TIMESTAMP_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;

// A real calendar date and time as written: `new Date()` silently rolls e.g. Feb 30 over to Mar 2
const isRealTimestamp = (value: string) => {
    const match = TIMESTAMP_PATTERN.exec(value);
    if (!match || Number.isNaN(Date.parse(value))) return false;
    const [year, month, day, hour, minute] = match.slice(1, 6).map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCMonth() === month - 1 && date.getUTCDate() === day && hour < 24 && minute < 60;
};

/**
 * Reads a timestamp from a request body or query
 *
 * @param field The field's name, for the error message
 * @param value The raw value
 * @returns The instant
 * @throws {HttpError} 400 if it isn't an ISO 8601 timestamp with a timezone, or isn't a real date and time
 */
const readTimestamp = (field: string, value: unknown) => {
    if (typeof value !== "string" || !isRealTimestamp(value))
        throw new HttpError(
            400,
            `"${field}" must be an ISO 8601 timestamp with a timezone, e.g. "2026-09-20T23:59:00Z".`
        );
    return new Date(value);
};

export default readTimestamp;
