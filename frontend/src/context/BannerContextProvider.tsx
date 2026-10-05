// BannerContextProvider.tsx
// Holds the state for BannerContext

import { type ReactNode, useCallback, useRef, useState } from "react";

import { type ActiveBanner, type BannerConfig, BannerContext } from "./BannerContext";

const BannerContextProvider = ({ children }: { children: ReactNode }) => {
    const [banner, setActiveBanner] = useState<ActiveBanner>();
    const nextId = useRef(0);

    const setBanner = useCallback((config: BannerConfig | undefined) => {
        setActiveBanner(config && { ...config, id: nextId.current++ });
    }, []);

    return <BannerContext.Provider value={{ banner, setBanner }}>{children}</BannerContext.Provider>;
};

export default BannerContextProvider;
