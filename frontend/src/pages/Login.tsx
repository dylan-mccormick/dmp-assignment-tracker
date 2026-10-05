// Login.tsx
// A page to allow the user to sign in via Google

import { type CodeResponse, useGoogleLogin } from "@react-oauth/google";
import { useContext } from "react";
import { Navigate, useNavigate } from "react-router";

import PrimaryButton from "../components/PrimaryButton";
import StandardLayout from "../components/StandardLayout";
import { API_BASE_URL, JWT_STORAGE_KEY } from "../config";
import { BannerContext } from "../context/BannerContext";
import { ModalContext } from "../context/ModalContext";
import { UserContext } from "../context/UserContext";

interface SignInResponse {
    user: { id: string; email: string; name: string; avatarUrl: string };
    jwt: string;
    created: boolean;
    restored: boolean;
}

const Login = () => {
    // Navigate
    const navigate = useNavigate();

    // Context
    const { setBanner } = useContext(BannerContext);
    const { showModal, closeModal } = useContext(ModalContext);
    const { user, loading, setUser } = useContext(UserContext);

    // Exchanges the Google auth code for a session via the gateway
    const signIn = async ({ code }: CodeResponse) => {
        setBanner(undefined);
        showModal({ type: "buttonless", title: "Signing in...", loadingSpinner: true });

        try {
            const res = await fetch(`${API_BASE_URL}/auth/google`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code })
            });
            const body = await res.json().catch(() => undefined);

            if (!res.ok) {
                setBanner({ level: "error", message: body?.error ?? "Sign in failed. Please try again." });
                return;
            }

            const { user: signedInUser, jwt, created, restored } = body as SignInResponse;
            localStorage.setItem(JWT_STORAGE_KEY, jwt);
            setUser({
                loggedIn: true,
                id: signedInUser.id,
                email: signedInUser.email,
                name: signedInUser.name,
                avatarUrl: signedInUser.avatarUrl
            });

            const welcome = restored
                ? `Welcome back, ${signedInUser.name}! Your account has been restored.`
                : created
                  ? `Welcome, ${signedInUser.name}! Your account has been created.`
                  : `Welcome back, ${signedInUser.name}!`;
            setBanner({ level: "success", message: welcome });
            navigate("/dashboard");
        } catch (error) {
            console.error(error);
            setBanner({ level: "error", message: "Could not reach the server. Please try again." });
        } finally {
            closeModal();
        }
    };

    // Google sign-in (auth-code flow: the code is exchanged for tokens by the auth service)
    const googleLogin = useGoogleLogin({
        flow: "auth-code",
        onSuccess: signIn,
        onError: () => {
            setBanner({ level: "error", message: "Google sign in failed. Please try again." });
        },
        onNonOAuthError: ({ type }) => {
            // closing the popup is a deliberate cancel, not an error
            if (type === "popup_closed") return;
            setBanner({ level: "error", message: "Could not open the Google sign in window. Please try again." });
        }
    });

    // the stored session is still being checked (the loading overlay is showing)
    if (loading) return null;

    // already signed in: nothing to do here
    if (user.loggedIn)
        return (
            <Navigate
                to="/dashboard"
                replace
            />
        );

    return (
        <>
            <StandardLayout
                title="Login"
                sidebar={[]}>
                <div className="flex flex-col items-center justify-center h-full">
                    <h1 className="text-3xl font-extralight mb-8">Login</h1>
                    <PrimaryButton onClick={() => googleLogin()}>Sign in with Google</PrimaryButton>
                </div>
            </StandardLayout>
        </>
    );
};

export default Login;
