// RabbitEventPublisher.ts
// EventPublisher over RabbitMQ: persistent JSON messages on a durable topic exchange, publisher confirms, and automatic
// reconnects

import { type ChannelModel, type ConfirmChannel, connect } from "amqplib";
import { v7 as uuidv7 } from "uuid";

import { EVENT_EXCHANGE, EventEnvelope, EventPublisher, EventType } from "./EventPublisher";

export class RabbitEventPublisher implements EventPublisher {
    // The current connection's channel; undefined while (re)connecting. Channels don't survive a reconnect, so setup()
    // makes a new one each time. It's a confirm channel: without confirms, a message written into a dying connection
    // is lost silently, while with them publish() rejects and the loss is logged
    private channel: ConfirmChannel | undefined;

    /**
     * Starts connecting in the background (retrying forever with backoff), so the service can serve requests even while
     * the broker is still starting or is down; events published meanwhile fail fast and are logged
     *
     * @param url The AMQP URL, e.g. amqp://user:pass@rabbitmq:5672
     */
    async start(url: string) {
        const connection = await connect(url, {
            recovery: {
                waitForConnect: false,
                maxDelay: 10_000,
                setup: async (model: ChannelModel) => {
                    const channel = await model.createConfirmChannel();
                    await channel.assertExchange(EVENT_EXCHANGE, "topic", { durable: true });
                    this.channel = channel;
                }
            }
        });
        connection.on("connect", () => console.log("Connected to RabbitMQ."));
        connection.on("disconnect", err => {
            this.channel = undefined;
            console.warn("Disconnected from RabbitMQ, reconnecting:", err.message);
        });
        connection.on("error", err => console.error("RabbitMQ connection error:", err));
    }

    async publish(type: EventType, userId: string, data: object) {
        if (!this.channel) throw new Error("Not connected to RabbitMQ.");

        const channel = this.channel;
        const envelope: EventEnvelope = { id: uuidv7(), type, userId, occurredAt: new Date().toISOString(), data };

        // Resolves once the broker has taken responsibility for the message (persisted it, as it's persistent), and
        // rejects if it nacks it or the channel closes first
        await new Promise<void>((resolve, reject) => {
            channel.publish(
                EVENT_EXCHANGE,
                type,
                Buffer.from(JSON.stringify(envelope)),
                {
                    persistent: true,
                    contentType: "application/json",
                    messageId: envelope.id,
                    timestamp: Math.floor(Date.now() / 1000)
                },
                err => (err ? reject(err) : resolve())
            );
        });
    }
}
