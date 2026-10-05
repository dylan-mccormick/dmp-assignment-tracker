// authRoutes.ts
// Handles API routes related to authentication

import type { Router } from "express";

import { HttpError } from "../error/HttpError";
import { User } from "../generated/authentication";
import authService from "../grpc/authService";
import requireAuth, { getAuthUser } from "../middleware/requireAuth";

// The user fields exposed to the frontend
const toPublicUser = ({ id, email, name, avatarUrl }: User) => ({ id, email, name, avatarUrl });

const authRoutes = (router: Router) => {
    // Exchanges a Google auth code (from the frontend's auth-code flow) for a session JWT
    router.post("/google", async (req, res) => {
        const code = req.body?.code;
        if (typeof code !== "string" || !code) throw new HttpError(400, "A Google auth code is required.");

        const { user, jwt, created, restored } = await authService.signInUser({ googleAuthCode: code });
        if (!user) throw new Error("Auth service returned no user on sign in.");

        res.status(created ? 201 : 200).json({ user: toPublicUser(user), jwt, created, restored });
    });

    // Returns the signed-in user
    router.get("/me", requireAuth, (_req, res) => {
        res.json({ user: toPublicUser(getAuthUser(res)) });
    });

    // Signs the user out of every session
    router.post("/logout", requireAuth, async (_req, res) => {
        await authService.logOutUser({ userId: getAuthUser(res).id });
        res.status(204).end();
    });

    return router;
};

export default authRoutes;
