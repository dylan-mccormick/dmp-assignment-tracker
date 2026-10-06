// Assignment.ts
// An assignment and its types as returned by the gateway's /api/v1/assignments and /assignment-types routes

export interface Assignment {
    id: string;
    classId: string;
    typeId: string;
    name: string;
    done: boolean;
    earlyDue: string | null; // ISO timestamp, null when there's no early deadline
    due: string; // ISO timestamp
    lateDue: string | null; // ISO timestamp, null when late submissions aren't accepted
    notes: string;
    createdAt: string; // ISO timestamp
    updatedAt: string; // ISO timestamp
}

export interface AssignmentType {
    id: string;
    value: string; // e.g. "Homework"
}

/**
 * Whether an unfinished assignment's due date has passed
 *
 * @param assignment The assignment
 * @param now The current time in milliseconds
 * @returns True when it isn't done and is past due
 */
export const isOverdue = (assignment: Assignment, now: number) => !assignment.done && Date.parse(assignment.due) < now;
