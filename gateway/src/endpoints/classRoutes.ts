// classRoutes.ts
// Handles API routes for the signed-in user's classes

import type { Request, Router } from "express";

import { HttpError } from "../error/HttpError";
import { Class } from "../generated/assignment";
import classService from "../grpc/classService";
import requireAuth, { getAuthUser } from "../middleware/requireAuth";

const FIELDS = ["semesterId", "name", "code"] as const;
type ClassFields = Partial<Record<(typeof FIELDS)[number], string>>;

// The class fields exposed to the frontend
const toPublicClass = ({ id, semesterId, name, code, createdAt, updatedAt }: Class) => ({
    id,
    semesterId,
    name,
    code,
    createdAt,
    updatedAt
});

// Picks the class fields from the body, rejecting non-string values (content is validated by the service)
const readFields = (req: Request, { required }: { required: boolean }): ClassFields => {
    const fields: ClassFields = {};
    for (const field of FIELDS) {
        const value = req.body?.[field];
        if (value === undefined && !required) continue;
        if (typeof value !== "string") throw new HttpError(400, `"${field}" must be a string.`);
        fields[field] = value;
    }
    return fields;
};

// `class` is a reserved word, so responses are read as `res.class` rather than destructured
const requireClass = (found: Class | undefined) => {
    if (!found) throw new Error("Assignment service returned no class.");
    return toPublicClass(found);
};

const classRoutes = (router: Router) => {
    router.use(requireAuth);

    // Lists the user's classes by name; ?semesterId=... limits it to one semester (404 if it isn't the user's)
    router.get("/", async (req, res) => {
        const { semesterId } = req.query;
        if (semesterId !== undefined && typeof semesterId !== "string")
            throw new HttpError(400, `"semesterId" must be a single string.`);

        const { classes } = await classService.listClasses({ userId: getAuthUser(res).id, semesterId });
        res.json({ classes: classes.map(toPublicClass) });
    });

    // Creates a class in one of the user's semesters: { semesterId, name, code }
    router.post("/", async (req, res) => {
        const { semesterId, name, code } = readFields(req, { required: true }) as Required<ClassFields>;
        const response = await classService.createClass({ userId: getAuthUser(res).id, semesterId, name, code });
        res.status(201).json({ class: requireClass(response.class) });
    });

    // Gets one class
    router.get("/:id", async (req, res) => {
        const response = await classService.getClass({ userId: getAuthUser(res).id, classId: req.params.id });
        res.json({ class: requireClass(response.class) });
    });

    // Updates only the given fields: any of { semesterId, name, code }; a new semesterId moves the class
    router.patch("/:id", async (req, res) => {
        const response = await classService.updateClass({
            userId: getAuthUser(res).id,
            classId: req.params.id,
            ...readFields(req, { required: false })
        });
        res.json({ class: requireClass(response.class) });
    });

    // Deletes a class, along with its assignments
    router.delete("/:id", async (req, res) => {
        await classService.deleteClass({ userId: getAuthUser(res).id, classId: req.params.id });
        res.status(204).end();
    });

    return router;
};

export default classRoutes;
