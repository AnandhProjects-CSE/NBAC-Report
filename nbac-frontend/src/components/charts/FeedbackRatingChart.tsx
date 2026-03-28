"use client"

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    ReferenceLine,
} from "recharts"

interface FeedbackRating {
    coNumber: string
    averageRating: number
    totalResponses?: number
}

interface FeedbackRatingChartProps {
    data: FeedbackRating[]
    height?: number
}

const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return "#10b981" // emerald
    if (rating >= 3.5) return "#3b82f6" // blue
    if (rating >= 2.5) return "#f59e0b" // amber
    return "#ef4444" // red
}

export function FeedbackRatingChart({ data, height = 280 }: FeedbackRatingChartProps) {
    if (!data || data.length === 0) return null

    const chartData = data.map((d) => ({
        coNumber: d.coNumber,
        rating: Number(d.averageRating?.toFixed(2) ?? 0),
        responses: d.totalResponses ?? 0,
    }))

    return (
        <ResponsiveContainer width="100%" height={height}>
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                    dataKey="coNumber"
                    tick={{ fontSize: 12, fontFamily: "monospace" }}
                    stroke="#94a3b8"
                />
                <YAxis
                    domain={[0, 5]}
                    ticks={[0, 1, 2, 3, 4, 5]}
                    tick={{ fontSize: 11 }}
                    stroke="#94a3b8"
                    label={{ value: "Rating (1–5)", angle: -90, position: "insideLeft", offset: 10, fontSize: 11, fill: "#64748b" }}
                />
                <Tooltip
                    formatter={(value: number, _: string, props: any) => [
                        `${value} / 5 (${props.payload.responses} responses)`,
                        "Average Rating",
                    ]}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <ReferenceLine y={3.5} stroke="#10b981" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: "Good", position: "insideTopRight", fontSize: 10, fill: "#10b981" }} />
                <Bar dataKey="rating" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                        <Cell key={index} fill={getRatingColor(entry.rating)} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    )
}
