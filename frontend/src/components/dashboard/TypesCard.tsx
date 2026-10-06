// TypesCard.tsx
// Done vs to do for each assignment type in the semester (homework, exams...), as horizontal stacked bars

import { lazy, Suspense } from "react";

import type { Dashboard } from "../../model/Dashboard";
import DashboardCard from "./DashboardCard";
import { RING_FILL, RING_TRACK } from "./ringColors";

const TypesChart = lazy(() => import("./TypesChart"));

const LEGEND = [
    { name: "Done", color: RING_FILL },
    { name: "To do", color: RING_TRACK }
];

const TypesCard = ({ types }: { types: Dashboard["types"] }) => (
    <DashboardCard
        h={2}
        title="By type"
        action={
            types.length > 0 && (
                <ul className="flex items-center gap-3 text-xs text-gray-600">
                    {LEGEND.map(item => (
                        <li
                            key={item.name}
                            className="flex items-center gap-1.5">
                            <span
                                aria-hidden="true"
                                className="w-2.5 h-2.5 rounded-sm"
                                style={{ background: item.color }}
                            />
                            {item.name}
                        </li>
                    ))}
                </ul>
            )
        }>
        {types.length === 0 ? (
            <p className="h-full flex items-center justify-center text-sm text-gray-500">No assignments yet.</p>
        ) : (
            <>
                <div
                    aria-hidden="true"
                    className="h-full">
                    <Suspense fallback={null}>
                        <TypesChart types={types} />
                    </Suspense>
                </div>
                {/* the chart's table twin, for screen readers */}
                <table className="sr-only">
                    <caption>Assignments by type</caption>
                    <thead>
                        <tr>
                            <th scope="col">Type</th>
                            <th scope="col">Done</th>
                            <th scope="col">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {types.map(t => (
                            <tr key={t.type}>
                                <th scope="row">{t.type}</th>
                                <td>{t.done}</td>
                                <td>{t.total}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </>
        )}
    </DashboardCard>
);

export default TypesCard;
