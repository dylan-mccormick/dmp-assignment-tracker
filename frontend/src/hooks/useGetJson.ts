// useGetJson.ts
// GETs a gateway path as JSON, signing the user out when the session has expired (401)

import { useCallback, useContext } from "react";

import apiFetch, { readError } from "../apiClient";
import { JWT_STORAGE_KEY } from "../config";
import { BannerContext } from "../context/BannerContext";
import { LOGGED_OUT, UserContext } from "../context/UserContext";

/**
 * Gets a function that GETs a gateway path and parses its JSON body
 *
 * @returns GetJson(path, signal): the body, or undefined if the user was signed out (401). Throws an Error with the
 *   gateway's message for any other failed status, or if the request fails or is aborted
 */
const useGetJson = () => {
    const { setUser } = useContext(UserContext);
    const { setBanner } = useContext(BannerContext);

    return useCallback(
        async (path: string, signal: AbortSignal) => {
            const res = await apiFetch(path, { signal });
            if (res.status === 401) {
                localStorage.removeItem(JWT_STORAGE_KEY);
                setUser(LOGGED_OUT);
                setBanner({ level: "error", message: await readError(res, "Please sign in again.") });
                return undefined;
            }
            if (!res.ok) throw new Error(await readError(res, `GET ${path} failed with status ${res.status}`));
            return res.json();
        },
        [setBanner, setUser]
    );
};

export default useGetJson;
