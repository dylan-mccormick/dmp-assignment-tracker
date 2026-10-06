// assignmentTypeRoutes.ts
// Handles API routes for the global, read-only assignment types

import type { Router } from "express";

import assignmentService from "../grpc/assignmentService";
import requireAuth from "../middleware/requireAuth";

const assignmentTypeRoutes = (router: Router) => {
    router.use(requireAuth);

    // Lists every assignment type, ordered by value: { types: [{ id, value }] }
    router.get("/", async (_req, res) => {
        const { types } = await assignmentService.listAssignmentTypes({});
        res.json({ types: types.map(({ id, value }) => ({ id, value })) });
    });

    return router;
};

export default assignmentTypeRoutes;
