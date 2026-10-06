// AssignmentRepository.ts
// A repository to handle a user's assignments and the global assignment types

import type { MicroserviceError } from "../error/MicroserviceError";
import { Assignment, AssignmentType } from "../generated/assignment";

export interface AssignmentProps {
    classId: string;
    typeId: string;
    name: string;
    done: boolean;
    earlyDue?: Date;
    due: Date;
    lateDue?: Date;
}

export interface AssignmentFilter {
    classId?: string;
    semesterId?: string;
    done?: boolean;
}

export interface AssignmentRepository {
    /**
     * Lists the global assignment types
     *
     * @returns The types, ordered by value
     * @throws {MicroserviceError} If the database fails
     */
    listAssignmentTypes(): Promise<AssignmentType[]>;

    /**
     * Lists the user's assignments, soonest due first, optionally only one class's or one semester's
     *
     * @param userId The owner of the assignments
     * @param filter At most one of classId/semesterId, and optionally done
     * @returns The assignments, or undefined if the classId/semesterId isn't one of the user's
     * @throws {MicroserviceError} If the database fails
     */
    listAssignments(userId: string, filter: AssignmentFilter): Promise<Assignment[] | undefined>;

    /**
     * Gets one of the user's assignments
     *
     * @param userId The owner of the assignment
     * @param assignmentId The id of the assignment
     * @returns The assignment, or undefined if it doesn't exist or belongs to another user
     * @throws {MicroserviceError} If the database fails
     */
    getAssignment(userId: string, assignmentId: string): Promise<Assignment | undefined>;

    /**
     * Creates an assignment in one of the user's classes. The class's ownership is checked in the same statement as the
     * insert, so an assignment can never be created under another user's class
     *
     * @param userId The owner of the assignment
     * @param props The assignment's (already validated) properties
     * @returns The created assignment, or undefined if the class doesn't exist or belongs to another user
     * @throws {MicroserviceError} INVALID_ARGUMENT for an unknown type or out-of-order deadlines, INTERNAL if the
     *   database fails
     */
    createAssignment(userId: string, props: AssignmentProps): Promise<Assignment | undefined>;

    /**
     * Replaces the assignment's properties, moving it if the class changed. The target class's ownership is checked in
     * the same statement as the update
     *
     * @param userId The owner of the assignment
     * @param assignmentId The id of the assignment
     * @param props The assignment's new (already validated) properties
     * @returns The updated assignment, or undefined if the assignment or the target class doesn't exist or belongs to
     *   another user
     * @throws {MicroserviceError} INVALID_ARGUMENT for an unknown type or out-of-order deadlines, INTERNAL if the
     *   database fails
     */
    updateAssignment(userId: string, assignmentId: string, props: AssignmentProps): Promise<Assignment | undefined>;

    /**
     * Deletes the assignment
     *
     * @param userId The owner of the assignment
     * @param assignmentId The id of the assignment
     * @returns The deleted assignment, or undefined if it doesn't exist or belongs to another user
     * @throws {MicroserviceError} If the database fails
     */
    deleteAssignment(userId: string, assignmentId: string): Promise<Assignment | undefined>;
}
