// requireAuth.ts
// Middleware that rejects requests without a valid JWT, and exposes the signed-in user via getAuthUser

import { NextFunction, Request, Response } from "express";

import { HttpError } from "../error/HttpError";
import { User } from "../generated/authentication";
import authService from "../grpc/authService";

const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
    const header = req.get("authorization");
    const jwt = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;
    if (!jwt) throw new HttpError(401, "You must be signed in.");

    const { valid, user } = await authService.softValidateJwt({ jwt });
    if (!valid || !user) throw new HttpError(401, "Your session has expired. Please sign in again.");

    res.locals.user = user;
    next();
};

/**
 * Gets the user set by requireAuth
 *
 * @param res The response of a request that passed requireAuth
 * @returns The signed-in user
 */
export const getAuthUser = (res: Response): User => res.locals.user;

export default requireAuth;
