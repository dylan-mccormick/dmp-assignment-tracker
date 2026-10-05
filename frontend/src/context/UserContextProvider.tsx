// UserContextProvider.tsx
// Holds the state for UserContext, restoring the session from the stored JWT on load

import { type ReactNode, useContext, useEffect, useState } from "react";

import { API_BASE_URL, JWT_STORAGE_KEY } from "../config";
import { BannerContext } from "./BannerContext";
import { LoadingBannerContext } from "./LoadingBannerContext";
import { LOGGED_OUT, type User, UserContext } from "./UserContext";

const UserContextProvider = ({ children }: { children: ReactNode }) => {
    // Context
    const { addProcess, removeProcess } = useContext(LoadingBannerContext);
    const { setBanner } = useContext(BannerContext);

    // State
    const [user, setUser] = useState<User>(LOGGED_OUT);
    // only loading if there's a stored session to check
    const [loading, setLoading] = useState(() => localStorage.getItem(JWT_STORAGE_KEY) !== null);

    // Restore the session from a stored JWT, if there is one
    useEffect(() => {
        const jwt = localStorage.getItem(JWT_STORAGE_KEY);
        if (!jwt) return;

        const controller = new AbortController();
        addProcess("user_context_loading");

        const fetchUser = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/auth/me`, {
                    headers: { Authorization: `Bearer ${jwt}` },
                    signal: controller.signal
                });

                if (res.status === 401) {
                    // expired or revoked: forget it
                    localStorage.removeItem(JWT_STORAGE_KEY);
                    setUser(LOGGED_OUT);
                    return;
                }
                if (!res.ok) throw new Error(`GET /auth/me failed with status ${res.status}`);

                const { user: me } = await res.json();
                setUser({ loggedIn: true, id: me.id, email: me.email, name: me.name, avatarUrl: me.avatarUrl });
            } catch (error) {
                if (controller.signal.aborted) return;
                console.error(error);
                // keep the JWT: the session may still be valid once the server is reachable again
                setUser(LOGGED_OUT);
                setBanner({ level: "error", message: "Could not load your account. Please try again." });
            } finally {
                if (!controller.signal.aborted) setLoading(false);
                removeProcess("user_context_loading");
            }
        };

        fetchUser();
        return () => controller.abort();
    }, [addProcess, removeProcess, setBanner]);

    return <UserContext.Provider value={{ user, loading, setUser }}>{children}</UserContext.Provider>;
};

export default UserContextProvider;
