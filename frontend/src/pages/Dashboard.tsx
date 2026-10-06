// Dashboard.tsx
// The signed-in user's main page: a grid of stat cards (placeholder cards for now, to check the grid's layout)

import DashboardCard, { type GridUnits } from "../components/dashboard/DashboardCard";
import DashboardGrid from "../components/dashboard/DashboardGrid";
import StandardLayout from "../components/StandardLayout";
import { MAIN_NAV_ITEMS } from "../navItems";

// Placeholder cards in a mix of sizes; each shows its requested size, so the shrink-to-fit is easy to see
const DUMMY_CARDS: { title: string; w: GridUnits; h: GridUnits; tint: string }[] = [
    { title: "Semester progress", w: 2, h: 1, tint: "bg-blue-50" },
    { title: "Done this semester", w: 1, h: 1, tint: "bg-green-50" },
    { title: "Upcoming", w: 1, h: 2, tint: "bg-amber-50" },
    { title: "This week", w: 1, h: 1, tint: "bg-purple-50" },
    { title: "Overdue", w: 1, h: 1, tint: "bg-red-50" },
    { title: "Classes", w: 3, h: 1, tint: "bg-teal-50" },
    { title: "Big card", w: 2, h: 2, tint: "bg-pink-50" },
    { title: "Small card", w: 1, h: 1, tint: "bg-gray-50" },
    { title: "Tall card", w: 1, h: 3, tint: "bg-indigo-50" },
    { title: "Another small card", w: 1, h: 1, tint: "bg-lime-50" }
];

const Dashboard = () => {
    return (
        <StandardLayout
            title="Dashboard"
            sidebar={MAIN_NAV_ITEMS}>
            <h1 className="text-3xl font-extralight mb-8">Dashboard</h1>

            <DashboardGrid>
                {DUMMY_CARDS.map(card => (
                    <DashboardCard
                        key={card.title}
                        title={card.title}
                        w={card.w}
                        h={card.h}>
                        <div
                            className={`h-full rounded ${card.tint} flex items-center justify-center text-gray-600 text-sm`}>
                            {card.w} wide × {card.h} tall
                        </div>
                    </DashboardCard>
                ))}
            </DashboardGrid>
        </StandardLayout>
    );
};

export default Dashboard;
