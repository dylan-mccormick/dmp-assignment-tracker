// ModalContext.tsx
// Context for the global imperative modal

import { createContext } from "react";

interface BaseModalConfig {
    title: string;
    message?: string;
    loadingSpinner?: boolean;
}

interface AlertModalConfig extends BaseModalConfig {
    type: "alert";
    onConfirm?: () => void;
}

interface ConfirmModalConfig extends BaseModalConfig {
    type: "confirm";
    confirmText?: string;
    danger?: boolean;
    onConfirm?: () => void;
    onCancel?: () => void;
}

// No buttons; whoever opened it is responsible for closing it (e.g. "Please wait" while a request runs)
interface ButtonlessModalConfig extends BaseModalConfig {
    type: "buttonless";
}

export type ModalConfig = AlertModalConfig | ConfirmModalConfig | ButtonlessModalConfig;

interface ModalContextInterface {
    modal: ModalConfig | undefined;
    showModal: (config: ModalConfig) => void;
    closeModal: () => void;
}

export const ModalContext = createContext<ModalContextInterface>({
    modal: undefined,
    showModal: () => {},
    closeModal: () => {}
});
