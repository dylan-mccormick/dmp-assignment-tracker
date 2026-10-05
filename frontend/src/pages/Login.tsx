// Login.tsx
// A page to allow the user to sign in via Google

import { useGoogleLogin } from "@react-oauth/google";
import { useState } from "react";
import { useNavigate } from "react-router";

import PrimaryButton from "../components/PrimaryButton";
import StandardLayout from "../components/StandardLayout";

const Login = () => {
    // Navigate
    const navigate = useNavigate();

    // State
    const [googleLoginError, setGoogleLoginError] = useState<string>();

    // Google sign-in (auth-code flow: the code is exchanged for tokens by the auth service)
    const googleLogin = useGoogleLogin({
        flow: "auth-code",
        onSuccess: _codeResponse => {
            // TODO: post _codeResponse.code to backend to get user info

            navigate("/dashboard");
        },
        onError: () => {
            setGoogleLoginError("An error occured. Please try again.");
        }
    });

    return (
        <>
            <StandardLayout
                title="Login"
                sidebar={[]}>
                <div className="flex flex-col items-center justify-center h-full">
                    <h1 className="text-3xl font-extralight mb-8">Login</h1>
                    <PrimaryButton onClick={() => googleLogin()}>Sign in with Google</PrimaryButton>
                    {googleLoginError && <p className="text-red-400">{googleLoginError}</p>}
                </div>
            </StandardLayout>
        </>
    );
};

export default Login;
