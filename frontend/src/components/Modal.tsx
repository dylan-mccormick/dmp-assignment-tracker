// Modal.tsx
// Renders the current ModalContext modal over the page

import { LoaderCircle } from "lucide-react";
import { useContext } from "react";

import { ModalContext } from "../context/ModalContext";
import PrimaryButton from "./PrimaryButton";
import SecondaryButton from "./SecondaryButton";

const Modal = () => {
    const { modal, closeModal } = useContext(ModalContext);

    if (!modal) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
                className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
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

                {modal.type !== "buttonless" && (
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
