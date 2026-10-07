// LoadingBanner.tsx
// Full-screen loading overlay shown while any LoadingBannerContext process is running

import { LoaderCircle } from "lucide-react";
import { useContext } from "react";

import { LoadingBannerContext } from "../context/LoadingBannerContext";

const LoadingBanner = () => {
    const { processes } = useContext(LoadingBannerContext);

    if (processes.size === 0) return null;

    const message = [...processes.values()].at(-1);

    return (
        <div className="fixed inset-0 bg-overlay z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 flex flex-col items-center gap-3">
                <LoaderCircle className="w-8 h-8 animate-spin text-primary" />
                {message && <span className="text-sm text-gray-600">{message}</span>}
            </div>
        </div>
    );
};

export default LoadingBanner;
