// DashboardGrid.tsx
// A grid of dashboard cards, 1 to 3 columns wide depending on its own width (not the viewport's), with capped columns

import type { ReactNode } from "react";

interface DashboardGridProps {
    /** DashboardCards */
    children: ReactNode;
}

/**
 * Lays out DashboardCards on a grid of equal units. The column count follows the grid's own width through a container
 * query (the sidebar changes the space as much as the screen does): 1 column, then 2 from 40rem, then 3 from 60rem, so
 * a column never gets much narrower than ~19rem. Columns stop growing at 24rem each, and past that the grid centers
 * with margins. Rows are a fixed height, and dense packing lets a small card fill a hole left by a larger one (so the
 * visual order can differ slightly from the source order)
 */
const DashboardGrid = ({ children }: DashboardGridProps) => (
    <div className="@container/dashboard w-full">
        <div className="mx-auto max-w-[74rem] grid grid-cols-1 @min-[40rem]/dashboard:grid-cols-2 @min-[60rem]/dashboard:grid-cols-3 auto-rows-[11rem] grid-flow-row-dense gap-4">
            {children}
        </div>
    </div>
);

export default DashboardGrid;
