// index.ts
// Entry point for the assignment microservice

import { Pool, types } from "pg";

import { NoopAssignmentEvents } from "./events/NoopAssignmentEvents";
import { AssignmentServiceService, ClassServiceService, SemesterServiceService } from "./generated/assignment";
import assignmentGrpcImpl from "./grpc/assignmentGrpcImpl";
import classGrpcImpl from "./grpc/classGrpcImpl";
import semesterGrpcImpl from "./grpc/semesterGrpcImpl";
import { AssignmentRepositoryImpl } from "./repository/AssignmentRepositoryImpl";
import { ClassRepositoryImpl } from "./repository/ClassRepositoryImpl";
import { SemesterRepositoryImpl } from "./repository/SemesterRepositoryImpl";
import { AssignmentServiceImpl } from "./service/AssignmentServiceImpl";
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
    const assignmentRepository = new AssignmentRepositoryImpl(dbPool);

    // Initialize Services
    const semesterService = new SemesterServiceImpl(semesterRepository);
    const classService = new ClassServiceImpl(classRepository);
    // publishes nothing yet; swap in a RabbitMQ publisher once Stats and Notification consume events
    const assignmentService = new AssignmentServiceImpl(assignmentRepository, new NoopAssignmentEvents());

    // Register each generated *Service definition with its grpcImpl
    startServer([
        { definition: SemesterServiceService, implementation: semesterGrpcImpl(semesterService) },
        { definition: ClassServiceService, implementation: classGrpcImpl(classService) },
        { definition: AssignmentServiceService, implementation: assignmentGrpcImpl(assignmentService) }
    ]);
};

main().catch(err => {
    console.error("Failed to start assignment service:", err);
    process.exit(1);
});
