// Semesters.tsx
// The signed-in user's semesters: a list that opens each semester's edit pane, and a modal to create one

import { Plus } from "lucide-react";
import { useContext, useEffect, useState } from "react";

import apiFetch, { readError } from "../apiClient";
import PrimaryButton from "../components/PrimaryButton";
import SemesterDetail from "../components/semesters/SemesterDetail";
import SemesterForm, { type SemesterFormValues } from "../components/semesters/SemesterForm";
import SplitPane, { SplitPaneItem } from "../components/SplitPane";
import StandardLayout from "../components/StandardLayout";
import TertiaryButton from "../components/TertiaryButton";
import { BannerContext } from "../context/BannerContext";
import { LoadingBannerContext } from "../context/LoadingBannerContext";
import { ModalContext } from "../context/ModalContext";
import { formatDate, todayDate } from "../dates";
import useGetJson from "../hooks/useGetJson";
import { compareSemesters, isCurrentSemester, type Semester } from "../model/Semester";
import { MAIN_NAV_ITEMS } from "../navItems";

const Semesters = () => {
    // Context
    const { setBanner } = useContext(BannerContext);
    const { showModal, closeModal } = useContext(ModalContext);
    const { addProcess, removeProcess } = useContext(LoadingBannerContext);

    // State
    const [semesters, setSemesters] = useState<Semester[]>();
    const [selectedId, setSelectedId] = useState<string>();

    const getJson = useGetJson();
    const selected = semesters?.find(s => s.id === selectedId);
    const currentDate = todayDate();

    // Load the user's semesters
    useEffect(() => {
        const controller = new AbortController();
        addProcess("loading_semesters");

        const fetchSemesters = async () => {
            try {
                const body = await getJson("/semesters", controller.signal);
                if (body) setSemesters(body.semesters);
            } catch (error) {
                if (controller.signal.aborted) return;
                console.error(error);
                setBanner({ level: "error", message: "Could not load your semesters. Please try again." });
            } finally {
                removeProcess("loading_semesters");
            }
        };

        fetchSemesters();
        return () => controller.abort();
    }, [addProcess, removeProcess, setBanner, getJson]);

    // Adds or replaces a semester, keeping the API's order
    const upsertSemester = (semester: Semester) =>
        setSemesters(list => [...(list ?? []).filter(s => s.id !== semester.id), semester].sort(compareSemesters));

    const removeSemester = (semesterId: string) => {
        setSemesters(list => list?.filter(s => s.id !== semesterId));
        setSelectedId(id => (id === semesterId ? undefined : id));
    };

    const createSemester = async (values: SemesterFormValues) => {
        let res: Response;
        try {
            res = await apiFetch("/semesters", { method: "POST", body: values });
        } catch {
            throw new Error("Could not reach the server. Please try again.");
        }
        if (!res.ok) throw new Error(await readError(res, "Could not create the semester. Please try again."));

        const { semester } = await res.json();
        upsertSemester(semester);
        setSelectedId(semester.id);
        closeModal();
        setBanner({ level: "success", message: `Created "${semester.name}".` });
    };

    const openCreateModal = () =>
        showModal({
            type: "custom",
            title: "New Semester",
            content: (
                <SemesterForm
                    submitLabel="Create"
                    submittingLabel="Creating..."
                    onSubmit={createSemester}
                    onCancel={closeModal}
                />
            )
        });

    return (
        <StandardLayout
            title="Semesters"
            sidebar={MAIN_NAV_ITEMS}>
            <div className="flex items-center justify-between gap-4 mb-8">
                <h1 className="text-3xl font-extralight">Semesters</h1>
                <PrimaryButton onClick={openCreateModal}>
                    <span className="flex items-center gap-1">
                        <Plus className="w-4 h-4" />
                        New Semester
                    </span>
                </PrimaryButton>
            </div>

            {semesters?.length === 0 && (
                <div className="text-center text-gray-600 py-16 space-y-2">
                    <p>You don't have any semesters yet.</p>
                    <TertiaryButton onClick={openCreateModal}>Create your first semester</TertiaryButton>
                </div>
            )}

            {semesters && semesters.length > 0 && (
                <SplitPane
                    selectedKey={selected?.id}
                    onSelect={setSelectedId}
                    renderDetailTitle={() => selected?.name}
                    renderDetail={() =>
                        selected && (
                            <SemesterDetail
                                // remount after a save so the form's "unchanged" baseline is the saved semester
                                key={`${selected.id}-${selected.updatedAt}`}
                                semester={selected}
                                onSaved={upsertSemester}
                                onDeleted={removeSemester}
                            />
                        )
                    }>
                    {semesters.map(semester => (
                        <SplitPaneItem
                            key={semester.id}
                            itemKey={semester.id}>
                            <p className="flex items-center gap-2 min-w-0">
                                <span className="truncate">{semester.name}</span>
                                {isCurrentSemester(semester, currentDate) && (
                                    <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-blue-50 text-primary">
                                        Current
                                    </span>
                                )}
                            </p>
                            <p className="text-sm text-gray-600">
                                {formatDate(semester.startDate)} – {formatDate(semester.endDate)}
                            </p>
                        </SplitPaneItem>
                    ))}
                </SplitPane>
            )}
        </StandardLayout>
    );
};

export default Semesters;
