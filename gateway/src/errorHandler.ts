// errorHandler.ts
// Safe error handler for the API gateway

import { NextFunction, Request, Response } from "express";

const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
    // Send a generic error response. Expose specific error details only in development mode.
    if (process.env.NODE_ENV === "development") {
        return res.status(500).json({ error: err.message, stack: err.stack });
    }

    return res.status(500).json({ error: "An internal server error occurred" });
};

export default errorHandler;
