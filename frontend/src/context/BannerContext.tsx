// BannerContext.tsx
// Context for the single dismissable banner shown under the header

import { createContext } from "react";

export interface BannerConfig {
    message: string;
    level: "success" | "error" | "info";
    /**
     * How long the banner stays up, in milliseconds. Defaults to a duration based on the message length (see
     * defaultBannerDuration), except errors, which by default stay up until dismissed so they can't vanish before
     * they're read; pass null to keep any banner up until the user dismisses it.
     */
    durationMs?: number | null;
}

// A banner as stored in context; the id changes on every setBanner call so a new banner restarts its timer
export interface ActiveBanner extends BannerConfig {
    id: number;
}

interface BannerContextInterface {
    banner: ActiveBanner | undefined;
    setBanner: (banner: BannerConfig | undefined) => void;
}

/**
 * Time to read a message: 2s plus ~60ms per character, kept between 4s and 12s
 *
 * @param message The banner text
 * @returns The duration in milliseconds
 */
export const defaultBannerDuration = (message: string) => Math.min(12000, Math.max(4000, 2000 + message.length * 60));

export const BannerContext = createContext<BannerContextInterface>({
    banner: undefined,
    setBanner: () => {}
});
