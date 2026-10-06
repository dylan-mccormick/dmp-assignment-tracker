// classService.ts
// Promise-based gRPC client for the assignment microservice's ClassService

import { credentials } from "@grpc/grpc-js";

import { ClassServiceClient } from "../generated/assignment";
import unaryFor from "./unary";

const client = new ClassServiceClient(
    process.env.ASSIGNMENT_SERVICE_URL ?? "localhost:50052",
    credentials.createInsecure()
);
const unary = unaryFor(client);

const classService = {
    createClass: unary(client.createClass),
    listClasses: unary(client.listClasses),
    getClass: unary(client.getClass),
    updateClass: unary(client.updateClass),
    deleteClass: unary(client.deleteClass)
};

export default classService;
