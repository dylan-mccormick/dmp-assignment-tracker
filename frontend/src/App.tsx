// App.tsx
// Main entry point for the app

import { GoogleOAuthProvider } from "@react-oauth/google";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";

import Banner from "./components/Banner";
import LoadingBanner from "./components/LoadingBanner";
import Modal from "./components/Modal";
import ProtectedRoute from "./components/ProtectedRoute";
import ComposeProviders from "./ComposeProviders";
import BannerContextProvider from "./context/BannerContextProvider";
import LoadingBannerContextProvider from "./context/LoadingBannerContextProvider";
import ModalContextProvider from "./context/ModalContextProvider";
import NavbarContextProvider from "./context/NavbarContextProvider";
import UserContextProvider from "./context/UserContextProvider";
import Account from "./pages/Account";
import Classes from "./pages/Classes";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import PageNotFound from "./pages/PageNotFound";
import Semesters from "./pages/Semesters";

const App = () => {
    return (
        <ComposeProviders
            providers={[
                LoadingBannerContextProvider,
                ModalContextProvider,
                BannerContextProvider,
                UserContextProvider,
                NavbarContextProvider
            ]}>
            <LoadingBanner />
            <Modal />
            <Banner />
            <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
                <BrowserRouter>
                    <Routes>
                        <Route
                            path="/login"
                            element={<Login />}
                        />
                        <Route
                            path="/"
                            element={
                                <Navigate
                                    to="/dashboard"
                                    replace
                                />
                            }
                        />
                        <Route
                            path="/dashboard"
                            element={
                                <ProtectedRoute>
                                    <Dashboard />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/account"
                            element={
                                <ProtectedRoute>
                                    <Account />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/classes"
                            element={
                                <ProtectedRoute>
                                    <Classes />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/semesters"
                            element={
                                <ProtectedRoute>
                                    <Semesters />
                                </ProtectedRoute>
                            }
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
