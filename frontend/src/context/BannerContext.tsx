// BannerContext.tsx
// Context for the single dismissable banner shown under the header

import { createContext } from "react";

export interface BannerConfig {
    message: string;
    level: "success" | "error" | "info";
}

interface BannerContextInterface {
    banner: BannerConfig | undefined;
    setBanner: (banner: BannerConfig | undefined) => void;
}

export const BannerContext = createContext<BannerContextInterface>({
    banner: undefined,
    setBanner: () => {}
});
