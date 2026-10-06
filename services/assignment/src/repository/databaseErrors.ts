// databaseErrors.ts
// Postgres error codes the repositories map to user-facing errors

import { DatabaseError } from "pg";

export const UNIQUE_VIOLATION = "23505";
export const FOREIGN_KEY_VIOLATION = "23503"; // e.g. the referenced semester was deleted mid-write
export const CHECK_VIOLATION = "23514";
export const INVALID_TEXT_REPRESENTATION = "22P02"; // e.g. a malformed uuid

export const isDatabaseError = (error: unknown, code: string) => error instanceof DatabaseError && error.code === code;
