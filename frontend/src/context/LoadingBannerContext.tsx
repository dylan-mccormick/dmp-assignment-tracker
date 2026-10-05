// LoadingBannerContext.tsx
// Context for named in-flight processes, shown as a full-screen loading overlay

import { createContext } from "react";

interface LoadingBannerContextInterface {
    processes: Map<string, string | undefined>;
    addProcess: (id: string, message?: string) => void;
    removeProcess: (id: string) => void;
}

export const LoadingBannerContext = createContext<LoadingBannerContextInterface>({
    processes: new Map(),
    addProcess: () => {},
    removeProcess: () => {}
});
