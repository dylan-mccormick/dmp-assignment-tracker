// classGrpcImpl.ts
// Returns an implementation of the ClassService gRPC server

import handleMicroserviceError from "../error/handleMicroserviceError";
import { ClassServiceServer } from "../generated/assignment";
import { ClassService } from "../service/ClassService";

const classGrpcImpl = (classService: ClassService): ClassServiceServer => {
    return {
        createClass(call, callback) {
            const { userId, semesterId, name, code } = call.request;

            classService
                .createClass(userId, { semesterId, name, code })
                .then(({ class: created }) => callback(null, { class: created }))
                .catch(err => handleMicroserviceError(err, callback));
        },

        listClasses(call, callback) {
            const { userId, semesterId } = call.request;

            classService
                .listClasses(userId, semesterId)
                .then(({ classes }) => callback(null, { classes }))
                .catch(err => handleMicroserviceError(err, callback));
        },

        getClass(call, callback) {
            const { userId, classId } = call.request;

            classService
                .getClass(userId, classId)
                .then(({ class: found }) => callback(null, { class: found }))
                .catch(err => handleMicroserviceError(err, callback));
        },

        updateClass(call, callback) {
            const { userId, classId, semesterId, name, code } = call.request;

            classService
                .updateClass(userId, classId, { semesterId, name, code })
                .then(({ class: updated }) => callback(null, { class: updated }))
                .catch(err => handleMicroserviceError(err, callback));
        },

        deleteClass(call, callback) {
            const { userId, classId } = call.request;

            classService
                .deleteClass(userId, classId)
                .then(({ deleted }) => callback(null, { deleted }))
                .catch(err => handleMicroserviceError(err, callback));
        }
    };
};

export default classGrpcImpl;
