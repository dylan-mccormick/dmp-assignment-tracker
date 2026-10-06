// assignmentNavigation.ts
// Keeps the assignment pages' back links pointing at the table view (semester, filters, page) they were opened from

/** The router state passed along list -> assignment -> edit, so each page can link back to the same table view */
export interface AssignmentNavState {
    back: string;
    /** Set when the edit page was opened from the assignment's view, so leaving it can step back in history instead */
    fromView?: boolean;
}

/**
 * The table URL to go back to: the one this page was opened from, else that semester's table
 *
 * @param state The router location's state
 * @param semesterId The assignment's semester, if known
 * @returns The /assignments URL
 */
export const listBackUrl = (state: unknown, semesterId?: string | null) => {
    const back = (state as Partial<AssignmentNavState> | null)?.back;
    if (typeof back === "string" && back.startsWith("/assignments")) return back;
    return `/assignments${semesterId ? `?semester=${encodeURIComponent(semesterId)}` : ""}`;
};
