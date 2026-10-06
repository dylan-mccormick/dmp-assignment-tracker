// AssignmentEvents.ts
// Notifies other services (Stats, Notification) about committed assignment changes

import { Assignment } from "../generated/assignment";

/**
 * Called by the AssignmentService after each write has committed, with the full rows rather than a pre-chosen event
 * name, so a publisher can derive whatever its consumers need (e.g. assignment.completed when done went false -> true,
 * assignment.due_date_changed when due moved) without the service guessing.
 *
 * Calls are best effort: the write has already committed, so a failure is logged and the request still succeeds. That
 * can lose an event if the process dies or the broker is down; an outbox table would close that gap.
 *
 * Not yet covered: assignments removed by a cascading class or semester delete, and classes moving between semesters.
 */
export interface AssignmentEvents {
    /**
     * @param userId The owner of the assignment
     * @param assignment The created assignment
     */
    created(userId: string, assignment: Assignment): Promise<void>;

    /**
     * @param userId The owner of the assignment
     * @param before The assignment before the update
     * @param after The assignment after the update
     */
    updated(userId: string, before: Assignment, after: Assignment): Promise<void>;

    /**
     * @param userId The owner of the assignment
     * @param assignment The deleted assignment
     */
    deleted(userId: string, assignment: Assignment): Promise<void>;
}
