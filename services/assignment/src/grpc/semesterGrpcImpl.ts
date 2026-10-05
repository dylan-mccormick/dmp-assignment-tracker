// semesterGrpcImpl.ts
// Returns an implementation of the SemesterService gRPC server

import handleMicroserviceError from "../error/handleMicroserviceError";
import { SemesterServiceServer } from "../generated/assignment";
import { SemesterService } from "../service/SemesterService";

const semesterGrpcImpl = (semesterService: SemesterService): SemesterServiceServer => {
    return {
        createSemester(call, callback) {
            const { userId, name, startDate, endDate } = call.request;

            semesterService
                .createSemester(userId, { name, startDate, endDate })
                .then(({ semester }) => callback(null, { semester }))
                .catch(err => handleMicroserviceError(err, callback));
        },

        listSemesters(call, callback) {
            const { userId } = call.request;

            semesterService
                .listSemesters(userId)
                .then(({ semesters }) => callback(null, { semesters }))
                .catch(err => handleMicroserviceError(err, callback));
        },

        getSemester(call, callback) {
            const { userId, semesterId } = call.request;

            semesterService
                .getSemester(userId, semesterId)
                .then(({ semester }) => callback(null, { semester }))
                .catch(err => handleMicroserviceError(err, callback));
        },

        updateSemester(call, callback) {
            const { userId, semesterId, name, startDate, endDate } = call.request;

            semesterService
                .updateSemester(userId, semesterId, { name, startDate, endDate })
                .then(({ semester }) => callback(null, { semester }))
                .catch(err => handleMicroserviceError(err, callback));
        },

        deleteSemester(call, callback) {
            const { userId, semesterId } = call.request;

            semesterService
                .deleteSemester(userId, semesterId)
                .then(({ deleted }) => callback(null, { deleted }))
                .catch(err => handleMicroserviceError(err, callback));
        }
    };
};

export default semesterGrpcImpl;
