// ClassServiceImpl.ts
// Implementation for ClassService

import { status } from "@grpc/grpc-js";

import { MicroserviceError } from "../error/MicroserviceError";
import { EventPublisher, publishAfterCommit } from "../events/EventPublisher";
import { Class } from "../generated/assignment";
import { ClassProps, ClassRepository } from "../repository/ClassRepository";
import { ClassService, ClassUpdate } from "./ClassService";

const MAX_NAME_LENGTH = 100;
const MAX_CODE_LENGTH = 20;

const invalid = (userFacingMessage: string) =>
    new MicroserviceError(status.INVALID_ARGUMENT, userFacingMessage, `Invalid class input: ${userFacingMessage}`);

const classNotFound = () =>
    new MicroserviceError(status.NOT_FOUND, "Class not found.", "Class does not exist or belongs to another user.");

const semesterNotFound = () =>
    new MicroserviceError(
        status.NOT_FOUND,
        "Semester not found.",
        "Class's semester does not exist or belongs to another user."
    );

// Trims and checks a full set of class properties (the semester's ownership is checked by the repository)
const validate = ({ semesterId, name, code }: ClassProps): ClassProps => {
    const trimmedName = name.trim();
    const trimmedCode = code.trim();
    if (!trimmedName) throw invalid("A class needs a name.");
    if (trimmedName.length > MAX_NAME_LENGTH)
        throw invalid(`A class's name can be at most ${MAX_NAME_LENGTH} characters.`);
    if (!trimmedCode) throw invalid("A class needs a code.");
    if (trimmedCode.length > MAX_CODE_LENGTH)
        throw invalid(`A class's code can be at most ${MAX_CODE_LENGTH} characters.`);

    return { semesterId, name: trimmedName, code: trimmedCode };
};

export class ClassServiceImpl implements ClassService {
    private readonly repository;
    private readonly events;

    constructor(repository: ClassRepository, events: EventPublisher) {
        this.repository = repository;
        this.events = events;
    }

    async listClasses(userId: string, semesterId?: string): Promise<{ classes: Class[] }> {
        const classes = await this.repository.listClasses(userId, semesterId);
        if (!classes) throw semesterNotFound();
        return { classes };
    }

    async getClass(userId: string, classId: string): Promise<{ class: Class }> {
        const found = await this.repository.getClass(userId, classId);
        if (!found) throw classNotFound();
        return { class: found };
    }

    async createClass(userId: string, props: ClassProps): Promise<{ class: Class }> {
        const created = await this.repository.createClass(userId, validate(props));
        if (!created) throw semesterNotFound();
        await publishAfterCommit(this.events, "class.created", userId, { class: created });
        return { class: created };
    }

    async updateClass(userId: string, classId: string, update: ClassUpdate): Promise<{ class: Class }> {
        const { class: existing } = await this.getClass(userId, classId);
        if (update.semesterId === undefined && update.name === undefined && update.code === undefined)
            return { class: existing };

        const props = validate({
            semesterId: update.semesterId ?? existing.semesterId,
            name: update.name ?? existing.name,
            code: update.code ?? existing.code
        });

        const updated = await this.repository.updateClass(userId, classId, props);
        if (updated) {
            await publishAfterCommit(this.events, "class.updated", userId, { before: existing, after: updated });
            return { class: updated };
        }

        // The class existed a moment ago, so this is almost always a bad target semester; re-check in case the class
        // itself was deleted concurrently, so the error names the right thing
        if (!(await this.repository.getClass(userId, classId))) throw classNotFound();
        throw semesterNotFound();
    }

    async deleteClass(userId: string, classId: string): Promise<{ deleted: boolean }> {
        if (!(await this.repository.deleteClass(userId, classId))) throw classNotFound();
        await publishAfterCommit(this.events, "class.deleted", userId, { classId });
        return { deleted: true };
    }
}
