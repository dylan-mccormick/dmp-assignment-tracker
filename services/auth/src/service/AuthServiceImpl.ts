// AuthServiceImpl.ts
// Implementation for AuthService

import { status } from "@grpc/grpc-js";
import { google } from "googleapis";
import { sign, verify } from "jsonwebtoken";

import { MicroserviceError } from "../error/MicroserviceError";
import { User } from "../generated/authentication";
import { AuthRepository } from "../repository/AuthRepository";
import { AuthService } from "./AuthService";

const JWT_TTL = "7d";
const JWT_ALGORITHM = "HS256";

// Claims embedded in every JWT, enough to identify the user without a database lookup
interface JwtClaims {
    sub: string;
    email: string;
    name: string;
    avatarUrl: string;
    tokenVersion: number;
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

    async signInUser(googleAuthCode: string): Promise<{ user: User; jwt: string; created: boolean }> {
        const jwtSecret = requireEnv("JWT_SECRET");

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

        // Create the user, or refresh their profile from Google if they already exist
        const { user, created } = await this.repository.upsertUserByGoogleId(profile.id, {
            email: profile.email,
            name: profile.name,
            avatarUrl: profile.picture ?? undefined
        });

        const claims: JwtClaims = {
            sub: user.id,
            email: user.email,
            name: user.name,
            avatarUrl: user.avatarUrl,
            tokenVersion: user.tokenVersion
        };
        const jwt = sign(claims, jwtSecret, { algorithm: JWT_ALGORITHM, expiresIn: JWT_TTL });

        return { user, jwt, created };
    }

    async softValidateJwt(jwt: string): Promise<{ user: User | undefined; valid: boolean }> {
        const jwtSecret = requireEnv("JWT_SECRET");

        let claims: JwtClaims;
        try {
            claims = verify(jwt, jwtSecret, { algorithms: [JWT_ALGORITHM] }) as JwtClaims;
        } catch {
            return { user: undefined, valid: false };
        }

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

    async deleteUser(userId: string): Promise<{ deleted: boolean }> {
        await this.repository.deleteUser(userId); // idempotent delete
        return { deleted: true };
    }
}
