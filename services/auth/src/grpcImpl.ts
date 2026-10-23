// grpcImpl.ts
// Returns an implementation of the gRPC server for this service

import { sendUnaryData, status } from "@grpc/grpc-js";

import { MicroserviceError } from "./error/MicroserviceError";
import { AuthenticationServiceServer } from "./generated/authentication";
import { AuthService, Session } from "./service/AuthService";

const handleMicroserviceError = (err: unknown, callback: sendUnaryData<any>) => {
    console.error(err);

    const code = err instanceof MicroserviceError ? err.code : status.INTERNAL;
    const details = err instanceof MicroserviceError ? err.userFacingMessage : "Unknown internal error.";
    callback({ name: "Error", message: details, code, details });
};

const NO_SESSION = { user: undefined, jwt: "", created: false, restored: false };

const toSessionResponse = ({ user, jwt, created, restored }: Session) => ({ user, jwt, created, restored });

const grpcImpl = (authService: AuthService): AuthenticationServiceServer => {
    return {
        signInUser(call, callback) {
            const { googleAuthCode } = call.request;
            authService
                .signInUser(googleAuthCode)
                .then(result =>
                    callback(
                        null,
                        result.termsRequired
                            ? { ...NO_SESSION, termsRequired: true, signupToken: result.signupToken }
                            : { ...toSessionResponse(result), termsRequired: false, signupToken: "" }
                    )
                )
                .catch(err => handleMicroserviceError(err, callback));
        },

        signUpUser(call, callback) {
            const { signupToken, acceptedTermsVersion } = call.request;
            authService
                .signUpUser(signupToken, acceptedTermsVersion)
                .then(session =>
                    callback(null, { ...toSessionResponse(session), termsRequired: false, signupToken: "" })
                )
                .catch(err => handleMicroserviceError(err, callback));
        },

        softValidateJwt(call, callback) {
            const { jwt } = call.request;

            authService
                .softValidateJwt(jwt)
                .then(({ user, valid }) => callback(null, { user, valid }))
                .catch(err => handleMicroserviceError(err, callback));
        },

        logOutUser(call, callback) {
            const { userId } = call.request;
            authService
                .logOutUser(userId)
                .then(({ loggedOut }) => callback(null, { loggedOut }))
                .catch(err => handleMicroserviceError(err, callback));
        },

        getUser(call, callback) {
            const { userId } = call.request;

            authService
                .getUser(userId)
                .then(({ user }) => callback(null, { user }))
                .catch(err => handleMicroserviceError(err, callback));
        },

        deleteUser(call, callback) {
            const { userId } = call.request;

            authService
                .deleteUser(userId)
                .then(({ deleted }) => callback(null, { deleted }))
                .catch(err => handleMicroserviceError(err, callback));
        }
    };
};

export default grpcImpl;
