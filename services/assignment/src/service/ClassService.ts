// ClassService.ts
// Defines the interface for ClassService

import type { MicroserviceError } from "../error/MicroserviceError";
import { Class } from "../generated/assignment";

export interface ClassUpdate {
    semesterId?: string;
    name?: string;
    code?: string;
}

export interface ClassService {
    /**
     * Lists the user's classes by name, optionally only those in one semester
     *
     * @param userId The owner of the classes
     * @param semesterId If set, only this semester's classes are listed
     * @returns The classes
     * @throws {MicroserviceError} NOT_FOUND if semesterId is set but isn't one of the user's semesters
     */
    listClasses(userId: string, semesterId?: string): Promise<{ classes: Class[] }>;

    /**
     * Gets one of the user's classes
     *
     * @param userId The owner of the class
     * @param classId The id of the class
     * @returns The class
     * @throws {MicroserviceError} NOT_FOUND if it doesn't exist or belongs to another user
     */
    getClass(userId: string, classId: string): Promise<{ class: Class }>;

    /**
     * Creates a class in one of the user's semesters. The name and code are trimmed
     *
     * @param userId The owner of the class
     * @param props The class's semester, name and code
     * @returns The created class
     * @throws {MicroserviceError} INVALID_ARGUMENT for an empty/long name or code, NOT_FOUND if the semester isn't the
     *   user's, ALREADY_EXISTS if the semester already has a class with that name
     */
    createClass(userId: string, props: { semesterId: string; name: string; code: string }): Promise<{ class: Class }>;

    /**
     * Updates only the given fields of a class; setting semesterId moves it (and its assignments) to that semester
     *
     * @param userId The owner of the class
     * @param classId The id of the class
     * @param update The fields to change
     * @returns The updated class
     * @throws {MicroserviceError} NOT_FOUND if the class or the target semester isn't the user's, INVALID_ARGUMENT or
     *   ALREADY_EXISTS as for createClass
     */
    updateClass(userId: string, classId: string, update: ClassUpdate): Promise<{ class: Class }>;

    /**
     * Deletes a class, and with it its assignments
     *
     * @param userId The owner of the class
     * @param classId The id of the class
     * @returns True when deleted
     * @throws {MicroserviceError} NOT_FOUND if it doesn't exist or belongs to another user
     */
    deleteClass(userId: string, classId: string): Promise<{ deleted: boolean }>;
}
