// App.tsx
// Main entry point for the app

import { BrowserRouter, Route, Routes } from "react-router";

import Login from "./pages/Login";
import PageNotFound from "./pages/PageNotFound";
import ComposeProviders from "./ComposeProviders";
import { GoogleOAuthProvider } from "@react-oauth/google";

const App = () => {
    return (
        <ComposeProviders providers={[

        ]}>
            <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
                <BrowserRouter>
                    <Routes>
                        <Route
                            path="/login"
                            element={<Login />}
                        />
                        <Route
                            path="*"
                            element={<PageNotFound />}
                        />
                    </Routes>
                </BrowserRouter>
            </GoogleOAuthProvider>
        </ComposeProviders>
    );
};

export default App;
