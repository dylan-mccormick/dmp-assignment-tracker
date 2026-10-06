// statsGrpcImpl.ts
// Returns an implementation of the StatsService gRPC server

import handleMicroserviceError from "../error/handleMicroserviceError";
import { StatsServiceServer } from "../generated/stats";
import { StatsService } from "../service/StatsService";

const statsGrpcImpl = (statsService: StatsService): StatsServiceServer => {
    return {
        getDashboard(call, callback) {
            const { userId, semesterId, today, now, weekStart, weekEnd } = call.request;

            statsService
                .getDashboard(userId, { semesterId, today, now, weekStart, weekEnd })
                .then(dashboard => callback(null, dashboard))
                .catch(err => handleMicroserviceError(err, callback));
        }
    };
};

export default statsGrpcImpl;
