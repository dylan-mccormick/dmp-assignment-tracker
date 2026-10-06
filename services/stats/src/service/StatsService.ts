// StatsService.ts
// Defines the interface for StatsService

import { Clock } from "../dashboard/computeDashboard";
import type { MicroserviceError } from "../error/MicroserviceError";
import { GetDashboardResponse } from "../generated/stats";

export interface DashboardRequest extends Partial<Clock> {
    semesterId?: string;
}

export interface StatsService {
    /**
     * Builds the user's dashboard for a semester (the active one unless semesterId is set), from cached inputs when
     * possible and from the assignment service otherwise
     *
     * @param userId The user
     * @param request The semester, and the caller's today, now and week bounds
     * @returns The dashboard (empty when the user has no semesters)
     * @throws {MicroserviceError} INVALID_ARGUMENT for a missing or malformed clock, NOT_FOUND if semesterId isn't the
     *   user's, UNAVAILABLE if the assignment service can't be reached on a cache miss
     */
    getDashboard(userId: string, request: DashboardRequest): Promise<GetDashboardResponse>;
}
