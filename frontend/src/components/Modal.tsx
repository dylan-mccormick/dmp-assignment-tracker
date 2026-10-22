// Modal.tsx
// Renders the current ModalContext modal over the page, scaling in on open and out on close. It's a native modal
// <dialog>, so the page behind it is inert (focus stays inside) and Escape cancels it; focus returns to whatever opened
// it

import { LoaderCircle } from "lucide-react";
import { type SyntheticEvent, type TransitionEvent, useContext, useLayoutEffect, useRef, useState } from "react";

import { type ModalConfig, ModalContext } from "../context/ModalContext";
import PrimaryButton from "./PrimaryButton";
import SecondaryButton from "./SecondaryButton";

// Where focus goes when the element that opened the modal is gone (e.g. the Delete button of a deleted item)
const focusFallback = () => document.getElementById("main")?.focus();

const Modal = () => {
    const { modal: current, closeModal } = useContext(ModalContext);

    // Refs
    const dialogRef = useRef<HTMLDialogElement>(null);
    const returnFocusRef = useRef<HTMLElement | null>(null);

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
    const shown = modal !== undefined && !(closing && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

    // Open the dialog before paint, and keep focus inside it when its content is swapped (the focused button may be
    // gone). On close it leaves the top layer right away (the fade-out plays as a plain fixed layer), so the page stops
    // being inert at once: focus goes back to whatever opened it, and a banner set alongside closeModal() is announced
    useLayoutEffect(() => {
        const dialog = dialogRef.current;
        const open = shown && !closing;
        if (open && dialog && !dialog.open) {
            returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
            dialog.showModal(); // focuses the first focusable element, e.g. Cancel or a form's first field
        } else if (open && dialog && !dialog.contains(document.activeElement)) {
            dialog.focus();
        }
        if (!open) {
            if (dialog?.open) dialog.close();
            if (returnFocusRef.current) {
                const target = returnFocusRef.current;
                returnFocusRef.current = null;
                if (target.isConnected) target.focus();
                else focusFallback();
            }
        }
    });

    if (!modal || !shown) return null;

    const handleTransitionEnd = (e: TransitionEvent<HTMLDialogElement>) => {
        if (closing && e.target === e.currentTarget && e.propertyName === "opacity") setDisplayed(undefined);
    };

    // Escape: the dialog closes through closeModal (so it can animate out), never on its own. A "please wait" modal
    // can't be cancelled
    const handleCancel = (e: SyntheticEvent<HTMLDialogElement>) => {
        e.preventDefault();
        if (closing || modal.type === "buttonless") return;
        closeModal();
        if (modal.type === "confirm") modal.onCancel?.();
    };

    // Browsers only let a page refuse Escape once per user interaction, so a repeated Escape can still close the dialog
    // natively; a "please wait" modal is reopened, since its request is still running
    const handleClose = (e: SyntheticEvent<HTMLDialogElement>) => {
        if (!closing && modal.type === "buttonless") e.currentTarget.showModal();
    };

    return (
        <dialog
            ref={dialogRef}
            tabIndex={-1}
            aria-labelledby="modal-title"
            aria-describedby={modal.message ? "modal-message" : undefined}
            aria-busy={modal.loadingSpinner || undefined}
            aria-hidden={closing || undefined}
            onCancel={handleCancel}
            onClose={handleClose}
            onTransitionEnd={handleTransitionEnd}
            className={`fixed inset-0 m-0 p-0 border-0 w-full h-full max-w-none max-h-none bg-overlay text-black outline-none backdrop:bg-transparent items-center justify-center transition-opacity duration-150 ease-out starting:opacity-0 motion-reduce:transition-none ${closing ? "flex z-50 opacity-0 pointer-events-none" : "open:flex opacity-100"}`}>
            <div
                className={`bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl transition-transform duration-150 ease-out starting:scale-90 motion-reduce:transition-none ${closing ? "scale-90" : "scale-100"}`}>
                <h2
                    id="modal-title"
                    className="text-lg font-bold mb-2">
                    {modal.title}
                </h2>
                {modal.message && (
                    <p
                        id="modal-message"
                        className="text-gray-600 mb-4">
                        {modal.message}
                    </p>
                )}

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
        </dialog>
    );
};

export default Modal;
