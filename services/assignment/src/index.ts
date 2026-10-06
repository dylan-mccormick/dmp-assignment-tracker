// index.ts
// Entry point for the assignment microservice

import { Pool, types } from "pg";

import { ClassServiceService, SemesterServiceService } from "./generated/assignment";
import classGrpcImpl from "./grpc/classGrpcImpl";
import semesterGrpcImpl from "./grpc/semesterGrpcImpl";
import { ClassRepositoryImpl } from "./repository/ClassRepositoryImpl";
import { SemesterRepositoryImpl } from "./repository/SemesterRepositoryImpl";
import { ClassServiceImpl } from "./service/ClassServiceImpl";
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
    const classRepository = new ClassRepositoryImpl(dbPool);

    // Initialize Services
    const semesterService = new SemesterServiceImpl(semesterRepository);
    const classService = new ClassServiceImpl(classRepository);

    // Register each generated *Service definition with its grpcImpl
    startServer([
        { definition: SemesterServiceService, implementation: semesterGrpcImpl(semesterService) },
        { definition: ClassServiceService, implementation: classGrpcImpl(classService) }
    ]);
};

main().catch(err => {
    console.error("Failed to start assignment service:", err);
    process.exit(1);
});
