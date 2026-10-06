// Semester.ts
// A semester as returned by the gateway's /api/v1/semesters routes

export interface Semester {
    id: string;
    name: string;
    startDate: string; // "YYYY-MM-DD"
    endDate: string; // "YYYY-MM-DD"
    createdAt: string; // ISO timestamp
    updatedAt: string; // ISO timestamp
}

/**
 * Orders semesters like the API: newest start date first, then newest created
 *
 * @param a A semester
 * @param b Another semester
 * @returns A negative number when a comes first
 */
export const compareSemesters = (a: Semester, b: Semester) =>
    b.startDate.localeCompare(a.startDate) || b.createdAt.localeCompare(a.createdAt);
