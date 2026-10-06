// AssignmentEditor.tsx
// One assignment's page, at /assignments/:id to edit (or delete) it and at /assignments/new to create one

import { ArrowLeft } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router";

import apiFetch, { readError } from "../apiClient";
import AssignmentForm, { type AssignmentFormValues } from "../components/assignments/AssignmentForm";
import KeyValueTable from "../components/KeyValueTable";
import SecondaryButton from "../components/SecondaryButton";
import StandardLayout from "../components/StandardLayout";
import { BannerContext } from "../context/BannerContext";
import { ModalContext } from "../context/ModalContext";
import { formatDateTime, fromDateTimeLocal, toDateTimeLocal } from "../dates";
import useGetJson from "../hooks/useGetJson";
import type { Assignment, AssignmentType } from "../model/Assignment";
import type { Class } from "../model/Class";
import type { Semester } from "../model/Semester";
import { MAIN_NAV_ITEMS } from "../navItems";

interface PageData {
    types: AssignmentType[];
    semesters: Semester[];
    classes: Class[];
    assignment?: Assignment; // set when editing
}

const toFormValues = (assignment: Assignment): AssignmentFormValues => ({
    name: assignment.name,
    typeId: assignment.typeId,
    classId: assignment.classId,
    done: assignment.done,
    earlyDue: assignment.earlyDue ? toDateTimeLocal(assignment.earlyDue) : "",
    due: toDateTimeLocal(assignment.due),
    lateDue: assignment.lateDue ? toDateTimeLocal(assignment.lateDue) : "",
    notes: assignment.notes
});

// The API's form of one field: deadlines become ISO timestamps, and an emptied optional deadline becomes null
const toApiValue = (key: keyof AssignmentFormValues, value: AssignmentFormValues[keyof AssignmentFormValues]) => {
    if (key === "earlyDue" || key === "lateDue") return value ? fromDateTimeLocal(value as string) : null;
    if (key === "due") return fromDateTimeLocal(value as string);
    return value;
};

const AssignmentEditor = () => {
    // Context
    const { setBanner } = useContext(BannerContext);
    const { showModal, closeModal } = useContext(ModalContext);

    // State
    const { id } = useParams();
    const creating = id === undefined;
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const navigate = useNavigate();
    const getJson = useGetJson();
    // Tagged with the page it was loaded for (an id, or "new"), so moving to another assignment shows "loading"
    // instead of the previous one, with nothing to reset
    const pageKey = id ?? "new";
    const [result, setResult] = useState<{ pageKey: string; data?: PageData; error?: string }>();
    const data = result?.pageKey === pageKey ? result.data : undefined;
    const loadError = result?.pageKey === pageKey ? result.error : undefined;

    // Back to the exact table view this page was opened from, else that semester's table
    const assignmentSemesterId = data?.classes.find(c => c.id === data.assignment?.classId)?.semesterId;
    const fallbackSemester = assignmentSemesterId ?? searchParams.get("semester");
    const back =
        typeof location.state?.back === "string" && location.state.back.startsWith("/assignments")
            ? location.state.back
            : `/assignments${fallbackSemester ? `?semester=${encodeURIComponent(fallbackSemester)}` : ""}`;

    // Load what the form needs: the types, every semester and class (for moving it), and the assignment itself
    useEffect(() => {
        const controller = new AbortController();

        const fetchAll = async () => {
            try {
                const [typeBody, semesterBody, classBody, assignmentBody] = await Promise.all([
                    getJson("/assignment-types", controller.signal),
                    getJson("/semesters", controller.signal),
                    getJson("/classes", controller.signal),
                    id === undefined
                        ? Promise.resolve({})
                        : getJson(`/assignments/${encodeURIComponent(id)}`, controller.signal)
                ]);
                if (!typeBody || !semesterBody || !classBody || !assignmentBody) return;
                setResult({
                    pageKey,
                    data: {
                        types: typeBody.types,
                        semesters: semesterBody.semesters,
                        classes: classBody.classes,
                        assignment: assignmentBody.assignment
                    }
                });
            } catch (error) {
                if (controller.signal.aborted) return;
                console.error(error);
                setResult({
                    pageKey,
                    error: error instanceof Error ? error.message : "Could not load the assignment."
                });
            }
        };

        fetchAll();
        return () => controller.abort();
    }, [id, pageKey, getJson]);

    const create = async (values: AssignmentFormValues) => {
        const body = Object.fromEntries(
            (Object.keys(values) as (keyof AssignmentFormValues)[])
                .map(key => [key, toApiValue(key, values[key])])
                .filter(([, value]) => value !== null)
        );

        let res: Response;
        try {
            res = await apiFetch("/assignments", { method: "POST", body });
        } catch {
            throw new Error("Could not reach the server. Please try again.");
        }
        if (!res.ok) throw new Error(await readError(res, "Could not create the assignment. Please try again."));

        const { assignment } = await res.json();
        setBanner({ level: "success", message: `Created "${assignment.name}".` });
        navigate(back, { replace: true });
    };

    // Sends only the fields that changed (PATCH)
    const save = async (values: AssignmentFormValues) => {
        const initial = toFormValues(data!.assignment!);
        const changes = Object.fromEntries(
            (Object.keys(values) as (keyof AssignmentFormValues)[])
                .filter(key => values[key] !== initial[key])
                .map(key => [key, toApiValue(key, values[key])])
        );

        let res: Response;
        try {
            res = await apiFetch(`/assignments/${data!.assignment!.id}`, { method: "PATCH", body: changes });
        } catch {
            throw new Error("Could not reach the server. Please try again.");
        }
        if (!res.ok) throw new Error(await readError(res, "Could not save the assignment. Please try again."));

        const saved: Assignment = (await res.json()).assignment;
        setResult(r => r?.data && { ...r, data: { ...r.data, assignment: saved } });
        setBanner({ level: "success", message: `Saved "${saved.name}".` });
    };

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
            navigate(back, { replace: true });
        } catch (error) {
            console.error(error);
            setBanner({ level: "error", message: "Could not reach the server. Please try again." });
        } finally {
            closeModal();
        }
    };

    const confirmDelete = (assignment: Assignment) =>
        showModal({
            type: "confirm",
            title: `Delete "${assignment.name}"?`,
            message: "This will permanently delete the assignment and its notes. This can't be undone.",
            confirmText: "Delete Assignment",
            danger: true,
            onConfirm: () => deleteAssignment(assignment)
        });

    // A new assignment starts in the class (or the semester's first class) it was created from
    const newValues = (): AssignmentFormValues => {
        const semesterClasses = data!.classes.filter(c => c.semesterId === searchParams.get("semester"));
        const classId =
            data!.classes.find(c => c.id === searchParams.get("class"))?.id ??
            semesterClasses[0]?.id ??
            data!.classes[0]?.id ??
            "";
        return { name: "", typeId: "", classId, done: false, earlyDue: "", due: "", lateDue: "", notes: "" };
    };

    const assignment = data?.assignment;
    const title = creating ? "New Assignment" : (assignment?.name ?? "Assignment");

    return (
        <StandardLayout
            title={title}
            sidebar={MAIN_NAV_ITEMS}>
            <div className="max-w-4xl">
                <Link
                    to={back}
                    className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-black mb-4">
                    <ArrowLeft className="w-4 h-4" />
                    Assignments
                </Link>
                <h1 className="text-3xl font-extralight mb-8 break-words">{title}</h1>

                {loadError && (
                    <div className="text-center text-gray-600 py-16 space-y-2">
                        <p>{loadError}</p>
                        <Link
                            to={back}
                            className="text-primary underline active:text-blue-600">
                            Back to assignments
                        </Link>
                    </div>
                )}

                {!data && !loadError && <p className="text-gray-600">Loading...</p>}

                {data && creating && data.classes.length === 0 && (
                    <div className="text-center text-gray-600 py-16 space-y-2">
                        <p>Assignments belong to a class, and you don't have any classes yet.</p>
                        <Link
                            to="/classes"
                            className="text-primary underline active:text-blue-600">
                            Add a class first
                        </Link>
                    </div>
                )}

                {data && creating && data.classes.length > 0 && (
                    <AssignmentForm
                        initialValues={newValues()}
                        types={data.types}
                        semesters={data.semesters}
                        classes={data.classes}
                        submitLabel="Create"
                        submittingLabel="Creating..."
                        onSubmit={create}
                        onCancel={() => navigate(back)}
                    />
                )}

                {data && assignment && (
                    <div className="space-y-8">
                        <KeyValueTable
                            rows={[
                                { label: "Created", value: formatDateTime(assignment.createdAt) },
                                { label: "Last Updated", value: formatDateTime(assignment.updatedAt) }
                            ]}
                        />
                        <AssignmentForm
                            // remount after a save so the form's "unchanged" baseline is the saved assignment
                            key={`${assignment.id}-${assignment.updatedAt}`}
                            initialValues={toFormValues(assignment)}
                            types={data.types}
                            semesters={data.semesters}
                            classes={data.classes}
                            submitLabel="Save"
                            submittingLabel="Saving..."
                            requireChanges
                            onSubmit={save}
                            extraActions={
                                <SecondaryButton
                                    danger
                                    onClick={() => confirmDelete(assignment)}>
                                    Delete
                                </SecondaryButton>
                            }
                        />
                    </div>
                )}
            </div>
        </StandardLayout>
    );
};

export default AssignmentEditor;
