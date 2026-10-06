// useIsMobile.ts
// Whether the viewport is below Tailwind's md breakpoint, re-rendering when it crosses it

import { useSyncExternalStore } from "react";

// Same breakpoint as Tailwind v4's `md:` (48rem), so JS and CSS agree on what "mobile" means
const query = window.matchMedia("(width < 48rem)");

const subscribe = (listener: () => void) => {
    query.addEventListener("change", listener);
    return () => query.removeEventListener("change", listener);
};

/**
 * Gets whether the viewport is mobile-sized (narrower than Tailwind's md breakpoint)
 *
 * @returns True while the viewport is narrower than 48rem
 */
const useIsMobile = () =>
    useSyncExternalStore(
        subscribe,
        () => query.matches,
        () => false
    );

export default useIsMobile;
