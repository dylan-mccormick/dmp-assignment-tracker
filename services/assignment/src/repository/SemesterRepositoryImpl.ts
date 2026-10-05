// SemesterRepositoryImpl.ts
// Implementation of the SemesterRepository

import { status } from "@grpc/grpc-js";
import { DatabaseError, Pool } from "pg";
import { v7 as uuidv7 } from "uuid";

import { MicroserviceError } from "../error/MicroserviceError";
import { Semester } from "../generated/assignment";
import { SemesterProps, SemesterRepository } from "./SemesterRepository";

const UNIQUE_VIOLATION = "23505";
const CHECK_VIOLATION = "23514";
const INVALID_TEXT_REPRESENTATION = "22P02"; // e.g. a malformed uuid

const rowToSemester = (row: any): Semester => ({
    id: row.id,
    name: row.name,
    startDate: row.start_date,
    endDate: row.end_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at
});

const isDatabaseError = (error: unknown, code: string) => error instanceof DatabaseError && error.code === code;

// Maps constraint violations on writes to user-facing errors
const writeError = (error: unknown, name: string, loggingMessage: string) => {
    if (isDatabaseError(error, UNIQUE_VIOLATION))
        return new MicroserviceError(
            status.ALREADY_EXISTS,
            `You already have a semester named "${name}".`,
            "Semester name conflicted with another of the user's semesters.",
            error
        );
    if (isDatabaseError(error, CHECK_VIOLATION))
        return new MicroserviceError(
            status.INVALID_ARGUMENT,
            "A semester's end date can't be before its start date.",
            "Semester write violated the end_date >= start_date check.",
            error
        );
    return new MicroserviceError(status.INTERNAL, "Unknown internal error.", loggingMessage, error);
};

export class SemesterRepositoryImpl implements SemesterRepository {
    private readonly pool;

    constructor(pool: Pool) {
        this.pool = pool;
    }

    async listSemesters(userId: string): Promise<Semester[]> {
        try {
            const result = await this.pool.query(
                "SELECT * FROM semesters WHERE user_id = $1 ORDER BY start_date DESC, created_at DESC",
                [userId]
            );
            return result.rows.map(rowToSemester);
        } catch (error) {
            throw new MicroserviceError(
                status.INTERNAL,
                "Unknown internal error.",
                "Failed to list semesters due to database error.",
                error
            );
        }
    }

    async getSemester(userId: string, semesterId: string): Promise<Semester | undefined> {
        try {
            const result = await this.pool.query("SELECT * FROM semesters WHERE id = $1 AND user_id = $2", [
                semesterId,
                userId
            ]);
            return result.rows[0] ? rowToSemester(result.rows[0]) : undefined;
        } catch (error) {
            if (isDatabaseError(error, INVALID_TEXT_REPRESENTATION)) return undefined;
            throw new MicroserviceError(
                status.INTERNAL,
                "Unknown internal error.",
                "Failed to get semester due to database error.",
                error
            );
        }
    }

    async createSemester(userId: string, props: SemesterProps): Promise<Semester> {
        try {
            const result = await this.pool.query(
                `INSERT INTO semesters (id, user_id, name, start_date, end_date) VALUES ($1, $2, $3, $4, $5)
                RETURNING *`,
                [uuidv7(), userId, props.name, props.startDate, props.endDate]
            );
            return rowToSemester(result.rows[0]);
        } catch (error) {
            throw writeError(error, props.name, "Failed to create semester due to database error.");
        }
    }

    async updateSemester(userId: string, semesterId: string, props: SemesterProps): Promise<Semester | undefined> {
        try {
            const result = await this.pool.query(
                `UPDATE semesters SET name = $1, start_date = $2, end_date = $3, updated_at = NOW()
                WHERE id = $4 AND user_id = $5 RETURNING *`,
                [props.name, props.startDate, props.endDate, semesterId, userId]
            );
            return result.rows[0] ? rowToSemester(result.rows[0]) : undefined;
        } catch (error) {
            if (isDatabaseError(error, INVALID_TEXT_REPRESENTATION)) return undefined;
            throw writeError(error, props.name, "Failed to update semester due to database error.");
        }
    }

    async deleteSemester(userId: string, semesterId: string): Promise<boolean> {
        try {
            const result = await this.pool.query("DELETE FROM semesters WHERE id = $1 AND user_id = $2", [
                semesterId,
                userId
            ]);
            return (result.rowCount ?? 0) > 0;
        } catch (error) {
            if (isDatabaseError(error, INVALID_TEXT_REPRESENTATION)) return false;
            throw new MicroserviceError(
                status.INTERNAL,
                "Unknown internal error.",
                "Failed to delete semester due to database error.",
                error
            );
        }
    }
}
