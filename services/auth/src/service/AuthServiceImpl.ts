// AuthServiceImpl.ts
// Implementation for AuthService

import { status } from "@grpc/grpc-js";
import { google } from "googleapis";
import { sign, verify } from "jsonwebtoken";

import { MicroserviceError } from "../error/MicroserviceError";
import { User } from "../generated/authentication";
import { AuthRepository } from "../repository/AuthRepository";
import { AuthService, Session, SignInResult } from "./AuthService";

const JWT_TTL = "7d";
const JWT_ALGORITHM = "HS256";

// The current Terms of Service / Privacy Policy version, which must match the frontend's TERMS_VERSION (legal.ts)
const TERMS_VERSION = "2026-10-22";

// Signup tokens carry a Google profile between sign-in and accepting the terms. Their audience keeps them from being
// accepted as session JWTs (which have none)
const SIGNUP_TOKEN_TTL = "15m";
const SIGNUP_TOKEN_AUDIENCE = "signup";

// Claims embedded in every JWT, enough to identify the user without a database lookup
interface JwtClaims {
    sub: string;
    email: string;
    name: string;
    avatarUrl: string;
    tokenVersion: number;
    aud?: unknown;
}

// Claims in a signup token: the verified Google profile of a user who hasn't accepted the terms yet
interface SignupTokenClaims {
    googleId: string;
    email: string;
    name: string;
    avatarUrl?: string;
}

const requireEnv = (name: string): string => {
    const value = process.env[name];
    if (!value)
        throw new MicroserviceError(
            status.INTERNAL,
            "Unknown internal error.",
            `Environment variable ${name} is not set.`
        );
    return value;
};

export class AuthServiceImpl implements AuthService {
    private readonly repository;

    constructor(repository: AuthRepository) {
        this.repository = repository;
    }

    async signInUser(googleAuthCode: string): Promise<SignInResult> {
        const profile = await this.getGoogleProfile(googleAuthCode);
        const { googleId, ...props } = profile;

        // Refresh the profile of an existing user who has accepted the current terms (never creates one)
        const existing = await this.repository.updateUserByGoogleId(googleId, props, TERMS_VERSION);
        if (existing) return { termsRequired: false, ...this.startSession(existing.user, false, existing.restored) };

        // Anyone else must accept the terms first: hand back the verified profile, signed, for signUpUser
        const signupToken = sign(profile satisfies SignupTokenClaims, requireEnv("JWT_SECRET"), {
            algorithm: JWT_ALGORITHM,
            expiresIn: SIGNUP_TOKEN_TTL,
            audience: SIGNUP_TOKEN_AUDIENCE
        });
        const existingUser = await this.repository.userExistsByGoogleId(googleId);
        return { termsRequired: true, signupToken, existingUser };
    }

    async signUpUser(signupToken: string, acceptedTermsVersion: string): Promise<Session> {
        let profile: SignupTokenClaims;
        try {
            profile = verify(signupToken, requireEnv("JWT_SECRET"), {
                algorithms: [JWT_ALGORITHM],
                audience: SIGNUP_TOKEN_AUDIENCE
            }) as SignupTokenClaims;
        } catch (error) {
            throw new MicroserviceError(
                status.UNAUTHENTICATED,
                "Your sign up has expired. Please sign in with Google again.",
                "Signup token is invalid or expired.",
                error
            );
        }

        if (acceptedTermsVersion !== TERMS_VERSION)
            throw new MicroserviceError(
                status.INVALID_ARGUMENT,
                "The Terms of Service and Privacy Policy have been updated. Please reload the page and review them.",
                `Accepted terms version ${acceptedTermsVersion} is not the current version ${TERMS_VERSION}.`
            );

        const { user, created, restored } = await this.repository.upsertUserByGoogleId(
            profile.googleId,
            { email: profile.email, name: profile.name, avatarUrl: profile.avatarUrl },
            TERMS_VERSION
        );
        return this.startSession(user, created, restored);
    }

    // Exchanges a Google auth code for the user's Google profile
    private async getGoogleProfile(googleAuthCode: string): Promise<SignupTokenClaims> {
        // Connect OAuth2 ("postmessage" is the redirect URI for codes from the popup auth-code flow)
        const oauth2Client = new google.auth.OAuth2(
            requireEnv("GOOGLE_CLIENT_ID"),
            requireEnv("GOOGLE_CLIENT_SECRET"),
            "postmessage"
        );
        const oauth2 = google.oauth2({
            auth: oauth2Client,
            version: "v2"
        });

        // Exchange the auth code for tokens
        try {
            const { tokens } = await oauth2Client.getToken(googleAuthCode);
            oauth2Client.setCredentials(tokens);
        } catch (error) {
            throw new MicroserviceError(
                status.UNAUTHENTICATED,
                "Google sign-in failed. Please try again.",
                "Failed to exchange the Google auth code for tokens.",
                error
            );
        }

        // Extract Google profile info
        let profile;
        try {
            ({ data: profile } = await oauth2.userinfo.get());
        } catch (error) {
            throw new MicroserviceError(
                status.UNAVAILABLE,
                "Could not get your Google profile. Please try again.",
                "Error occured while trying to obtain user info with OAuth2.",
                error
            );
        }

        if (!profile.id || !profile.name || !profile.email) {
            throw new MicroserviceError(
                status.INVALID_ARGUMENT,
                "Your Google account must share its name and email to sign in.",
                "User has not provided all necessary information to create or sign into an account."
            );
        }

        return {
            googleId: profile.id,
            email: profile.email,
            name: profile.name,
            avatarUrl: profile.picture ?? undefined
        };
    }

    // Issues a session JWT for the user
    private startSession(user: User, created: boolean, restored: boolean): Session {
        const claims: JwtClaims = {
            sub: user.id,
            email: user.email,
            name: user.name,
            avatarUrl: user.avatarUrl,
            tokenVersion: user.tokenVersion
        };
        const jwt = sign(claims, requireEnv("JWT_SECRET"), { algorithm: JWT_ALGORITHM, expiresIn: JWT_TTL });

        return { user, jwt, created, restored };
    }

    async softValidateJwt(jwt: string): Promise<{ user: User | undefined; valid: boolean }> {
        const jwtSecret = requireEnv("JWT_SECRET");

        let claims: JwtClaims;
        try {
            claims = verify(jwt, jwtSecret, { algorithms: [JWT_ALGORITHM] }) as JwtClaims;
        } catch {
            return { user: undefined, valid: false };
        }

        // session JWTs have no audience, so this rejects signup tokens
        if (claims.aud !== undefined) return { user: undefined, valid: false };

        // verify the token version matches (revoked on logout/deletion)
        try {
            const tokenVersion = await this.repository.getUserTokenVersionById(claims.sub);
            if (claims.tokenVersion !== tokenVersion) return { user: undefined, valid: false };
        } catch (error) {
            if (error instanceof MicroserviceError && error.code === status.NOT_FOUND)
                return { user: undefined, valid: false };
            throw error;
        }

        return {
            user: {
                id: claims.sub,
                googleId: "",
                email: claims.email,
                name: claims.name,
                avatarUrl: claims.avatarUrl,
                tokenVersion: claims.tokenVersion,
                createdAt: undefined,
                updatedAt: undefined,
                deletedAt: undefined
            },
            valid: true
        };
    }

    async logOutUser(userId: string): Promise<{ loggedOut: boolean }> {
        // increment the token version to log out of every session
        await this.repository.incrementTokenVersion(userId);
        return { loggedOut: true };
    }

    async getUser(userId: string): Promise<{ user: User }> {
        const user = await this.repository.getUserById(userId);
        if (!user)
            throw new MicroserviceError(
                status.NOT_FOUND,
                "User not found.",
                "Attempted to get a user that does not exist."
            );
        return { user };
    }

    async deleteUser(userId: string): Promise<{ deleted: boolean }> {
        await this.repository.deleteUser(userId); // idempotent delete
        return { deleted: true };
    }
}
