// authService.ts
// Promise-based gRPC client for the auth microservice

import { ClientUnaryCall, credentials, Metadata, ServiceError } from "@grpc/grpc-js";

import { AuthenticationServiceClient } from "../generated/authentication";

const DEADLINE_MS = 10 * 1000;

const client = new AuthenticationServiceClient(
    process.env.AUTH_SERVICE_URL ?? "localhost:50051",
    credentials.createInsecure()
);

type UnaryMethod<Req, Res> = (
    request: Req,
    metadata: Metadata,
    options: { deadline: number },
    callback: (error: ServiceError | null, response: Res) => void
) => ClientUnaryCall;

// Wraps a callback-style unary method; rejects with the gRPC ServiceError (mapped to HTTP in errorHandler)
const unary =
    <Req, Res>(method: UnaryMethod<Req, Res>) =>
    (request: Req) =>
        new Promise<Res>((resolve, reject) => {
            method.call(client, request, new Metadata(), { deadline: Date.now() + DEADLINE_MS }, (error, response) =>
                error ? reject(error) : resolve(response)
            );
        });

const authService = {
    signInUser: unary(client.signInUser),
    softValidateJwt: unary(client.softValidateJwt),
    logOutUser: unary(client.logOutUser),
    deleteUser: unary(client.deleteUser)
};

export default authService;
