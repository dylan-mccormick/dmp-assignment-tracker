// AssignmentServiceImpl.ts
// Implementation for AssignmentService

import { status } from "@grpc/grpc-js";

import { MicroserviceError } from "../error/MicroserviceError";
import { EventPublisher, publishAfterCommit } from "../events/EventPublisher";
import { Assignment, AssignmentType } from "../generated/assignment";
import { AssignmentFilter, AssignmentProps, AssignmentRepository } from "../repository/AssignmentRepository";
import { AssignmentCreate, AssignmentService, AssignmentUpdate } from "./AssignmentService";

const MAX_NAME_LENGTH = 200;
const MAX_NOTES_LENGTH = 10_000;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const invalid = (userFacingMessage: string) =>
    new MicroserviceError(status.INVALID_ARGUMENT, userFacingMessage, `Invalid assignment input: ${userFacingMessage}`);

const assignmentNotFound = () =>
    new MicroserviceError(
        status.NOT_FOUND,
        "Assignment not found.",
        "Assignment does not exist or belongs to another user."
    );

const classNotFound = () =>
    new MicroserviceError(
        status.NOT_FOUND,
        "Class not found.",
        "Assignment's class does not exist or belongs to another user."
    );

const isValidDate = (date: Date | undefined): date is Date => date instanceof Date && !Number.isNaN(date.getTime());

// Trims and checks a full set of assignment properties (the class's ownership is checked by the repository)
const validate = (props: Omit<AssignmentProps, "due"> & { due?: Date }): AssignmentProps => {
    const name = props.name.trim();
    if (!name) throw invalid("An assignment needs a name.");
    if (name.length > MAX_NAME_LENGTH)
        throw invalid(`An assignment's name can be at most ${MAX_NAME_LENGTH} characters.`);
    // a malformed type id would otherwise fail as a malformed uuid, indistinguishable from a malformed class id
    if (!UUID_PATTERN.test(props.typeId)) throw invalid("Unknown assignment type.");
    if (!isValidDate(props.due)) throw invalid("An assignment needs a due date.");
    if (props.earlyDue !== undefined && !isValidDate(props.earlyDue))
        throw invalid("The early deadline isn't a valid date.");
    if (props.lateDue !== undefined && !isValidDate(props.lateDue))
        throw invalid("The late deadline isn't a valid date.");
    if (props.earlyDue && props.earlyDue > props.due) throw invalid("The early deadline can't be after the due date.");
    if (props.lateDue && props.lateDue < props.due) throw invalid("The late deadline can't be before the due date.");
    // notes keep their whitespace (e.g. indented lists); only the length is limited
    if (props.notes.length > MAX_NOTES_LENGTH) throw invalid(`Notes can be at most ${MAX_NOTES_LENGTH} characters.`);

    return { ...props, name, due: props.due };
};

export class AssignmentServiceImpl implements AssignmentService {
    private readonly repository;
    private readonly events;

    constructor(repository: AssignmentRepository, events: EventPublisher) {
        this.repository = repository;
        this.events = events;
    }

    async listAssignmentTypes(): Promise<{ types: AssignmentType[] }> {
        return { types: await this.repository.listAssignmentTypes() };
    }

    async listAssignments(userId: string, filter: AssignmentFilter): Promise<{ assignments: Assignment[] }> {
        if (filter.classId !== undefined && filter.semesterId !== undefined)
            throw invalid("Filter by a class or a semester, not both.");

        const assignments = await this.repository.listAssignments(userId, filter);
        if (!assignments)
            throw filter.classId !== undefined
                ? classNotFound()
                : new MicroserviceError(
                      status.NOT_FOUND,
                      "Semester not found.",
                      "Assignment filter's semester does not exist or belongs to another user."
                  );
        return { assignments };
    }

    async getAssignment(userId: string, assignmentId: string): Promise<{ assignment: Assignment }> {
        const assignment = await this.repository.getAssignment(userId, assignmentId);
        if (!assignment) throw assignmentNotFound();
        return { assignment };
    }

    async createAssignment(userId: string, props: AssignmentCreate): Promise<{ assignment: Assignment }> {
        const assignment = await this.repository.createAssignment(userId, validate(props));
        if (!assignment) throw classNotFound();

        await publishAfterCommit(this.events, "assignment.created", userId, { assignment });
        return { assignment };
    }

    async updateAssignment(
        userId: string,
        assignmentId: string,
        update: AssignmentUpdate
    ): Promise<{ assignment: Assignment }> {
        if (update.clearEarlyDue && update.earlyDue !== undefined)
            throw invalid("Set the early deadline or clear it, not both.");
        if (update.clearLateDue && update.lateDue !== undefined)
            throw invalid("Set the late deadline or clear it, not both.");

        // validate the changed fields together with the unchanged ones (e.g. a new due date vs the old late deadline)
        const { assignment: existing } = await this.getAssignment(userId, assignmentId);
        const { clearEarlyDue, clearLateDue, ...fields } = update;
        if (!clearEarlyDue && !clearLateDue && Object.values(fields).every(value => value === undefined))
            return { assignment: existing };

        const props = validate({
            classId: update.classId ?? existing.classId,
            typeId: update.typeId ?? existing.typeId,
            name: update.name ?? existing.name,
            done: update.done ?? existing.done,
            earlyDue: clearEarlyDue ? undefined : (update.earlyDue ?? existing.earlyDue),
            due: update.due ?? existing.due,
            lateDue: clearLateDue ? undefined : (update.lateDue ?? existing.lateDue),
            notes: update.notes ?? existing.notes
        });

        const assignment = await this.repository.updateAssignment(userId, assignmentId, props);
        if (!assignment) {
            // The assignment existed a moment ago, so this is almost always a bad target class; re-check in case the
            // assignment itself was deleted concurrently, so the error names the right thing
            if (!(await this.repository.getAssignment(userId, assignmentId))) throw assignmentNotFound();
            throw classNotFound();
        }

        await publishAfterCommit(this.events, "assignment.updated", userId, { before: existing, after: assignment });
        return { assignment };
    }

    async deleteAssignment(userId: string, assignmentId: string): Promise<{ deleted: boolean }> {
        const deleted = await this.repository.deleteAssignment(userId, assignmentId);
        if (!deleted) throw assignmentNotFound();

        await publishAfterCommit(this.events, "assignment.deleted", userId, { assignment: deleted });
        return { deleted: true };
    }
}
