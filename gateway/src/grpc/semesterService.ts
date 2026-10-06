// semesterService.ts
// Promise-based gRPC client for the assignment microservice's SemesterService

import { credentials } from "@grpc/grpc-js";

import { SemesterServiceClient } from "../generated/assignment";
import unaryFor from "./unary";

const client = new SemesterServiceClient(
    process.env.ASSIGNMENT_SERVICE_URL ?? "localhost:50052",
    credentials.createInsecure()
);
const unary = unaryFor(client);

const semesterService = {
    createSemester: unary(client.createSemester),
    listSemesters: unary(client.listSemesters),
    getSemester: unary(client.getSemester),
    updateSemester: unary(client.updateSemester),
    deleteSemester: unary(client.deleteSemester)
};

export default semesterService;
