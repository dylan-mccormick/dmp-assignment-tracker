// App.tsx
// Main entry point for the app

import { GoogleOAuthProvider } from "@react-oauth/google";
import { BrowserRouter, Route, Routes } from "react-router";

import LoadingBanner from "./components/LoadingBanner";
import Modal from "./components/Modal";
import ComposeProviders from "./ComposeProviders";
import BannerContextProvider from "./context/BannerContextProvider";
import LoadingBannerContextProvider from "./context/LoadingBannerContextProvider";
import ModalContextProvider from "./context/ModalContextProvider";
import Login from "./pages/Login";
import PageNotFound from "./pages/PageNotFound";

const App = () => {
    return (
        <ComposeProviders providers={[LoadingBannerContextProvider, ModalContextProvider, BannerContextProvider]}>
            <LoadingBanner />
            <Modal />
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
