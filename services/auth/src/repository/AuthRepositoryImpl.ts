// AuthRepositoryImpl.ts
// Implementation of the AuthRepository

import { status } from "@grpc/grpc-js";
import { DatabaseError, Pool } from "pg";
import { RedisClientType } from "redis";
import { v7 as uuidv7 } from "uuid";

import { MicroserviceError } from "../error/MicroserviceError";
import { User } from "../generated/authentication";
import { AuthRepository, GoogleProfileProps, UpdateUserProps } from "./AuthRepository";

const TOKEN_VERSION_TTL = 5 * 60; // 5 minutes
const UNIQUE_VIOLATION = "23505";

const tokenVersionKey = (userId: string) => `token-version:${userId}`;

const rowToUser = (row: any): User => ({
    id: row.id,
    googleId: row.google_id,
    email: row.email,
    name: row.name,
    avatarUrl: row.avatar_url ?? "",
    tokenVersion: row.token_version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at ?? undefined
});

const isUniqueViolation = (error: unknown) => error instanceof DatabaseError && error.code === UNIQUE_VIOLATION;

export class AuthRepositoryImpl implements AuthRepository {
    private readonly pool;
    private readonly redis;

    constructor(redis: RedisClientType, pool: Pool) {
        this.redis = redis;
        this.pool = pool;
    }

    private async getActiveUserBy(column: "id" | "google_id" | "email", value: string): Promise<User | undefined> {
        try {
            const result = await this.pool.query(`SELECT * FROM users WHERE ${column} = $1 AND deleted_at IS NULL`, [
                value
            ]);
            return result.rows[0] ? rowToUser(result.rows[0]) : undefined;
        } catch (error) {
            throw new MicroserviceError(
                status.INTERNAL,
                "Unknown internal error.",
                `Failed to get user by ${column} due to database error.`,
                error
            );
        }
    }

    getUserById(userId: string): Promise<User | undefined> {
        return this.getActiveUserBy("id", userId);
    }

    getUserByGoogleId(googleId: string): Promise<User | undefined> {
        return this.getActiveUserBy("google_id", googleId);
    }

    getUserByEmail(email: string): Promise<User | undefined> {
        return this.getActiveUserBy("email", email);
    }

    async getUserTokenVersionById(userId: string): Promise<number> {
        // try cache
        try {
            const cachedTokenVersion = await this.redis.get(tokenVersionKey(userId));
            if (cachedTokenVersion !== null) return parseInt(cachedTokenVersion);
        } catch (error) {
            console.error("Cache failed to get user token version by ID. Falling back to DB...", error);
        }

        let tokenVersion: number;
        try {
            const result = await this.pool.query(
                "SELECT token_version FROM users WHERE id = $1 AND deleted_at IS NULL",
                [userId]
            );
            tokenVersion = result.rows[0]?.token_version;
        } catch (error) {
            throw new MicroserviceError(
                status.INTERNAL,
                "Unknown internal error.",
                "Failed to get user token version due to database error.",
                error
            );
        }

        if (tokenVersion === undefined)
            throw new MicroserviceError(
                status.NOT_FOUND,
                "User no longer exists.",
                "Attempted to get the token version of a user that does not exist."
            );

        // populate cache (best effort)
        try {
            await this.redis.set(tokenVersionKey(userId), tokenVersion, {
                expiration: { type: "EX", value: TOKEN_VERSION_TTL }
            });
        } catch (error) {
            console.error("Cache failed to set user token version.", error);
        }

        return tokenVersion;
    }

    async updateUserByGoogleId(
        googleId: string,
        props: GoogleProfileProps
    ): Promise<{ user: User; restored: boolean } | undefined> {
        try {
            // `previous` is read before the update, since RETURNING only sees the new values
            const result = await this.pool.query(
                `UPDATE users SET
                    email = $2,
                    name = $3,
                    avatar_url = $4,
                    deleted_at = NULL,
                    updated_at = NOW()
                FROM (SELECT id, deleted_at FROM users WHERE google_id = $1) AS previous
                WHERE users.id = previous.id
                RETURNING users.*, previous.deleted_at IS NOT NULL AS restored`,
                [googleId, props.email, props.name, props.avatarUrl ?? null]
            );

            if (!result.rows[0]) return undefined;
            return { user: rowToUser(result.rows[0]), restored: result.rows[0].restored };
        } catch (error) {
            if (isUniqueViolation(error))
                throw new MicroserviceError(
                    status.ALREADY_EXISTS,
                    "Another account already uses this email address.",
                    "Update by google ID conflicted with an existing user's email.",
                    error
                );

            throw new MicroserviceError(
                status.INTERNAL,
                "Unknown internal error.",
                "Failed to update user by google ID due to database error.",
                error
            );
        }
    }

    async upsertUserByGoogleId(
        googleId: string,
        props: GoogleProfileProps,
        termsVersion: string
    ): Promise<{ user: User; created: boolean; restored: boolean }> {
        const newId = uuidv7();

        try {
            // `previous` reads the row as it was before this statement, since RETURNING only sees the new values. An
            // existing user keeps the terms version they first accepted
            const result = await this.pool.query(
                `WITH previous AS (SELECT deleted_at FROM users WHERE google_id = $2)
                INSERT INTO users (id, google_id, email, name, avatar_url, terms_version, terms_accepted_at)
                VALUES ($1, $2, $3, $4, $5, $6, NOW())
                ON CONFLICT (google_id) DO UPDATE SET
                    email = EXCLUDED.email,
                    name = EXCLUDED.name,
                    avatar_url = EXCLUDED.avatar_url,
                    terms_version = COALESCE(users.terms_version, EXCLUDED.terms_version),
                    terms_accepted_at = COALESCE(users.terms_accepted_at, EXCLUDED.terms_accepted_at),
                    deleted_at = NULL,
                    updated_at = NOW()
                RETURNING *, COALESCE((SELECT deleted_at IS NOT NULL FROM previous), FALSE) AS restored`,
                [newId, googleId, props.email, props.name, props.avatarUrl ?? null, termsVersion]
            );

            const user = rowToUser(result.rows[0]);
            return { user, created: user.id === newId, restored: result.rows[0].restored };
        } catch (error) {
            if (isUniqueViolation(error))
                throw new MicroserviceError(
                    status.ALREADY_EXISTS,
                    "Another account already uses this email address.",
                    "Upsert by google ID conflicted with an existing user's email.",
                    error
                );

            throw new MicroserviceError(
                status.INTERNAL,
                "Unknown internal error.",
                "Failed to upsert user due to database error.",
                error
            );
        }
    }

    async updateUser(userId: string, props: UpdateUserProps): Promise<void> {
        const updates: [string, unknown][] = [["updated_at", new Date()]];
        if (props.email) updates.push(["email", props.email]);
        if (props.name) updates.push(["name", props.name]);
        if (props.avatarUrl) updates.push(["avatar_url", props.avatarUrl]);

        try {
            const setClause = updates.map(([column], i) => `${column} = $${i + 1}`).join(", ");
            await this.pool.query(`UPDATE users SET ${setClause} WHERE id = $${updates.length + 1}`, [
                ...updates.map(([, value]) => value),
                userId
            ]);
        } catch (error) {
            if (isUniqueViolation(error))
                throw new MicroserviceError(
                    status.ALREADY_EXISTS,
                    "Another account already uses this email address.",
                    "Update conflicted with an existing user's email.",
                    error
                );

            throw new MicroserviceError(
                status.INTERNAL,
                "Unknown internal error.",
                "Failed to update user due to database error.",
                error
            );
        }
    }

    async incrementTokenVersion(userId: string): Promise<number> {
        let tokenVersion: number;
        try {
            const result = await this.pool.query(
                `UPDATE users SET token_version = token_version + 1, updated_at = NOW()
                WHERE id = $1 AND deleted_at IS NULL RETURNING token_version`,
                [userId]
            );
            tokenVersion = result.rows[0]?.token_version;
        } catch (error) {
            throw new MicroserviceError(
                status.INTERNAL,
                "Unknown internal error.",
                "Failed to increment token version due to database error.",
                error
            );
        }

        if (tokenVersion === undefined)
            throw new MicroserviceError(
                status.NOT_FOUND,
                "User not found.",
                "Attempted to increment the token version of a user that does not exist."
            );

        await this.invalidateTokenVersionCache(userId);
        return tokenVersion;
    }

    async deleteUser(userId: string): Promise<void> {
        try {
            await this.pool.query(
                `UPDATE users SET deleted_at = NOW(), updated_at = NOW(), token_version = token_version + 1
                WHERE id = $1 AND deleted_at IS NULL`,
                [userId]
            );
        } catch (error) {
            throw new MicroserviceError(
                status.INTERNAL,
                "Unknown internal error.",
                "Failed to delete user due to database error.",
                error
            );
        }

        await this.invalidateTokenVersionCache(userId);
    }

    private async invalidateTokenVersionCache(userId: string) {
        try {
            await this.redis.del(tokenVersionKey(userId));
        } catch (error) {
            // the cached entry would let revoked tokens through until its TTL, so surface this as a failure
            throw new MicroserviceError(
                status.UNAVAILABLE,
                "Unknown internal error.",
                "Failed to invalidate cached token version.",
                error
            );
        }
    }
}
