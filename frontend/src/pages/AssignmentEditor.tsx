// AssignmentEditor.tsx
// Edits every field of an assignment (/assignments/:id/edit) or creates one (/assignments/new)

import { ArrowLeft, Trash2 } from "lucide-react";
import { useContext } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router";

import apiFetch, { readError } from "../apiClient";
import AssignmentForm, { type AssignmentFormValues } from "../components/assignments/AssignmentForm";
import { type AssignmentNavState, listBackUrl } from "../components/assignments/assignmentNavigation";
import SecondaryButton from "../components/SecondaryButton";
import StandardLayout from "../components/StandardLayout";
import { BannerContext } from "../context/BannerContext";
import { fromDateTimeLocal, toDateTimeLocal } from "../dates";
import useAssignmentData, { type AssignmentData } from "../hooks/useAssignmentData";
import useDeleteAssignment from "../hooks/useDeleteAssignment";
import type { Assignment } from "../model/Assignment";
import { MAIN_NAV_ITEMS } from "../navItems";

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

    // State
    const { id } = useParams();
    const creating = id === undefined;
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { data, loadError } = useAssignmentData(id);

    const assignment = data?.assignment;
    const assignmentSemesterId = data?.classes.find(c => c.id === assignment?.classId)?.semesterId;
    const listBack = listBackUrl(location.state, assignmentSemesterId ?? searchParams.get("semester"));
    const fromView = (location.state as Partial<AssignmentNavState> | null)?.fromView === true;
    const viewUrl = `/assignments/${id}`;

    // Leaves the edit page for the assignment's view: a step back in history when we came from there (no duplicate
    // entry), else a replace. Either way the view remounts and loads the saved assignment
    const returnToView = () => {
        if (fromView) navigate(-1);
        else navigate(viewUrl, { replace: true, state: { back: listBack } satisfies AssignmentNavState });
    };

    const confirmDelete = useDeleteAssignment(() => navigate(listBack, { replace: true }));

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

        const { assignment: created } = await res.json();
        setBanner({ level: "success", message: `Created "${created.name}".` });
        navigate(listBack, { replace: true });
    };

    // Sends only the fields that changed (PATCH), then goes back to the assignment's view. The loaded assignment is
    // passed in rather than read with `assignment!`: the React Compiler turns a non-null assertion inside a closure
    // into an unguarded `assignment.x` dependency check that runs on every render, crashing while it's still loading
    const save = async (current: Assignment, values: AssignmentFormValues) => {
        const initial = toFormValues(current);
        const changes = Object.fromEntries(
            (Object.keys(values) as (keyof AssignmentFormValues)[])
                .filter(key => values[key] !== initial[key])
                .map(key => [key, toApiValue(key, values[key])])
        );

        let res: Response;
        try {
            res = await apiFetch(`/assignments/${current.id}`, { method: "PATCH", body: changes });
        } catch {
            throw new Error("Could not reach the server. Please try again.");
        }
        if (!res.ok) throw new Error(await readError(res, "Could not save the assignment. Please try again."));

        const saved: Assignment = (await res.json()).assignment;
        setBanner({ level: "success", message: `Saved "${saved.name}".` });
        returnToView();
    };

    // A new assignment starts in the class (or the semester's first class) it was created from (data is passed in, not
    // read with `data!`, for the same React Compiler reason as save)
    const newValues = ({ classes }: AssignmentData): AssignmentFormValues => {
        const semesterClasses = classes.filter(c => c.semesterId === searchParams.get("semester"));
        const classId =
            classes.find(c => c.id === searchParams.get("class"))?.id ?? semesterClasses[0]?.id ?? classes[0]?.id ?? "";
        return { name: "", typeId: "", classId, done: false, earlyDue: "", due: "", lateDue: "", notes: "" };
    };

    const title = creating ? "New Assignment" : `Edit ${assignment?.name ?? "Assignment"}`;

    return (
        <StandardLayout
            title={title}
            sidebar={MAIN_NAV_ITEMS}>
            <div className="max-w-4xl">
                {creating ? (
                    <Link
                        to={listBack}
                        className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-black mb-4">
                        <ArrowLeft className="w-4 h-4" />
                        Assignments
                    </Link>
                ) : (
                    <button
                        type="button"
                        onClick={returnToView}
                        className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-black mb-4 cursor-pointer">
                        <ArrowLeft className="w-4 h-4" />
                        Back to assignment
                    </button>
                )}
                <h1 className="text-3xl font-extralight mb-8 break-words">{title}</h1>

                {loadError && (
                    <div className="text-center text-gray-600 py-16 space-y-2">
                        <p>{loadError}</p>
                        <Link
                            to={listBack}
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
                        initialValues={newValues(data)}
                        types={data.types}
                        semesters={data.semesters}
                        classes={data.classes}
                        submitLabel="Create"
                        submittingLabel="Creating..."
                        onSubmit={create}
                        onCancel={() => navigate(listBack)}
                    />
                )}

                {data && assignment && (
                    <AssignmentForm
                        initialValues={toFormValues(assignment)}
                        types={data.types}
                        semesters={data.semesters}
                        classes={data.classes}
                        submitLabel="Save"
                        submittingLabel="Saving..."
                        requireChanges
                        onSubmit={values => save(assignment, values)}
                        onCancel={returnToView}
                        extraActions={
                            <SecondaryButton
                                danger
                                onClick={() => confirmDelete(assignment)}>
                                <span className="flex items-center gap-1.5">
                                    <Trash2 className="w-4 h-4" />
                                    Delete
                                </span>
                            </SecondaryButton>
                        }
                    />
                )}
            </div>
        </StandardLayout>
    );
};

export default AssignmentEditor;
