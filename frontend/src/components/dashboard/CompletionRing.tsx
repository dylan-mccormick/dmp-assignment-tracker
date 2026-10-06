// CompletionRing.tsx
// The Recharts ring for CompletionCard, in its own module so Recharts is only downloaded with the dashboard

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { RING_FILL, RING_TRACK } from "./ringColors";

interface CompletionRingProps {
    done: number;
    toDo: number;
}

const CompletionRing = ({ done, toDo }: CompletionRingProps) => {
    const total = done + toDo;
    const slices = [
        { name: "Done", value: done, color: RING_FILL },
        { name: "To do", value: toDo, color: RING_TRACK }
    ];

    return (
        <ResponsiveContainer>
            <PieChart>
                <Pie
                    data={slices}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="72%"
                    outerRadius="100%"
                    startAngle={90}
                    endAngle={-270}
                    // a 2px surface gap between the segments, not a border
                    stroke="#ffffff"
                    strokeWidth={2}
                    isAnimationActive={!window.matchMedia("(prefers-reduced-motion: reduce)").matches}>
                    {slices.map(slice => (
                        <Cell
                            key={slice.name}
                            fill={slice.color}
                        />
                    ))}
                </Pie>
                <Tooltip
                    formatter={(value, name) => [`${value} (${Math.round((Number(value) / total) * 100)}%)`, name]}
                />
            </PieChart>
        </ResponsiveContainer>
    );
};

export default CompletionRing;
