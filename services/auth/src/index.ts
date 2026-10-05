// index.ts
// Entry point for the auth microservice

import { Pool } from "pg";
import { createClient } from "redis";

import { AuthRepositoryImpl } from "./repository/AuthRepositoryImpl";
import { AuthServiceImpl } from "./service/AuthServiceImpl";
import startServer from "./startServer";

// Initialize Storage
const dbPool = new Pool({
    connectionString: process.env.DATABASE_URL
});
const redis = createClient({
    url: process.env.REDIS_URL
});

// Initialize Repositories
const authRepository = new AuthRepositoryImpl(redis, dbPool);

// Initialize Services
const authService = new AuthServiceImpl(authRepository);

startServer(authService);
