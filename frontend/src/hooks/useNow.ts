// useNow.ts
// The current time, re-rendering every second; every subscriber shares one interval

import { useSyncExternalStore } from "react";

const TICK_MS = 1000;

const listeners = new Set<() => void>();
let now = Date.now();
let interval: number | undefined;

const subscribe = (listener: () => void) => {
    listeners.add(listener);
    if (interval === undefined) {
        now = Date.now();
        interval = window.setInterval(() => {
            now = Date.now();
            listeners.forEach(notify => notify());
        }, TICK_MS);
    }

    return () => {
        listeners.delete(listener);
        if (listeners.size === 0) {
            window.clearInterval(interval);
            interval = undefined;
        }
    };
};

const noopSubscribe = () => () => {};

/**
 * Gets the current time in milliseconds, updated every second while enabled
 *
 * @param enabled Pass false to skip the ticker (the value is then the time of the last tick or first render)
 * @returns The current time in milliseconds
 */
const useNow = (enabled = true) =>
    useSyncExternalStore(
        enabled ? subscribe : noopSubscribe,
        () => now,
        () => now
    );

export default useNow;
