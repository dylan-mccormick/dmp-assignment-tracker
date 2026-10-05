// config.ts
// Shared frontend configuration

// Base URL of the gateway's REST API (proxied to the gateway in dev, same-origin in prod)
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";

// localStorage key holding the session JWT
export const JWT_STORAGE_KEY = "jwt";
