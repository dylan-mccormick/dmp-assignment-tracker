// index.ts
// Entry point for the auth microservice

import { Pool } from "pg";
import { createClient, RedisClientType } from "redis";

import { AuthRepositoryImpl } from "./repository/AuthRepositoryImpl";
import { AuthServiceImpl } from "./service/AuthServiceImpl";
import startServer from "./startServer";

const main = async () => {
    // Initialize Storage
    const dbPool = new Pool({
        connectionString: process.env.DATABASE_URL
    });
    const redis: RedisClientType = createClient({
        url: process.env.REDIS_URL,
        disableOfflineQueue: true // fail fast while disconnected so cache-aside falls back to the DB
    });
    redis.on("error", err => console.error("Redis client error:", err));
    await redis.connect();

    // Initialize Repositories
    const authRepository = new AuthRepositoryImpl(redis, dbPool);

    // Initialize Services
    const authService = new AuthServiceImpl(authRepository);

    startServer(authService);
};

main().catch(err => {
    console.error("Failed to start auth service:", err);
    process.exit(1);
});
