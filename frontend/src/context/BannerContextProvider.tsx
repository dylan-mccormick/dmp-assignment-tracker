// BannerContextProvider.tsx
// Holds the state for BannerContext

import { type ReactNode, useState } from "react";

import { type BannerConfig, BannerContext } from "./BannerContext";

const BannerContextProvider = ({ children }: { children: ReactNode }) => {
    const [banner, setBanner] = useState<BannerConfig>();

    return <BannerContext.Provider value={{ banner, setBanner }}>{children}</BannerContext.Provider>;
};

export default BannerContextProvider;
