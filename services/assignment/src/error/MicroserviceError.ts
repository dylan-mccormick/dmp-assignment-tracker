// MicroserviceError.ts
// A descriptive error thrown in the Assignment Microservice

import { status } from "@grpc/grpc-js";

export class MicroserviceError extends Error {
    public code: status;
    public userFacingMessage: string;
    public loggingMessage: string;
    public cause: any;

    /**
     * @param code The gRPC status code returned to the caller
     * @param userFacingMessage A message safe to show to the end user
     * @param loggingMessage A detailed message for the service logs
     * @param cause The underlying error, if any
     */
    constructor(code: status, userFacingMessage: string, loggingMessage: string, cause?: any) {
        super(loggingMessage, { cause });

        this.name = "MicroserviceError";
        this.code = code;
        this.userFacingMessage = userFacingMessage;
        this.loggingMessage = loggingMessage;
    }
}
