// startServer.ts
// Creates and starts the gRPC server for this service

import { Server, ServerCredentials, ServiceDefinition, UntypedServiceImplementation } from "@grpc/grpc-js";

// A generated *Service definition paired with its grpcImpl
export interface GrpcService {
    definition: ServiceDefinition;
    implementation: UntypedServiceImplementation;
}

const startServer = (services: GrpcService[]) => {
    const server = new Server();

    for (const { definition, implementation } of services) {
        server.addService(definition, implementation);
    }

    // GRPC_PORT lets a test instance run beside the dev stack, which already holds 50053
    server.bindAsync(`0.0.0.0:${process.env.GRPC_PORT ?? 50053}`, ServerCredentials.createInsecure(), (err, port) => {
        if (err) {
            console.error("Server failed to bind: ", err);
            process.exit(1);
        }

        console.log(`gRPC server listening on PORT ${port}`);
    });
};

export default startServer;
