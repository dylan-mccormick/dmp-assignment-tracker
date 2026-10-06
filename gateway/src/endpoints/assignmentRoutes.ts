// assignmentRoutes.ts
// Handles API routes for the signed-in user's assignments

import type { Request, Router } from "express";

import { HttpError } from "../error/HttpError";
import { Assignment } from "../generated/assignment";
import assignmentService from "../grpc/assignmentService";
import requireAuth, { getAuthUser } from "../middleware/requireAuth";

// An ISO 8601 timestamp with an explicit offset; without one, `new Date()` would read it in the gateway's timezone
const TIMESTAMP_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;

const STRING_FIELDS = ["classId", "typeId", "name"] as const;
const DEADLINE_FIELDS = ["earlyDue", "lateDue"] as const;

interface AssignmentFields {
    classId?: string;
    typeId?: string;
    name?: string;
    done?: boolean;
    // the generated request types require these keys (as Date | undefined) rather than making them optional
    earlyDue: Date | undefined;
    due: Date | undefined;
    lateDue: Date | undefined;
    clearEarlyDue: boolean;
    clearLateDue: boolean;
}

// The assignment fields exposed to the frontend (timestamps serialize as ISO strings; unset deadlines as null)
const toPublicAssignment = (assignment: Assignment) => ({
    id: assignment.id,
    classId: assignment.classId,
    typeId: assignment.typeId,
    name: assignment.name,
    done: assignment.done,
    earlyDue: assignment.earlyDue ?? null,
    due: assignment.due,
    lateDue: assignment.lateDue ?? null,
    createdAt: assignment.createdAt,
    updatedAt: assignment.updatedAt
});

const requireAssignment = (assignment: Assignment | undefined) => {
    if (!assignment) throw new Error("Assignment service returned no assignment.");
    return toPublicAssignment(assignment);
};

// A real calendar date and time as written: `new Date()` silently rolls e.g. Feb 30 over to Mar 2
const isRealTimestamp = (value: string) => {
    const match = TIMESTAMP_PATTERN.exec(value);
    if (!match || Number.isNaN(Date.parse(value))) return false;
    const [year, month, day, hour, minute] = match.slice(1, 6).map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCMonth() === month - 1 && date.getUTCDate() === day && hour < 24 && minute < 60;
};

const readTimestamp = (field: string, value: unknown) => {
    if (typeof value !== "string" || !isRealTimestamp(value))
        throw new HttpError(
            400,
            `"${field}" must be an ISO 8601 timestamp with a timezone, e.g. "2026-09-20T23:59:00Z".`
        );
    return new Date(value);
};

/**
 * Picks the assignment fields from the body, rejecting wrongly typed values (content is validated by the service). On
 * create every string field and `due` are required; on update every field is optional, and a null early/late deadline
 * clears it
 */
const readFields = (req: Request, { create }: { create: boolean }): AssignmentFields => {
    const body = req.body ?? {};
    const fields: AssignmentFields = {
        earlyDue: undefined,
        due: undefined,
        lateDue: undefined,
        clearEarlyDue: false,
        clearLateDue: false
    };

    for (const field of STRING_FIELDS) {
        const value = body[field];
        if (value === undefined && !create) continue;
        if (typeof value !== "string") throw new HttpError(400, `"${field}" must be a string.`);
        fields[field] = value;
    }

    if (body.done !== undefined) {
        if (typeof body.done !== "boolean") throw new HttpError(400, `"done" must be true or false.`);
        fields.done = body.done;
    }

    if (body.due !== undefined || create) fields.due = readTimestamp("due", body.due);

    for (const field of DEADLINE_FIELDS) {
        const value = body[field];
        if (value === undefined) continue;
        if (value === null) {
            if (!create) fields[field === "earlyDue" ? "clearEarlyDue" : "clearLateDue"] = true;
            continue;
        }
        fields[field] = readTimestamp(field, value);
    }

    return fields;
};

// A single string query parameter (repeating it, e.g. ?classId=a&classId=b, is rejected)
const readQueryString = (req: Request, name: string) => {
    const value = req.query[name];
    if (value !== undefined && typeof value !== "string")
        throw new HttpError(400, `"${name}" must be a single string.`);
    return value;
};

const assignmentRoutes = (router: Router) => {
    router.use(requireAuth);

    // Lists the user's assignments, soonest due first. Optional query: classId or semesterId (not both), done=true|false
    router.get("/", async (req, res) => {
        const done = readQueryString(req, "done");
        if (done !== undefined && done !== "true" && done !== "false")
            throw new HttpError(400, `"done" must be "true" or "false".`);

        const { assignments } = await assignmentService.listAssignments({
            userId: getAuthUser(res).id,
            classId: readQueryString(req, "classId"),
            semesterId: readQueryString(req, "semesterId"),
            done: done === undefined ? undefined : done === "true"
        });
        res.json({ assignments: assignments.map(toPublicAssignment) });
    });

    // Creates an assignment: { classId, typeId, name, due, done?, earlyDue?, lateDue? } (ISO timestamps)
    router.post("/", async (req, res) => {
        // with create: true, readFields has required (and so set) the string fields and due
        const { classId, typeId, name, done, earlyDue, due, lateDue } = readFields(req, { create: true });
        const { assignment } = await assignmentService.createAssignment({
            userId: getAuthUser(res).id,
            classId: classId!,
            typeId: typeId!,
            name: name!,
            done: done ?? false,
            earlyDue,
            due,
            lateDue
        });
        res.status(201).json({ assignment: requireAssignment(assignment) });
    });

    // Gets one assignment
    router.get("/:id", async (req, res) => {
        const { assignment } = await assignmentService.getAssignment({
            userId: getAuthUser(res).id,
            assignmentId: req.params.id
        });
        res.json({ assignment: requireAssignment(assignment) });
    });

    // Updates only the given fields; a new classId moves it, and "earlyDue": null / "lateDue": null removes a deadline
    router.patch("/:id", async (req, res) => {
        const { assignment } = await assignmentService.updateAssignment({
            userId: getAuthUser(res).id,
            assignmentId: req.params.id,
            ...readFields(req, { create: false })
        });
        res.json({ assignment: requireAssignment(assignment) });
    });

    // Deletes an assignment
    router.delete("/:id", async (req, res) => {
        await assignmentService.deleteAssignment({ userId: getAuthUser(res).id, assignmentId: req.params.id });
        res.status(204).end();
    });

    return router;
};

export default assignmentRoutes;
