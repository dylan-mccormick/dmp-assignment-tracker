// useAssignmentData.ts
// Loads what the assignment pages need: the types, every semester and class, and (unless creating) the assignment

import { useEffect, useState } from "react";

import type { Assignment, AssignmentType } from "../model/Assignment";
import type { Class } from "../model/Class";
import type { Semester } from "../model/Semester";
import useGetJson from "./useGetJson";

export interface AssignmentData {
    types: AssignmentType[];
    semesters: Semester[];
    classes: Class[];
    assignment?: Assignment; // set unless creating
}

/**
 * Loads an assignment page's data, reloading when the id changes
 *
 * @param id The assignment's id, or undefined when creating one
 * @returns The data (undefined while loading), a load error message, and a setter to replace the assignment after a
 *   save
 */
const useAssignmentData = (id: string | undefined) => {
    const getJson = useGetJson();

    // Tagged with the page it was loaded for (an id, or "new"), so moving to another assignment shows "loading"
    // instead of the previous one, with nothing to reset
    const pageKey = id ?? "new";
    const [result, setResult] = useState<{ pageKey: string; data?: AssignmentData; error?: string }>();

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

    const setAssignment = (assignment: Assignment) =>
        setResult(r => r?.data && { ...r, data: { ...r.data, assignment } });

    return {
        data: result?.pageKey === pageKey ? result.data : undefined,
        loadError: result?.pageKey === pageKey ? result.error : undefined,
        setAssignment
    };
};

export default useAssignmentData;
