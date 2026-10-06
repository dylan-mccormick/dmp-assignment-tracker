// Duration.tsx
// Renders the time between two instants (e.g. "1 year, 2 days"), live-updating when either end is now

import { type FormatDurationOptions, formatDuration } from "../duration";
import useNow from "../hooks/useNow";

type Instant = Date | number | string;

interface DurationProps extends FormatDurationOptions {
    /** The start; omit for "now" */
    from?: Instant;
    /** The end; omit for "now" */
    to?: Instant;
}

const toMs = (instant: Instant) => (instant instanceof Date ? instant.getTime() : new Date(instant).getTime());

/**
 * Shows the duration from `from` to `to`. With `countdown`, a future `to` reads "in 2 days" and a past one "2 days
 * ago", e.g. <Duration to={assignment.due} countdown /> for a live due-date countdown.
 */
const Duration = ({ from, to, countdown }: DurationProps) => {
    const now = useNow(from === undefined || to === undefined);
    const fromMs = from === undefined ? now : toMs(from);
    const toMsValue = to === undefined ? now : toMs(to);

    return <span>{formatDuration(toMsValue - fromMs, { countdown })}</span>;
};

export default Duration;
