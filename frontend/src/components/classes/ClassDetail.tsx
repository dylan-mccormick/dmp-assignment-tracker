// ClassDetail.tsx
// The edit pane for one class: its metadata and semester, a form to change or move it, and deletion

import { useContext } from "react";

import apiFetch, { readError } from "../../apiClient";
import { BannerContext } from "../../context/BannerContext";
import { ModalContext } from "../../context/ModalContext";
import { formatDate, formatDateTime } from "../../dates";
import type { Class } from "../../model/Class";
import type { Semester } from "../../model/Semester";
import KeyValueTable from "../KeyValueTable";
import SecondaryButton from "../SecondaryButton";
import ClassForm, { type ClassFormValues } from "./ClassForm";

interface ClassDetailProps {
    cls: Class;
    semesters: Semester[];
    onSaved: (cls: Class) => void;
    onDeleted: (classId: string) => void;
}

const ClassDetail = ({ cls, semesters, onSaved, onDeleted }: ClassDetailProps) => {
    // Context
    const { setBanner } = useContext(BannerContext);
    const { showModal, closeModal } = useContext(ModalContext);

    const semester = semesters.find(s => s.id === cls.semesterId);

    // Sends only the fields that changed (PATCH)
    const save = async (values: ClassFormValues) => {
        const changes = Object.fromEntries(
            (Object.keys(values) as (keyof ClassFormValues)[])
                .filter(key => values[key] !== cls[key])
                .map(key => [key, values[key]])
        );

        let res: Response;
        try {
            res = await apiFetch(`/classes/${cls.id}`, { method: "PATCH", body: changes });
        } catch {
            throw new Error("Could not reach the server. Please try again.");
        }
        if (!res.ok) throw new Error(await readError(res, "Could not save the class. Please try again."));

        const saved: Class = (await res.json()).class;
        onSaved(saved);
        const movedTo = saved.semesterId !== cls.semesterId && semesters.find(s => s.id === saved.semesterId);
        setBanner({
            level: "success",
            message: movedTo ? `Moved "${saved.name}" to ${movedTo.name}.` : `Saved "${saved.name}".`
        });
    };

    const deleteClass = async () => {
        showModal({ type: "buttonless", title: "Deleting class...", loadingSpinner: true });

        try {
            const res = await apiFetch(`/classes/${cls.id}`, { method: "DELETE" });

            // 404: it's already gone
            if (!res.ok && res.status !== 404) {
                setBanner({
                    level: "error",
                    message: await readError(res, "Could not delete the class. Please try again.")
                });
                return;
            }

            onDeleted(cls.id);
            setBanner({ level: "success", message: `Deleted "${cls.name}".` });
        } catch (error) {
            console.error(error);
            setBanner({ level: "error", message: "Could not reach the server. Please try again." });
        } finally {
            closeModal();
        }
    };

    const confirmDelete = () =>
        showModal({
            type: "confirm",
            title: `Delete "${cls.name}"?`,
            message: "This will permanently delete the class along with all of its assignments. This can't be undone.",
            confirmText: "Delete Class",
            danger: true,
            onConfirm: deleteClass
        });

    return (
        <div className="space-y-8">
            <KeyValueTable
                rows={[
                    { label: "Code", value: cls.code },
                    { label: "Semester", value: semester?.name ?? "Unknown" },
                    ...(semester
                        ? [
                              {
                                  label: "Semester Dates",
                                  value: `${formatDate(semester.startDate)} – ${formatDate(semester.endDate)}`
                              }
                          ]
                        : []),
                    { label: "Created", value: formatDateTime(cls.createdAt) },
                    { label: "Last Updated", value: formatDateTime(cls.updatedAt) }
                ]}
            />

            <section>
                <h3 className="text-lg font-light mb-4">Edit</h3>
                <ClassForm
                    initialValues={{ semesterId: cls.semesterId, name: cls.name, code: cls.code }}
                    semesters={semesters}
                    submitLabel="Save"
                    submittingLabel="Saving..."
                    requireChanges
                    onSubmit={save}
                    extraActions={
                        <SecondaryButton
                            danger
                            onClick={confirmDelete}>
                            Delete
                        </SecondaryButton>
                    }
                />
            </section>
        </div>
    );
};

export default ClassDetail;
