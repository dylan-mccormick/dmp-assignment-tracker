// CompletionCard.tsx
// Assignments done across the semester: a ring meter with the percentage in the middle, and the counts beside it

import { lazy, Suspense } from "react";

import DashboardCard from "./DashboardCard";
import { RING_FILL, RING_TRACK } from "./ringColors";

const CompletionRing = lazy(() => import("./CompletionRing"));

interface CompletionCardProps {
    done: number;
    total: number;
}

const CompletionCard = ({ done, total }: CompletionCardProps) => {
    const toDo = total - done;
    const percent = total === 0 ? 0 : Math.round((done / total) * 100);
    const slices = [
        { name: "Done", value: done, color: RING_FILL },
        { name: "To do", value: toDo, color: RING_TRACK }
    ];

    return (
        <DashboardCard
            h={2}
            title="Assignments this semester">
            {total === 0 ? (
                <p className="h-full flex items-center justify-center text-sm text-gray-500">No assignments yet.</p>
            ) : (
                <div className="h-full flex flex-col">
                    <div className="relative flex-1 min-h-0">
                        {/* Recharts loads on demand; until then a plain ring of the same size holds the space */}
                        <Suspense
                            fallback={
                                <div className="h-full flex items-center justify-center">
                                    <div className="h-full aspect-square rounded-full border-[1.25rem] border-primary/15" />
                                </div>
                            }>
                            <CompletionRing
                                done={done}
                                toDo={toDo}
                            />
                        </Suspense>
                        {/* the headline number, centered in the ring; decorative for screen readers (the list below says it) */}
                        <div
                            aria-hidden="true"
                            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-5xl font-semibold">{percent}%</span>
                            <span className="text-sm text-gray-500">done</span>
                        </div>
                    </div>

                    <dl className="grid grid-cols-2 gap-3 mt-4 text-sm">
                        {slices.map(slice => (
                            <div key={slice.name}>
                                <dt className="flex items-center gap-1.5 text-gray-500">
                                    <span
                                        aria-hidden="true"
                                        className="w-2.5 h-2.5 rounded-full"
                                        style={{ background: slice.color }}
                                    />
                                    {slice.name}
                                </dt>
                                <dd className="text-xl font-semibold">{slice.value}</dd>
                            </div>
                        ))}
                    </dl>
                    <p className="sr-only">
                        {done} of {total} assignments done ({percent}%).
                    </p>
                </div>
            )}
        </DashboardCard>
    );
};

export default CompletionCard;
