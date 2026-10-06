// NoopAssignmentEvents.ts
// Placeholder AssignmentEvents that publishes nothing, until the RabbitMQ publisher exists

import { Assignment } from "../generated/assignment";
import { AssignmentEvents } from "./AssignmentEvents";

export class NoopAssignmentEvents implements AssignmentEvents {
    async created(_userId: string, _assignment: Assignment): Promise<void> {}

    async updated(_userId: string, _before: Assignment, _after: Assignment): Promise<void> {}

    async deleted(_userId: string, _assignment: Assignment): Promise<void> {}
}
