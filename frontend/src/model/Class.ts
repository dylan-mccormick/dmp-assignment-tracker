// Class.ts
// A class as returned by the gateway's /api/v1/classes routes

export interface Class {
    id: string;
    semesterId: string;
    name: string;
    code: string; // e.g. "CS 3700"
    createdAt: string; // ISO timestamp
    updatedAt: string; // ISO timestamp
}

/**
 * Orders classes like the API: by name ignoring case, then oldest created
 *
 * @param a A class
 * @param b Another class
 * @returns A negative number when a comes first
 */
export const compareClasses = (a: Class, b: Class) =>
    a.name.toLowerCase().localeCompare(b.name.toLowerCase()) || a.createdAt.localeCompare(b.createdAt);
