// ClassRepositoryImpl.ts
// Implementation of the ClassRepository

import { status } from "@grpc/grpc-js";
import { Pool } from "pg";
import { v7 as uuidv7 } from "uuid";

import { MicroserviceError } from "../error/MicroserviceError";
import { Class } from "../generated/assignment";
import { ClassProps, ClassRepository } from "./ClassRepository";
import {
    FOREIGN_KEY_VIOLATION,
    INVALID_TEXT_REPRESENTATION,
    isDatabaseError,
    UNIQUE_VIOLATION
} from "./databaseErrors";

const rowToClass = (row: any): Class => ({
    id: row.id,
    semesterId: row.semester_id,
    name: row.name,
    code: row.code,
    createdAt: row.created_at,
    updatedAt: row.updated_at
});

const internal = (loggingMessage: string, error: unknown) =>
    new MicroserviceError(status.INTERNAL, "Unknown internal error.", loggingMessage, error);

// Maps a duplicate name on writes to a user-facing error
const writeError = (error: unknown, name: string, loggingMessage: string) => {
    if (isDatabaseError(error, UNIQUE_VIOLATION))
        return new MicroserviceError(
            status.ALREADY_EXISTS,
            `That semester already has a class named "${name}".`,
            "Class name conflicted with another class in the same semester.",
            error
        );
    return internal(loggingMessage, error);
};

export class ClassRepositoryImpl implements ClassRepository {
    private readonly pool;

    constructor(pool: Pool) {
        this.pool = pool;
    }

    async listClasses(userId: string, semesterId?: string): Promise<Class[] | undefined> {
        try {
            if (semesterId === undefined) {
                const result = await this.pool.query(
                    "SELECT * FROM classes WHERE user_id = $1 ORDER BY LOWER(name), created_at",
                    [userId]
                );
                return result.rows.map(rowToClass);
            }

            // Starting from the semester tells "not your semester" (no rows) apart from "no classes yet" (one row
            // of NULLs from the LEFT JOIN)
            const result = await this.pool.query(
                `SELECT c.* FROM semesters s LEFT JOIN classes c ON c.semester_id = s.id
                WHERE s.id = $1 AND s.user_id = $2 ORDER BY LOWER(c.name), c.created_at`,
                [semesterId, userId]
            );
            if (result.rows.length === 0) return undefined;
            return result.rows.filter(row => row.id !== null).map(rowToClass);
        } catch (error) {
            if (isDatabaseError(error, INVALID_TEXT_REPRESENTATION)) return undefined;
            throw internal("Failed to list classes due to database error.", error);
        }
    }

    async getClass(userId: string, classId: string): Promise<Class | undefined> {
        try {
            const result = await this.pool.query("SELECT * FROM classes WHERE id = $1 AND user_id = $2", [
                classId,
                userId
            ]);
            return result.rows[0] ? rowToClass(result.rows[0]) : undefined;
        } catch (error) {
            if (isDatabaseError(error, INVALID_TEXT_REPRESENTATION)) return undefined;
            throw internal("Failed to get class due to database error.", error);
        }
    }

    async createClass(userId: string, props: ClassProps): Promise<Class | undefined> {
        try {
            // Inserts nothing unless the semester is the user's
            const result = await this.pool.query(
                `INSERT INTO classes (id, semester_id, user_id, name, code)
                SELECT $1, s.id, s.user_id, $2, $3 FROM semesters s WHERE s.id = $4 AND s.user_id = $5
                RETURNING *`,
                [uuidv7(), props.name, props.code, props.semesterId, userId]
            );
            return result.rows[0] ? rowToClass(result.rows[0]) : undefined;
        } catch (error) {
            // a malformed semester id, or the semester was deleted between the SELECT and the foreign key check
            if (isDatabaseError(error, INVALID_TEXT_REPRESENTATION) || isDatabaseError(error, FOREIGN_KEY_VIOLATION))
                return undefined;
            throw writeError(error, props.name, "Failed to create class due to database error.");
        }
    }

    async updateClass(userId: string, classId: string, props: ClassProps): Promise<Class | undefined> {
        try {
            // Updates nothing unless both the class and the target semester are the user's
            const result = await this.pool.query(
                `UPDATE classes c SET semester_id = s.id, name = $1, code = $2, updated_at = NOW()
                FROM semesters s
                WHERE c.id = $3 AND c.user_id = $4 AND s.id = $5 AND s.user_id = $4
                RETURNING c.*`,
                [props.name, props.code, classId, userId, props.semesterId]
            );
            return result.rows[0] ? rowToClass(result.rows[0]) : undefined;
        } catch (error) {
            if (isDatabaseError(error, INVALID_TEXT_REPRESENTATION) || isDatabaseError(error, FOREIGN_KEY_VIOLATION))
                return undefined;
            throw writeError(error, props.name, "Failed to update class due to database error.");
        }
    }

    async deleteClass(userId: string, classId: string): Promise<boolean> {
        try {
            const result = await this.pool.query("DELETE FROM classes WHERE id = $1 AND user_id = $2", [
                classId,
                userId
            ]);
            return (result.rowCount ?? 0) > 0;
        } catch (error) {
            if (isDatabaseError(error, INVALID_TEXT_REPRESENTATION)) return false;
            throw internal("Failed to delete class due to database error.", error);
        }
    }
}
