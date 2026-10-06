// useDeleteAssignment.ts
// The confirm -> "deleting..." -> banner flow for deleting an assignment, shared by its view and edit pages

import { useContext } from "react";

import apiFetch, { readError } from "../apiClient";
import { BannerContext } from "../context/BannerContext";
import { ModalContext } from "../context/ModalContext";
import type { Assignment } from "../model/Assignment";

/**
 * Gets a function that asks to confirm, then deletes an assignment
 *
 * @param onDeleted Called once it's gone (including when it was already gone), e.g. to leave the page
 * @returns ConfirmDelete(assignment)
 */
const useDeleteAssignment = (onDeleted: () => void) => {
    const { setBanner } = useContext(BannerContext);
    const { showModal, closeModal } = useContext(ModalContext);

    const deleteAssignment = async (assignment: Assignment) => {
        showModal({ type: "buttonless", title: "Deleting assignment...", loadingSpinner: true });

        try {
            const res = await apiFetch(`/assignments/${assignment.id}`, { method: "DELETE" });

            // 404: it's already gone
            if (!res.ok && res.status !== 404) {
                setBanner({
                    level: "error",
                    message: await readError(res, "Could not delete the assignment. Please try again.")
                });
                return;
            }

            setBanner({ level: "success", message: `Deleted "${assignment.name}".` });
            onDeleted();
        } catch (error) {
            console.error(error);
            setBanner({ level: "error", message: "Could not reach the server. Please try again." });
        } finally {
            closeModal();
        }
    };

    return (assignment: Assignment) =>
        showModal({
            type: "confirm",
            title: `Delete "${assignment.name}"?`,
            message: "This will permanently delete the assignment and its notes. This can't be undone.",
            confirmText: "Delete Assignment",
            danger: true,
            onConfirm: () => deleteAssignment(assignment)
        });
};

export default useDeleteAssignment;
