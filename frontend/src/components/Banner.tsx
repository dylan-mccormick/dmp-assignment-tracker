// Banner.tsx
// Renders the current BannerContext banner: slides in, auto-dismisses after its duration (paused while hovered or
// focused; errors stay until closed), and can be closed with the X button. Screen readers hear it through live regions
// that are always mounted, since a live region that appears together with its text often isn't announced

import { CircleAlert, CircleCheck, Info, X } from "lucide-react";
import { type AnimationEvent, type TransitionEvent, useContext, useState } from "react";

import { type ActiveBanner, BannerContext, defaultBannerDuration } from "../context/BannerContext";

const LEVEL_STYLES = {
    success: { box: "bg-green-50 border-green-200 text-green-900", icon: "text-green-700", bar: "bg-green-600" },
    error: { box: "bg-red-50 border-red-200 text-red-900", icon: "text-red-700", bar: "bg-red-600" },
    info: { box: "bg-blue-50 border-blue-200 text-primary", icon: "text-primary", bar: "bg-primary" }
};

const LEVEL_ICONS = {
    success: CircleCheck,
    error: CircleAlert,
    info: Info
};

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const BannerItem = ({ banner, onDismissed }: { banner: ActiveBanner; onDismissed: () => void }) => {
    // State
    const [leaving, setLeaving] = useState(false);

    const styles = LEVEL_STYLES[banner.level];
    const Icon = LEVEL_ICONS[banner.level];
    const durationMs =
        banner.durationMs !== undefined
            ? banner.durationMs
            : banner.level === "error"
              ? null
              : defaultBannerDuration(banner.message);

    // Start the exit transition (no transition runs with reduced motion, so dismiss right away)
    const dismiss = () => (prefersReducedMotion() ? onDismissed() : setLeaving(true));

    const handleTransitionEnd = (e: TransitionEvent<HTMLDivElement>) => {
        if (leaving && e.target === e.currentTarget && e.propertyName === "opacity") onDismissed();
    };

    // The countdown bar's animation is the timer, so pausing it (hover/focus) pauses the auto-dismiss too
    const handleCountdownEnd = (e: AnimationEvent<HTMLDivElement>) => {
        if (e.animationName === "banner-countdown") dismiss();
    };

    return (
        <div
            onTransitionEnd={handleTransitionEnd}
            className={`group relative overflow-hidden flex items-start gap-3 p-4 rounded-lg border shadow-md transition-all duration-300 ease-out starting:opacity-0 starting:-translate-y-3 motion-reduce:transition-none ${styles.box} ${leaving ? "opacity-0 -translate-y-3" : "opacity-100 translate-y-0"}`}>
            <Icon className={`shrink-0 w-5 h-5 mt-0.5 ${styles.icon}`} />
            <span className="flex-1 min-w-0 break-words">{banner.message}</span>
            <button
                type="button"
                className="shrink-0 -m-0.5 p-0.5 cursor-pointer rounded opacity-60 hover:opacity-100 transition-opacity"
                aria-label="Dismiss"
                onClick={dismiss}>
                <X className="w-5 h-5" />
            </button>

            {durationMs !== null && (
                <div
                    aria-hidden="true"
                    onAnimationEnd={handleCountdownEnd}
                    style={{ animation: `banner-countdown ${durationMs}ms linear forwards` }}
                    className={`absolute bottom-0 left-0 h-1 w-full origin-left opacity-40 group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused] ${styles.bar}`}
                />
            )}
        </div>
    );
};

const Banner = () => {
    const { banner, setBanner } = useContext(BannerContext);

    return (
        <>
            {/* the announcements: keyed by banner id, so the same message set twice is still read out again */}
            <div
                role="status"
                className="sr-only">
                {banner && banner.level !== "error" && <p key={banner.id}>{banner.message}</p>}
            </div>
            <div
                role="alert"
                className="sr-only">
                {banner?.level === "error" && <p key={banner.id}>{banner.message}</p>}
            </div>

            {banner && (
                <div className="fixed top-20 inset-x-0 z-40 flex justify-center px-4 pointer-events-none">
                    <div className="w-full max-w-xl pointer-events-auto">
                        <BannerItem
                            key={banner.id}
                            banner={banner}
                            onDismissed={() => setBanner(undefined)}
                        />
                    </div>
                </div>
            )}
        </>
    );
};

export default Banner;
