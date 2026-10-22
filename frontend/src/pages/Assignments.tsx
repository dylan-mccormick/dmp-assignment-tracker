// Assignments.tsx
// The signed-in user's assignments in one semester (picked from a dropdown) as a table, with a name search, filters
// in a modal, and pagination. All of it is client-side over the semester's assignments and kept in the URL

import { ListFilter, Plus, Search, X } from "lucide-react";
import { type Ref, useContext, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router";

import {
    type AssignmentFilters,
    applyFilters,
    countActiveFilters,
    filtersToParams,
    NO_FILTERS,
    PARAMS,
    readFilters,
    readPageSize
} from "../components/assignments/assignmentFilters";
import AssignmentFiltersForm from "../components/assignments/AssignmentFiltersForm";
import AssignmentTable from "../components/assignments/AssignmentTable";
import SemesterSelect from "../components/classes/SemesterSelect";
import { controlClass } from "../components/form/formControl";
import Pagination from "../components/Pagination";
import PrimaryButton from "../components/PrimaryButton";
import StandardLayout from "../components/StandardLayout";
import TertiaryButton from "../components/TertiaryButton";
import { BannerContext } from "../context/BannerContext";
import { LoadingBannerContext } from "../context/LoadingBannerContext";
import { ModalContext } from "../context/ModalContext";
import { formatDate, todayDate } from "../dates";
import useGetJson from "../hooks/useGetJson";
import type { Assignment, AssignmentType } from "../model/Assignment";
import type { Class } from "../model/Class";
import { isCurrentSemester, type Semester } from "../model/Semester";
import { MAIN_NAV_ITEMS } from "../navItems";
import { paginate } from "../pagination";

const IconButton = ({
    label,
    active,
    opensDialog,
    onClick,
    ref,
    children
}: {
    label: string;
    /** Highlights the button, e.g. while filters are applied */
    active?: boolean;
    /** Set when the button opens a modal */
    opensDialog?: boolean;
    onClick: () => void;
    ref?: Ref<HTMLButtonElement>;
    children: React.ReactNode;
}) => (
    <button
        ref={ref}
        type="button"
        aria-label={label}
        aria-haspopup={opensDialog ? "dialog" : undefined}
        title={label}
        onClick={onClick}
        className={`relative p-2 rounded cursor-pointer transition-colors hover:bg-gray-100 ${active ? "bg-gray-100 text-primary" : "text-gray-700"}`}>
        {children}
    </button>
);

const Assignments = () => {
    // Context
    const { setBanner } = useContext(BannerContext);
    const { showModal, closeModal } = useContext(ModalContext);
    const { addProcess, removeProcess } = useContext(LoadingBannerContext);

    // State
    const [searchParams, setSearchParams] = useSearchParams();
    const location = useLocation();
    const navigate = useNavigate();
    const getJson = useGetJson();
    const [semesters, setSemesters] = useState<Semester[]>();
    const [types, setTypes] = useState<AssignmentType[]>([]);
    // Tagged with the semester they were loaded for, so switching semesters shows "loading" instead of stale rows
    const [loaded, setLoaded] = useState<{ semesterId: string; classes: Class[]; assignments: Assignment[] }>();
    const [searchOpen, setSearchOpen] = useState(() => !!searchParams.get(PARAMS.search));

    // Refs
    const searchButtonRef = useRef<HTMLButtonElement>(null);

    // The picked semester: the URL's if it's still one of the user's, else the current one, else the newest
    const currentDate = todayDate();
    const semester =
        semesters?.find(s => s.id === searchParams.get(PARAMS.semester)) ??
        semesters?.find(s => isCurrentSemester(s, currentDate)) ??
        semesters?.[0];
    const semesterId = semester?.id;
    const data = loaded && loaded.semesterId === semesterId ? loaded : undefined;

    // Derived view
    const classesById = new Map((data?.classes ?? []).map(c => [c.id, c]));
    const typesById = new Map(types.map(t => [t.id, t]));
    const filters = readFilters(searchParams, new Set(classesById.keys()));
    const search = searchParams.get(PARAMS.search) ?? "";
    const pageSize = readPageSize(searchParams);
    const matching = data ? applyFilters(data.assignments, filters, search) : [];
    // completed assignments the default view is hiding from this search/filter (to say so when nothing else matches)
    const hiddenDone =
        data && !filters.showDone
            ? applyFilters(data.assignments, { ...filters, showDone: true }, search).length - matching.length
            : 0;
    const { page, items: pageItems } = paginate(matching, Number(searchParams.get(PARAMS.page) ?? 1), pageSize);
    const activeFilterCount = countActiveFilters(filters);
    const back = location.pathname + location.search;

    // Merges changes into the URL (undefined removes a parameter); anything that changes the matching rows goes back
    // to page 1. `replace` so typing a search or paging doesn't pile up history entries
    const updateParams = (patch: Record<string, string | undefined>, { resetPage = true } = {}) =>
        setSearchParams(
            prev => {
                const next = new URLSearchParams(prev);
                for (const [key, value] of Object.entries(patch)) {
                    if (value === undefined || value === "") next.delete(key);
                    else next.set(key, value);
                }
                if (resetPage) next.delete(PARAMS.page);
                return next;
            },
            { replace: true }
        );

    // Load the semesters (for the dropdown) and the assignment types once
    useEffect(() => {
        const controller = new AbortController();
        addProcess("loading_assignment_page");

        const fetchAll = async () => {
            try {
                const [semesterBody, typeBody] = await Promise.all([
                    getJson("/semesters", controller.signal),
                    getJson("/assignment-types", controller.signal)
                ]);
                if (!semesterBody || !typeBody) return;
                setSemesters(semesterBody.semesters);
                setTypes(typeBody.types);
            } catch (error) {
                if (controller.signal.aborted) return;
                console.error(error);
                setBanner({ level: "error", message: "Could not load your semesters. Please try again." });
            } finally {
                removeProcess("loading_assignment_page");
            }
        };

        fetchAll();
        return () => controller.abort();
    }, [addProcess, removeProcess, setBanner, getJson]);

    // Load the picked semester's classes and assignments whenever the pick changes
    useEffect(() => {
        if (!semesterId) return;
        const controller = new AbortController();
        // per semester: an aborted load's `finally` runs after the next load starts, and mustn't remove its process
        const processId = `loading_assignments_${semesterId}`;
        addProcess(processId);

        const fetchSemester = async () => {
            const query = `semesterId=${encodeURIComponent(semesterId)}`;
            try {
                const [classBody, assignmentBody] = await Promise.all([
                    getJson(`/classes?${query}`, controller.signal),
                    getJson(`/assignments?${query}`, controller.signal)
                ]);
                if (!classBody || !assignmentBody) return;
                setLoaded({ semesterId, classes: classBody.classes, assignments: assignmentBody.assignments });
            } catch (error) {
                if (controller.signal.aborted) return;
                console.error(error);
                setBanner({ level: "error", message: "Could not load your assignments. Please try again." });
            } finally {
                removeProcess(processId);
            }
        };

        fetchSemester();
        return () => controller.abort();
    }, [semesterId, addProcess, removeProcess, setBanner, getJson]);

    // A new semester's classes are different, so its class filter can't carry over
    const pickSemester = (id: string) => updateParams({ [PARAMS.semester]: id, [PARAMS.classId]: undefined });

    const applyFiltersFromModal = (next: AssignmentFilters) => {
        updateParams(filtersToParams(next));
        closeModal();
    };

    const openFilters = () =>
        data &&
        showModal({
            type: "custom",
            title: "Filter Assignments",
            content: (
                <AssignmentFiltersForm
                    classes={data.classes}
                    initialValues={filters}
                    onApply={applyFiltersFromModal}
                    onCancel={closeModal}
                />
            )
        });

    // The search box (and its close button) unmount, so focus goes back to the Search button that opened it
    const closeSearch = () => {
        flushSync(() => setSearchOpen(false));
        updateParams({ [PARAMS.search]: undefined });
        searchButtonRef.current?.focus();
    };

    const newAssignmentUrl = () => {
        const params = new URLSearchParams();
        if (semesterId) params.set("semester", semesterId);
        if (filters.classId) params.set("class", filters.classId);
        return `/assignments/new?${params}`;
    };

    // A readable summary of the active filters, e.g. "CS 3700 · Due Sep 1 – Sep 30 · Including completed"
    const filterSummary = [
        filters.classId && classesById.get(filters.classId)?.code,
        (filters.from || filters.to) &&
            `Due ${filters.from ? formatDate(filters.from) : "any time"} – ${filters.to ? formatDate(filters.to) : "any time"}`,
        filters.showDone && "Including completed"
    ]
        .filter(Boolean)
        .join(" · ");

    return (
        <StandardLayout
            title="Assignments"
            sidebar={MAIN_NAV_ITEMS}>
            <div className="flex items-center justify-between gap-4 mb-8">
                <h1 className="text-3xl font-extralight">Assignments</h1>
                {data && data.classes.length > 0 && (
                    <PrimaryButton onClick={() => navigate(newAssignmentUrl(), { state: { back } })}>
                        <span className="flex items-center gap-1">
                            <Plus className="w-4 h-4" />
                            New Assignment
                        </span>
                    </PrimaryButton>
                )}
            </div>

            {semesters?.length === 0 && (
                <div className="text-center text-gray-600 py-16 space-y-2">
                    <p>Assignments belong to a class in a semester, and you don't have any semesters yet.</p>
                    <Link
                        to="/semesters"
                        className="text-primary underline active:text-blue-600">
                        Create a semester first
                    </Link>
                </div>
            )}

            {semesters && semester && (
                <>
                    {/* Toolbar: semester on the left; search and filters on the right */}
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                        <label
                            htmlFor="assignments-semester"
                            className="text-sm text-gray-600">
                            Semester
                        </label>
                        <SemesterSelect
                            id="assignments-semester"
                            semesters={semesters}
                            value={semester.id}
                            onChange={pickSemester}
                            className="min-w-0 flex-1 sm:flex-none sm:w-64"
                        />

                        <div className="flex items-center gap-1 ml-auto">
                            {searchOpen && (
                                <div className="relative">
                                    <input
                                        type="search"
                                        autoFocus
                                        aria-label="Search assignments by name"
                                        placeholder="Search by name"
                                        value={search}
                                        onChange={e => updateParams({ [PARAMS.search]: e.target.value })}
                                        onKeyDown={e => e.key === "Escape" && closeSearch()}
                                        className={`w-48 sm:w-64 pr-8 ${controlClass()}`}
                                    />
                                    <button
                                        type="button"
                                        aria-label="Close search"
                                        title="Close search"
                                        onClick={closeSearch}
                                        className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded cursor-pointer text-gray-500 hover:bg-gray-100">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                            {!searchOpen && (
                                <IconButton
                                    ref={searchButtonRef}
                                    label="Search by name"
                                    onClick={() => setSearchOpen(true)}>
                                    <Search className="w-5 h-5" />
                                </IconButton>
                            )}
                            <IconButton
                                label={activeFilterCount ? `Filters (${activeFilterCount} active)` : "Filters"}
                                active={activeFilterCount > 0}
                                opensDialog
                                onClick={openFilters}>
                                <ListFilter className="w-5 h-5" />
                                {activeFilterCount > 0 && (
                                    <span
                                        aria-hidden="true"
                                        className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-primary text-white text-[10px] leading-4 text-center">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </IconButton>
                        </div>
                    </div>

                    {filterSummary && (
                        <p className="flex flex-wrap items-center gap-x-3 text-sm text-gray-600 mb-4">
                            <span>Filtered: {filterSummary}</span>
                            <TertiaryButton onClick={() => updateParams(filtersToParams(NO_FILTERS))}>
                                Clear filters
                            </TertiaryButton>
                        </p>
                    )}

                    {data && data.classes.length === 0 && (
                        <div className="text-center text-gray-600 py-16 space-y-2">
                            <p>{semester.name} doesn't have any classes yet, and assignments belong to a class.</p>
                            <Link
                                to={`/classes?semester=${encodeURIComponent(semester.id)}`}
                                className="text-primary underline active:text-blue-600">
                                Add a class first
                            </Link>
                        </div>
                    )}

                    {data && data.classes.length > 0 && data.assignments.length === 0 && (
                        <div className="text-center text-gray-600 py-16 space-y-2">
                            <p>{semester.name} doesn't have any assignments yet.</p>
                            <TertiaryButton onClick={() => navigate(newAssignmentUrl(), { state: { back } })}>
                                Add the first assignment
                            </TertiaryButton>
                        </div>
                    )}

                    {data && matching.length === 0 && hiddenDone > 0 && (
                        <div className="text-center text-gray-600 py-16 space-y-2">
                            <p>
                                Nothing left to do here:{" "}
                                {hiddenDone === 1
                                    ? "1 completed assignment is"
                                    : `${hiddenDone} completed assignments are`}{" "}
                                hidden.
                            </p>
                            <TertiaryButton onClick={() => updateParams({ [PARAMS.showDone]: "1" })}>
                                Show completed
                            </TertiaryButton>
                        </div>
                    )}

                    {data && data.assignments.length > 0 && matching.length === 0 && hiddenDone === 0 && (
                        <div className="text-center text-gray-600 py-16 space-y-2">
                            <p>No assignments match{search ? ` "${search.trim()}"` : ""} with these filters.</p>
                            <TertiaryButton
                                onClick={() => {
                                    setSearchOpen(false);
                                    updateParams({ ...filtersToParams(NO_FILTERS), [PARAMS.search]: undefined });
                                }}>
                                Clear search and filters
                            </TertiaryButton>
                        </div>
                    )}

                    {matching.length > 0 && (
                        <div className="space-y-4">
                            <AssignmentTable
                                assignments={pageItems}
                                classesById={classesById}
                                typesById={typesById}
                                back={back}
                            />
                            <Pagination
                                page={page}
                                pageSize={pageSize}
                                total={matching.length}
                                onPageChange={next =>
                                    updateParams(
                                        { [PARAMS.page]: next > 1 ? String(next) : undefined },
                                        { resetPage: false }
                                    )
                                }
                                onPageSizeChange={size => updateParams({ [PARAMS.pageSize]: String(size) })}
                            />
                        </div>
                    )}
                </>
            )}
        </StandardLayout>
    );
};

export default Assignments;
