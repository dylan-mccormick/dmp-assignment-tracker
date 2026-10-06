// assignmentFilters.ts
// The assignment table's filters: their URL form and how they're applied (client-side, over one semester's assignments)

import { endOfLocalDay, startOfLocalDay } from "../../dates";
import type { Assignment } from "../../model/Assignment";
import { DEFAULT_PAGE_SIZE, PAGE_SIZES } from "../../pagination";

export interface AssignmentFilters {
    classId: string; // "" for every class
    from: string; // "YYYY-MM-DD" or ""; due on or after the start of this day
    to: string; // "YYYY-MM-DD" or ""; due on or before the end of this day
    hideDone: boolean;
}

export const NO_FILTERS: AssignmentFilters = { classId: "", from: "", to: "", hideDone: false };

// URL query parameters, so the view survives a reload and the back link from an assignment
export const PARAMS = {
    semester: "semester",
    classId: "class",
    from: "from",
    to: "to",
    hideDone: "hideDone",
    search: "q",
    page: "page",
    pageSize: "size"
} as const;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Reads the filters from the URL, ignoring malformed values and a class that isn't in the semester
 *
 * @param params The URL's query parameters
 * @param classIds The ids of the picked semester's classes
 * @returns The filters
 */
export const readFilters = (params: URLSearchParams, classIds: Set<string>): AssignmentFilters => {
    const classId = params.get(PARAMS.classId) ?? "";
    const from = params.get(PARAMS.from) ?? "";
    const to = params.get(PARAMS.to) ?? "";
    return {
        classId: classIds.has(classId) ? classId : "",
        from: DATE_PATTERN.test(from) ? from : "",
        to: DATE_PATTERN.test(to) ? to : "",
        hideDone: params.get(PARAMS.hideDone) === "1"
    };
};

/**
 * The URL parameter changes that store the given filters (undefined removes a parameter)
 *
 * @param filters The filters
 * @returns The parameter patch
 */
export const filtersToParams = ({ classId, from, to, hideDone }: AssignmentFilters) => ({
    [PARAMS.classId]: classId || undefined,
    [PARAMS.from]: from || undefined,
    [PARAMS.to]: to || undefined,
    [PARAMS.hideDone]: hideDone ? "1" : undefined
});

/**
 * Reads the rows-per-page setting from the URL
 *
 * @param params The URL's query parameters
 * @returns One of PAGE_SIZES
 */
export const readPageSize = (params: URLSearchParams) => {
    const size = Number(params.get(PARAMS.pageSize));
    return PAGE_SIZES.includes(size) ? size : DEFAULT_PAGE_SIZE;
};

/**
 * Counts the filters that narrow the list, for the filter button's badge
 *
 * @param filters The filters
 * @returns How many are set
 */
export const countActiveFilters = ({ classId, from, to, hideDone }: AssignmentFilters) =>
    [classId, from, to, hideDone].filter(Boolean).length;

/**
 * Applies the filters and a case-insensitive name search, keeping the API's soonest-due-first order
 *
 * @param assignments The semester's assignments
 * @param filters The filters
 * @param search The name search ("" matches everything)
 * @returns The matching assignments
 */
export const applyFilters = (
    assignments: Assignment[],
    { classId, from, to, hideDone }: AssignmentFilters,
    search: string
) => {
    const query = search.trim().toLowerCase();
    const fromMs = from ? startOfLocalDay(from) : -Infinity;
    const toMs = to ? endOfLocalDay(to) : Infinity;

    return assignments.filter(assignment => {
        const due = Date.parse(assignment.due);
        return (
            (!classId || assignment.classId === classId) &&
            due >= fromMs &&
            due <= toMs &&
            (!hideDone || !assignment.done) &&
            (!query || assignment.name.toLowerCase().includes(query))
        );
    });
};
