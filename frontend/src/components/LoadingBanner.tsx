// LoadingBanner.tsx
// Full-screen loading overlay shown while any LoadingBannerContext process runs longer than a moment

import { LoaderCircle } from "lucide-react";
import { useContext, useEffect, useState } from "react";

import { LoadingBannerContext } from "../context/LoadingBannerContext";

// Most page loads finish in ~100ms; flashing the overlay (and its dimmed backdrop) for those reads as a flicker. So it
// only appears once loading has run this long...
const SHOW_DELAY_MS = 400;
// ...and, once shown, stays at least this long, so a load that ends just after the delay doesn't flash it either
const MIN_VISIBLE_MS = 500;

const LoadingBanner = () => {
    const { processes } = useContext(LoadingBannerContext);
    const busy = processes.size > 0;

    // When the overlay appeared, or undefined while it's hidden. Only timers change it, never the render itself
    const [shownAt, setShownAt] = useState<number>();

    useEffect(() => {
        if (busy && shownAt === undefined) {
            const timer = window.setTimeout(() => setShownAt(Date.now()), SHOW_DELAY_MS);
            return () => window.clearTimeout(timer); // finished (or restarted) before the delay: never shown
        }
        if (!busy && shownAt !== undefined) {
            const remaining = Math.max(MIN_VISIBLE_MS - (Date.now() - shownAt), 0);
            const timer = window.setTimeout(() => setShownAt(undefined), remaining);
            return () => window.clearTimeout(timer); // busy again before it hid: stays up
        }
    }, [busy, shownAt]);

    if (shownAt === undefined) return null;

    const message = [...processes.values()].at(-1);

    return (
        <div
            role="status"
            aria-live="polite"
            data-loading-overlay
            className="fixed inset-0 bg-overlay z-50 flex items-center justify-center transition-opacity duration-150 ease-out starting:opacity-0 motion-reduce:transition-none">
            <div className="bg-white rounded-lg p-6 flex flex-col items-center gap-3">
                <LoaderCircle className="w-8 h-8 animate-spin text-primary" />
                <span className={message ? "text-sm text-gray-600" : "sr-only"}>{message ?? "Loading..."}</span>
            </div>
        </div>
    );
};

export default LoadingBanner;
