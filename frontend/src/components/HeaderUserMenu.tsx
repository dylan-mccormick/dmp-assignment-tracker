// HeaderUserMenu.tsx
// Shows the signed-in user's name and a log out button (logs out of all devices); blank when signed out

import { CircleUserRound } from "lucide-react";
import { useContext } from "react";

import apiFetch from "../apiClient";
import { JWT_STORAGE_KEY } from "../config";
import { BannerContext } from "../context/BannerContext";
import { ModalContext } from "../context/ModalContext";
import { LOGGED_OUT, UserContext } from "../context/UserContext";
import TertiaryButton from "./TertiaryButton";

const HeaderUserMenu = () => {
    // Context
    const { user, setUser } = useContext(UserContext);
    const { showModal, closeModal } = useContext(ModalContext);
    const { setBanner } = useContext(BannerContext);

    if (!user.loggedIn) return null;

    // Revokes every session (the gateway bumps the user's token version), then clears the local one
    const logOut = async () => {
        showModal({ type: "buttonless", title: "Logging out...", loadingSpinner: true });

        try {
            const res = await apiFetch("/auth/logout", { method: "POST" });

            // 401: the session was already revoked or expired, so there's nothing left to revoke
            if (!res.ok && res.status !== 401) {
                const body = await res.json().catch(() => undefined);
                setBanner({ level: "error", message: body?.error ?? "Log out failed. Please try again." });
                return;
            }

            localStorage.removeItem(JWT_STORAGE_KEY);
            setUser(LOGGED_OUT); // protected pages redirect to /login
            setBanner({ level: "success", message: "You have been logged out of all devices." });
        } catch (error) {
            console.error(error);
            setBanner({ level: "error", message: "Could not reach the server. Please try again." });
        } finally {
            closeModal();
        }
    };

    const confirmLogOut = () =>
        showModal({
            type: "confirm",
            title: "Log out?",
            message: "This will log you out of all devices you are signed in on.",
            confirmText: "Log Out",
            onConfirm: logOut
        });

    return (
        <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
                {user.avatarUrl ? (
                    <img
                        className="w-8 h-8 rounded-full shrink-0"
                        src={user.avatarUrl}
                        alt=""
                        referrerPolicy="no-referrer"
                    />
                ) : (
                    <CircleUserRound className="shrink-0" />
                )}
                <span className="truncate max-w-48">{user.name}</span>
            </div>
            <TertiaryButton onClick={confirmLogOut}>Log Out</TertiaryButton>
        </div>
    );
};

export default HeaderUserMenu;
