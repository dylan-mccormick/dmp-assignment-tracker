// handleMicroserviceError.ts
// Reports an error from a gRPC handler to the caller (shared by every grpcImpl in this service)

import { sendUnaryData, status } from "@grpc/grpc-js";

import { MicroserviceError } from "./MicroserviceError";

/**
 * Logs the error and always completes the call: MicroserviceErrors keep their status and user-facing message, and
 * anything else becomes INTERNAL
 *
 * @param err The error thrown by the service layer
 * @param callback The gRPC callback of the failing call
 */
const handleMicroserviceError = (err: unknown, callback: sendUnaryData<any>) => {
    console.error(err);

    const code = err instanceof MicroserviceError ? err.code : status.INTERNAL;
    const details = err instanceof MicroserviceError ? err.userFacingMessage : "Unknown internal error.";
    callback({ name: "Error", message: details, code, details });
};

export default handleMicroserviceError;
