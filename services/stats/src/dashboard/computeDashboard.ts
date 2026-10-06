// computeDashboard.ts
// Turns a cached snapshot plus the caller's clock into the dashboard; pure, so it runs on every request

import { ClassProgress, DashboardAssignment, GetDashboardResponse } from "../generated/stats";
import { AssignmentRow, SemesterRow, SemesterSnapshot } from "./snapshot";

const DAY_MS = 24 * 60 * 60 * 1000;
const UPCOMING_MS = 7 * DAY_MS;

export interface Clock {
    today: string; // the user's local date, "YYYY-MM-DD"
    now: Date;
    weekStart: Date; // inclusive
    weekEnd: Date; // exclusive
}

// Whole days from one calendar date to another (UTC midnights, so daylight saving can't add or drop an hour)
const daysBetween = (from: string, to: string) => {
    const [fy, fm, fd] = from.split("-").map(Number);
    const [ty, tm, td] = to.split("-").map(Number);
    return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / DAY_MS);
};

/**
 * Picks the semester to summarize when the caller doesn't: the one containing today (the most recently started, if they
 * overlap), else the next one to start, else the most recently ended
 *
 * @param semesters The user's semesters
 * @param today The user's local date, "YYYY-MM-DD"
 * @returns The semester, or undefined when there are none
 */
export const pickActiveSemester = (semesters: SemesterRow[], today: string): SemesterRow | undefined => {
    const byStartDesc = [...semesters].sort((a, b) => b.startDate.localeCompare(a.startDate));
    const current = byStartDesc.find(s => s.startDate <= today && today <= s.endDate);
    if (current) return current;

    const next = [...semesters]
        .filter(s => s.startDate > today)
        .sort((a, b) => a.startDate.localeCompare(b.startDate))[0];
    if (next) return next;

    return [...semesters].sort((a, b) => b.endDate.localeCompare(a.endDate))[0];
};

/**
 * Days of the semester that have passed, both ends inclusive: 0 before it starts, all of them after it ends
 *
 * @param semester The semester
 * @param today The user's local date, "YYYY-MM-DD"
 * @returns The progress
 */
export const semesterProgress = (semester: SemesterRow, today: string) => {
    const daysTotal = daysBetween(semester.startDate, semester.endDate) + 1;
    const daysElapsed = Math.min(Math.max(daysBetween(semester.startDate, today) + 1, 0), daysTotal);
    return { daysElapsed, daysTotal, fraction: daysElapsed / daysTotal };
};

const toDashboardAssignment =
    (snapshot: SemesterSnapshot, classesById: Map<string, { code: string; name: string }>) =>
    (assignment: AssignmentRow): DashboardAssignment => ({
        id: assignment.id,
        name: assignment.name,
        classId: assignment.classId,
        classCode: classesById.get(assignment.classId)?.code ?? "",
        className: classesById.get(assignment.classId)?.name ?? "",
        type: snapshot.typeNames[assignment.typeId] ?? "",
        due: new Date(assignment.due),
        lateDue: assignment.lateDue ? new Date(assignment.lateDue) : undefined
    });

/**
 * Computes the dashboard for one semester
 *
 * @param snapshot The semester's cached classes and assignments
 * @param clock The caller's "today", "now" and week bounds
 * @returns The dashboard
 */
export const computeDashboard = (
    snapshot: SemesterSnapshot,
    { today, now, weekStart, weekEnd }: Clock
): GetDashboardResponse => {
    const { semester, classes, assignments } = snapshot;
    const nowMs = now.getTime();
    const dueMs = (a: AssignmentRow) => Date.parse(a.due);
    const bySoonestDue = (a: AssignmentRow, b: AssignmentRow) => dueMs(a) - dueMs(b);

    const counts = new Map(classes.map(c => [c.id, { done: 0, total: 0 }]));
    for (const assignment of assignments) {
        const count = counts.get(assignment.classId);
        if (!count) continue;
        count.total++;
        if (assignment.done) count.done++;
    }
    const classProgress: ClassProgress[] = classes.map(c => ({
        classId: c.id,
        code: c.code,
        name: c.name,
        done: counts.get(c.id)!.done,
        total: counts.get(c.id)!.total
    }));

    const thisWeek = assignments.filter(a => dueMs(a) >= weekStart.getTime() && dueMs(a) < weekEnd.getTime());
    const weekDone = thisWeek.filter(a => a.done).length;

    const notDone = assignments.filter(a => !a.done);
    const toItem = toDashboardAssignment(snapshot, new Map(classes.map(c => [c.id, c])));

    return {
        semester: { ...semester },
        progress: semesterProgress(semester, today),
        assignmentsDone: assignments.filter(a => a.done).length,
        assignmentsTotal: assignments.length,
        classes: classProgress,
        week: { done: weekDone, notDone: thisWeek.length - weekDone, total: thisWeek.length },
        upcoming: notDone
            .filter(a => dueMs(a) >= nowMs && dueMs(a) < nowMs + UPCOMING_MS)
            .sort(bySoonestDue)
            .map(toItem),
        overdue: notDone
            .filter(a => dueMs(a) < nowMs)
            .sort(bySoonestDue)
            .map(toItem)
    };
};
