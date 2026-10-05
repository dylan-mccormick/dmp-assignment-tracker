// LoadingBannerContextProvider.tsx
// Holds the state for LoadingBannerContext

import { type ReactNode, useCallback, useState } from "react";

import { LoadingBannerContext } from "./LoadingBannerContext";

const LoadingBannerContextProvider = ({ children }: { children: ReactNode }) => {
    const [processes, setProcesses] = useState<Map<string, string | undefined>>(new Map());

    const addProcess = useCallback((id: string, message?: string) => {
        setProcesses(prev => new Map(prev).set(id, message));
    }, []);

    const removeProcess = useCallback((id: string) => {
        setProcesses(prev => {
            const next = new Map(prev);
            next.delete(id);
            return next;
        });
    }, []);

    return (
        <LoadingBannerContext.Provider value={{ processes, addProcess, removeProcess }}>
            {children}
        </LoadingBannerContext.Provider>
    );
};

export default LoadingBannerContextProvider;
