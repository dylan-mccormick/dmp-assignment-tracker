// StatsCache.ts
// Defines the interface for Stats' Redis cache of dashboard inputs

import { SemesterRow, SemesterSnapshot } from "../dashboard/snapshot";
import type { MicroserviceError } from "../error/MicroserviceError";

/** A cache read: the user's current version, and the value if one is cached for that version */
export interface CacheRead<T> {
    /** Pass back to the matching write; undefined when Redis couldn't be read (then don't write either) */
    version: string | undefined;
    value: T | undefined;
}

/**
 * Cache-aside storage for one user's dashboard inputs, invalidated by bumping a per-user version rather than deleting
 * keys: every value is stored tagged with the version that was current _before_ it was fetched from the assignment
 * service, and a read only accepts a value whose tag matches the current version. So a slow miss that read old data
 * can't overwrite the cache after an invalidation landed in between (the classic cache-aside race); its write is simply
 * never accepted
 */
export interface StatsCache {
    /**
     * Reads the user's semester list. Best effort: if Redis fails, it's a miss
     *
     * @param userId The user
     * @returns The version and the list, if cached for it
     */
    readSemesters(userId: string): Promise<CacheRead<SemesterRow[]>>;

    /**
     * Caches the user's semester list. Best effort: failures are logged
     *
     * @param userId The user
     * @param version The version from the read that missed
     * @param semesters The semesters, fetched after that read
     */
    writeSemesters(userId: string, version: string, semesters: SemesterRow[]): Promise<void>;

    /**
     * Reads one semester's snapshot. Best effort: if Redis fails, it's a miss
     *
     * @param userId The user
     * @param semesterId The semester
     * @returns The version and the snapshot, if cached for it
     */
    readSnapshot(userId: string, semesterId: string): Promise<CacheRead<SemesterSnapshot>>;

    /**
     * Caches one semester's snapshot. Best effort: failures are logged
     *
     * @param userId The user
     * @param version The version from the read that missed
     * @param snapshot The snapshot, fetched after that read
     */
    writeSnapshot(userId: string, version: string, snapshot: SemesterSnapshot): Promise<void>;

    /**
     * Invalidates everything cached for the user (in one INCR, whatever semesters are cached)
     *
     * @param userId The user
     * @throws {Error} If Redis fails: unlike reads and writes, a lost invalidation would leave the dashboard stale
     */
    invalidate(userId: string): Promise<void>;
}
