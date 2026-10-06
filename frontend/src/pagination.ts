// pagination.ts
// Page sizes and slicing for client-side pagination (kept out of Pagination.tsx so fast refresh keeps working)

export const PAGE_SIZES = [10, 25, 50, 100];
export const DEFAULT_PAGE_SIZE = PAGE_SIZES[1];

/**
 * Clamps a requested page into range and slices out its items
 *
 * @param items Every item, in order
 * @param page The requested 1-based page (e.g. from the URL, so possibly out of range)
 * @param pageSize Items per page
 * @returns The page actually shown and its items
 */
export const paginate = <T>(items: T[], page: number, pageSize: number) => {
    const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
    const shown = Math.min(Math.max(1, Math.floor(page) || 1), pageCount);
    return { page: shown, items: items.slice((shown - 1) * pageSize, shown * pageSize) };
};
