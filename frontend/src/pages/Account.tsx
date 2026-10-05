// Account.tsx
// The signed-in user's account details, and account deletion

import { CircleUserRound } from "lucide-react";
import { useContext, useEffect, useState } from "react";

import apiFetch from "../apiClient";
import KeyValueTable from "../components/KeyValueTable";
import SecondaryButton from "../components/SecondaryButton";
import StandardLayout from "../components/StandardLayout";
import { JWT_STORAGE_KEY } from "../config";
import { BannerContext } from "../context/BannerContext";
import { LoadingBannerContext } from "../context/LoadingBannerContext";
import { ModalContext } from "../context/ModalContext";
import { LOGGED_OUT, UserContext } from "../context/UserContext";
import { MAIN_NAV_ITEMS } from "../navItems";

interface AccountDetails {
    id: string;
    email: string;
    name: string;
    avatarUrl: string;
    createdAt: string;
    updatedAt: string;
}

const formatDateTime = (iso: string) =>
    new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));

const Account = () => {
    // Context
    const { setUser } = useContext(UserContext);
    const { setBanner } = useContext(BannerContext);
    const { showModal, closeModal } = useContext(ModalContext);
    const { addProcess, removeProcess } = useContext(LoadingBannerContext);

    // State
    const [account, setAccount] = useState<AccountDetails>();

    // Signs out locally (the session is gone server-side); the protected route then redirects to /login
    const endSession = () => {
        localStorage.removeItem(JWT_STORAGE_KEY);
        setUser(LOGGED_OUT);
    };

    // Load the account details
    useEffect(() => {
        const controller = new AbortController();
        addProcess("loading_account");

        const fetchAccount = async () => {
            try {
                const res = await apiFetch("/account", { signal: controller.signal });
                const body = await res.json().catch(() => undefined);

                if (res.status === 401) {
                    localStorage.removeItem(JWT_STORAGE_KEY);
                    setUser(LOGGED_OUT);
                    setBanner({ level: "error", message: body?.error ?? "Please sign in again." });
                    return;
                }
                if (!res.ok) throw new Error(body?.error ?? `GET /account failed with status ${res.status}`);

                setAccount(body.account);
            } catch (error) {
                if (controller.signal.aborted) return;
                console.error(error);
                setBanner({ level: "error", message: "Could not load your account. Please try again." });
            } finally {
                removeProcess("loading_account");
            }
        };

        fetchAccount();
        return () => controller.abort();
    }, [addProcess, removeProcess, setBanner, setUser]);

    // Soft deletes the account (revoking every session), then signs out locally
    const deleteAccount = async () => {
        showModal({ type: "buttonless", title: "Deleting account...", loadingSpinner: true });

        try {
            const res = await apiFetch("/account", { method: "DELETE" });

            if (!res.ok) {
                const body = await res.json().catch(() => undefined);
                setBanner({
                    level: "error",
                    message: body?.error ?? "Could not delete your account. Please try again."
                });
                return;
            }

            endSession();
            setBanner({ level: "success", message: "Your account has been deleted." });
        } catch (error) {
            console.error(error);
            setBanner({ level: "error", message: "Could not reach the server. Please try again." });
        } finally {
            closeModal();
        }
    };

    const confirmDeleteAccount = () =>
        showModal({
            type: "confirm",
            title: "Delete account?",
            message:
                "This will delete your account and log you out of all devices. You can restore it by signing in again.",
            confirmText: "Delete Account",
            danger: true,
            onConfirm: deleteAccount
        });

    return (
        <StandardLayout
            title="Account"
            sidebar={MAIN_NAV_ITEMS}>
            <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-extralight mb-8">Account</h1>

                {account && (
                    <>
                        <div className="flex justify-center mb-8">
                            {account.avatarUrl ? (
                                <img
                                    className="w-24 h-24 rounded-full"
                                    src={account.avatarUrl}
                                    alt="Profile picture"
                                    referrerPolicy="no-referrer"
                                />
                            ) : (
                                <CircleUserRound
                                    className="w-24 h-24 text-gray-400"
                                    strokeWidth={1}
                                />
                            )}
                        </div>

                        <KeyValueTable
                            rows={[
                                { label: "Name", value: account.name },
                                { label: "Email", value: account.email },
                                { label: "Account ID", value: <span className="font-mono text-sm">{account.id}</span> },
                                { label: "Created", value: formatDateTime(account.createdAt) },
                                { label: "Last Updated", value: formatDateTime(account.updatedAt) }
                            ]}
                        />

                        <div className="flex justify-end mt-8">
                            <SecondaryButton
                                danger
                                onClick={confirmDeleteAccount}>
                                Delete Account
                            </SecondaryButton>
                        </div>
                    </>
                )}
            </div>
        </StandardLayout>
    );
};

export default Account;
