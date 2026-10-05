// ModalContextProvider.tsx
// Holds the state for ModalContext

import { type ReactNode, useCallback, useState } from "react";

import { type ModalConfig, ModalContext } from "./ModalContext";

const ModalContextProvider = ({ children }: { children: ReactNode }) => {
    const [modal, setModal] = useState<ModalConfig>();

    const showModal = useCallback((config: ModalConfig) => setModal(config), []);
    const closeModal = useCallback(() => setModal(undefined), []);

    return <ModalContext.Provider value={{ modal, showModal, closeModal }}>{children}</ModalContext.Provider>;
};

export default ModalContextProvider;
