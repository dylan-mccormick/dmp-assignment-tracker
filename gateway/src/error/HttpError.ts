// HttpError.ts
// An error with an HTTP status and a message that is safe to show to the user

export class HttpError extends Error {
    public status: number;

    constructor(status: number, message: string) {
        super(message);

        this.name = "HttpError";
        this.status = status;
    }
}
