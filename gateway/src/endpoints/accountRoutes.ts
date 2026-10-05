// accountRoutes.ts
// Handles API routes for the signed-in user's account

import type { Router } from "express";

import authService from "../grpc/authService";
import requireAuth, { getAuthUser } from "../middleware/requireAuth";

const accountRoutes = (router: Router) => {
    router.use(requireAuth);

    // Returns the signed-in user's account details
    router.get("/", async (_req, res) => {
        const { user } = await authService.getUser({ userId: getAuthUser(res).id });
        if (!user) throw new Error("Auth service returned no user.");

        const { id, email, name, avatarUrl, createdAt, updatedAt } = user;
        res.json({ account: { id, email, name, avatarUrl, createdAt, updatedAt } });
    });

    // Soft deletes the signed-in user's account, revoking every session
    router.delete("/", async (_req, res) => {
        await authService.deleteUser({ userId: getAuthUser(res).id });
        res.status(204).end();
    });

    return router;
};

export default accountRoutes;
