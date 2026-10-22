// AssignmentTable.tsx
// The assignments table: name, type, class and the three deadlines, with a chevron (or a click on the row) to open one

import { AlertCircle, Check, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router";

import { formatCompactDateTime } from "../../dates";
import { type Assignment, type AssignmentType, isOverdue } from "../../model/Assignment";
import type { Class } from "../../model/Class";

interface AssignmentTableProps {
    assignments: Assignment[];
    classesById: Map<string, Class>;
    typesById: Map<string, AssignmentType>;
    /** Passed as the link state, so the assignment page's back link returns to this exact view */
    back: string;
}

const HEADERS = ["Name", "Type", "Class", "Early Due", "Due", "Late Due"];

const Deadline = ({ timestamp, overdue = false }: { timestamp: string | null; overdue?: boolean }) =>
    timestamp ? (
        // overdue is marked by an icon too, not only by color
        <span className={overdue ? "inline-flex items-center gap-1 text-red-700 font-medium" : undefined}>
            {overdue && <AlertCircle className="shrink-0 w-4 h-4" />}
            {formatCompactDateTime(timestamp)}
            {overdue && <span className="sr-only"> (overdue)</span>}
        </span>
    ) : (
        <span className="text-gray-500">
            <span aria-hidden="true">—</span>
            <span className="sr-only">None</span>
        </span>
    );

const AssignmentTable = ({ assignments, classesById, typesById, back }: AssignmentTableProps) => {
    const navigate = useNavigate();
    // the time when the table mounted, for marking overdue assignments (it doesn't need to tick)
    const [now] = useState(Date.now);

    return (
        <div className="overflow-x-auto border border-gray-200 rounded">
            <table className="w-full min-w-[56rem] text-sm text-left">
                <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                    <tr>
                        {HEADERS.map(header => (
                            <th
                                key={header}
                                scope="col"
                                className="px-4 py-3 font-medium whitespace-nowrap">
                                {header}
                            </th>
                        ))}
                        <th
                            scope="col"
                            className="w-12">
                            <span className="sr-only">Open</span>
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {assignments.map(assignment => {
                        const cls = classesById.get(assignment.classId);
                        const to = `/assignments/${assignment.id}`;

                        return (
                            <tr
                                key={assignment.id}
                                // the row is a mouse convenience; the chevron link is the keyboard/screen reader way in
                                onClick={() => navigate(to, { state: { back } })}
                                className={`group cursor-pointer transition-colors hover:bg-gray-50 ${assignment.done ? "text-gray-500" : ""}`}>
                                <td className="px-4 py-3 max-w-xs">
                                    <span className="flex items-center gap-2 min-w-0">
                                        {assignment.done && (
                                            <Check
                                                role="img"
                                                aria-label="Completed"
                                                className="shrink-0 w-4 h-4 text-green-700"
                                            />
                                        )}
                                        <span
                                            className={`truncate ${assignment.done ? "line-through" : "font-medium"}`}>
                                            {assignment.name}
                                        </span>
                                    </span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                    {typesById.get(assignment.typeId)?.value ?? "—"}
                                </td>
                                <td
                                    className="px-4 py-3 whitespace-nowrap"
                                    title={cls?.name}>
                                    {cls?.code ?? "—"}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                    <Deadline timestamp={assignment.earlyDue} />
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                    <Deadline
                                        timestamp={assignment.due}
                                        overdue={isOverdue(assignment, now)}
                                    />
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                    <Deadline timestamp={assignment.lateDue} />
                                </td>
                                <td className="pr-2">
                                    <Link
                                        to={to}
                                        state={{ back }}
                                        aria-label={`Open ${assignment.name}`}
                                        title="Open"
                                        onClick={e => e.stopPropagation()}
                                        className="flex items-center justify-center w-9 h-9 rounded text-gray-500 group-hover:text-gray-700 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-primary">
                                        <ChevronRight className="w-5 h-5 transition-transform duration-150 ease-out group-hover:translate-x-0.5 motion-reduce:transition-none" />
                                    </Link>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default AssignmentTable;
