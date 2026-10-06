// assignmentClient.ts
// Promise-based gRPC clients for the assignment service, the source Stats rebuilds its cache from

import { ChannelCredentials, Client, ClientUnaryCall, credentials, Metadata, ServiceError } from "@grpc/grpc-js";

import { AssignmentServiceClient, ClassServiceClient, SemesterServiceClient } from "../generated/assignment";

const DEADLINE_MS = 10 * 1000;

type UnaryMethod<Req, Res> = (
    request: Req,
    metadata: Metadata,
    options: { deadline: number },
    callback: (error: ServiceError | null, response: Res) => void
) => ClientUnaryCall;

// Wraps a generated client's callback-style unary methods as promises with a 10s deadline (rejecting with the
// ServiceError), like the gateway's unary.ts
const unaryFor =
    (client: Client) =>
    <Req, Res>(method: UnaryMethod<Req, Res>) =>
    (request: Req) =>
        new Promise<Res>((resolve, reject) => {
            method.call(client, request, new Metadata(), { deadline: Date.now() + DEADLINE_MS }, (error, response) =>
                error ? reject(error) : resolve(response)
            );
        });

/**
 * Creates the read-only calls Stats makes to the assignment service
 *
 * @param address Host:port of the assignment service
 * @param creds The channel credentials (insecure inside backend_net)
 * @returns The calls
 */
export const createAssignmentClient = (address: string, creds: ChannelCredentials = credentials.createInsecure()) => {
    const semesters = new SemesterServiceClient(address, creds);
    const classes = new ClassServiceClient(address, creds);
    const assignments = new AssignmentServiceClient(address, creds);

    return {
        listSemesters: unaryFor(semesters)(semesters.listSemesters),
        listClasses: unaryFor(classes)(classes.listClasses),
        listAssignments: unaryFor(assignments)(assignments.listAssignments),
        listAssignmentTypes: unaryFor(assignments)(assignments.listAssignmentTypes)
    };
};

export type AssignmentClient = ReturnType<typeof createAssignmentClient>;
