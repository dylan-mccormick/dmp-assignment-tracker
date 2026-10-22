// NextDeadlineCard.tsx
// A live countdown to the soonest unfinished assignment due in the next 7 days, which can be paused (it updates every
// second, so WCAG 2.2.2 wants a way to stop it)

import { Pause, Play } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

import { formatDateTime } from "../../dates";
import useNow from "../../hooks/useNow";
import type { DashboardAssignment } from "../../model/Dashboard";
import DashboardCard from "./DashboardCard";

interface NextDeadlineCardProps {
    /** The soonest upcoming assignment, if any is due in the next 7 days */
    next: DashboardAssignment | undefined;
}

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const Unit = ({ value, label }: { value: number; label: string }) => (
    <div className="min-w-12 text-center">
        {/* tabular figures here: the digits tick, and shouldn't make the row jitter */}
        <div className="text-3xl font-semibold tabular-nums">{String(value).padStart(2, "0")}</div>
        <div className="text-xs text-gray-500">{label}</div>
    </div>
);

const NextDeadlineCard = ({ next }: NextDeadlineCardProps) => {
    // State
    const [paused, setPaused] = useState(false);

    // only this card subscribes to the per-second tick (paused, it shows the time of the last tick)
    const now = useNow(next !== undefined && !paused);
    const remaining = next ? Math.max(Date.parse(next.due) - now, 0) : 0;

    return (
        <DashboardCard
            w={3}
            title="Next deadline"
            action={
                next && (
                    <button
                        type="button"
                        aria-label="Pause countdown"
                        aria-pressed={paused}
                        title={paused ? "Resume countdown" : "Pause countdown"}
                        onClick={() => setPaused(p => !p)}
                        className="shrink-0 cursor-pointer rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-black transition-colors">
                        {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                    </button>
                )
            }>
            {!next ? (
                <p className="h-full flex items-center justify-center text-sm text-gray-500">
                    Nothing due in the next 7 days.
                </p>
            ) : (
                // its own container: when the card is too narrow for the countdown to sit beside the name, the two stack and
                // the due date line goes (the countdown says it), so it still fits one grid row
                <div className="@container h-full flex flex-wrap items-center justify-between gap-x-8 gap-y-3">
                    <Link
                        to={`/assignments/${next.id}`}
                        className="min-w-0 flex-1 basis-56 rounded -m-1 p-1 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-primary">
                        <span className="block text-xl truncate">{next.name}</span>
                        <span className="block text-sm text-gray-600 truncate">
                            {next.classCode} · {next.className}
                            {next.type && ` · ${next.type}`}
                        </span>
                        <span className="hidden @min-[32rem]:block text-sm text-gray-500">
                            Due {formatDateTime(next.due)}
                        </span>
                    </Link>

                    {remaining === 0 ? (
                        <p className="text-xl font-semibold text-amber-800">Due now</p>
                    ) : (
                        <div
                            role="timer"
                            aria-label={`Time left: ${Math.floor(remaining / DAY)} days, ${Math.floor((remaining % DAY) / HOUR)} hours, ${Math.floor((remaining % HOUR) / MINUTE)} minutes`}
                            className="flex items-start gap-3">
                            <Unit
                                value={Math.floor(remaining / DAY)}
                                label="days"
                            />
                            <Unit
                                value={Math.floor((remaining % DAY) / HOUR)}
                                label="hours"
                            />
                            <Unit
                                value={Math.floor((remaining % HOUR) / MINUTE)}
                                label="min"
                            />
                            <Unit
                                value={Math.floor((remaining % MINUTE) / SECOND)}
                                label="sec"
                            />
                        </div>
                    )}
                </div>
            )}
        </DashboardCard>
    );
};

export default NextDeadlineCard;
