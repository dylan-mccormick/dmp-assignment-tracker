// AuthRepository.ts
// A repository to handle users for the auth service

import type { MicroserviceError } from "../error/MicroserviceError";
import { User } from "../generated/authentication";

export interface UpdateUserProps {
    email?: string;
    name?: string;
    avatarUrl?: string;
}

export interface GoogleProfileProps {
    email: string;
    name: string;
    avatarUrl?: string;
}

export interface AuthRepository {
    /**
     * Gets the specified active (non-deleted) user by their Id
     *
     * @param userId The id of the user to get
     * @returns The user, or undefined if not found
     * @throws {MicroserviceError} If the database fails
     */
    getUserById(userId: string): Promise<User | undefined>;

    /**
     * Gets the token version of the specified active user (cache-aside via Redis)
     *
     * @param userId The id of the user to get
     * @returns Token version of the user
     * @throws {MicroserviceError} NOT_FOUND if the user does not exist, INTERNAL if the database fails
     */
    getUserTokenVersionById(userId: string): Promise<number>;

    /**
     * Gets the specified active user by their google Id
     *
     * @param googleId The google id of the user to get
     * @returns The user, or undefined if not found
     * @throws {MicroserviceError} If the database fails
     */
    getUserByGoogleId(googleId: string): Promise<User | undefined>;

    /**
     * Gets the specified active user by their email
     *
     * @param email The email of the user to get
     * @returns The user, or undefined if not found
     * @throws {MicroserviceError} If the database fails
     */
    getUserByEmail(email: string): Promise<User | undefined>;

    /**
     * Refreshes an existing user's profile from Google. Never creates a user, since a new account must first accept the
     * terms (see upsertUserByGoogleId). A soft-deleted user signing in again is restored (for now, at any time; a
     * 30-day grace period followed by a permanent purge is planned).
     *
     * @param googleId The google id of the user
     * @param props The user's current Google profile
     * @returns The user and whether a soft-deleted account was restored, or undefined if no user has this google id
     * @throws {MicroserviceError} ALREADY_EXISTS if another account uses the email, INTERNAL if the database fails
     */
    updateUserByGoogleId(
        googleId: string,
        props: GoogleProfileProps
    ): Promise<{ user: User; restored: boolean } | undefined>;

    /**
     * Creates the user for a Google account that has accepted the terms, or refreshes their profile if they already
     * exist (e.g. signed up in another tab). A soft-deleted user is restored
     *
     * @param googleId The google id of the user
     * @param props The user's current Google profile
     * @param termsVersion The version of the Terms of Service and Privacy Policy the user accepted
     * @returns The user, whether they were newly created, and whether a soft-deleted account was restored
     * @throws {MicroserviceError} ALREADY_EXISTS if another account uses the email, INTERNAL if the database fails
     */
    upsertUserByGoogleId(
        googleId: string,
        props: GoogleProfileProps,
        termsVersion: string
    ): Promise<{ user: User; created: boolean; restored: boolean }>;

    /**
     * Updates a user to follow the specified properties
     *
     * @param userId The id of the user to update
     * @param props Properties describing the user
     * @throws {MicroserviceError} ALREADY_EXISTS if the email is taken, INTERNAL if the database fails
     */
    updateUser(userId: string, props: UpdateUserProps): Promise<void>;

    /**
     * Increments the user's token version, invalidating every JWT issued to them
     *
     * @param userId The id of the user
     * @returns The new token version
     * @throws {MicroserviceError} NOT_FOUND if the user does not exist, INTERNAL if the database fails
     */
    incrementTokenVersion(userId: string): Promise<number>;

    /**
     * Soft deletes the specified user by id and invalidates their JWTs. If the user does not exist, nothing will happen
     *
     * @param userId The id of the user to delete
     * @throws {MicroserviceError} If the database fails
     */
    deleteUser(userId: string): Promise<void>;
}
