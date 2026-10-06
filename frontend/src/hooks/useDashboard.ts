// useDashboard.ts
// Loads the dashboard stats, and refreshes them when the tab regains focus and every few minutes

import { useCallback, useContext, useEffect, useState } from "react";

import { BannerContext } from "../context/BannerContext";
import { LoadingBannerContext } from "../context/LoadingBannerContext";
import { localWeekBounds, todayDate } from "../dates";
import type { Dashboard } from "../model/Dashboard";
import useGetJson from "./useGetJson";

const REFRESH_MS = 5 * 60 * 1000;

/**
 * Fetches the dashboard for the active semester. Refetches are cheap (Stats serves them from Redis), so the view also
 * refreshes on focus and on a timer: upcoming/overdue move with the clock, not just with edits
 *
 * @returns The latest dashboard (undefined until the first load), the time it was fetched (to word "due in..."
 *   against), whether a refresh is in flight, and whether the first load failed
 */
const useDashboard = () => {
    const { setBanner } = useContext(BannerContext);
    const { addProcess, removeProcess } = useContext(LoadingBannerContext);
    const getJson = useGetJson();

    const [result, setResult] = useState<{ dashboard: Dashboard; fetchedAt: number }>();
    const [refreshing, setRefreshing] = useState(false);
    const [failed, setFailed] = useState(false);

    // GETs the dashboard for the viewer's current day and week
    const fetchDashboard = useCallback(
        async (signal: AbortSignal) => {
            const now = new Date();
            const week = localWeekBounds(now);
            const query = new URLSearchParams({ today: todayDate(), weekStart: week.start, weekEnd: week.end });
            const body = await getJson(`/stats/dashboard?${query}`, signal);
            return body ? { dashboard: body as Dashboard, fetchedAt: now.getTime() } : undefined;
        },
        [getJson]
    );

    useEffect(() => {
        const controller = new AbortController();

        // The first load shows the full-screen overlay; refreshes keep the current view (dimmed) instead
        addProcess("loading_dashboard");
        fetchDashboard(controller.signal)
            .then(loaded => loaded && setResult(loaded))
            .catch(error => {
                if (controller.signal.aborted) return;
                console.error(error);
                setFailed(true);
                setBanner({ level: "error", message: "Could not load your dashboard. Please try again." });
            })
            .finally(() => removeProcess("loading_dashboard"));

        const refresh = () => {
            if (document.visibilityState !== "visible") return;
            setRefreshing(true);
            fetchDashboard(controller.signal)
                .then(loaded => loaded && setResult(loaded))
                // a failed refresh keeps the last good view; the next focus or tick tries again
                .catch(error => !controller.signal.aborted && console.error(error))
                .finally(() => !controller.signal.aborted && setRefreshing(false));
        };
        const timer = window.setInterval(refresh, REFRESH_MS);
        document.addEventListener("visibilitychange", refresh);

        return () => {
            controller.abort();
            window.clearInterval(timer);
            document.removeEventListener("visibilitychange", refresh);
        };
    }, [fetchDashboard, addProcess, removeProcess, setBanner]);

    return { dashboard: result?.dashboard, fetchedAt: result?.fetchedAt, refreshing, failed };
};

export default useDashboard;
