// TypesChart.tsx
// The Recharts bars for TypesCard, in its own module so Recharts is only downloaded with the dashboard

import { Bar, BarChart, LabelList, ResponsiveContainer, XAxis, YAxis } from "recharts";

import { RING_FILL, RING_TRACK } from "./ringColors";

interface TypesChartProps {
    types: { type: string; done: number; total: number }[];
}

const TypesChart = ({ types }: TypesChartProps) => {
    const rows = types.map(t => ({ ...t, toDo: t.total - t.done, label: `${t.done}/${t.total}` }));
    const animate = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    return (
        <ResponsiveContainer>
            <BarChart
                data={rows}
                layout="vertical"
                margin={{ top: 0, right: 40, bottom: 0, left: 0 }}
                barCategoryGap="28%">
                <XAxis
                    type="number"
                    hide
                    allowDecimals={false}
                />
                <YAxis
                    type="category"
                    dataKey="type"
                    width={76}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#4b5563", fontSize: 12 }}
                />
                {/* a 2px surface gap between the stacked segments; the far end of each bar is rounded */}
                <Bar
                    dataKey="done"
                    stackId="type"
                    fill={RING_FILL}
                    stroke="#ffffff"
                    strokeWidth={2}
                    isAnimationActive={animate}
                />
                <Bar
                    dataKey="toDo"
                    stackId="type"
                    fill={RING_TRACK}
                    stroke="#ffffff"
                    strokeWidth={2}
                    radius={[0, 4, 4, 0]}
                    isAnimationActive={animate}>
                    {/* the one direct label per bar, past its end */}
                    <LabelList
                        dataKey="label"
                        position="right"
                        fill="#4b5563"
                        fontSize={12}
                    />
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
};

export default TypesChart;
