// statsRoutes.ts
// Handles API routes for the signed-in user's dashboard stats

import type { Request, Router } from "express";

import { HttpError } from "../error/HttpError";
import { DashboardAssignment } from "../generated/stats";
import statsService from "../grpc/statsService";
import requireAuth, { getAuthUser } from "../middleware/requireAuth";
import readTimestamp from "../validation/readTimestamp";

// A single string query parameter (repeating it is rejected)
const readQueryString = (req: Request, name: string) => {
    const value = req.query[name];
    if (value !== undefined && typeof value !== "string")
        throw new HttpError(400, `"${name}" must be a single string.`);
    return value;
};

const toPublicAssignment = (assignment: DashboardAssignment) => ({
    id: assignment.id,
    name: assignment.name,
    classId: assignment.classId,
    classCode: assignment.classCode,
    className: assignment.className,
    type: assignment.type,
    due: assignment.due,
    lateDue: assignment.lateDue ?? null
});

const statsRoutes = (router: Router) => {
    router.use(requireAuth);

    /*
     * The dashboard for a semester (the active one, unless ?semesterId= picks one). The client passes what depends on
     * its timezone: ?today=YYYY-MM-DD and ?weekStart=&weekEnd= (its local Monday 00:00 and the next, as ISO timestamps
     * with an offset). "Now" is the same instant everywhere, so the gateway uses its own clock rather than the client's
     */
    router.get("/dashboard", async (req, res) => {
        const weekStart = readTimestamp("weekStart", readQueryString(req, "weekStart"));
        const weekEnd = readTimestamp("weekEnd", readQueryString(req, "weekEnd"));

        const dashboard = await statsService.getDashboard({
            userId: getAuthUser(res).id,
            semesterId: readQueryString(req, "semesterId"),
            today: readQueryString(req, "today") ?? "", // the stats service validates it
            now: new Date(),
            weekStart,
            weekEnd
        });

        res.json({
            semester: dashboard.semester ?? null,
            progress: dashboard.progress ?? null,
            assignmentsDone: dashboard.assignmentsDone,
            assignmentsTotal: dashboard.assignmentsTotal,
            classes: dashboard.classes,
            week: dashboard.week,
            upcoming: dashboard.upcoming.map(toPublicAssignment),
            overdue: dashboard.overdue.map(toPublicAssignment)
        });
    });

    return router;
};

export default statsRoutes;
