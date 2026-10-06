// assignmentGrpcImpl.ts
// Returns an implementation of the AssignmentService gRPC server

import handleMicroserviceError from "../error/handleMicroserviceError";
import { AssignmentServiceServer } from "../generated/assignment";
import { AssignmentService } from "../service/AssignmentService";

const assignmentGrpcImpl = (assignmentService: AssignmentService): AssignmentServiceServer => {
    return {
        listAssignmentTypes(_call, callback) {
            assignmentService
                .listAssignmentTypes()
                .then(({ types }) => callback(null, { types }))
                .catch(err => handleMicroserviceError(err, callback));
        },

        createAssignment(call, callback) {
            const { userId, classId, typeId, name, done, earlyDue, due, lateDue, notes } = call.request;

            assignmentService
                .createAssignment(userId, { classId, typeId, name, done, earlyDue, due, lateDue, notes })
                .then(({ assignment }) => callback(null, { assignment }))
                .catch(err => handleMicroserviceError(err, callback));
        },

        listAssignments(call, callback) {
            const { userId, classId, semesterId, done } = call.request;

            assignmentService
                .listAssignments(userId, { classId, semesterId, done })
                .then(({ assignments }) => callback(null, { assignments }))
                .catch(err => handleMicroserviceError(err, callback));
        },

        getAssignment(call, callback) {
            const { userId, assignmentId } = call.request;

            assignmentService
                .getAssignment(userId, assignmentId)
                .then(({ assignment }) => callback(null, { assignment }))
                .catch(err => handleMicroserviceError(err, callback));
        },

        updateAssignment(call, callback) {
            const { userId, assignmentId, ...update } = call.request;

            assignmentService
                .updateAssignment(userId, assignmentId, update)
                .then(({ assignment }) => callback(null, { assignment }))
                .catch(err => handleMicroserviceError(err, callback));
        },

        deleteAssignment(call, callback) {
            const { userId, assignmentId } = call.request;

            assignmentService
                .deleteAssignment(userId, assignmentId)
                .then(({ deleted }) => callback(null, { deleted }))
                .catch(err => handleMicroserviceError(err, callback));
        }
    };
};

export default assignmentGrpcImpl;
