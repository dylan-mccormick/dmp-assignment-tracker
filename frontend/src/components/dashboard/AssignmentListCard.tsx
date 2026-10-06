// AssignmentListCard.tsx
// A list of assignments (upcoming or overdue), each a link to the assignment with a status ticker

import { AlertCircle, CalendarClock, CircleCheck, Clock, Hourglass } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";

import { formatCompactDateTime, formatRelative } from "../../dates";
import type { DashboardAssignment } from "../../model/Dashboard";
import DashboardCard from "./DashboardCard";

const SOON_MS = 24 * 60 * 60 * 1000;

interface Status {
    label: string;
    icon: ReactNode;
    className: string;
}

// Status colors only ever mean status, and always come with an icon and words
const statusOf = (assignment: DashboardAssignment, kind: "upcoming" | "overdue", now: number): Status => {
    const due = Date.parse(assignment.due);
    if (kind === "upcoming") {
        return due - now < SOON_MS
            ? {
                  label: `Due ${formatRelative(assignment.due, now)}`,
                  icon: <Clock className="w-3.5 h-3.5" />,
                  className: "bg-amber-50 text-amber-800"
              }
            : {
                  label: `Due ${formatRelative(assignment.due, now)}`,
                  icon: <CalendarClock className="w-3.5 h-3.5" />,
                  className: "bg-gray-100 text-gray-700"
              };
    }
    if (assignment.lateDue && Date.parse(assignment.lateDue) > now) {
        return {
            label: `Late until ${formatCompactDateTime(assignment.lateDue)}`,
            icon: <Hourglass className="w-3.5 h-3.5" />,
            className: "bg-amber-50 text-amber-800"
        };
    }
    return {
        label: `Overdue · was due ${formatRelative(assignment.due, now)}`,
        icon: <AlertCircle className="w-3.5 h-3.5" />,
        className: "bg-red-50 text-red-800"
    };
};

interface AssignmentListCardProps {
    kind: "upcoming" | "overdue";
    assignments: DashboardAssignment[];
    /** When the list was fetched, to word "due in..." against */
    now: number;
}

const AssignmentListCard = ({ kind, assignments, now }: AssignmentListCardProps) => (
    <DashboardCard
        h={2}
        title={kind === "upcoming" ? "Due in the next 7 days" : "Overdue"}
        action={
            assignments.length > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">{assignments.length}</span>
            )
        }>
        {assignments.length === 0 ? (
            <p className="h-full flex flex-col items-center justify-center gap-2 text-sm text-gray-500 text-center">
                <CircleCheck className="w-6 h-6 text-gray-400" />
                {kind === "upcoming" ? "Nothing due in the next 7 days." : "Nothing overdue. Nice work."}
            </p>
        ) : (
            <ul className="h-full overflow-y-auto -mx-2 space-y-1">
                {assignments.map(assignment => {
                    const status = statusOf(assignment, kind, now);
                    return (
                        <li key={assignment.id}>
                            <Link
                                to={`/assignments/${assignment.id}`}
                                title={assignment.className}
                                className="block rounded px-2 py-2 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-primary">
                                <span className="block truncate font-medium">{assignment.name}</span>
                                <span className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-xs text-gray-600">
                                    <span>
                                        {assignment.classCode}
                                        {assignment.type && ` · ${assignment.type}`}
                                    </span>
                                    <span
                                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${status.className}`}>
                                        {status.icon}
                                        {status.label}
                                    </span>
                                </span>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        )}
    </DashboardCard>
);

export default AssignmentListCard;
