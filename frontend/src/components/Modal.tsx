// Modal.tsx
// Renders the current ModalContext modal over the page, scaling in on open and out on close

import { LoaderCircle } from "lucide-react";
import { type TransitionEvent, useContext, useState } from "react";

import { type ModalConfig, ModalContext } from "../context/ModalContext";
import PrimaryButton from "./PrimaryButton";
import SecondaryButton from "./SecondaryButton";

const Modal = () => {
    const { modal: current, closeModal } = useContext(ModalContext);

    // Keep showing the last modal after closeModal() so it can animate out; switching straight to another modal
    // (e.g. confirm -> "please wait") swaps the content in place
    const [displayed, setDisplayed] = useState<ModalConfig | undefined>(current);
    const [previous, setPrevious] = useState(current);
    if (current !== previous) {
        setPrevious(current);
        if (current) setDisplayed(current);
    }

    const closing = !current && displayed !== undefined;
    const modal = displayed;

    // With reduced motion there's no transition to wait for
    if (!modal || (closing && window.matchMedia("(prefers-reduced-motion: reduce)").matches)) return null;

    const handleTransitionEnd = (e: TransitionEvent<HTMLDivElement>) => {
        if (closing && e.target === e.currentTarget && e.propertyName === "opacity") setDisplayed(undefined);
    };

    return (
        <div
            onTransitionEnd={handleTransitionEnd}
            className={`fixed inset-0 bg-overlay z-50 flex items-center justify-center transition-opacity duration-150 ease-out starting:opacity-0 motion-reduce:transition-none ${closing ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
                className={`bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl transition-transform duration-150 ease-out starting:scale-90 motion-reduce:transition-none ${closing ? "scale-90" : "scale-100"}`}>
                <h2
                    id="modal-title"
                    className="text-lg font-bold mb-2">
                    {modal.title}
                </h2>
                {modal.message && <p className="text-gray-600 mb-4">{modal.message}</p>}

                {modal.loadingSpinner && (
                    <div className="flex items-center justify-center py-2">
                        <LoaderCircle className="w-12 h-12 animate-spin text-primary" />
                    </div>
                )}

                {modal.type === "custom" && modal.content}

                {(modal.type === "alert" || modal.type === "confirm") && (
                    <div className="flex gap-2 justify-end">
                        {modal.type === "confirm" && (
                            <SecondaryButton
                                onClick={() => {
                                    closeModal();
                                    modal.onCancel?.();
                                }}>
                                Cancel
                            </SecondaryButton>
                        )}
                        <PrimaryButton
                            danger={modal.type === "confirm" && modal.danger}
                            onClick={() => {
                                closeModal();
                                modal.onConfirm?.();
                            }}>
                            {modal.type === "confirm" ? (modal.confirmText ?? "Confirm") : "OK"}
                        </PrimaryButton>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Modal;
