// AuthRepositoryImpl.ts
// Implementation of the AuthRepository

import { Pool } from "pg";
import { RedisClientType } from "redis";
import { v7 as uuidv7 } from "uuid";

import { MicroserviceError } from "../error/MicroserviceError";
import { User } from "../generated/authentication";
import { AuthRepository, UpdateUserProps } from "./AuthRepository";

const TOKEN_VERSION_TTL = 5 * 60; // 5 minutes

export class AuthRepositoryImpl implements AuthRepository {
    private readonly pool;
    private readonly redis;

    constructor(redis: RedisClientType, pool: Pool) {
        this.redis = redis;
        this.pool = pool;
    }

    async getUserById(userId: string): Promise<User | undefined> {
        try {
            const result = await this.pool.query("SELECT * FROM users WHERE id = $1", [userId]);
            if (result.rowCount == 0) return undefined;

            return {
                id: result.rows[0].id,
                googleId: result.rows[0].google_id,
                email: result.rows[0].email,
                name: result.rows[0].name,
                avatarUrl: result.rows[0].avatar_url,
                tokenVersion: result.rows[0].token_version,
                createdAt: result.rows[0].createdAt,
                updatedAt: result.rows[0].updatedAt,
                deletedAt: result.rows[0].deletedAt
            };
        } catch (error) {
            throw new MicroserviceError(
                500,
                "Unknown internal error.",
                "Failed to get user by ID due to database error.",
                error
            );
        }
    }

    async getUserTokenVersionById(userId: string): Promise<number> {
        // try cache
        try {
            const cachedTokenVersion = await this.redis.get(`token-version:${userId}`);
            if (cachedTokenVersion) return parseInt(cachedTokenVersion);
        } catch (error) {
            console.error(
                new MicroserviceError(
                    500,
                    "Unknown internal error.",
                    "Cache failed to get user token version by ID. Falling back to DB...",
                    error
                )
            );
        }

        try {
            const result = await this.pool.query("SELECT * FROM users WHERE id = $1", [userId]);
            if (result.rowCount == 0)
                throw new MicroserviceError(
                    404,
                    "User no longer exists.",
                    "Attempted to get the token version of a user that does not exist."
                );

            await this.redis.set(`token-version:${userId}`, result.rows[0].token_version, {
                expiration: { type: "EX", value: TOKEN_VERSION_TTL }
            });
            return result.rows[0].token_version;
        } catch (error) {
            throw new MicroserviceError(
                500,
                "Unknown internal error.",
                "Failed to get user by ID due to database error.",
                error
            );
        }
    }

    async getUserByGoogleId(googleId: string): Promise<User | undefined> {
        try {
            const result = await this.pool.query("SELECT * FROM users WHERE google_id = $1", [googleId]);
            if (result.rowCount == 0) return undefined;

            return {
                id: result.rows[0].id,
                googleId: result.rows[0].google_id,
                email: result.rows[0].email,
                name: result.rows[0].name,
                avatarUrl: result.rows[0].avatar_url,
                tokenVersion: result.rows[0].token_version,
                createdAt: result.rows[0].createdAt,
                updatedAt: result.rows[0].updatedAt,
                deletedAt: result.rows[0].deletedAt
            };
        } catch (error) {
            throw new MicroserviceError(
                500,
                "Unknown internal error.",
                "Failed to get user by google ID due to database error.",
                error
            );
        }
    }

    async getUserByEmail(email: string): Promise<User | undefined> {
        try {
            const result = await this.pool.query("SELECT * FROM users WHERE email = $1", [email]);
            if (result.rowCount == 0) return undefined;

            return {
                id: result.rows[0].id,
                googleId: result.rows[0].google_id,
                email: result.rows[0].email,
                name: result.rows[0].name,
                avatarUrl: result.rows[0].avatar_url,
                tokenVersion: result.rows[0].token_version,
                createdAt: result.rows[0].createdAt,
                updatedAt: result.rows[0].updatedAt,
                deletedAt: result.rows[0].deletedAt
            };
        } catch (error) {
            throw new MicroserviceError(
                500,
                "Unknown internal error.",
                "Failed to get user by email due to database error.",
                error
            );
        }
    }

    async createUser(googleId: string, props: UpdateUserProps): Promise<User> {
        if (!props.email || !props.name || !props.avatarUrl || !props.tokenVersion)
            throw new MicroserviceError(500, "Unknown internal error.", "Must pass all UpdateUserProps to createUser.");

        // ensure uniqueness
        try {
            const result = await this.pool.query("SELECT * FROM users WHERE google_id = $1 OR email = $2", [
                googleId,
                props.email
            ]);
            if (result.rowCount && result.rowCount > 0)
                throw new MicroserviceError(
                    409,
                    "User already exists with that account.",
                    "A user with the provided google ID or email already exists."
                );
        } catch (error) {
            throw new MicroserviceError(
                500,
                "Unknown internal error.",
                "Failed to get user by google ID or email due to database error.",
                error
            );
        }

        try {
            const uuid = uuidv7();
            await this.pool.query(
                "INSERT INTO users(id, google_id, email, name, avatar_url) VALUES ($1, $2, $3, $4, $5)",
                [uuid, googleId, props.email, props.name, props.avatarUrl]
            );

            return {
                id: uuid,
                googleId,
                email: props.email,
                name: props.name,
                avatarUrl: props.avatarUrl,
                tokenVersion: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: undefined
            };
        } catch (error) {
            throw new MicroserviceError(
                500,
                "Unknown internal error.",
                "Failed to create user due to database error.",
                error
            );
        }
    }

    async updateUser(userId: string, props: UpdateUserProps): Promise<void> {
        // email unique validation
        if (props.email) {
            try {
                const result = await this.pool.query("SELECT * FROM users WHERE email = $1", [props.email]);
                if (result.rowCount && result.rowCount > 0)
                    throw new MicroserviceError(
                        409,
                        "User already exists with that account.",
                        "A user with the provided google ID or email already exists."
                    );
            } catch (error) {
                throw new MicroserviceError(
                    500,
                    "Unknown internal error.",
                    "Failed to check for email uniqueness during user update due to database error.",
                    error
                );
            }
        }

        // update user
        try {
            const updates: [string, unknown][] = [["updated_at", new Date()]];
            if (props.email) updates.push(["email", props.email]);
            if (props.name) updates.push(["name", props.name]);
            if (props.tokenVersion) updates.push(["token_version", props.tokenVersion]);
            if (props.avatarUrl) updates.push(["avatar_url", props.avatarUrl]);

            const setClause = updates.map(([column], i) => `${column} = $${i + 1}`).join(", ");
            await this.pool.query(`UPDATE users SET ${setClause} WHERE id = $${updates.length + 1}`, [
                ...updates.map(([, value]) => value),
                userId
            ]);

            // invalidate cache
            if (props.tokenVersion) {
                await this.redis.del(`token-version:${userId}`);
            }
        } catch (error) {
            throw new MicroserviceError(
                500,
                "Unknown internal error.",
                "Failed to update user due to database error.",
                error
            );
        }
    }

    async deleteUser(userId: string): Promise<void> {}
}
