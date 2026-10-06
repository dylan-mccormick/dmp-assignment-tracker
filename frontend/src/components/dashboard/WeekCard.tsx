// WeekCard.tsx
// This week (Monday to Sunday) at a glance: how many assignments are due, done and still to do

import type { Dashboard } from "../../model/Dashboard";
import ProgressBar from "../ProgressBar";
import DashboardCard from "./DashboardCard";

interface WeekCardProps {
    week: Dashboard["week"];
    /** The Monday that starts the week */
    weekStart: Date;
}

const dayFormat = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });

const Stat = ({ label, value }: { label: string; value: number }) => (
    <div>
        <dt className="text-xs text-gray-500">{label}</dt>
        <dd className="text-2xl font-semibold">{value}</dd>
    </div>
);

const WeekCard = ({ week, weekStart }: WeekCardProps) => {
    const sunday = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6);

    return (
        <DashboardCard
            title="This week"
            action={
                <span className="text-xs text-gray-500">
                    {dayFormat.format(weekStart)} – {dayFormat.format(sunday)}
                </span>
            }>
            {week.total === 0 ? (
                <p className="h-full flex items-center justify-center text-sm text-gray-500">Nothing due this week.</p>
            ) : (
                <div className="h-full flex flex-col justify-between">
                    <dl className="grid grid-cols-3 gap-2">
                        <Stat
                            label="Done"
                            value={week.done}
                        />
                        <Stat
                            label="To do"
                            value={week.notDone}
                        />
                        <Stat
                            label="Due"
                            value={week.total}
                        />
                    </dl>
                    <div className="space-y-1">
                        <ProgressBar
                            fraction={week.done / week.total}
                            label="Assignments due this week that are done"
                            valueText={`${week.done} of ${week.total}`}
                        />
                        <p className="text-xs text-gray-500">
                            {week.done} of {week.total} done
                        </p>
                    </div>
                </div>
            )}
        </DashboardCard>
    );
};

export default WeekCard;
