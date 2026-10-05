// AuthService.ts
// Defines the interface for AuthService

import { User } from "../generated/authentication";

export interface AuthService {
    /**
     * Either creates or returns a user who tries to log in via OAuth2 and provides their Google auth code
     *
     * @param googleAuthCode The authorization code from Google's OAuth2 auth-code flow
     * @returns The logged-in user, the JWT for their session, whether this is a new user (created), and whether a
     *   soft-deleted account was restored (restored)
     */
    signInUser(googleAuthCode: string): Promise<{ user: User; jwt: string; created: boolean; restored: boolean }>;

    /**
     * Validates a users JWT (ensures it is not expired/revoked). The returned user is built from the JWT claims, so it
     * has no googleId or timestamps
     *
     * @param jwt The JWT to validate
     * @returns The user alongside whether they are valid jwt
     */
    softValidateJwt(jwt: string): Promise<{ user: User | undefined; valid: boolean }>;

    /**
     * Logs out a user by the provided JWT. Invalidates all sessions the user is currently in
     *
     * @param userId The id of the user to log out
     * @returns True when the user is logged out
     */
    logOutUser(userId: string): Promise<{ loggedOut: boolean }>;

    /**
     * Deletes a user by their userId
     *
     * @param userId The id of the user to delete
     * @returns True when the user is marked as deleted
     */
    deleteUser(userId: string): Promise<{ deleted: boolean }>;
}
