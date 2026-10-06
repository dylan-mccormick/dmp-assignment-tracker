// SemesterService.ts
// Defines the interface for SemesterService

import type { MicroserviceError } from "../error/MicroserviceError";
import { Semester } from "../generated/assignment";

export interface SemesterUpdate {
    name?: string;
    startDate?: string;
    endDate?: string;
}

export interface SemesterService {
    /**
     * Lists the user's semesters, newest start date first
     *
     * @param userId The owner of the semesters
     * @returns The semesters
     * @throws {MicroserviceError} If the database fails
     */
    listSemesters(userId: string): Promise<{ semesters: Semester[] }>;

    /**
     * Gets one of the user's semesters
     *
     * @param userId The owner of the semester
     * @param semesterId The id of the semester
     * @returns The semester
     * @throws {MicroserviceError} NOT_FOUND if it doesn't exist or belongs to another user
     */
    getSemester(userId: string, semesterId: string): Promise<{ semester: Semester }>;

    /**
     * Creates a semester. The name is trimmed; dates are "YYYY-MM-DD"
     *
     * @param userId The owner of the semester
     * @param props The semester's name and dates
     * @returns The created semester
     * @throws {MicroserviceError} INVALID_ARGUMENT for an empty/long name or bad dates, ALREADY_EXISTS for a duplicate
     *   name
     */
    createSemester(
        userId: string,
        props: { name: string; startDate: string; endDate: string }
    ): Promise<{
        semester: Semester;
    }>;

    /**
     * Updates only the given fields of a semester (validated together with the unchanged ones)
     *
     * @param userId The owner of the semester
     * @param semesterId The id of the semester
     * @param update The fields to change
     * @returns The updated semester
     * @throws {MicroserviceError} NOT_FOUND, INVALID_ARGUMENT, or ALREADY_EXISTS as for createSemester
     */
    updateSemester(userId: string, semesterId: string, update: SemesterUpdate): Promise<{ semester: Semester }>;

    /**
     * Deletes a semester, and with it its classes and their assignments
     *
     * @param userId The owner of the semester
     * @param semesterId The id of the semester
     * @returns True when deleted
     * @throws {MicroserviceError} NOT_FOUND if it doesn't exist or belongs to another user
     */
    deleteSemester(userId: string, semesterId: string): Promise<{ deleted: boolean }>;
}
