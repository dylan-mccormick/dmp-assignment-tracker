// AuthService.ts
// Defines the interface for AuthService

import { User } from "../generated/authentication";

// A signed-in session for the user
export interface Session {
    user: User;
    jwt: string;
    created: boolean; // this is a new user
    restored: boolean; // a soft-deleted account was restored
}

// Signing in either starts a session, or, for a user who hasn't accepted the current terms (including a Google account
// with no user yet), requires them to be accepted first
export type SignInResult =
    | ({ termsRequired: false } & Session)
    | { termsRequired: true; signupToken: string; existingUser: boolean };

export interface AuthService {
    /**
     * Signs in an existing user who has accepted the current terms via the Google auth code from OAuth2. Anyone else (a
     * Google account with no user, or a user who hasn't accepted the current version) gets a short-lived signup token
     * instead, to pass to signUpUser once they accept the terms
     *
     * @param googleAuthCode The authorization code from Google's OAuth2 auth-code flow
     * @returns The session, or termsRequired with a signup token and whether the user already has an account
     * @throws {MicroserviceError} UNAUTHENTICATED if the code is invalid, INVALID_ARGUMENT if the Google profile lacks
     *   a name or email, ALREADY_EXISTS if another account uses the email, UNAVAILABLE if Google fails
     */
    signInUser(googleAuthCode: string): Promise<SignInResult>;

    /**
     * Records that the user for a signup token from signInUser accepted the terms, creating them if they're new
     *
     * @param signupToken The signup token from signInUser
     * @param acceptedTermsVersion The version of the Terms of Service and Privacy Policy the user accepted
     * @returns The user's session
     * @throws {MicroserviceError} UNAUTHENTICATED if the signup token is invalid or expired, INVALID_ARGUMENT if the
     *   accepted version isn't the current one, ALREADY_EXISTS if another account uses the email
     */
    signUpUser(signupToken: string, acceptedTermsVersion: string): Promise<Session>;

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
    /**
     * Gets an active user's full account details (unlike softValidateJwt, read from the database)
     *
     * @param userId The id of the user to get
     * @returns The user
     * @throws {MicroserviceError} NOT_FOUND if the user does not exist, INTERNAL if the database fails
     */
    getUser(userId: string): Promise<{ user: User }>;

    deleteUser(userId: string): Promise<{ deleted: boolean }>;
}
