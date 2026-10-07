// ClassesCard.tsx
// How much of each class's work is done this semester; each class links to its assignments

import { ChevronRight } from "lucide-react";
import { Link } from "react-router";

import type { DashboardClass } from "../../model/Dashboard";
import ProgressBar from "../ProgressBar";
import DashboardCard from "./DashboardCard";

interface ClassesCardProps {
    classes: DashboardClass[];
    semesterId: string;
    semesterName: string;
}

// The assignments table, already filtered to one class of the semester (the same query it keeps in its own URL)
const classAssignmentsUrl = (semesterId: string, classId: string) =>
    `/assignments?${new URLSearchParams({ semester: semesterId, class: classId })}`;

const ClassesCard = ({ classes, semesterId, semesterName }: ClassesCardProps) => (
    <DashboardCard
        w={2}
        h={2}
        title="Classes">
        {classes.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-2 text-sm text-gray-500">
                <p>{semesterName} doesn't have any classes yet.</p>
                <Link
                    to={`/classes?semester=${encodeURIComponent(semesterId)}`}
                    className="text-primary underline active:text-blue-600">
                    Add a class
                </Link>
            </div>
        ) : (
            // the card is its own container, so its rows go 1 -> 2 -> 3 across with the card's width
            <div className="@container h-full overflow-y-auto">
                <ul className="grid grid-cols-1 @md:grid-cols-2 @3xl:grid-cols-3 gap-x-4 gap-y-1">
                    {classes.map(cls => (
                        <li
                            key={cls.classId}
                            className="min-w-0">
                            <Link
                                to={classAssignmentsUrl(semesterId, cls.classId)}
                                title={`${cls.code} assignments`}
                                className="group block space-y-1.5 rounded px-2 py-2 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-primary">
                                <span className="flex items-baseline justify-between gap-3">
                                    <span className="min-w-0 truncate">
                                        <span className="font-medium">{cls.code}</span>{" "}
                                        <span className="text-sm text-gray-500">{cls.name}</span>
                                    </span>
                                    <span className="shrink-0 flex items-center gap-1 font-semibold">
                                        {cls.total === 0 ? "—" : `${Math.round((cls.done / cls.total) * 100)}%`}
                                        <ChevronRight
                                            aria-hidden="true"
                                            className="w-4 h-4 text-gray-400 transition-transform duration-150 ease-out group-hover:translate-x-0.5 group-hover:text-gray-600 motion-reduce:transition-none"
                                        />
                                    </span>
                                </span>
                                <ProgressBar
                                    fraction={cls.total === 0 ? 0 : cls.done / cls.total}
                                    label={`${cls.code} assignments done`}
                                    valueText={cls.total === 0 ? "No assignments" : `${cls.done} of ${cls.total}`}
                                />
                                <span className="block text-xs text-gray-500">
                                    {cls.total === 0 ? "No assignments yet" : `${cls.done} of ${cls.total} done`}
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        )}
    </DashboardCard>
);

export default ClassesCard;
