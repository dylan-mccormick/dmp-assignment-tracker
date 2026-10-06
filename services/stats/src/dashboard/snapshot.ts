// snapshot.ts
// The cached inputs of a dashboard: only what changes when data changes, never anything that depends on the clock

export interface SemesterRow {
    id: string;
    name: string;
    startDate: string; // "YYYY-MM-DD"
    endDate: string; // "YYYY-MM-DD"
}

export interface ClassRow {
    id: string;
    code: string;
    name: string;
}

export interface AssignmentRow {
    id: string;
    classId: string;
    typeId: string;
    name: string;
    done: boolean;
    due: string; // ISO timestamp
    lateDue: string | null; // ISO timestamp
}

/** One semester's classes and assignments, plus the type names they refer to */
export interface SemesterSnapshot {
    semester: SemesterRow;
    classes: ClassRow[]; // by name, as the assignment service lists them
    assignments: AssignmentRow[]; // soonest due first, as the assignment service lists them
    typeNames: Record<string, string>; // type id -> value, e.g. "Homework"
}
