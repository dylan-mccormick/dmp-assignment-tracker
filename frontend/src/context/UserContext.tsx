// UserContext.tsx
// Context for the current user: basic, non-sensitive profile info when signed in

import { createContext } from "react";

export interface LoggedInUser {
    loggedIn: true;
    id: string;
    email: string;
    name: string;
    avatarUrl: string;
}

export interface LoggedOutUser {
    loggedIn: false;
}

export type User = LoggedInUser | LoggedOutUser;

export const LOGGED_OUT: LoggedOutUser = { loggedIn: false };

interface UserContextInterface {
    user: User;
    loading: boolean; // true until the stored session (if any) has been checked
    setUser: (user: User) => void;
}

export const UserContext = createContext<UserContextInterface>({
    user: LOGGED_OUT,
    loading: true,
    setUser: () => {}
});
