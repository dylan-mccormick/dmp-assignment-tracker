// SemesterServiceImpl.ts
// Implementation for SemesterService

import { status } from "@grpc/grpc-js";

import { MicroserviceError } from "../error/MicroserviceError";
import { EventPublisher, publishAfterCommit } from "../events/EventPublisher";
import { Semester } from "../generated/assignment";
import { SemesterProps, SemesterRepository } from "../repository/SemesterRepository";
import { SemesterService, SemesterUpdate } from "./SemesterService";

const MAX_NAME_LENGTH = 100;

const invalid = (userFacingMessage: string) =>
    new MicroserviceError(status.INVALID_ARGUMENT, userFacingMessage, `Invalid semester input: ${userFacingMessage}`);

const notFound = () =>
    new MicroserviceError(
        status.NOT_FOUND,
        "Semester not found.",
        "Semester does not exist or belongs to another user."
    );

// A real calendar date in "YYYY-MM-DD" form (rejects e.g. 2026-02-30)
const isValidDate = (value: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
};

// Trims and checks a full set of semester properties
const validate = ({ name, startDate, endDate }: SemesterProps): SemesterProps => {
    const trimmedName = name.trim();
    if (!trimmedName) throw invalid("A semester needs a name.");
    if (trimmedName.length > MAX_NAME_LENGTH)
        throw invalid(`A semester's name can be at most ${MAX_NAME_LENGTH} characters.`);
    if (!isValidDate(startDate)) throw invalid("The start date must be a valid date.");
    if (!isValidDate(endDate)) throw invalid("The end date must be a valid date.");
    if (endDate < startDate) throw invalid("A semester's end date can't be before its start date.");

    return { name: trimmedName, startDate, endDate };
};

export class SemesterServiceImpl implements SemesterService {
    private readonly repository;
    private readonly events;

    constructor(repository: SemesterRepository, events: EventPublisher) {
        this.repository = repository;
        this.events = events;
    }

    async listSemesters(userId: string): Promise<{ semesters: Semester[] }> {
        return { semesters: await this.repository.listSemesters(userId) };
    }

    async getSemester(userId: string, semesterId: string): Promise<{ semester: Semester }> {
        const semester = await this.repository.getSemester(userId, semesterId);
        if (!semester) throw notFound();
        return { semester };
    }

    async createSemester(userId: string, props: SemesterProps): Promise<{ semester: Semester }> {
        const semester = await this.repository.createSemester(userId, validate(props));
        await publishAfterCommit(this.events, "semester.created", userId, { semester });
        return { semester };
    }

    async updateSemester(userId: string, semesterId: string, update: SemesterUpdate): Promise<{ semester: Semester }> {
        // validate the changed fields together with the unchanged ones (e.g. a new end date vs the old start date)
        const { semester: existing } = await this.getSemester(userId, semesterId);
        if (update.name === undefined && update.startDate === undefined && update.endDate === undefined)
            return { semester: existing };

        const props = validate({
            name: update.name ?? existing.name,
            startDate: update.startDate ?? existing.startDate,
            endDate: update.endDate ?? existing.endDate
        });

        const semester = await this.repository.updateSemester(userId, semesterId, props);
        if (!semester) throw notFound(); // deleted concurrently
        await publishAfterCommit(this.events, "semester.updated", userId, { before: existing, after: semester });
        return { semester };
    }

    async deleteSemester(userId: string, semesterId: string): Promise<{ deleted: boolean }> {
        if (!(await this.repository.deleteSemester(userId, semesterId))) throw notFound();
        await publishAfterCommit(this.events, "semester.deleted", userId, { semesterId });
        return { deleted: true };
    }
}
