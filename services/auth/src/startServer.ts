// startServer.ts
// Creates and starts the gRPC server for this service

import { Server, ServerCredentials } from "@grpc/grpc-js";

import { AuthenticationServiceService } from "./generated/authentication";
import grpcImpl from "./grpcImpl";
import { AuthService } from "./service/AuthService";

const startServer = (authService: AuthService) => {
    const server = new Server();

    server.addService(AuthenticationServiceService, grpcImpl(authService) as any);

    server.bindAsync(`0.0.0.0:50051`, ServerCredentials.createInsecure(), (err, port) => {
        if (err) {
            console.error("Server failed to bind: ", err);
            process.exit(1);
        }

        console.log(`gRPC server listening on PORT ${port}`);
    });
};

export default startServer;
