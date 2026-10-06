// DashboardCard.tsx
// One card on the DashboardGrid, sized in grid units (a card wider than the grid shrinks to fit it)

import { type ReactNode, useId } from "react";

export type GridUnits = 1 | 2 | 3;

// Literal class names, so Tailwind finds them. A card's width is capped at the grid's current column count: on 2
// columns a 3-wide card spans 2, and on 1 column everything spans 1. Heights don't change with the width
const COL_SPAN: Record<GridUnits, string> = {
    1: "col-span-1",
    2: "col-span-1 @min-[40rem]/dashboard:col-span-2",
    3: "col-span-1 @min-[40rem]/dashboard:col-span-2 @min-[60rem]/dashboard:col-span-3"
};

const ROW_SPAN: Record<GridUnits, string> = {
    1: "row-span-1",
    2: "row-span-2",
    3: "row-span-3"
};

interface DashboardCardProps {
    /** Width in grid units (1 to 3) */
    w?: GridUnits;
    /** Height in grid units (1 to 3) */
    h?: GridUnits;
    title?: string;
    /** Shown at the right of the title row, e.g. a link */
    action?: ReactNode;
    children?: ReactNode;
}

const DashboardCard = ({ w = 1, h = 1, title, action, children }: DashboardCardProps) => {
    const titleId = useId();

    return (
        <section
            aria-labelledby={title ? titleId : undefined}
            className={`${COL_SPAN[w]} ${ROW_SPAN[h]} min-w-0 flex flex-col rounded-lg border border-gray-200 bg-white p-4 overflow-hidden`}>
            {(title || action) && (
                <div className="flex items-center justify-between gap-2 mb-3">
                    {title && (
                        <h2
                            id={titleId}
                            className="text-sm font-medium text-gray-600 truncate">
                            {title}
                        </h2>
                    )}
                    {action}
                </div>
            )}
            <div className="flex-1 min-h-0">{children}</div>
        </section>
    );
};

export default DashboardCard;
