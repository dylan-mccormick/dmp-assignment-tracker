// AuthServiceImpl.ts
// Implementation for AuthService

import { google } from "googleapis";
import { sign, verify } from "jsonwebtoken";

import { MicroserviceError } from "../error/MicroserviceError";
import { User } from "../generated/authentication";
import { AuthRepository } from "../repository/AuthRepository";
import { AuthService } from "./AuthService";

const JWT_TTL = "7d";

export class AuthServiceImpl implements AuthService {
    private readonly repository;

    constructor(repository: AuthRepository) {
        this.repository = repository;
    }

    async signInUser(googleAuthCode: string): Promise<{ user: User; jwt: string; created: boolean }> {
        if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET)
            throw new MicroserviceError(
                500,
                "Unknown internal error.",
                "Environment variables GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set when logging in users."
            );

        // Connect OAuth2 ("postmessage" is the redirect URI for codes from the popup auth-code flow)
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            "postmessage"
        );
        const oauth2 = google.oauth2({
            auth: oauth2Client,
            version: "v2"
        });

        // Extract Google profile info
        try {
            // Exchange the auth code for tokens
            const { tokens } = await oauth2Client.getToken(googleAuthCode);
            oauth2Client.setCredentials(tokens);

            const { data } = await oauth2.userinfo.get();

            if (!data.id || !data.name || !data.email || !data.picture) {
                throw new MicroserviceError(
                    400,
                    "User has not provided all necessary information.",
                    "User has not provided all necessary information to create or sign into an account."
                );
            }

            let user = await this.repository.getUserByGoogleId(data.id);
            let created = false;

            if (!user) {
                user = await this.repository.createUser(data.id, {
                    name: data.name,
                    email: data.email,
                    avatarUrl: data.picture
                });
                created = true;
            }

            if (!created) {
                // update user info
                await this.repository.updateUser(user.id, {
                    name: data.name,
                    email: data.email,
                    avatarUrl: data.picture
                });
            }

            // sign them back in
            if (!process.env.JWT_SECRET)
                throw new MicroserviceError(
                    500,
                    "Unknown internal error.",
                    "Environment variable JWT_SECRET is not set when logging in users."
                );
            const jwt = sign(user, process.env.JWT_SECRET, { expiresIn: JWT_TTL });

            return {
                user,
                jwt,
                created
            };
        } catch (error) {
            if (error instanceof MicroserviceError) throw error;
            throw new MicroserviceError(
                500,
                "Could not gather Google profile information.",
                "Error occured while trying to obtain user info with OAuth2.",
                error
            );
        }
    }

    async softValidateJwt(jwt: string): Promise<{ user: User | undefined; valid: boolean }> {
        if (!process.env.JWT_SECRET)
            throw new MicroserviceError(
                500,
                "Unknown internal error.",
                "Environment variable JWT_SECRET is not set when logging in users."
            );

        try {
            const user = verify(jwt, process.env.JWT_SECRET) as User;

            // verify the token version matches
            const tokenVersion = await this.repository.getUserTokenVersionById(user.id);
            if (user.tokenVersion != tokenVersion) {
                return { user: undefined, valid: false };
            }

            return { user, valid: true };
        } catch (error) {
            return { user: undefined, valid: false };
        }
    }

    async logOutUser(userId: string): Promise<{ loggedOut: boolean }> {
        // increment the token version to log out
        const targetUser = await this.repository.getUserById(userId);
        if (!targetUser)
            throw new MicroserviceError(
                404,
                "User not found.",
                "Attempt to log out the user, but the user id was not found."
            );

        await this.repository.updateUser(userId, { tokenVersion: targetUser.tokenVersion + 1 });
        return { loggedOut: true };
    }

    async deleteUser(userId: string): Promise<{ deleted: boolean }> {
        await this.repository.deleteUser(userId); // idempotent delete
        return { deleted: true };
    }
}
