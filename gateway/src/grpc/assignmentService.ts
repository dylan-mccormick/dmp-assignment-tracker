// assignmentService.ts
// Promise-based gRPC client for the assignment microservice's AssignmentService

import { credentials } from "@grpc/grpc-js";

import { AssignmentServiceClient } from "../generated/assignment";
import unaryFor from "./unary";

const client = new AssignmentServiceClient(
    process.env.ASSIGNMENT_SERVICE_URL ?? "localhost:50052",
    credentials.createInsecure()
);
const unary = unaryFor(client);

const assignmentService = {
    listAssignmentTypes: unary(client.listAssignmentTypes),
    createAssignment: unary(client.createAssignment),
    listAssignments: unary(client.listAssignments),
    getAssignment: unary(client.getAssignment),
    updateAssignment: unary(client.updateAssignment),
    deleteAssignment: unary(client.deleteAssignment)
};

export default assignmentService;
