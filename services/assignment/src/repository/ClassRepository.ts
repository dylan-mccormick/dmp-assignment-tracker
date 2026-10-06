// ClassRepository.ts
// A repository to handle a user's classes

import type { MicroserviceError } from "../error/MicroserviceError";
import { Class } from "../generated/assignment";

export interface ClassProps {
    semesterId: string;
    name: string;
    code: string;
}

export interface ClassRepository {
    /**
     * Lists the user's classes by name, optionally only those in one semester
     *
     * @param userId The owner of the classes
     * @param semesterId If set, only this semester's classes are listed
     * @returns The classes, or undefined if semesterId is set but isn't one of the user's semesters
     * @throws {MicroserviceError} If the database fails
     */
    listClasses(userId: string, semesterId?: string): Promise<Class[] | undefined>;

    /**
     * Gets one of the user's classes
     *
     * @param userId The owner of the class
     * @param classId The id of the class
     * @returns The class, or undefined if it doesn't exist or belongs to another user
     * @throws {MicroserviceError} If the database fails
     */
    getClass(userId: string, classId: string): Promise<Class | undefined>;

    /**
     * Creates a class in one of the user's semesters. The semester's ownership is checked in the same statement as the
     * insert, so a class can never be created under another user's semester
     *
     * @param userId The owner of the class
     * @param props The class's (already validated) properties
     * @returns The created class, or undefined if the semester doesn't exist or belongs to another user
     * @throws {MicroserviceError} ALREADY_EXISTS if the semester has a class with that name, INTERNAL if the database
     *   fails
     */
    createClass(userId: string, props: ClassProps): Promise<Class | undefined>;

    /**
     * Replaces the class's properties, moving it if the semester changed. The target semester's ownership is checked in
     * the same statement as the update
     *
     * @param userId The owner of the class
     * @param classId The id of the class
     * @param props The class's new (already validated) properties
     * @returns The updated class, or undefined if the class or the target semester doesn't exist or belongs to another
     *   user
     * @throws {MicroserviceError} ALREADY_EXISTS if the target semester has another class with that name, INTERNAL if
     *   the database fails
     */
    updateClass(userId: string, classId: string, props: ClassProps): Promise<Class | undefined>;

    /**
     * Deletes the class, and with it its assignments
     *
     * @param userId The owner of the class
     * @param classId The id of the class
     * @returns Whether a class was deleted (false if it doesn't exist or belongs to another user)
     * @throws {MicroserviceError} If the database fails
     */
    deleteClass(userId: string, classId: string): Promise<boolean>;
}
