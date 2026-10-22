// SemesterDetail.tsx
// The edit pane for one semester: its metadata, a form to change its name/dates, and deletion

import { useContext } from "react";
import { Link } from "react-router";

import apiFetch, { readError } from "../../apiClient";
import { BannerContext } from "../../context/BannerContext";
import { ModalContext } from "../../context/ModalContext";
import { calendarDateToUtcMs, formatDate, formatDateTime } from "../../dates";
import type { Semester } from "../../model/Semester";
import Duration from "../Duration";
import KeyValueTable from "../KeyValueTable";
import SecondaryButton from "../SecondaryButton";
import SemesterForm, { type SemesterFormValues } from "./SemesterForm";

const DAY_MS = 24 * 60 * 60 * 1000;

interface SemesterDetailProps {
    semester: Semester;
    onSaved: (semester: Semester) => void;
    onDeleted: (semesterId: string) => void;
}

const SemesterDetail = ({ semester, onSaved, onDeleted }: SemesterDetailProps) => {
    // Context
    const { setBanner } = useContext(BannerContext);
    const { showModal, closeModal } = useContext(ModalContext);

    // Sends only the fields that changed (PATCH)
    const save = async (values: SemesterFormValues) => {
        const changes = Object.fromEntries(
            (Object.keys(values) as (keyof SemesterFormValues)[])
                .filter(key => values[key] !== semester[key])
                .map(key => [key, values[key]])
        );

        let res: Response;
        try {
            res = await apiFetch(`/semesters/${semester.id}`, { method: "PATCH", body: changes });
        } catch {
            throw new Error("Could not reach the server. Please try again.");
        }
        if (!res.ok) throw new Error(await readError(res, "Could not save the semester. Please try again."));

        const { semester: saved } = await res.json();
        onSaved(saved);
        setBanner({ level: "success", message: `Saved "${saved.name}".` });
    };

    const deleteSemester = async () => {
        showModal({ type: "buttonless", title: "Deleting semester...", loadingSpinner: true });

        try {
            const res = await apiFetch(`/semesters/${semester.id}`, { method: "DELETE" });

            // 404: it's already gone
            if (!res.ok && res.status !== 404) {
                setBanner({
                    level: "error",
                    message: await readError(res, "Could not delete the semester. Please try again.")
                });
                return;
            }

            onDeleted(semester.id);
            setBanner({ level: "success", message: `Deleted "${semester.name}".` });
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
            title: `Delete "${semester.name}"?`,
            message:
                "This will permanently delete the semester along with all of its classes and their assignments. This can't be undone.",
            confirmText: "Delete Semester",
            danger: true,
            onConfirm: deleteSemester
        });

    return (
        <div className="space-y-8">
            <KeyValueTable
                rows={[
                    { label: "Starts", value: formatDate(semester.startDate) },
                    { label: "Ends", value: formatDate(semester.endDate) },
                    {
                        label: "Length",
                        // inclusive: from the start of the first day to the end of the last
                        value: (
                            <Duration
                                from={calendarDateToUtcMs(semester.startDate)}
                                to={calendarDateToUtcMs(semester.endDate) + DAY_MS}
                            />
                        )
                    },
                    { label: "Created", value: formatDateTime(semester.createdAt) },
                    { label: "Last Updated", value: formatDateTime(semester.updatedAt) }
                ]}
            />

            <Link
                to={`/classes?semester=${encodeURIComponent(semester.id)}`}
                className="inline-block text-primary underline active:text-blue-600">
                View classes
            </Link>

            <section>
                <h3 className="text-lg font-light mb-4">Edit</h3>
                <SemesterForm
                    initialValues={{ name: semester.name, startDate: semester.startDate, endDate: semester.endDate }}
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

export default SemesterDetail;
