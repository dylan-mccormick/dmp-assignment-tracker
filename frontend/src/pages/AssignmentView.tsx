// AssignmentView.tsx
// One assignment at a glance (/assignments/:id): its details and notes, a button to mark it complete (with confetti)
// or incomplete, and links to edit or delete it

import { ArrowLeft, CircleCheck, Pencil, RotateCcw, Trash2 } from "lucide-react";
import { useContext, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";

import apiFetch, { readError } from "../apiClient";
import { type AssignmentNavState, listBackUrl } from "../components/assignments/assignmentNavigation";
import KeyValueTable from "../components/KeyValueTable";
import PrimaryButton from "../components/PrimaryButton";
import SecondaryButton from "../components/SecondaryButton";
import StandardLayout from "../components/StandardLayout";
import { fireConfetti } from "../confetti";
import { BannerContext } from "../context/BannerContext";
import { formatDateTime, formatRelative } from "../dates";
import useAssignmentData from "../hooks/useAssignmentData";
import useDeleteAssignment from "../hooks/useDeleteAssignment";
import useNow from "../hooks/useNow";
import type { Assignment } from "../model/Assignment";
import { MAIN_NAV_ITEMS } from "../navItems";

// Where the assignment stands right now, for the badge under its name
const statusOf = (assignment: Assignment, now: number) => {
    const due = Date.parse(assignment.due);
    const lateDue = assignment.lateDue ? Date.parse(assignment.lateDue) : undefined;

    if (assignment.done) return { label: "Completed", className: "bg-green-50 text-green-800" };
    if (now > (lateDue ?? due)) return { label: "Overdue", className: "bg-red-50 text-red-800" };
    if (now > due && assignment.lateDue)
        return {
            label: `Late, accepted until ${formatDateTime(assignment.lateDue)}`,
            className: "bg-amber-50 text-amber-800"
        };
    return { label: `Due ${formatRelative(assignment.due, now)}`, className: "bg-blue-50 text-primary" };
};

const Deadline = ({ timestamp, now }: { timestamp: string | null; now: number }) =>
    timestamp ? (
        <>
            {formatDateTime(timestamp)}
            <span className="block text-sm text-gray-500">{formatRelative(timestamp, now)}</span>
        </>
    ) : (
        <span className="text-gray-400">None</span>
    );

const IconLabel = ({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => (
    <span className="flex items-center gap-1.5">
        {icon}
        {children}
    </span>
);

const AssignmentView = () => {
    // Context
    const { setBanner } = useContext(BannerContext);

    // State
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { data, loadError, setAssignment } = useAssignmentData(id);
    const [toggling, setToggling] = useState(false);
    const now = useNow();

    const assignment = data?.assignment;
    const cls = data?.classes.find(c => c.id === assignment?.classId);
    const semester = data?.semesters.find(s => s.id === cls?.semesterId);
    const type = data?.types.find(t => t.id === assignment?.typeId);
    const back = listBackUrl(location.state, cls?.semesterId);
    const navState: AssignmentNavState = { back };

    const confirmDelete = useDeleteAssignment(() => navigate(back, { replace: true }));

    const toggleDone = async (current: Assignment) => {
        setToggling(true);
        try {
            const res = await apiFetch(`/assignments/${current.id}`, {
                method: "PATCH",
                body: { done: !current.done }
            });
            if (!res.ok) {
                setBanner({
                    level: "error",
                    message: await readError(res, "Could not update the assignment. Please try again.")
                });
                return;
            }

            const saved: Assignment = (await res.json()).assignment;
            setAssignment(saved);
            if (saved.done) fireConfetti();
        } catch (error) {
            console.error(error);
            setBanner({ level: "error", message: "Could not reach the server. Please try again." });
        } finally {
            setToggling(false);
        }
    };

    const status = assignment && statusOf(assignment, now);

    return (
        <StandardLayout
            title={assignment?.name ?? "Assignment"}
            sidebar={MAIN_NAV_ITEMS}>
            <div className="max-w-3xl">
                <Link
                    to={back}
                    className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-black mb-4">
                    <ArrowLeft className="w-4 h-4" />
                    Assignments
                </Link>

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

                {assignment && status && (
                    <div className="space-y-8">
                        <div>
                            <h1
                                className={`text-3xl font-extralight break-words ${assignment.done ? "text-gray-500 line-through" : ""}`}>
                                {assignment.name}
                            </h1>
                            <p className="flex flex-wrap items-center gap-2 mt-3 text-sm text-gray-600">
                                <span className={`px-2 py-0.5 rounded-full ${status.className}`}>{status.label}</span>
                                {type && <span>{type.value}</span>}
                                {cls && (
                                    <span>
                                        · {cls.code} — {cls.name}
                                    </span>
                                )}
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {assignment.done ? (
                                <SecondaryButton
                                    onClick={() => toggleDone(assignment)}
                                    disabled={toggling}>
                                    <IconLabel icon={<RotateCcw className="w-4 h-4" />}>
                                        {toggling ? "Saving..." : "Mark incomplete"}
                                    </IconLabel>
                                </SecondaryButton>
                            ) : (
                                <PrimaryButton
                                    onClick={() => toggleDone(assignment)}
                                    disabled={toggling}>
                                    <IconLabel icon={<CircleCheck className="w-4 h-4" />}>
                                        {toggling ? "Saving..." : "Mark complete"}
                                    </IconLabel>
                                </PrimaryButton>
                            )}
                            <SecondaryButton
                                onClick={() =>
                                    navigate(`/assignments/${assignment.id}/edit`, {
                                        state: { ...navState, fromView: true }
                                    })
                                }>
                                <IconLabel icon={<Pencil className="w-4 h-4" />}>Edit</IconLabel>
                            </SecondaryButton>
                            <SecondaryButton
                                danger
                                onClick={() => confirmDelete(assignment)}>
                                <IconLabel icon={<Trash2 className="w-4 h-4" />}>Delete</IconLabel>
                            </SecondaryButton>
                        </div>

                        <KeyValueTable
                            rows={[
                                { label: "Class", value: cls ? `${cls.code} — ${cls.name}` : "Unknown" },
                                { label: "Semester", value: semester?.name ?? "Unknown" },
                                { label: "Type", value: type?.value ?? "Unknown" },
                                {
                                    label: "Early Due",
                                    value: (
                                        <Deadline
                                            timestamp={assignment.earlyDue}
                                            now={now}
                                        />
                                    )
                                },
                                {
                                    label: "Due",
                                    value: (
                                        <Deadline
                                            timestamp={assignment.due}
                                            now={now}
                                        />
                                    )
                                },
                                {
                                    label: "Late Due",
                                    value: (
                                        <Deadline
                                            timestamp={assignment.lateDue}
                                            now={now}
                                        />
                                    )
                                }
                            ]}
                        />

                        <section>
                            <h2 className="text-lg font-light mb-3">Notes</h2>
                            {assignment.notes ? (
                                <p className="whitespace-pre-wrap break-words text-gray-800">{assignment.notes}</p>
                            ) : (
                                <p className="text-gray-500">
                                    No notes yet.{" "}
                                    <Link
                                        to={`/assignments/${assignment.id}/edit`}
                                        state={{ ...navState, fromView: true }}
                                        className="text-primary underline active:text-blue-600">
                                        Add some
                                    </Link>
                                </p>
                            )}
                        </section>

                        <p className="text-xs text-gray-500">
                            Created {formatDateTime(assignment.createdAt)} · Last updated{" "}
                            {formatDateTime(assignment.updatedAt)}
                        </p>
                    </div>
                )}
            </div>
        </StandardLayout>
    );
};

export default AssignmentView;
