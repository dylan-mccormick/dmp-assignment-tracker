// AuthRepository.ts
// A repository to handle users for the auth service

import { MicroserviceError } from "../error/MicroserviceError";
import { User } from "../generated/authentication";

export interface UpdateUserProps {
    email?: string;
    name?: string;
    avatarUrl?: string;
    tokenVersion?: number;
}

export interface AuthRepository {
    /**
     * Gets the specified user by their Id
     *
     * @param userId The id of the user to get
     * @returns The user, or undefined if not found
     * @throws {MicroserviceError} If the database fails
     */
    getUserById(userId: string): Promise<User | undefined>;

    /**
     * Gets the token version of the user by their specified id
     *
     * @param userId The id of the user to get
     * @returns Token version of the user
     * @throws {MicroserviceError} If the database fails or the user does not exist
     */
    getUserTokenVersionById(userId: string): Promise<number>;

    /**
     * Gets the specified user by their google Id
     *
     * @param googleId The google id of the user to get
     * @returns The user, or undefined if not found
     * @throws {MicroserviceError} If the database fails
     */
    getUserByGoogleId(googleId: string): Promise<User | undefined>;

    /**
     * Gets the specified user by their email
     *
     * @param email The email of the user to get
     * @returns The user, or undefined if not found
     * @throws {MicroserviceError} If the database fails
     */
    getUserByEmail(email: string): Promise<User | undefined>;

    /**
     * Creates a new user with the specified properties
     *
     * @param googleId The id of the user to create
     * @param props Properties describing the user
     * @throws {MicroserviceError} If the database fails, or a property is not unique
     */
    createUser(googleId: string, props: UpdateUserProps): Promise<User>;

    /**
     * Updates a user to follow the specified properties
     *
     * @param userId The id of the user to update
     * @param props Properties describing the user
     * @throws {MicroserviceError} If the database fails, or a property is not unique
     */
    updateUser(userId: string, props: UpdateUserProps): Promise<void>;

    /**
     * Deletes the specified user by id If the user does not exist, nothing will happen
     *
     * @param userId The id of the user to delete
     * @throws {MicroserviceError} If the database fails
     */
    deleteUser(userId: string): Promise<void>;
}
