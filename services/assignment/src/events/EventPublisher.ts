// EventPublisher.ts
// Publishes domain events about committed semester/class/assignment changes, for Stats and Notification

/** The RabbitMQ topic exchange every event goes to; consumers bind queues to it by routing key (e.g. "assignment.*") */
export const EVENT_EXCHANGE = "assignment.events";

/** Routing keys. Every event carries the owner's userId, so a consumer can act per user without reading `data` */
export type EventType =
    | "semester.created" // data: { semester }
    | "semester.updated" // data: { before, after }
    | "semester.deleted" // data: { semesterId }; its classes and assignments are gone too (cascade), with no events of their own
    | "class.created" // data: { class }
    | "class.updated" // data: { before, after }; a changed semesterId means it moved semesters
    | "class.deleted" // data: { classId }; its assignments are gone too (cascade), with no events of their own
    | "assignment.created" // data: { assignment }
    | "assignment.updated" // data: { before, after }; consumers derive e.g. "completed" (done false -> true) themselves
    | "assignment.deleted"; // data: { assignment }

/** The JSON body of every message */
export interface EventEnvelope {
    id: string; // uuid v7, also the AMQP messageId (for consumers that want to deduplicate)
    type: EventType;
    userId: string;
    occurredAt: string; // ISO timestamp
    data: object;
}

export interface EventPublisher {
    /**
     * Publishes an event
     *
     * @param type The routing key
     * @param userId The owner of the changed rows
     * @param data The event's details (see EventType)
     * @throws {Error} If the broker isn't connected or the publish fails
     */
    publish(type: EventType, userId: string, data: object): Promise<void>;
}

/**
 * Publishes an event after its write has committed. Best effort: the write can't be undone, so a failure is logged and
 * swallowed, and the caller's request still succeeds. A lost event leaves Stats stale until its cache TTL; an outbox
 * table would make delivery reliable
 *
 * @param publisher The publisher
 * @param type The routing key
 * @param userId The owner of the changed rows
 * @param data The event's details
 */
export const publishAfterCommit = async (publisher: EventPublisher, type: EventType, userId: string, data: object) => {
    try {
        await publisher.publish(type, userId, data);
    } catch (error) {
        console.error(`Failed to publish ${type} event:`, error);
    }
};
