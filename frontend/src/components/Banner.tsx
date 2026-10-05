// Banner.tsx
// Renders the current BannerContext banner, dismissable

import { X } from "lucide-react";
import { useContext } from "react";

import { BannerContext } from "../context/BannerContext";

const LEVEL_STYLES = {
    success: "bg-green-700",
    error: "bg-red-700",
    info: "bg-primary"
};

const Banner = () => {
    const { banner, setBanner } = useContext(BannerContext);

    if (!banner) return null;

    return (
        <div
            role={banner.level === "error" ? "alert" : "status"}
            className={`w-full p-4 px-8 mb-4 flex items-center justify-between gap-4 rounded text-white ${LEVEL_STYLES[banner.level]}`}>
            <span>{banner.message}</span>
            <button
                className="cursor-pointer"
                aria-label="Dismiss"
                onClick={() => setBanner(undefined)}>
                <X />
            </button>
        </div>
    );
};

export default Banner;
