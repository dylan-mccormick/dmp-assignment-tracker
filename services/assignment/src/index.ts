// index.ts
// Entry point for the assignment microservice

import { Pool, types } from "pg";

import { SemesterServiceService } from "./generated/assignment";
import semesterGrpcImpl from "./grpc/semesterGrpcImpl";
import { SemesterRepositoryImpl } from "./repository/SemesterRepositoryImpl";
import { SemesterServiceImpl } from "./service/SemesterServiceImpl";
import startServer from "./startServer";

// Return DATE columns as their "YYYY-MM-DD" text; pg's default makes a JS Date at local midnight, which can shift
// the day depending on the server's timezone
types.setTypeParser(types.builtins.DATE, value => value);

const main = async () => {
    // Initialize Storage
    const dbPool = new Pool({
        connectionString: process.env.DATABASE_URL
    });

    // Initialize Repositories
    const semesterRepository = new SemesterRepositoryImpl(dbPool);

    // Initialize Services
    const semesterService = new SemesterServiceImpl(semesterRepository);

    // Register each generated *Service definition with its grpcImpl
    startServer([{ definition: SemesterServiceService, implementation: semesterGrpcImpl(semesterService) }]);
};

main().catch(err => {
    console.error("Failed to start assignment service:", err);
    process.exit(1);
});
