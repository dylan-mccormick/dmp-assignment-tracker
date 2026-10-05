// semesterRoutes.ts
// Handles API routes for the signed-in user's semesters

import type { Request, Router } from "express";

import { HttpError } from "../error/HttpError";
import { Semester } from "../generated/assignment";
import semesterService from "../grpc/semesterService";
import requireAuth, { getAuthUser } from "../middleware/requireAuth";

const FIELDS = ["name", "startDate", "endDate"] as const;
type SemesterFields = Partial<Record<(typeof FIELDS)[number], string>>;

// The semester fields exposed to the frontend
const toPublicSemester = ({ id, name, startDate, endDate, createdAt, updatedAt }: Semester) => ({
    id,
    name,
    startDate,
    endDate,
    createdAt,
    updatedAt
});

// Picks the semester fields from the body, rejecting non-string values (content is validated by the service)
const readFields = (req: Request, { required }: { required: boolean }): SemesterFields => {
    const fields: SemesterFields = {};
    for (const field of FIELDS) {
        const value = req.body?.[field];
        if (value === undefined && !required) continue;
        if (typeof value !== "string") throw new HttpError(400, `"${field}" must be a string.`);
        fields[field] = value;
    }
    return fields;
};

const requireSemester = (semester: Semester | undefined) => {
    if (!semester) throw new Error("Assignment service returned no semester.");
    return toPublicSemester(semester);
};

const semesterRoutes = (router: Router) => {
    router.use(requireAuth);

    // Lists the user's semesters, newest start date first
    router.get("/", async (_req, res) => {
        const { semesters } = await semesterService.listSemesters({ userId: getAuthUser(res).id });
        res.json({ semesters: semesters.map(toPublicSemester) });
    });

    // Creates a semester: { name, startDate, endDate } ("YYYY-MM-DD" dates)
    router.post("/", async (req, res) => {
        const { name, startDate, endDate } = readFields(req, { required: true }) as Required<SemesterFields>;
        const { semester } = await semesterService.createSemester({
            userId: getAuthUser(res).id,
            name,
            startDate,
            endDate
        });
        res.status(201).json({ semester: requireSemester(semester) });
    });

    // Gets one semester
    router.get("/:id", async (req, res) => {
        const { semester } = await semesterService.getSemester({
            userId: getAuthUser(res).id,
            semesterId: req.params.id
        });
        res.json({ semester: requireSemester(semester) });
    });

    // Updates only the given fields: any of { name, startDate, endDate }
    router.patch("/:id", async (req, res) => {
        const { semester } = await semesterService.updateSemester({
            userId: getAuthUser(res).id,
            semesterId: req.params.id,
            ...readFields(req, { required: false })
        });
        res.json({ semester: requireSemester(semester) });
    });

    // Deletes a semester, along with its classes and their assignments
    router.delete("/:id", async (req, res) => {
        await semesterService.deleteSemester({ userId: getAuthUser(res).id, semesterId: req.params.id });
        res.status(204).end();
    });

    return router;
};

export default semesterRoutes;
