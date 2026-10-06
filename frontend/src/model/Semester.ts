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

/**
 * Whether a calendar date falls within the semester (inclusive)
 *
 * @param semester The semester
 * @param date A "YYYY-MM-DD" calendar date, e.g. from todayDate()
 * @returns True when the semester is running on that date
 */
export const isCurrentSemester = (semester: Semester, date: string) =>
    semester.startDate <= date && date <= semester.endDate;
