// StatsServiceImpl.ts
// Implementation for StatsService: cache-aside over the assignment service, then the clock-dependent math per request

import { ServiceError, status } from "@grpc/grpc-js";

import { Clock, computeDashboard, pickActiveSemester } from "../dashboard/computeDashboard";
import { SemesterRow, SemesterSnapshot } from "../dashboard/snapshot";
import { MicroserviceError } from "../error/MicroserviceError";
import { Assignment, Class, Semester } from "../generated/assignment";
import { GetDashboardResponse } from "../generated/stats";
import { AssignmentClient } from "../grpc/assignmentClient";
import { StatsCache } from "../repository/StatsCache";
import { DashboardRequest, StatsService } from "./StatsService";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const EMPTY_DASHBOARD: GetDashboardResponse = {
    semester: undefined,
    progress: undefined,
    assignmentsDone: 0,
    assignmentsTotal: 0,
    classes: [],
    week: { done: 0, notDone: 0, total: 0 },
    upcoming: [],
    overdue: []
};

const invalid = (userFacingMessage: string) =>
    new MicroserviceError(
        status.INVALID_ARGUMENT,
        userFacingMessage,
        `Invalid dashboard request: ${userFacingMessage}`
    );

const semesterNotFound = () =>
    new MicroserviceError(status.NOT_FOUND, "Semester not found.", "Dashboard semester isn't one of the user's.");

const isDate = (value: Date | undefined): value is Date => value instanceof Date && !Number.isNaN(value.getTime());

// A real calendar date, e.g. not 2026-02-30
const isCalendarDate = (value: string | undefined): value is string => {
    if (!value || !DATE_PATTERN.test(value)) return false;
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
};

const validateClock = ({ today, now, weekStart, weekEnd }: Partial<Clock>): Clock => {
    if (!isCalendarDate(today)) throw invalid('"today" must be a "YYYY-MM-DD" date.');
    if (!isDate(now)) throw invalid('"now" is required.');
    if (!isDate(weekStart) || !isDate(weekEnd)) throw invalid("The week's start and end are required.");
    if (weekEnd <= weekStart) throw invalid("The week must end after it starts.");
    return { today, now, weekStart, weekEnd };
};

// Assignment service failures on a cache miss: its NOT_FOUND means the semester isn't the user's, and anything else
// means Stats can't answer right now
const fromAssignmentService = (error: unknown) => {
    const code = (error as Partial<ServiceError>)?.code;
    if (code === status.NOT_FOUND) return semesterNotFound();
    return new MicroserviceError(
        status.UNAVAILABLE,
        "Stats are unavailable right now. Please try again.",
        "Assignment service call failed while rebuilding the stats cache.",
        error
    );
};

const toSemesterRow = ({ id, name, startDate, endDate }: Semester): SemesterRow => ({ id, name, startDate, endDate });

export class StatsServiceImpl implements StatsService {
    private readonly cache;
    private readonly assignments;

    constructor(cache: StatsCache, assignments: AssignmentClient) {
        this.cache = cache;
        this.assignments = assignments;
    }

    // Cache-aside: the cached list for the current version, else fetched and cached under the version read *before*
    // the fetch (so an invalidation that lands mid-fetch makes the write unreadable instead of stale)
    private async semesters(userId: string, { skipCache = false } = {}): Promise<SemesterRow[]> {
        const cached = await this.cache.readSemesters(userId);
        if (cached.value && !skipCache) return cached.value;

        const semesters = await this.assignments
            .listSemesters({ userId })
            .then(res => res.semesters.map(toSemesterRow))
            .catch(error => {
                throw fromAssignmentService(error);
            });
        if (cached.version !== undefined) await this.cache.writeSemesters(userId, cached.version, semesters);
        return semesters;
    }

    private async snapshot(userId: string, semester: SemesterRow): Promise<SemesterSnapshot> {
        const cached = await this.cache.readSnapshot(userId, semester.id);
        if (cached.value) return cached.value;

        const [classes, assignments, types] = await Promise.all([
            this.assignments.listClasses({ userId, semesterId: semester.id }),
            this.assignments.listAssignments({ userId, semesterId: semester.id }),
            this.assignments.listAssignmentTypes({})
        ]).catch(error => {
            throw fromAssignmentService(error);
        });

        const snapshot: SemesterSnapshot = {
            semester,
            classes: classes.classes.map(({ id, code, name }: Class) => ({ id, code, name })),
            assignments: assignments.assignments.map((a: Assignment) => ({
                id: a.id,
                classId: a.classId,
                typeId: a.typeId,
                name: a.name,
                done: a.done,
                due: a.due!.toISOString(),
                lateDue: a.lateDue?.toISOString() ?? null
            })),
            typeNames: Object.fromEntries(types.types.map(t => [t.id, t.value]))
        };
        if (cached.version !== undefined) await this.cache.writeSnapshot(userId, cached.version, snapshot);
        return snapshot;
    }

    async getDashboard(userId: string, request: DashboardRequest): Promise<GetDashboardResponse> {
        const clock = validateClock(request);

        let semester: SemesterRow | undefined;
        if (request.semesterId === undefined) {
            semester = pickActiveSemester(await this.semesters(userId), clock.today);
            if (!semester) return EMPTY_DASHBOARD;
        } else {
            // A semester created moments ago may not be in the cached list yet (its event not consumed), so a miss
            // is re-checked against the assignment service before it's a NOT_FOUND
            semester =
                (await this.semesters(userId)).find(s => s.id === request.semesterId) ??
                (await this.semesters(userId, { skipCache: true })).find(s => s.id === request.semesterId);
            if (!semester) throw semesterNotFound();
        }

        return computeDashboard(await this.snapshot(userId, semester), clock);
    }
}
