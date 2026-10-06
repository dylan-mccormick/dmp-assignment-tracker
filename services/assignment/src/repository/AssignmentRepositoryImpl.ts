// AssignmentRepositoryImpl.ts
// Implementation of the AssignmentRepository

import { status } from "@grpc/grpc-js";
import { DatabaseError, Pool } from "pg";
import { v7 as uuidv7 } from "uuid";

import { MicroserviceError } from "../error/MicroserviceError";
import { Assignment, AssignmentType } from "../generated/assignment";
import { AssignmentFilter, AssignmentProps, AssignmentRepository } from "./AssignmentRepository";
import { CHECK_VIOLATION, FOREIGN_KEY_VIOLATION, INVALID_TEXT_REPRESENTATION, isDatabaseError } from "./databaseErrors";

const TYPE_FOREIGN_KEY = "assignments_type_id_fkey";

const rowToAssignment = (row: any): Assignment => ({
    id: row.id,
    classId: row.class_id,
    typeId: row.type_id,
    name: row.name,
    done: row.done,
    earlyDue: row.early_due ?? undefined,
    due: row.due,
    lateDue: row.late_due ?? undefined,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at
});

const internal = (loggingMessage: string, error: unknown) =>
    new MicroserviceError(status.INTERNAL, "Unknown internal error.", loggingMessage, error);

// The write failed because the class is gone or malformed (not the user's), so the caller reports NOT_FOUND
const isMissingClass = (error: unknown) =>
    isDatabaseError(error, INVALID_TEXT_REPRESENTATION) ||
    (isDatabaseError(error, FOREIGN_KEY_VIOLATION) && (error as DatabaseError).constraint !== TYPE_FOREIGN_KEY);

// Maps constraint violations on writes to user-facing errors
const writeError = (error: unknown, loggingMessage: string) => {
    if (isDatabaseError(error, FOREIGN_KEY_VIOLATION))
        return new MicroserviceError(
            status.INVALID_ARGUMENT,
            "Unknown assignment type.",
            "Assignment write referenced a type_id that doesn't exist.",
            error
        );
    if (isDatabaseError(error, CHECK_VIOLATION))
        return new MicroserviceError(
            status.INVALID_ARGUMENT,
            "An assignment's early deadline must be before its due date, and its late deadline after it.",
            "Assignment write violated the early_due <= due <= late_due check.",
            error
        );
    return internal(loggingMessage, error);
};

export class AssignmentRepositoryImpl implements AssignmentRepository {
    private readonly pool;

    constructor(pool: Pool) {
        this.pool = pool;
    }

    async listAssignmentTypes(): Promise<AssignmentType[]> {
        try {
            const result = await this.pool.query("SELECT id, value FROM assignment_type ORDER BY value");
            return result.rows.map(row => ({ id: row.id, value: row.value }));
        } catch (error) {
            throw internal("Failed to list assignment types due to database error.", error);
        }
    }

    async listAssignments(
        userId: string,
        { classId, semesterId, done }: AssignmentFilter
    ): Promise<Assignment[] | undefined> {
        try {
            if (classId === undefined && semesterId === undefined) {
                const result = await this.pool.query(
                    `SELECT * FROM assignments WHERE user_id = $1 AND ($2::boolean IS NULL OR done = $2)
                    ORDER BY due, created_at`,
                    [userId, done ?? null]
                );
                return result.rows.map(rowToAssignment);
            }

            // Starting from the class/semester tells "not yours" (no rows) apart from "no assignments" (a row of NULLs
            // from the LEFT JOIN). The done filter goes in the JOIN's ON so it can't drop that row.
            const result =
                classId !== undefined
                    ? await this.pool.query(
                          `SELECT a.* FROM classes c
                          LEFT JOIN assignments a ON a.class_id = c.id AND ($3::boolean IS NULL OR a.done = $3)
                          WHERE c.id = $1 AND c.user_id = $2 ORDER BY a.due, a.created_at`,
                          [classId, userId, done ?? null]
                      )
                    : await this.pool.query(
                          `SELECT a.* FROM semesters s
                          LEFT JOIN classes c ON c.semester_id = s.id
                          LEFT JOIN assignments a ON a.class_id = c.id AND ($3::boolean IS NULL OR a.done = $3)
                          WHERE s.id = $1 AND s.user_id = $2 ORDER BY a.due, a.created_at`,
                          [semesterId, userId, done ?? null]
                      );
            if (result.rows.length === 0) return undefined;
            return result.rows.filter(row => row.id !== null).map(rowToAssignment);
        } catch (error) {
            if (isDatabaseError(error, INVALID_TEXT_REPRESENTATION)) return undefined;
            throw internal("Failed to list assignments due to database error.", error);
        }
    }

    async getAssignment(userId: string, assignmentId: string): Promise<Assignment | undefined> {
        try {
            const result = await this.pool.query("SELECT * FROM assignments WHERE id = $1 AND user_id = $2", [
                assignmentId,
                userId
            ]);
            return result.rows[0] ? rowToAssignment(result.rows[0]) : undefined;
        } catch (error) {
            if (isDatabaseError(error, INVALID_TEXT_REPRESENTATION)) return undefined;
            throw internal("Failed to get assignment due to database error.", error);
        }
    }

    async createAssignment(userId: string, props: AssignmentProps): Promise<Assignment | undefined> {
        try {
            // Inserts nothing unless the class is the user's
            const result = await this.pool.query(
                `INSERT INTO assignments (id, class_id, user_id, type_id, name, done, early_due, due, late_due, notes)
                SELECT $1, c.id, c.user_id, $2, $3, $4, $5, $6, $7, $10 FROM classes c WHERE c.id = $8 AND c.user_id = $9
                RETURNING *`,
                [
                    uuidv7(),
                    props.typeId,
                    props.name,
                    props.done,
                    props.earlyDue ?? null,
                    props.due,
                    props.lateDue ?? null,
                    props.classId,
                    userId,
                    props.notes
                ]
            );
            return result.rows[0] ? rowToAssignment(result.rows[0]) : undefined;
        } catch (error) {
            // a malformed class id, or the class was deleted between the SELECT and the foreign key check
            if (isMissingClass(error)) return undefined;
            throw writeError(error, "Failed to create assignment due to database error.");
        }
    }

    async updateAssignment(
        userId: string,
        assignmentId: string,
        props: AssignmentProps
    ): Promise<Assignment | undefined> {
        try {
            // Updates nothing unless both the assignment and the target class are the user's
            const result = await this.pool.query(
                `UPDATE assignments a SET class_id = c.id, type_id = $1, name = $2, done = $3, early_due = $4, due = $5,
                    late_due = $6, notes = $10, updated_at = NOW()
                FROM classes c
                WHERE a.id = $7 AND a.user_id = $8 AND c.id = $9 AND c.user_id = $8
                RETURNING a.*`,
                [
                    props.typeId,
                    props.name,
                    props.done,
                    props.earlyDue ?? null,
                    props.due,
                    props.lateDue ?? null,
                    assignmentId,
                    userId,
                    props.classId,
                    props.notes
                ]
            );
            return result.rows[0] ? rowToAssignment(result.rows[0]) : undefined;
        } catch (error) {
            if (isMissingClass(error)) return undefined;
            throw writeError(error, "Failed to update assignment due to database error.");
        }
    }

    async deleteAssignment(userId: string, assignmentId: string): Promise<Assignment | undefined> {
        try {
            const result = await this.pool.query("DELETE FROM assignments WHERE id = $1 AND user_id = $2 RETURNING *", [
                assignmentId,
                userId
            ]);
            return result.rows[0] ? rowToAssignment(result.rows[0]) : undefined;
        } catch (error) {
            if (isDatabaseError(error, INVALID_TEXT_REPRESENTATION)) return undefined;
            throw internal("Failed to delete assignment due to database error.", error);
        }
    }
}
