// Login.tsx
// A page to allow the user to sign in via Google

import { GoogleLogin, hasGrantedAllScopesGoogle } from "@react-oauth/google";
import StandardLayout from "../components/StandardLayout";
import { useState } from "react";
import { useNavigate } from "react-router";

const Login = () => {
    // Navigate
    const navigate = useNavigate();

    // State
    const [googleLoginError, setGoogleLoginError] = useState<string>();

    return (
        <>
            <StandardLayout
                title="Login"
                sidebar={[]}>
                <div className="flex flex-col items-center justify-center h-full">
                    <h1 className="text-3xl font-extralight mb-8">Login</h1>
                    <GoogleLogin
                        onSuccess={(response) => {

                            // TODO: post to backend to get user info

                            navigate("/dashboard");
                        }}
                        onError={() => {
                            setGoogleLoginError("An error occured. Please try again.");
                        }}
                    />
                    {googleLoginError && <p className="text-red-400">{googleLoginError}</p>}
                </div>
            </StandardLayout>
        </>
    );
};

export default Login;
