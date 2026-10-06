// Classes.tsx
// The signed-in user's classes in one semester (picked from a dropdown): a list that opens each class's edit pane, and a
// modal to create one

import { Plus } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";

import apiFetch, { readError } from "../apiClient";
import ClassDetail from "../components/classes/ClassDetail";
import ClassForm, { type ClassFormValues } from "../components/classes/ClassForm";
import SemesterSelect from "../components/classes/SemesterSelect";
import PrimaryButton from "../components/PrimaryButton";
import SplitPane, { SplitPaneItem } from "../components/SplitPane";
import StandardLayout from "../components/StandardLayout";
import TertiaryButton from "../components/TertiaryButton";
import { BannerContext } from "../context/BannerContext";
import { LoadingBannerContext } from "../context/LoadingBannerContext";
import { ModalContext } from "../context/ModalContext";
import { todayDate } from "../dates";
import useGetJson from "../hooks/useGetJson";
import { type Class, compareClasses } from "../model/Class";
import { isCurrentSemester, type Semester } from "../model/Semester";
import { MAIN_NAV_ITEMS } from "../navItems";

// The URL query parameter holding the picked semester, so a reload or a link (e.g. from a semester) keeps it
const SEMESTER_PARAM = "semester";

const Classes = () => {
    // Context
    const { setBanner } = useContext(BannerContext);
    const { showModal, closeModal } = useContext(ModalContext);
    const { addProcess, removeProcess } = useContext(LoadingBannerContext);

    // State
    const [searchParams, setSearchParams] = useSearchParams();
    const [semesters, setSemesters] = useState<Semester[]>();
    // Tagged with the semester they were loaded for, so switching semesters shows "loading" instead of stale classes
    const [loaded, setLoaded] = useState<{ semesterId: string; classes: Class[] }>();
    const [selectedId, setSelectedId] = useState<string>();

    // The picked semester: the URL's if it's still one of the user's, else the current one, else the newest
    const currentDate = todayDate();
    const semester =
        semesters?.find(s => s.id === searchParams.get(SEMESTER_PARAM)) ??
        semesters?.find(s => isCurrentSemester(s, currentDate)) ??
        semesters?.[0];
    const semesterId = semester?.id;

    const classes = loaded && loaded.semesterId === semesterId ? loaded.classes : undefined;
    const selected = classes?.find(c => c.id === selectedId);

    const getJson = useGetJson();

    // Load the user's semesters for the dropdown
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

    // Load the picked semester's classes whenever the pick changes
    useEffect(() => {
        if (!semesterId) return;
        const controller = new AbortController();
        // per semester: an aborted load's `finally` runs after the next load starts, and mustn't remove its process
        const processId = `loading_classes_${semesterId}`;
        addProcess(processId);

        const fetchClasses = async () => {
            try {
                const body = await getJson(`/classes?semesterId=${encodeURIComponent(semesterId)}`, controller.signal);
                if (body) setLoaded({ semesterId, classes: body.classes });
            } catch (error) {
                if (controller.signal.aborted) return;
                console.error(error);
                setBanner({ level: "error", message: "Could not load your classes. Please try again." });
            } finally {
                removeProcess(processId);
            }
        };

        fetchClasses();
        return () => controller.abort();
    }, [semesterId, addProcess, removeProcess, setBanner, getJson]);

    const pickSemester = (id: string) => setSearchParams({ [SEMESTER_PARAM]: id }, { replace: true });

    const removeClass = (classId: string) => {
        setLoaded(l => l && { ...l, classes: l.classes.filter(c => c.id !== classId) });
        setSelectedId(id => (id === classId ? undefined : id));
    };

    // Adds or replaces a class, keeping the API's order; a class moved to another semester leaves this list
    const upsertClass = (cls: Class) => {
        if (cls.semesterId !== semesterId) return removeClass(cls.id);
        setLoaded(l => l && { ...l, classes: [...l.classes.filter(c => c.id !== cls.id), cls].sort(compareClasses) });
    };

    const createClass = async (values: ClassFormValues) => {
        let res: Response;
        try {
            res = await apiFetch("/classes", { method: "POST", body: values });
        } catch {
            throw new Error("Could not reach the server. Please try again.");
        }
        if (!res.ok) throw new Error(await readError(res, "Could not create the class. Please try again."));

        const created: Class = (await res.json()).class;
        upsertClass(created);
        setSelectedId(created.id);
        closeModal();
        setBanner({ level: "success", message: `Created "${created.name}".` });
    };

    const openCreateModal = () =>
        semester &&
        showModal({
            type: "custom",
            title: `New Class in ${semester.name}`,
            content: (
                <ClassForm
                    initialValues={{ semesterId: semester.id, name: "", code: "" }}
                    submitLabel="Create"
                    submittingLabel="Creating..."
                    onSubmit={createClass}
                    onCancel={closeModal}
                />
            )
        });

    return (
        <StandardLayout
            title="Classes"
            sidebar={MAIN_NAV_ITEMS}>
            <div className="flex items-center justify-between gap-4 mb-8">
                <h1 className="text-3xl font-extralight">Classes</h1>
                {semester && (
                    <PrimaryButton onClick={openCreateModal}>
                        <span className="flex items-center gap-1">
                            <Plus className="w-4 h-4" />
                            New Class
                        </span>
                    </PrimaryButton>
                )}
            </div>

            {semesters?.length === 0 && (
                <div className="text-center text-gray-600 py-16 space-y-2">
                    <p>Classes belong to a semester, and you don't have any semesters yet.</p>
                    <Link
                        to="/semesters"
                        className="text-primary underline active:text-blue-600">
                        Create a semester first
                    </Link>
                </div>
            )}

            {semesters && semester && (
                <>
                    <div className="flex items-center gap-3 mb-4">
                        <label
                            htmlFor="classes-semester"
                            className="text-sm text-gray-600">
                            Semester
                        </label>
                        <SemesterSelect
                            id="classes-semester"
                            semesters={semesters}
                            value={semester.id}
                            onChange={pickSemester}
                            className="min-w-0 flex-1 sm:flex-none sm:w-64"
                        />
                    </div>

                    {classes?.length === 0 && (
                        <div className="text-center text-gray-600 py-16 space-y-2">
                            <p>{semester.name} doesn't have any classes yet.</p>
                            <TertiaryButton onClick={openCreateModal}>Add the first class</TertiaryButton>
                        </div>
                    )}

                    {classes && classes.length > 0 && (
                        <SplitPane
                            selectedKey={selected?.id}
                            onSelect={setSelectedId}
                            renderDetailTitle={() => selected?.name}
                            renderDetail={() =>
                                selected && (
                                    <ClassDetail
                                        // remount after a save so the form's "unchanged" baseline is the saved class
                                        key={`${selected.id}-${selected.updatedAt}`}
                                        cls={selected}
                                        semesters={semesters}
                                        onSaved={upsertClass}
                                        onDeleted={removeClass}
                                    />
                                )
                            }>
                            {classes.map(cls => (
                                <SplitPaneItem
                                    key={cls.id}
                                    itemKey={cls.id}>
                                    <p className="truncate">{cls.name}</p>
                                    <p className="text-sm text-gray-600 truncate">{cls.code}</p>
                                </SplitPaneItem>
                            ))}
                        </SplitPane>
                    )}
                </>
            )}
        </StandardLayout>
    );
};

export default Classes;
