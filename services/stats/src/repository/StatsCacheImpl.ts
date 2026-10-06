// StatsCacheImpl.ts
// Implementation of the StatsCache on Redis

import { RedisClientType } from "redis";

import { SemesterRow, SemesterSnapshot } from "../dashboard/snapshot";
import { CacheRead, StatsCache } from "./StatsCache";

// A safety net only: invalidation is what keeps the cache fresh, and this bounds how stale a lost event can leave it
const TTL_SECONDS = 10 * 60;

// Redis answers in well under a millisecond on the backend network, so this long means it's in trouble. node-redis's own
// command `timeout` doesn't cover this: it only bounds the wait *to be written*, and a command already sent to a frozen
// server (connection still open) waits for its reply forever
const REDIS_TIMEOUT_MS = 500;

// Rejects if the call takes longer than REDIS_TIMEOUT_MS (the abandoned command settles whenever the connection does)
const withTimeout = <T>(call: Promise<T>, what: string) =>
    new Promise<T>((resolve, reject) => {
        const timer = setTimeout(
            () => reject(new Error(`Redis ${what} timed out after ${REDIS_TIMEOUT_MS}ms`)),
            REDIS_TIMEOUT_MS
        );
        call.then(resolve, reject).finally(() => clearTimeout(timer));
    });

// Keys are grouped under the user, so `stats:{userId}:*` is everything Stats holds for them
const versionKey = (userId: string) => `stats:${userId}:version`;
const semestersKey = (userId: string) => `stats:${userId}:semesters`;
const snapshotKey = (userId: string, semesterId: string) => `stats:${userId}:semester:${semesterId}`;

// A version key that doesn't exist yet (or was evicted) reads as "0"; the first INCR makes it 1, so values written
// under "0" are invalidated too
const NO_VERSION = "0";

interface Tagged<T> {
    version: string;
    value: T;
}

export class StatsCacheImpl implements StatsCache {
    private readonly redis;

    constructor(redis: RedisClientType) {
        this.redis = redis;
    }

    // One round trip for the version and the value, so they're read consistently
    private async read<T>(userId: string, key: string): Promise<CacheRead<T>> {
        try {
            const [version, raw] = await withTimeout(this.redis.mGet([versionKey(userId), key]), "read");
            const current = version ?? NO_VERSION;
            if (!raw) return { version: current, value: undefined };

            const tagged = JSON.parse(raw) as Tagged<T>;
            return { version: current, value: tagged.version === current ? tagged.value : undefined };
        } catch (error) {
            console.error(`Failed to read ${key} from the stats cache:`, error);
            return { version: undefined, value: undefined };
        }
    }

    private async write<T>(key: string, version: string, value: T) {
        try {
            await withTimeout(
                this.redis.set(key, JSON.stringify({ version, value } satisfies Tagged<T>), { EX: TTL_SECONDS }),
                "write"
            );
        } catch (error) {
            console.error(`Failed to write ${key} to the stats cache:`, error);
        }
    }

    readSemesters(userId: string) {
        return this.read<SemesterRow[]>(userId, semestersKey(userId));
    }

    writeSemesters(userId: string, version: string, semesters: SemesterRow[]) {
        return this.write(semestersKey(userId), version, semesters);
    }

    readSnapshot(userId: string, semesterId: string) {
        return this.read<SemesterSnapshot>(userId, snapshotKey(userId, semesterId));
    }

    writeSnapshot(userId: string, version: string, snapshot: SemesterSnapshot) {
        return this.write(snapshotKey(userId, snapshot.semester.id), version, snapshot);
    }

    async invalidate(userId: string) {
        await withTimeout(this.redis.incr(versionKey(userId)), "invalidation");
    }
}
