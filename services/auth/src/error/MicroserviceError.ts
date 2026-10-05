// MicroserviceError.ts
// A descriptive error thrown in the Auth Microservice

export class MicroserviceError extends Error {
    public code: number;
    public userFacingMessage: string;
    public loggingMessage: string;
    public cause: any;

    constructor(code: number, userFacingMessage: string, loggingMessage: string, cause?: any) {
        super(loggingMessage, { cause });

        this.name = "MicroserviceError";
        this.code = code;
        this.userFacingMessage = userFacingMessage;
        this.loggingMessage = loggingMessage;
    }
}
