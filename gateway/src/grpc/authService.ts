// authService.ts
// Promise-based gRPC client for the auth microservice

import { credentials } from "@grpc/grpc-js";

import { AuthenticationServiceClient } from "../generated/authentication";
import unaryFor from "./unary";

const client = new AuthenticationServiceClient(
    process.env.AUTH_SERVICE_URL ?? "localhost:50051",
    credentials.createInsecure()
);
const unary = unaryFor(client);

const authService = {
    signInUser: unary(client.signInUser),
    softValidateJwt: unary(client.softValidateJwt),
    logOutUser: unary(client.logOutUser),
    getUser: unary(client.getUser),
    deleteUser: unary(client.deleteUser)
};

export default authService;
