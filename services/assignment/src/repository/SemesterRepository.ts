// SemesterRepository.ts
// A repository to handle a user's semesters

import type { MicroserviceError } from "../error/MicroserviceError";
import { Semester } from "../generated/assignment";

export interface SemesterProps {
    name: string;
    startDate: string; // "YYYY-MM-DD"
    endDate: string; // "YYYY-MM-DD"
}

export interface SemesterRepository {
    /**
     * Lists the user's semesters, newest start date first
     *
     * @param userId The owner of the semesters
     * @returns The semesters
     * @throws {MicroserviceError} If the database fails
     */
    listSemesters(userId: string): Promise<Semester[]>;

    /**
     * Gets one of the user's semesters
     *
     * @param userId The owner of the semester
     * @param semesterId The id of the semester
     * @returns The semester, or undefined if it doesn't exist or belongs to another user
     * @throws {MicroserviceError} If the database fails
     */
    getSemester(userId: string, semesterId: string): Promise<Semester | undefined>;

    /**
     * Creates a semester for the user
     *
     * @param userId The owner of the semester
     * @param props The semester's (already validated) properties
     * @returns The created semester
     * @throws {MicroserviceError} ALREADY_EXISTS if the user has a semester with that name, INVALID_ARGUMENT if the
     *   dates are out of order, INTERNAL if the database fails
     */
    createSemester(userId: string, props: SemesterProps): Promise<Semester>;

    /**
     * Replaces the semester's properties
     *
     * @param userId The owner of the semester
     * @param semesterId The id of the semester
     * @param props The semester's new (already validated) properties
     * @returns The updated semester, or undefined if it doesn't exist or belongs to another user
     * @throws {MicroserviceError} ALREADY_EXISTS if the user has another semester with that name, INVALID_ARGUMENT if
     *   the dates are out of order, INTERNAL if the database fails
     */
    updateSemester(userId: string, semesterId: string, props: SemesterProps): Promise<Semester | undefined>;

    /**
     * Deletes the semester, and with it its classes and their assignments
     *
     * @param userId The owner of the semester
     * @param semesterId The id of the semester
     * @returns Whether a semester was deleted (false if it doesn't exist or belongs to another user)
     * @throws {MicroserviceError} If the database fails
     */
    deleteSemester(userId: string, semesterId: string): Promise<boolean>;
}
