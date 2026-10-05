// index.ts
// Entrypoint for the API Gateway

import { Router } from "express";

import authRoutes from "./endpoints/authRoutes";
import errorHandler from "./errorHandler";
import initAPI from "./initAPI";

const app = initAPI();

app.use("/api/v1/auth", authRoutes(Router()));

app.use(errorHandler);
