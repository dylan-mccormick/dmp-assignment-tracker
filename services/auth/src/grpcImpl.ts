// grpcImpl.ts
// Returns an implementation of the gRPC server for this service

import { sendUnaryData } from "@grpc/grpc-js";

import { MicroserviceError } from "./error/MicroserviceError";
import { AuthenticationServiceServer } from "./generated/authentication";
import { AuthService } from "./service/AuthService";

const handleMicroserviceError = (err: any, callback: sendUnaryData<any>) => {
    if (err instanceof MicroserviceError) {
        callback({
            name: "Error",
            code: err.code,
            message: err.userFacingMessage
        });
    }

    console.error(err);
};

const grpcImpl = (authService: AuthService): AuthenticationServiceServer => {
    return {
        signInUser(call, callback) {
            const { googleAuthCode } = call.request;
            authService
                .signInUser(googleAuthCode)
                .then(({ user, jwt, created }) => callback(null, { user, jwt, created }))
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
