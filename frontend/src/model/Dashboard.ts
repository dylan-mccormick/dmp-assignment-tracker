// Dashboard.ts
// The dashboard stats as returned by the gateway's GET /api/v1/stats/dashboard

export interface DashboardAssignment {
    id: string;
    name: string;
    classId: string;
    classCode: string;
    className: string;
    type: string; // e.g. "Homework"
    due: string; // ISO timestamp
    lateDue: string | null; // ISO timestamp, null when late submissions aren't accepted
}

export interface DashboardClass {
    classId: string;
    code: string;
    name: string;
    done: number;
    total: number; // 0 when the class has no assignments
}

export interface Dashboard {
    semester: { id: string; name: string; startDate: string; endDate: string } | null; // null: no semesters at all
    progress: { daysElapsed: number; daysTotal: number; fraction: number } | null;
    assignmentsDone: number;
    assignmentsTotal: number;
    classes: DashboardClass[];
    week: { done: number; notDone: number; total: number };
    upcoming: DashboardAssignment[]; // not done, due in the next 7 days, soonest first
    overdue: DashboardAssignment[]; // not done, past due, most overdue first
    types: { type: string; done: number; total: number }[]; // the semester's types in use, most assignments first
}
