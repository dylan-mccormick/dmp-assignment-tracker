// startInvalidationConsumer.ts
// Consumes every assignment-service event and invalidates that user's cached dashboard inputs

import { type ChannelModel, connect } from "amqplib";

import { StatsCache } from "../repository/StatsCache";

// Must match the assignment service's EVENT_EXCHANGE (see its events/EventPublisher.ts)
const EVENT_EXCHANGE = "assignment.events";
// Durable and named, so events published while Stats is down wait for it instead of being dropped
const QUEUE = "stats.invalidate";
// How long to wait before redelivering a message whose invalidation failed (e.g. Redis is down)
const RETRY_DELAY_MS = 2000;

/**
 * Starts consuming in the background (reconnecting forever). Every event, whatever its type, invalidates its user's
 * cache: Stats doesn't need to know what changed, and a cascading delete (one semester.deleted for many rows) is
 * covered for free. A message is acked only after the invalidation succeeded, so a Redis failure redelivers it
 *
 * @param url The AMQP URL
 * @param cache The cache to invalidate
 */
const startInvalidationConsumer = async (url: string, cache: StatsCache) => {
    const connection = await connect(url, {
        recovery: {
            waitForConnect: false,
            maxDelay: 10_000,
            // Runs after every (re)connect: channels and consumers don't survive a reconnect
            setup: async (model: ChannelModel) => {
                const channel = await model.createChannel();
                await channel.assertExchange(EVENT_EXCHANGE, "topic", { durable: true });
                await channel.assertQueue(QUEUE, { durable: true });
                await channel.bindQueue(QUEUE, EVENT_EXCHANGE, "#");
                await channel.prefetch(32);

                await channel.consume(QUEUE, message => {
                    if (!message) return; // the queue was deleted; recovery will set up again

                    let userId: unknown;
                    try {
                        userId = JSON.parse(message.content.toString()).userId;
                    } catch {
                        userId = undefined;
                    }
                    if (typeof userId !== "string") {
                        // retrying can't fix a malformed message, so drop it rather than redeliver it forever
                        console.error(
                            `Dropping malformed ${message.fields.routingKey} event:`,
                            message.content.toString()
                        );
                        channel.ack(message);
                        return;
                    }

                    cache
                        .invalidate(userId)
                        .then(() => channel.ack(message))
                        .catch(error => {
                            console.error(`Failed to invalidate stats for user ${userId}, retrying:`, error);
                            setTimeout(() => {
                                try {
                                    channel.nack(message, false, true);
                                } catch {
                                    // the channel closed meanwhile; the broker redelivers its unacked messages anyway
                                }
                            }, RETRY_DELAY_MS);
                        });
                });
            }
        }
    });
    connection.on("connect", () => console.log("Connected to RabbitMQ; consuming assignment events."));
    connection.on("disconnect", err => console.warn("Disconnected from RabbitMQ, reconnecting:", err.message));
    connection.on("error", err => console.error("RabbitMQ connection error:", err));
};

export default startInvalidationConsumer;
