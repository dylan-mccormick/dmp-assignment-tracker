// Login.tsx
// A page to allow the user to sign in via Google, accepting the Terms of Service and Privacy Policy first if they're new

import { type CodeResponse, useGoogleLogin } from "@react-oauth/google";
import { useContext, useEffect, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router";

import apiFetch from "../apiClient";
import PrimaryButton from "../components/PrimaryButton";
import StandardLayout from "../components/StandardLayout";
import TertiaryButton from "../components/TertiaryButton";
import { JWT_STORAGE_KEY } from "../config";
import { BannerContext } from "../context/BannerContext";
import { ModalContext } from "../context/ModalContext";
import { UserContext } from "../context/UserContext";
import { TERMS_VERSION } from "../legal";

interface SessionResponse {
    user: { id: string; email: string; name: string; avatarUrl: string };
    jwt: string;
    created: boolean;
    restored: boolean;
}

// A user who hasn't accepted the current terms (including a new one) gets a signup token instead of a session, until
// they accept
type SignInResponse =
    | (SessionResponse & { termsRequired: false })
    | { termsRequired: true; signupToken: string; existingUser: boolean };

// A legal document link, opened in a new tab so the pending sign up isn't lost
const LegalLink = ({ to, children }: { to: string; children: string }) => (
    <a
        href={to}
        target="_blank"
        rel="noreferrer"
        className="text-primary underline">
        {children}
        <span className="sr-only"> (opens in a new tab)</span>
    </a>
);

const Login = () => {
    // Navigate
    const navigate = useNavigate();

    // Context
    const { setBanner } = useContext(BannerContext);
    const { showModal, closeModal } = useContext(ModalContext);
    const { user, loading, setUser } = useContext(UserContext);

    // State
    const [signupToken, setSignupToken] = useState<string>();
    const [existingUser, setExistingUser] = useState(false); // the terms step is for an existing account, not a new one
    const [acceptedTerms, setAcceptedTerms] = useState(false);

    // Ref
    const termsHeadingRef = useRef<HTMLHeadingElement>(null);

    // Move focus to the terms step when it replaces the sign in button, so it's announced
    useEffect(() => {
        if (signupToken) termsHeadingRef.current?.focus();
    }, [signupToken]);

    // Stores the session and goes to the dashboard
    const startSession = ({ user: signedInUser, jwt, created, restored }: SessionResponse) => {
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
    };

    // Exchanges the Google auth code for a session via the gateway, or a signup token if this is a new account
    const signIn = async ({ code }: CodeResponse) => {
        setBanner(undefined);
        showModal({ type: "buttonless", title: "Signing in...", loadingSpinner: true });

        try {
            const res = await apiFetch("/auth/google", { method: "POST", body: { code } });
            const body = await res.json().catch(() => undefined);

            if (!res.ok) {
                setBanner({ level: "error", message: body?.error ?? "Sign in failed. Please try again." });
                return;
            }

            const result = body as SignInResponse;
            if (result.termsRequired) {
                setAcceptedTerms(false);
                setExistingUser(result.existingUser);
                setSignupToken(result.signupToken);
                return;
            }
            startSession(result);
        } catch (error) {
            console.error(error);
            setBanner({ level: "error", message: "Could not reach the server. Please try again." });
        } finally {
            closeModal();
        }
    };

    // Records the acceptance (creating the account if it's new), then signs in
    const signUp = async (token: string) => {
        setBanner(undefined);
        showModal({
            type: "buttonless",
            title: existingUser ? "Signing in..." : "Creating account...",
            loadingSpinner: true
        });

        try {
            const res = await apiFetch("/auth/signup", {
                method: "POST",
                body: { signupToken: token, acceptedTermsVersion: TERMS_VERSION }
            });
            const body = await res.json().catch(() => undefined);

            if (!res.ok) {
                // an expired signup token can't be retried: start over from Google
                if (res.status === 401) setSignupToken(undefined);
                setBanner({
                    level: "error",
                    message:
                        body?.error ??
                        (existingUser
                            ? "Sign in failed. Please try again."
                            : "Could not create your account. Please try again.")
                });
                return;
            }

            setSignupToken(undefined);
            startSession(body as SessionResponse);
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
                    <img
                        className="w-24 h-24 mb-8 dark:invert"
                        alt="DMP Service Logo"
                        src="https://cdn.mnmzc.dev/logos/dmp-black.png"
                    />
                    {signupToken ? (
                        <>
                            <h1
                                ref={termsHeadingRef}
                                tabIndex={-1}
                                className="text-3xl font-extralight mb-4 outline-none">
                                {existingUser ? "Review our terms" : "Create your account"}
                            </h1>
                            <p className="max-w-md text-center text-gray-600 mb-6">
                                {existingUser
                                    ? "Before you continue, please review and accept the Terms of Service and Privacy Policy."
                                    : "Before we create your account, please review and accept the Terms of Service and Privacy Policy."}
                            </p>
                            <label className="flex items-start gap-2 cursor-pointer max-w-md mb-6">
                                <input
                                    type="checkbox"
                                    checked={acceptedTerms}
                                    onChange={e => setAcceptedTerms(e.target.checked)}
                                    className="w-4 h-4 mt-1 shrink-0 accent-primary cursor-pointer"
                                />
                                <span>
                                    I have read and agree to the <LegalLink to="/terms">Terms of Service</LegalLink> and
                                    the <LegalLink to="/privacy">Privacy Policy</LegalLink>.
                                </span>
                            </label>
                            <div className="flex items-center gap-6">
                                <TertiaryButton onClick={() => setSignupToken(undefined)}>Cancel</TertiaryButton>
                                <PrimaryButton
                                    disabled={!acceptedTerms}
                                    onClick={() => signUp(signupToken)}>
                                    {existingUser ? "Continue" : "Create Account"}
                                </PrimaryButton>
                            </div>
                        </>
                    ) : (
                        <>
                            <h1 className="text-3xl font-extralight mb-8">Login</h1>
                            <PrimaryButton onClick={() => googleLogin()}>Sign in with Google</PrimaryButton>
                        </>
                    )}
                </div>
            </StandardLayout>
        </>
    );
};

export default Login;
