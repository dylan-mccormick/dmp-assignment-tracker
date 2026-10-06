// apiClient.ts
// fetch wrapper for the gateway API: prefixes the base URL and sends the stored session JWT, if any

import { API_BASE_URL, JWT_STORAGE_KEY } from "./config";

/**
 * Calls the gateway API
 *
 * @param path The path under the API base URL, e.g. "/auth/me"
 * @param init Standard fetch options; a JSON `body` object is serialized and sent as JSON
 * @returns The raw Response (callers check `res.ok` and parse the body themselves)
 */
const apiFetch = (path: string, { body, headers, ...init }: Omit<RequestInit, "body"> & { body?: unknown } = {}) => {
    const jwt = localStorage.getItem(JWT_STORAGE_KEY);

    return fetch(`${API_BASE_URL}${path}`, {
        ...init,
        headers: {
            ...(body !== undefined && { "Content-Type": "application/json" }),
            ...(jwt && { Authorization: `Bearer ${jwt}` }),
            ...headers
        },
        body: body !== undefined ? JSON.stringify(body) : undefined
    });
};

export default apiFetch;

/**
 * Reads the gateway's `{ error }` message from a failed response
 *
 * @param res The failed response
 * @param fallback The message to use if the body has none
 * @returns The user-facing error message
 */
export const readError = async (res: Response, fallback: string): Promise<string> => {
    const body = await res.json().catch(() => undefined);
    return typeof body?.error === "string" ? body.error : fallback;
};
