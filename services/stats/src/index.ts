// index.ts
// Entry point for the stats microservice: a rebuildable read model over the assignment service, cached in Redis

import { createClient, RedisClientType } from "redis";

import startInvalidationConsumer from "./consumer/startInvalidationConsumer";
import { StatsServiceService } from "./generated/stats";
import { createAssignmentClient } from "./grpc/assignmentClient";
import statsGrpcImpl from "./grpc/statsGrpcImpl";
import { StatsCacheImpl } from "./repository/StatsCacheImpl";
import { StatsServiceImpl } from "./service/StatsServiceImpl";
import startServer from "./startServer";

const main = async () => {
    // Initialize Storage. With the offline queue disabled, commands fail fast while Redis is known to be down; a server
    // that's frozen while the connection still looks open is covered by StatsCacheImpl's per-call timeout
    const redis: RedisClientType = createClient({ url: process.env.REDIS_URL, disableOfflineQueue: true });
    redis.on("error", err => console.error("Redis client error:", err));
    await redis.connect();

    // Initialize Clients, Cache and Service
    const assignmentClient = createAssignmentClient(process.env.ASSIGNMENT_SERVICE_URL ?? "localhost:50052");
    const cache = new StatsCacheImpl(redis);
    const statsService = new StatsServiceImpl(cache, assignmentClient);

    // Invalidate on assignment-service events (connects in the background)
    if (process.env.RABBITMQ_URL) await startInvalidationConsumer(process.env.RABBITMQ_URL, cache);
    else console.warn("RABBITMQ_URL is unset; cached stats will only expire by TTL.");

    startServer([{ definition: StatsServiceService, implementation: statsGrpcImpl(statsService) }]);
};

main().catch(err => {
    console.error("Failed to start stats service:", err);
    process.exit(1);
});
