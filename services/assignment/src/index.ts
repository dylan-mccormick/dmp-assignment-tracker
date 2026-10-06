// index.ts
// Entry point for the assignment microservice

import { Pool, types } from "pg";

import { EventPublisher } from "./events/EventPublisher";
import { NoopEventPublisher } from "./events/NoopEventPublisher";
import { RabbitEventPublisher } from "./events/RabbitEventPublisher";
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

    // Initialize the event publisher; it connects in the background, so the service starts even if RabbitMQ is down
    let events: EventPublisher = new NoopEventPublisher();
    if (process.env.RABBITMQ_URL) {
        const rabbit = new RabbitEventPublisher();
        await rabbit.start(process.env.RABBITMQ_URL);
        events = rabbit;
    } else {
        console.warn("RABBITMQ_URL is unset; events will not be published.");
    }

    // Initialize Repositories
    const semesterRepository = new SemesterRepositoryImpl(dbPool);
    const classRepository = new ClassRepositoryImpl(dbPool);
    const assignmentRepository = new AssignmentRepositoryImpl(dbPool);

    // Initialize Services
    const semesterService = new SemesterServiceImpl(semesterRepository, events);
    const classService = new ClassServiceImpl(classRepository, events);
    const assignmentService = new AssignmentServiceImpl(assignmentRepository, events);

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
