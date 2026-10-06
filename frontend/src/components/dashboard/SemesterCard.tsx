// SemesterCard.tsx
// The active semester: its name and dates, and how much of it has passed

import { formatDate, todayDate } from "../../dates";
import type { Dashboard } from "../../model/Dashboard";
import ProgressBar from "../ProgressBar";
import DashboardCard from "./DashboardCard";

interface SemesterCardProps {
    semester: NonNullable<Dashboard["semester"]>;
    progress: NonNullable<Dashboard["progress"]>;
}

// Laid out to fit one 11rem grid row: the semester's name is the heading (no separate card title), and each date is
// one line
const SemesterCard = ({ semester, progress }: SemesterCardProps) => {
    const today = todayDate();
    const phase = today < semester.startDate ? "Upcoming" : today > semester.endDate ? "Ended" : "Current";
    const percent = Math.round(progress.fraction * 100);
    const daysLeft = progress.daysTotal - progress.daysElapsed;

    return (
        <DashboardCard
            w={2}
            label={`Semester: ${semester.name}`}>
            <div className="h-full flex flex-col justify-between gap-2">
                <div className="flex items-start justify-between gap-3 min-w-0">
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-600">Semester</p>
                        <p className="flex items-center gap-2 min-w-0">
                            <span className="text-xl truncate">{semester.name}</span>
                            <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-blue-50 text-primary">
                                {phase}
                            </span>
                        </p>
                    </div>
                    <p className="shrink-0 text-3xl font-semibold leading-none pt-1">{percent}%</p>
                </div>

                <div className="space-y-1.5">
                    <ProgressBar
                        size="md"
                        fraction={progress.fraction}
                        label={`${semester.name} elapsed`}
                        valueText={`Day ${progress.daysElapsed} of ${progress.daysTotal}`}
                    />
                    <p className="flex flex-wrap justify-between gap-x-3 text-sm text-gray-600">
                        <span>
                            Day {progress.daysElapsed} of {progress.daysTotal}
                        </span>
                        <span>
                            {phase === "Ended" ? "Finished" : `${daysLeft} ${daysLeft === 1 ? "day" : "days"} left`}
                        </span>
                    </p>
                </div>

                <p className="flex flex-wrap justify-between gap-x-3 text-sm">
                    <span>
                        <span className="text-gray-500">Starts</span> {formatDate(semester.startDate)}
                    </span>
                    <span>
                        <span className="text-gray-500">Ends</span> {formatDate(semester.endDate)}
                    </span>
                </p>
            </div>
        </DashboardCard>
    );
};

export default SemesterCard;
