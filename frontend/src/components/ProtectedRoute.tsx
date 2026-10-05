// ProtectedRoute.tsx
// Renders its children only for a logged-in user; otherwise redirects to the login page

import { type ReactNode, useContext } from "react";
import { Navigate } from "react-router";

import { UserContext } from "../context/UserContext";

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
    const { user, loading } = useContext(UserContext);

    // the stored session is still being checked (the loading overlay is showing)
    if (loading) return null;

    return user.loggedIn ? (
        children
    ) : (
        <Navigate
            to="/login"
            replace
        />
    );
};

export default ProtectedRoute;
