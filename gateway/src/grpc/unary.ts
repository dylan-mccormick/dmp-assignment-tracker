// unary.ts
// Turns callback-style unary methods of a generated gRPC client into promise-returning functions

import { Client, ClientUnaryCall, Metadata, ServiceError } from "@grpc/grpc-js";

const DEADLINE_MS = 10 * 1000;

type UnaryMethod<Req, Res> = (
    request: Req,
    metadata: Metadata,
    options: { deadline: number },
    callback: (error: ServiceError | null, response: Res) => void
) => ClientUnaryCall;

/**
 * Creates a wrapper for the given client's unary methods. Each call has a 10s deadline and rejects with the gRPC
 * ServiceError (mapped to HTTP in errorHandler)
 *
 * @param client The generated gRPC client the methods belong to
 * @returns A function that wraps one of the client's methods, e.g. unary(client.getUser)
 */
const unaryFor =
    (client: Client) =>
    <Req, Res>(method: UnaryMethod<Req, Res>) =>
    (request: Req) =>
        new Promise<Res>((resolve, reject) => {
            method.call(client, request, new Metadata(), { deadline: Date.now() + DEADLINE_MS }, (error, response) =>
                error ? reject(error) : resolve(response)
            );
        });

export default unaryFor;
