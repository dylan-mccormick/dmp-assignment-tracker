// statsService.ts
// Promise-based gRPC client for the stats microservice's StatsService

import { credentials } from "@grpc/grpc-js";

import { StatsServiceClient } from "../generated/stats";
import unaryFor from "./unary";

const client = new StatsServiceClient(process.env.STATS_SERVICE_URL ?? "localhost:50053", credentials.createInsecure());
const unary = unaryFor(client);

const statsService = {
    getDashboard: unary(client.getDashboard)
};

export default statsService;
