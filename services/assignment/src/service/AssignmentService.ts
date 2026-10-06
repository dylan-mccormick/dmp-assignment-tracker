// AssignmentService.ts
// Defines the interface for AssignmentService

import type { MicroserviceError } from "../error/MicroserviceError";
import { Assignment, AssignmentType } from "../generated/assignment";
import { AssignmentFilter } from "../repository/AssignmentRepository";

export interface AssignmentCreate {
    classId: string;
    typeId: string;
    name: string;
    done: boolean;
    earlyDue?: Date;
    due?: Date;
    lateDue?: Date;
    notes: string;
}

export interface AssignmentUpdate {
    classId?: string;
    typeId?: string;
    name?: string;
    done?: boolean;
    earlyDue?: Date;
    due?: Date;
    lateDue?: Date;
    notes?: string;
    clearEarlyDue: boolean;
    clearLateDue: boolean;
}

export interface AssignmentService {
    /**
     * Lists the global assignment types
     *
     * @returns The types, ordered by value
     * @throws {MicroserviceError} If the database fails
     */
    listAssignmentTypes(): Promise<{ types: AssignmentType[] }>;

    /**
     * Lists the user's assignments, soonest due first, optionally only one class's or one semester's
     *
     * @param userId The owner of the assignments
     * @param filter At most one of classId/semesterId, and optionally done
     * @returns The assignments
     * @throws {MicroserviceError} INVALID_ARGUMENT if both classId and semesterId are set, NOT_FOUND if the one that's
     *   set isn't the user's
     */
    listAssignments(userId: string, filter: AssignmentFilter): Promise<{ assignments: Assignment[] }>;

    /**
     * Gets one of the user's assignments
     *
     * @param userId The owner of the assignment
     * @param assignmentId The id of the assignment
     * @returns The assignment
     * @throws {MicroserviceError} NOT_FOUND if it doesn't exist or belongs to another user
     */
    getAssignment(userId: string, assignmentId: string): Promise<{ assignment: Assignment }>;

    /**
     * Creates an assignment in one of the user's classes. The name is trimmed
     *
     * @param userId The owner of the assignment
     * @param props The assignment's class, type, name, done flag and deadlines
     * @returns The created assignment
     * @throws {MicroserviceError} INVALID_ARGUMENT for an empty/long name, an unknown type, a missing due date,
     *   out-of-order deadlines or overlong notes, NOT_FOUND if the class isn't the user's
     */
    createAssignment(userId: string, props: AssignmentCreate): Promise<{ assignment: Assignment }>;

    /**
     * Updates only the given fields of an assignment; setting classId moves it to that class
     *
     * @param userId The owner of the assignment
     * @param assignmentId The id of the assignment
     * @param update The fields to change; clearEarlyDue/clearLateDue remove those deadlines
     * @returns The updated assignment
     * @throws {MicroserviceError} NOT_FOUND if the assignment or the target class isn't the user's, INVALID_ARGUMENT as
     *   for createAssignment or when a deadline is both set and cleared
     */
    updateAssignment(
        userId: string,
        assignmentId: string,
        update: AssignmentUpdate
    ): Promise<{ assignment: Assignment }>;

    /**
     * Deletes an assignment
     *
     * @param userId The owner of the assignment
     * @param assignmentId The id of the assignment
     * @returns True when deleted
     * @throws {MicroserviceError} NOT_FOUND if it doesn't exist or belongs to another user
     */
    deleteAssignment(userId: string, assignmentId: string): Promise<{ deleted: boolean }>;
}
