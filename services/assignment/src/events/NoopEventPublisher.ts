// NoopEventPublisher.ts
// EventPublisher that publishes nothing, for running without a broker (RABBITMQ_URL unset)

import { EventPublisher } from "./EventPublisher";

export class NoopEventPublisher implements EventPublisher {
    async publish(): Promise<void> {}
}
