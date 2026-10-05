// index.ts
// Entry point for the assignment microservice

import startServer from "./startServer";

const main = async () => {
    // Initialize Storage
    // TODO: create the pg Pool (DATABASE_URL) here once the first repository needs it

    // Initialize Repositories

    // Initialize Services

    // Register each generated *Service definition with its grpcImpl here
    startServer([]);
};

main().catch(err => {
    console.error("Failed to start assignment service:", err);
    process.exit(1);
});
