// errorHandler.ts
// Safe error handler for the API gateway

import { status as GrpcStatus } from "@grpc/grpc-js";
import { NextFunction, Request, Response } from "express";

import { HttpError } from "./error/HttpError";

// gRPC statuses whose details are written by the services to be user-facing
const USER_FACING_GRPC_STATUSES: Partial<Record<GrpcStatus, number>> = {
    [GrpcStatus.INVALID_ARGUMENT]: 400,
    [GrpcStatus.UNAUTHENTICATED]: 401,
    [GrpcStatus.PERMISSION_DENIED]: 403,
    [GrpcStatus.NOT_FOUND]: 404,
    [GrpcStatus.ALREADY_EXISTS]: 409
};

const isGrpcError = (err: any): err is { code: GrpcStatus; details: string } =>
    typeof err?.code === "number" && typeof err?.details === "string";

const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });

    // e.g. malformed JSON bodies from body-parser
    if (typeof err?.status === "number" && err.status >= 400 && err.status < 500 && err.expose)
        return res.status(err.status).json({ error: "Invalid request." });

    if (isGrpcError(err)) {
        const httpStatus = USER_FACING_GRPC_STATUSES[err.code];
        if (httpStatus) return res.status(httpStatus).json({ error: err.details });

        if (err.code === GrpcStatus.UNAVAILABLE || err.code === GrpcStatus.DEADLINE_EXCEEDED) {
            console.error(err);
            return res.status(503).json({ error: "A service is temporarily unavailable. Please try again." });
        }
    }

    console.error(err);

    // Send a generic error response. Expose specific error details only in development mode.
    if (process.env.NODE_ENV === "development") {
        return res.status(500).json({ error: err?.message, stack: err?.stack });
    }

    return res.status(500).json({ error: "An internal server error occurred" });
};

export default errorHandler;
